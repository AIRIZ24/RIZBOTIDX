import React, { useState, useEffect } from 'react';
import {
  addBuyTransaction,
  addSellTransaction,
  calculateBrokerFee,
  calculatePosition,
  formatCurrency,
} from '../services/portfolioService';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  initialType?: 'buy' | 'sell';
  onSuccess: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  initialType = 'buy',
  onSuccess,
}) => {
  const [type, setType] = useState<'buy' | 'sell'>(initialType);
  const [lots, setLots] = useState<string>('1');
  const [price, setPrice] = useState<string>(currentPrice.toString());
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [includeFee, setIncludeFee] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>('');
  const [maxSellLots, setMaxSellLots] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setPrice(currentPrice.toString());
      setType(initialType);
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
      
      // Check available lots for selling
      const position = calculatePosition(symbol, currentPrice);
      setMaxSellLots(position?.totalShares || 0);
    }
  }, [isOpen, currentPrice, initialType, symbol]);

  const lotsNum = parseInt(lots) || 0;
  const priceNum = parseFloat(price) || 0;
  const sharesValue = lotsNum * 100 * priceNum;
  const fee = includeFee ? calculateBrokerFee(type, lotsNum, priceNum) : 0;
  const totalValue = type === 'buy' ? sharesValue + fee : sharesValue - fee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (lotsNum <= 0 || priceNum <= 0) {
      setError('Masukkan jumlah lot dan harga yang valid!');
      return;
    }

    // Validate sell amount
    if (type === 'sell' && lotsNum > maxSellLots) {
      setError(`Maksimal jual: ${maxSellLots} lot`);
      return;
    }

    try {
      const transactionDate = new Date(date).getTime();
      
      if (type === 'buy') {
        addBuyTransaction(symbol, lotsNum, priceNum, fee, transactionDate, note || undefined);
      } else {
        addSellTransaction(symbol, lotsNum, priceNum, fee, transactionDate, note || undefined);
      }

      onSuccess();
      onClose();
      
      // Reset form
      setLots('1');
      setNote('');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#141c2f] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                type === 'buy' 
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/20'
                  : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20'
              }`}>
                <span className="material-icons-round text-white">
                  {type === 'buy' ? 'add_shopping_cart' : 'remove_shopping_cart'}
                </span>
              </div>
              {type === 'buy' ? 'Beli' : 'Jual'} {symbol}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-icons-round text-lg">close</span>
            </button>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={() => setType('buy')}
              className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                type === 'buy'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              <span className="material-icons-round">trending_up</span>
              BELI
            </button>
            <button
              type="button"
              onClick={() => setType('sell')}
              className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                type === 'sell'
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              <span className="material-icons-round">trending_down</span>
              JUAL
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current Price Info */}
          <div className="p-3 bg-slate-800/30 rounded-xl flex items-center justify-between">
            <span className="text-sm text-slate-400">Harga saat ini</span>
            <span className="font-mono font-bold text-white">
              Rp {currentPrice.toLocaleString()}
            </span>
          </div>

          {/* Lots Input */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block flex justify-between">
              <span>Jumlah Lot (1 lot = 100 lembar)</span>
              {type === 'sell' && maxSellLots > 0 && (
                <span className="text-slate-500">Maks: {maxSellLots} lot</span>
              )}
            </label>
            <input
              type="number"
              value={lots}
              onChange={(e) => setLots(e.target.value)}
              className="w-full bg-[#0a0e17] border border-slate-700/50 rounded-xl py-3 px-4 text-white font-mono text-lg focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              min="1"
              max={type === 'sell' ? maxSellLots : undefined}
              required
            />
            <div className="flex gap-2 mt-2">
              {[1, 5, 10, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLots(preset.toString())}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                >
                  {preset} lot
                </button>
              ))}
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              Harga per Lembar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                Rp
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#0a0e17] border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                min="1"
                required
              />
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-[#0a0e17] border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              required
            />
          </div>

          {/* Fee Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
            <div>
              <p className="text-sm text-white">Sertakan Biaya Broker</p>
              <p className="text-xs text-slate-500">
                {type === 'buy' ? '0.15%' : '0.25%'} = {formatCurrency(fee)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIncludeFee(!includeFee)}
              className={`w-12 h-6 rounded-full transition-all ${
                includeFee ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                  includeFee ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              Catatan (opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#0a0e17] border border-slate-700/50 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="cth: Beli di support, Target profit 10%..."
              maxLength={50}
            />
          </div>

          {/* Summary */}
          <div className="p-4 bg-slate-800/50 rounded-xl space-y-2 border border-slate-700/30">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Nilai Saham</span>
              <span className="text-white font-mono">{formatCurrency(sharesValue)}</span>
            </div>
            {includeFee && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Biaya Broker</span>
                <span className="text-slate-300 font-mono">
                  {type === 'buy' ? '+' : '-'} {formatCurrency(fee)}
                </span>
              </div>
            )}
            <div className="border-t border-slate-700/50 pt-2 flex justify-between">
              <span className="text-slate-300 font-medium">Total</span>
              <span className={`font-mono font-bold text-lg ${
                type === 'buy' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <span className="material-icons-round text-sm">error</span>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={type === 'sell' && maxSellLots === 0}
            className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
              type === 'buy'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-emerald-900/30'
                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-red-900/30'
            }`}
          >
            <span className="material-icons-round">
              {type === 'buy' ? 'add_shopping_cart' : 'remove_shopping_cart'}
            </span>
            {type === 'buy' ? 'Beli Sekarang' : (maxSellLots === 0 ? 'Tidak Ada Posisi' : 'Jual Sekarang')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;