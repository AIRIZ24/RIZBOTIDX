/**
 * Usage Limit Modal
 * Shows when user reaches their usage limit and prompts upgrade
 */

import React from 'react';
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from '../services/authService';

export type LimitType = 'analysis' | 'watchlist' | 'alert' | 'portfolio' | 'feature';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onLogin?: () => void;
  limitType: LimitType;
  currentTier: SubscriptionTier | null;
  currentUsage?: number;
  maxUsage?: number;
  featureName?: string;
}

const LIMIT_INFO: Record<LimitType, {
  icon: string;
  title: string;
  description: string;
  upgradeMessage: string;
}> = {
  analysis: {
    icon: 'psychology',
    title: 'Batas Analisis AI Tercapai',
    description: 'Anda telah menggunakan semua kuota analisis AI hari ini.',
    upgradeMessage: 'Upgrade untuk mendapatkan lebih banyak analisis AI per hari.',
  },
  watchlist: {
    icon: 'visibility',
    title: 'Batas Watchlist Tercapai',
    description: 'Anda telah mencapai batas maksimal saham di watchlist.',
    upgradeMessage: 'Upgrade untuk menambah lebih banyak saham ke watchlist.',
  },
  alert: {
    icon: 'notifications',
    title: 'Batas Price Alert Tercapai',
    description: 'Anda telah mencapai batas maksimal price alert.',
    upgradeMessage: 'Upgrade untuk membuat lebih banyak price alert.',
  },
  portfolio: {
    icon: 'account_balance_wallet',
    title: 'Batas Portfolio Tercapai',
    description: 'Anda telah mencapai batas maksimal portfolio.',
    upgradeMessage: 'Upgrade untuk membuat lebih banyak portfolio.',
  },
  feature: {
    icon: 'lock',
    title: 'Fitur Premium',
    description: 'Fitur ini hanya tersedia untuk pengguna premium.',
    upgradeMessage: 'Upgrade untuk mengakses semua fitur premium.',
  },
};

const UsageLimitModal: React.FC<UsageLimitModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  onLogin,
  limitType,
  currentTier,
  currentUsage,
  maxUsage,
  featureName,
}) => {
  if (!isOpen) return null;

  const info = LIMIT_INFO[limitType];
  const isGuest = currentTier === null;

  // Get next tier recommendation
  const getRecommendedTier = (): SubscriptionTier => {
    if (!currentTier || currentTier === 'free') return 'basic';
    if (currentTier === 'basic') return 'pro';
    return 'elite';
  };

  const recommendedTier = getRecommendedTier();
  const recommendedLimits = SUBSCRIPTION_LIMITS[recommendedTier];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0f1629] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <span className="material-icons-round text-white text-2xl">{info.icon}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {featureName ? `${featureName} Terkunci` : info.title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {isGuest ? 'Login untuk mengakses fitur ini' : info.description}
              </p>
            </div>
          </div>
          
          {/* Usage indicator */}
          {!isGuest && currentUsage !== undefined && maxUsage !== undefined && (
            <div className="mt-4 bg-slate-900/50 rounded-xl p-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Penggunaan</span>
                <span className="text-white font-mono font-bold">
                  {currentUsage} / {maxUsage}
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                <span className="material-icons-round text-sm">warning</span>
                Kuota habis! Reset besok pukul 00:00 WIB
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {isGuest ? (
            // Guest user - show login prompt
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="material-icons-round text-blue-400">info</span>
                  <div>
                    <p className="text-sm text-blue-300">
                      Login atau daftar gratis untuk mengakses fitur ini dan mendapatkan:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      <li className="flex items-center gap-2">
                        <span className="material-icons-round text-emerald-400 text-sm">check</span>
                        3 analisis AI per hari
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-icons-round text-emerald-400 text-sm">check</span>
                        Watchlist 5 saham
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-icons-round text-emerald-400 text-sm">check</span>
                        2 price alert
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  Nanti Saja
                </button>
                <button
                  onClick={() => {
                    onClose();
                    if (onLogin) onLogin();
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round text-lg">login</span>
                  Login / Daftar
                </button>
              </div>
            </div>
          ) : (
            // Logged in user - show upgrade prompt
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">{info.upgradeMessage}</p>

              {/* Recommended tier card */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-icons-round text-purple-400">recommend</span>
                    <span className="text-sm text-purple-300">Rekomendasi</span>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full">
                    {recommendedLimits.name}
                  </span>
                </div>
                
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold text-white">
                      {formatPrice(recommendedLimits.price)}
                    </span>
                    <span className="text-slate-400">/bulan</span>
                  </div>
                </div>

                <ul className="space-y-2 text-sm">
                  {recommendedLimits.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-slate-300">
                      <span className="material-icons-round text-emerald-400 text-sm">check_circle</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Compare tiers hint */}
              <p className="text-xs text-slate-500 text-center">
                Lihat perbandingan semua paket di halaman upgrade
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  Nanti Saja
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onUpgrade();
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round text-lg">upgrade</span>
                  Upgrade Sekarang
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <span className="material-icons-round text-slate-400">close</span>
        </button>
      </div>
    </div>
  );
};

export default UsageLimitModal;
