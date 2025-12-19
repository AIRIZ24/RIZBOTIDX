import React, { useState, useEffect } from 'react';
import { StockTicker } from '../types';
import { 
  createAlert, 
  getActiveAlerts, 
  deleteAlert, 
  getTriggeredAlerts,
  clearTriggeredAlerts,
  formatAlertMessage,
  PriceAlert 
} from '../services/priceAlertService';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: StockTicker;
  onAlertCreated: () => void;
}

const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ isOpen, onClose, ticker, onAlertCreated }) => {
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [note, setNote] = useState<string>('');
  const [activeAlerts, setActiveAlerts] = useState<PriceAlert[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<PriceAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'active' | 'history'>('create');

  useEffect(() => {
    if (isOpen) {
      // Set default target price based on condition
      const defaultPrice = condition === 'above' 
        ? Math.round(ticker.price * 1.05) // 5% above
        : Math.round(ticker.price * 0.95); // 5% below
      setTargetPrice(defaultPrice.toString());
      
      // Load alerts
      setActiveAlerts(getActiveAlerts());
      setTriggeredAlerts(getTriggeredAlerts());
    }
  }, [isOpen, ticker.price, condition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      alert('Masukkan harga target yang valid!');
      return;
    }

    createAlert(ticker.symbol, price, condition, note || undefined);
    setActiveAlerts(getActiveAlerts());
    setNote('');
    setActiveTab('active');
    onAlertCreated();
  };

  const handleDeleteAlert = (alertId: string) => {
    deleteAlert(alertId);
    setActiveAlerts(getActiveAlerts());
  };

  const handleClearHistory = () => {
    clearTriggeredAlerts();
    setTriggeredAlerts([]);
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
      <div className="relative bg-[#141c2f] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="material-icons-round text-white">notifications_active</span>
              </div>
              Price Alert
            </h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-icons-round text-lg">close</span>
            </button>
          </div>
          
          {/* Current Price Info */}
          <div className="mt-4 p-3 bg-slate-800/30 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Harga {ticker.symbol} saat ini</p>
              <p className="text-lg font-bold text-white font-mono">Rp {ticker.price.toLocaleString()}</p>
            </div>
            <span className={`text-sm font-mono px-2 py-1 rounded-lg ${
              ticker.change >= 0 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {ticker.change >= 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'create', label: 'Buat Alert', icon: 'add_alert' },
              { id: 'active', label: 'Aktif', icon: 'pending', count: activeAlerts.length },
              { id: 'history', label: 'Riwayat', icon: 'history', count: triggeredAlerts.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/50 border border-transparent'
                }`}
              >
                <span className="material-icons-round text-sm">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-blue-500/30 text-blue-300 text-[10px] px-1.5 rounded-full">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {/* Create Tab */}
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Condition Selection */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Kondisi Alert</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCondition('above')}
                    className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      condition === 'above'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="material-icons-round text-lg">trending_up</span>
                    Naik di atas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCondition('below')}
                    className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      condition === 'below'
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="material-icons-round text-lg">trending_down</span>
                    Turun di bawah
                  </button>
                </div>
              </div>

              {/* Target Price */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Harga Target</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full bg-[#0a0e17] border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[
                    { label: '-5%', value: Math.round(ticker.price * 0.95) },
                    { label: '-2%', value: Math.round(ticker.price * 0.98) },
                    { label: '+2%', value: Math.round(ticker.price * 1.02) },
                    { label: '+5%', value: Math.round(ticker.price * 1.05) },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTargetPrice(preset.value.toString())}
                      className="flex-1 text-xs py-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note (optional) */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Catatan (opsional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#0a0e17] border border-slate-700/50 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="cth: Support level, Target profit..."
                  maxLength={50}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span className="material-icons-round">add_alert</span>
                Buat Alert
              </button>
            </form>
          )}

          {/* Active Alerts Tab */}
          {activeTab === 'active' && (
            <div className="space-y-2">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <span className="material-icons-round text-4xl mb-2 block">notifications_off</span>
                  <p>Belum ada alert aktif</p>
                  <p className="text-xs mt-1">Buat alert untuk menerima notifikasi</p>
                </div>
              ) : (
                activeAlerts.map(alert => (
                  <div 
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        alert.condition === 'above' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        <span className="material-icons-round">
                          {alert.condition === 'above' ? 'trending_up' : 'trending_down'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{formatAlertMessage(alert)}</p>
                        {alert.note && (
                          <p className="text-xs text-slate-500">{alert.note}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <span className="material-icons-round text-sm">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {triggeredAlerts.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="w-full text-xs text-slate-500 hover:text-red-400 py-2 transition-colors"
                >
                  Hapus semua riwayat
                </button>
              )}
              {triggeredAlerts.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <span className="material-icons-round text-4xl mb-2 block">history</span>
                  <p>Belum ada riwayat alert</p>
                </div>
              ) : (
                triggeredAlerts.map(alert => (
                  <div 
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <span className="material-icons-round">check_circle</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{formatAlertMessage(alert)}</p>
                        <p className="text-xs text-slate-500">
                          Triggered: {new Date(alert.triggeredAt || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceAlertModal;
