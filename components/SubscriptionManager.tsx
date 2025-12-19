/**
 * Subscription Manager Component
 * Full subscription management with payment simulation and history
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  SubscriptionTier,
  SUBSCRIPTION_LIMITS,
  getSession,
  upgradeSubscription,
  getRemainingUsage,
} from '../services/authService';
import { getTransactions, PaymentTransaction, formatCurrency } from '../services/paymentService';
import PaymentModal from './PaymentModal';

interface SubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (user: User) => void;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  tier: SubscriptionTier;
  status: 'success' | 'pending' | 'failed';
  paymentMethod: string;
}

// Storage key for transactions
const TRANSACTIONS_KEY = 'rizbot_transactions';

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  isOpen,
  onClose,
  onUserUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upgrade' | 'history'>('overview');
  const [user, setUser] = useState<User | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentUser = getSession();
      setUser(currentUser);
      loadTransactions();
    }
  }, [isOpen]);

  const loadTransactions = () => {
    const txns = getTransactions();
    setTransactions(txns);
  };

  const handlePaymentSuccess = (tier: SubscriptionTier) => {
    setIsPaymentModalOpen(false);
    const updatedUser = getSession();
    if (updatedUser) {
      setUser(updatedUser);
      onUserUpdate(updatedUser);
    }
    setShowSuccess(true);
    loadTransactions();
    
    setTimeout(() => {
      setShowSuccess(false);
      setActiveTab('overview');
      setSelectedTier(null);
    }, 3000);
  };

  const handleCancelSubscription = () => {
    if (!user) return;
    
    if (confirm('Apakah Anda yakin ingin membatalkan subscription? Anda akan kembali ke tier Free.')) {
      const result = upgradeSubscription('free');
      if (result.success && result.user) {
        setUser(result.user);
        onUserUpdate(result.user);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'text-slate-400 bg-slate-500/20';
      case 'basic': return 'text-blue-400 bg-blue-500/20';
      case 'pro': return 'text-purple-400 bg-purple-500/20';
      case 'elite': return 'text-amber-400 bg-amber-500/20';
    }
  };

  const getNextBillingDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const usage = user ? getRemainingUsage() : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Payment Modal */}
      {selectedTier && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          selectedTier={selectedTier}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0f1629] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="material-icons-round text-white">card_membership</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Subscription Management</h2>
              <p className="text-sm text-slate-400">Kelola langganan RIZBOT IDX Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <span className="material-icons-round text-slate-400">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'upgrade', label: 'Upgrade', icon: 'upgrade' },
            { id: 'payment', label: 'Pembayaran', icon: 'payment' },
            { id: 'history', label: 'Riwayat', icon: 'history' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span className="material-icons-round text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3">
              <span className="material-icons-round text-emerald-400 text-2xl">check_circle</span>
              <div>
                <p className="font-semibold text-emerald-400">Pembayaran Berhasil!</p>
                <p className="text-sm text-emerald-300/80">Subscription Anda telah diupgrade.</p>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && user && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Paket Saat Ini</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${getTierColor(user.subscription).split(' ')[0]}`}>
                        {SUBSCRIPTION_LIMITS[user.subscription].name}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTierColor(user.subscription)}`}>
                        {user.subscription === 'free' ? 'GRATIS' : 'AKTIF'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400 mb-1">Harga</p>
                    <p className="text-xl font-bold text-white">
                      {SUBSCRIPTION_LIMITS[user.subscription].price === 0 
                        ? 'Gratis' 
                        : `${formatPrice(SUBSCRIPTION_LIMITS[user.subscription].price)}/bulan`
                      }
                    </p>
                  </div>
                </div>

                {user.subscription !== 'free' && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <div>
                      <p className="text-sm text-slate-400">Tagihan Berikutnya</p>
                      <p className="text-white font-medium">{getNextBillingDate()}</p>
                    </div>
                    <button
                      onClick={handleCancelSubscription}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Batalkan Subscription
                    </button>
                  </div>
                )}
              </div>

              {/* Usage Stats */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Penggunaan Hari Ini</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {usage && (
                    <>
                      <UsageCard
                        icon="psychology"
                        label="Analisis AI"
                        current={user.dailyAnalysisCount}
                        limit={user.dailyAnalysisLimit}
                        color="blue"
                      />
                      <UsageCard
                        icon="visibility"
                        label="Watchlist"
                        current={5} // Would come from actual data
                        limit={SUBSCRIPTION_LIMITS[user.subscription].watchlistLimit}
                        color="emerald"
                      />
                      <UsageCard
                        icon="notifications"
                        label="Price Alerts"
                        current={2} // Would come from actual data
                        limit={SUBSCRIPTION_LIMITS[user.subscription].alertLimit}
                        color="amber"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Fitur Anda</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SUBSCRIPTION_LIMITS[user.subscription].features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 bg-slate-800/30 px-3 py-2 rounded-lg"
                    >
                      <span className="material-icons-round text-emerald-400 text-sm">check_circle</span>
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade CTA */}
              {user.subscription !== 'elite' && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white mb-1">Ingin fitur lebih?</h4>
                      <p className="text-sm text-slate-400">Upgrade ke paket yang lebih tinggi untuk akses penuh.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('upgrade')}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Upgrade Sekarang
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upgrade Tab */}
          {activeTab === 'upgrade' && user && (
            <div className="space-y-6">
              <p className="text-slate-400">Pilih paket yang sesuai dengan kebutuhan trading Anda:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(SUBSCRIPTION_LIMITS) as SubscriptionTier[])
                  .filter(tier => tier !== 'free')
                  .map(tier => {
                    const plan = SUBSCRIPTION_LIMITS[tier];
                    const isCurrent = user.subscription === tier;
                    const isDowngrade = 
                      (tier === 'basic' && ['pro', 'elite'].includes(user.subscription)) ||
                      (tier === 'pro' && user.subscription === 'elite');

                    return (
                      <div
                        key={tier}
                        onClick={() => !isCurrent && !isDowngrade && setSelectedTier(tier)}
                        className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                          selectedTier === tier
                            ? 'border-purple-500 bg-purple-500/10'
                            : isCurrent
                            ? 'border-emerald-500/50 bg-emerald-500/5'
                            : isDowngrade
                            ? 'border-slate-700/50 bg-slate-800/20 opacity-50 cursor-not-allowed'
                            : 'border-slate-700/50 hover:border-slate-600 bg-slate-800/30'
                        }`}
                      >
                        {tier === 'pro' && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                            POPULER
                          </div>
                        )}
                        
                        {isCurrent && (
                          <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                            SAAT INI
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                          <h4 className={`text-xl font-bold ${getTierColor(tier).split(' ')[0]}`}>
                            {plan.name}
                          </h4>
                          {selectedTier === tier && (
                            <span className="material-icons-round text-purple-400">check_circle</span>
                          )}
                        </div>

                        <div className="mb-4">
                          <span className="text-3xl font-bold text-white">
                            {formatPrice(plan.price)}
                          </span>
                          <span className="text-slate-400">/bulan</span>
                        </div>

                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                              <span className="material-icons-round text-emerald-400 text-sm">check</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
              </div>

              {selectedTier && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setActiveTab('payment')}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    Lanjut ke Pembayaran
                    <span className="material-icons-round">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              {!selectedTier ? (
                <div className="text-center py-12">
                  <span className="material-icons-round text-6xl text-slate-600 mb-4">shopping_cart</span>
                  <p className="text-slate-400">Pilih paket terlebih dahulu</p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Pilih Paket
                  </button>
                </div>
              ) : (
                <>
                  {/* Order Summary */}
                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                    <h3 className="font-semibold text-white mb-4">Ringkasan Pesanan</h3>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white font-medium">
                          RIZBOT IDX {SUBSCRIPTION_LIMITS[selectedTier].name}
                        </p>
                        <p className="text-sm text-slate-400">Langganan bulanan</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {formatPrice(SUBSCRIPTION_LIMITS[selectedTier].price)}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
                      <span className="text-slate-400">Total</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        {formatPrice(SUBSCRIPTION_LIMITS[selectedTier].price)}
                      </span>
                    </div>
                  </div>

                  {/* Available Payment Methods Info */}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="font-semibold text-white mb-3">Metode Pembayaran Tersedia</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg">
                        <div className="w-8 h-8 bg-[#108ee9] rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">D</span>
                        </div>
                        <span className="text-sm text-blue-400">DANA</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">G</span>
                        </div>
                        <span className="text-sm text-green-400">GoPay</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">O</span>
                        </div>
                        <span className="text-sm text-purple-400">OVO</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 rounded-lg">
                        <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">B</span>
                        </div>
                        <span className="text-sm text-orange-400">BNI VA</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 rounded-lg">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">B</span>
                        </div>
                        <span className="text-sm text-blue-400">BCA VA</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 rounded-lg">
                        <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">M</span>
                        </div>
                        <span className="text-sm text-yellow-400">Mandiri VA</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      💡 Virtual Account tidak dikenakan biaya tambahan
                    </p>
                  </div>

                  {/* Pay Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <button
                      onClick={() => {
                        setSelectedTier(null);
                        setActiveTab('upgrade');
                      }}
                      className="px-6 py-2.5 text-slate-400 hover:text-white transition-colors"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <span className="material-icons-round">payment</span>
                      Lanjutkan ke Pembayaran
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-icons-round text-6xl text-slate-600 mb-4">receipt_long</span>
                  <p className="text-slate-400">Belum ada riwayat transaksi</p>
                </div>
              ) : (
                transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.status === 'success' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : transaction.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        <span className="material-icons-round">
                          {transaction.status === 'success' ? 'check' : transaction.status === 'pending' ? 'hourglass_empty' : 'close'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Upgrade ke {SUBSCRIPTION_LIMITS[transaction.tier].name}
                        </p>
                        <p className="text-sm text-slate-400">
                          {formatDate(transaction.date)} • {transaction.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{formatPrice(transaction.amount)}</p>
                      <p className={`text-xs font-medium ${
                        transaction.status === 'success' 
                          ? 'text-emerald-400'
                          : transaction.status === 'pending'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}>
                        {transaction.status === 'success' ? 'Berhasil' : transaction.status === 'pending' ? 'Menunggu' : 'Gagal'}
                      </p>
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

// Usage Card Component
interface UsageCardProps {
  icon: string;
  label: string;
  current: number;
  limit: number;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
}

const UsageCard: React.FC<UsageCardProps> = ({ icon, label, current, limit, color }) => {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;

  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    purple: 'from-purple-500 to-pink-500',
  };

  return (
    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <span className="material-icons-round text-white text-sm">{icon}</span>
        </div>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold text-white">{current}</span>
        <span className="text-sm text-slate-400">
          / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${isNearLimit ? 'from-red-500 to-orange-500' : colorClasses[color]} rounded-full transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
