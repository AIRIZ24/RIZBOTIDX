import React, { useState, useEffect, useCallback } from 'react';
import { StockTicker } from '../types';
import {
  calculatePortfolioSummary,
  getTransactionHistory,
  deleteTransaction,
  formatCurrency,
  formatPercent,
  PortfolioSummary,
  Transaction,
  clearPortfolio,
  exportToPDF,
  exportToExcel,
  exportToJSON,
} from '../services/portfolioService';

interface PortfolioTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: StockTicker[];
  onAddTransaction: (symbol: string, type: 'buy' | 'sell') => void;
}

const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({
  isOpen,
  onClose,
  watchlist,
  onAddTransaction,
}) => {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'history'>('portfolio');
  const [isLoading, setIsLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const loadPortfolioData = useCallback(() => {
    setIsLoading(true);
    
    // Build price map from watchlist
    const priceMap: Record<string, number> = {};
    watchlist.forEach(stock => {
      priceMap[stock.symbol] = stock.price;
    });
    
    const portfolioSummary = calculatePortfolioSummary(priceMap);
    setSummary(portfolioSummary);
    setTransactions(getTransactionHistory());
    setIsLoading(false);
  }, [watchlist]);

  useEffect(() => {
    if (isOpen) {
      loadPortfolioData();
    }
  }, [isOpen, loadPortfolioData]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowExportMenu(false);
    if (showExportMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showExportMenu]);

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      deleteTransaction(id);
      loadPortfolioData();
    }
  };

  const handleExportPDF = async () => {
    if (!summary) return;
    setShowExportMenu(false);
    setExportStatus('Generating PDF...');
    try {
      await exportToPDF(summary, transactions);
      setExportStatus('PDF ready!');
      setTimeout(() => setExportStatus(null), 2000);
    } catch (error) {
      setExportStatus('Export failed');
      setTimeout(() => setExportStatus(null), 2000);
    }
  };

  const handleExportExcel = () => {
    if (!summary) return;
    setShowExportMenu(false);
    setExportStatus('Generating Excel...');
    try {
      exportToExcel(summary, transactions);
      setExportStatus('Excel downloaded!');
      setTimeout(() => setExportStatus(null), 2000);
    } catch (error) {
      setExportStatus('Export failed');
      setTimeout(() => setExportStatus(null), 2000);
    }
  };

  const handleExportJSON = () => {
    if (!summary) return;
    setShowExportMenu(false);
    setExportStatus('Generating backup...');
    try {
      exportToJSON(summary, transactions);
      setExportStatus('Backup downloaded!');
      setTimeout(() => setExportStatus(null), 2000);
    } catch (error) {
      setExportStatus('Export failed');
      setTimeout(() => setExportStatus(null), 2000);
    }
  };

  const handleClearAll = () => {
    if (confirm('Hapus semua data portfolio? Tindakan ini tidak dapat dibatalkan.')) {
      clearPortfolio();
      loadPortfolioData();
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
      <div className="relative bg-[#141c2f] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="material-icons-round text-white">account_balance_wallet</span>
              </div>
              Portfolio Tracker
            </h2>
            <div className="flex items-center gap-2">
              {/* Export Button */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExportMenu(!showExportMenu);
                  }}
                  disabled={!summary || summary.positions.length === 0}
                  className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export Report"
                >
                  <span className="material-icons-round text-sm">download</span>
                  <span className="text-xs font-medium">Export</span>
                </button>
                
                {/* Export Dropdown */}
                {showExportMenu && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl border border-slate-700/50 shadow-xl overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-3 text-left hover:bg-slate-700/50 flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                    >
                      <span className="material-icons-round text-red-400 text-lg">picture_as_pdf</span>
                      <div>
                        <p className="text-sm font-medium">Export PDF</p>
                        <p className="text-[10px] text-slate-500">Laporan lengkap</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="w-full px-4 py-3 text-left hover:bg-slate-700/50 flex items-center gap-3 text-slate-300 hover:text-white transition-colors border-t border-slate-700/30"
                    >
                      <span className="material-icons-round text-emerald-400 text-lg">table_chart</span>
                      <div>
                        <p className="text-sm font-medium">Export Excel</p>
                        <p className="text-[10px] text-slate-500">Format CSV</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full px-4 py-3 text-left hover:bg-slate-700/50 flex items-center gap-3 text-slate-300 hover:text-white transition-colors border-t border-slate-700/30"
                    >
                      <span className="material-icons-round text-blue-400 text-lg">data_object</span>
                      <div>
                        <p className="text-sm font-medium">Backup Data</p>
                        <p className="text-[10px] text-slate-500">Format JSON</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Export Status Toast */}
              {exportStatus && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs font-medium shadow-lg border border-slate-700/50 whitespace-nowrap">
                  {exportStatus}
                </div>
              )}
              
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-icons-round text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && summary.positions.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500">Total Investasi</p>
                <p className="text-lg font-bold text-white font-mono">
                  {formatCurrency(summary.totalInvested)}
                </p>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500">Nilai Saat Ini</p>
                <p className="text-lg font-bold text-white font-mono">
                  {formatCurrency(summary.totalCurrentValue)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${
                summary.totalProfitLoss >= 0 
                  ? 'bg-emerald-500/10 border border-emerald-500/20' 
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                <p className="text-xs text-slate-500">Profit/Loss</p>
                <p className={`text-lg font-bold font-mono ${
                  summary.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {formatCurrency(summary.totalProfitLoss)}
                  <span className="text-xs ml-1">
                    ({formatPercent(summary.totalProfitLossPercent)})
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/50 border border-transparent'
              }`}
            >
              <span className="material-icons-round text-sm">pie_chart</span>
              Posisi ({summary?.positions.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/50 border border-transparent'
              }`}
            >
              <span className="material-icons-round text-sm">history</span>
              Riwayat ({transactions.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <span className="material-icons-round text-4xl text-blue-400 animate-spin">sync</span>
            </div>
          ) : activeTab === 'portfolio' ? (
            // Portfolio Positions
            <div className="space-y-3">
              {!summary || summary.positions.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <span className="material-icons-round text-5xl mb-3 block">inventory_2</span>
                  <p className="text-lg">Portfolio Kosong</p>
                  <p className="text-sm mt-1">Tambahkan transaksi pembelian untuk memulai</p>
                  <button
                    onClick={() => {
                      onClose();
                      if (watchlist.length > 0) {
                        onAddTransaction(watchlist[0].symbol, 'buy');
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                  >
                    + Tambah Transaksi
                  </button>
                </div>
              ) : (
                summary.positions.map(position => (
                  <div
                    key={position.symbol}
                    className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                          {position.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{position.symbol}</p>
                          <p className="text-xs text-slate-500">
                            {position.totalShares} lot @ Rp {position.averagePrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-white">
                          {formatCurrency(position.currentValue)}
                        </p>
                        <p className={`text-xs font-mono ${
                          position.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(position.profitLoss)} ({formatPercent(position.profitLossPercent)})
                        </p>
                      </div>
                    </div>

                    {/* Position Details */}
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-700/30">
                      <div>
                        <p className="text-[10px] text-slate-500">Avg. Price</p>
                        <p className="text-xs font-mono text-slate-300">
                          Rp {position.averagePrice.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Current</p>
                        <p className="text-xs font-mono text-slate-300">
                          Rp {position.currentPrice.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Invested</p>
                        <p className="text-xs font-mono text-slate-300">
                          {formatCurrency(position.totalInvested)}
                        </p>
                      </div>
                      <div className="flex justify-end items-end gap-1">
                        <button
                          onClick={() => {
                            onClose();
                            onAddTransaction(position.symbol, 'buy');
                          }}
                          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                          title="Tambah Beli"
                        >
                          <span className="material-icons-round text-sm">add</span>
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onAddTransaction(position.symbol, 'sell');
                          }}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                          title="Jual"
                        >
                          <span className="material-icons-round text-sm">remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Transaction History
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <span className="material-icons-round text-4xl mb-2 block">receipt_long</span>
                  <p>Belum ada riwayat transaksi</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleClearAll}
                    className="w-full text-xs text-slate-500 hover:text-red-400 py-2 transition-colors"
                  >
                    Hapus semua riwayat
                  </button>
                  {transactions.map(txn => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          txn.type === 'buy'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          <span className="material-icons-round">
                            {txn.type === 'buy' ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {txn.type === 'buy' ? 'Beli' : 'Jual'} {txn.symbol}
                          </p>
                          <p className="text-xs text-slate-500">
                            {txn.shares} lot @ Rp {txn.pricePerShare.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`font-mono text-sm ${
                            txn.type === 'buy' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {txn.type === 'buy' ? '-' : '+'}{formatCurrency(txn.totalValue)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(txn.date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteTransaction(txn.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <span className="material-icons-round text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
          <button
            onClick={() => {
              onClose();
              if (watchlist.length > 0) {
                onAddTransaction(watchlist[0].symbol, 'buy');
              }
            }}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
          >
            <span className="material-icons-round">add</span>
            Tambah Transaksi
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioTracker;
