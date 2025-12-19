import React from 'react';
import { SUBSCRIPTION_LIMITS, SubscriptionTier, upgradeSubscription, User } from '../services/authService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  onUpgradeSuccess: (user: User) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, currentTier, onUpgradeSuccess }) => {
  const [selectedTier, setSelectedTier] = React.useState<SubscriptionTier>('pro');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const tiers: SubscriptionTier[] = ['free', 'basic', 'pro', 'elite'];
  
  const tierStyles: Record<SubscriptionTier, { gradient: string; icon: string; popular?: boolean }> = {
    free: { gradient: 'from-slate-600 to-slate-700', icon: 'person' },
    basic: { gradient: 'from-blue-600 to-blue-700', icon: 'star' },
    pro: { gradient: 'from-purple-600 to-purple-700', icon: 'workspace_premium', popular: true },
    elite: { gradient: 'from-amber-500 to-orange-500', icon: 'diamond' },
  };

  const handleUpgrade = async () => {
    if (selectedTier === currentTier || selectedTier === 'free') return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = upgradeSubscription(selectedTier);
    
    if (result.success && result.user) {
      onUpgradeSuccess(result.user);
      onClose();
    }
    
    setIsProcessing(false);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis';
    return `Rp${price.toLocaleString('id-ID')}/bulan`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#141c2f] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 p-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-b border-slate-700/50 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <span className="material-icons-round text-lg">close</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              🚀 Upgrade RIZBOT IDX
            </h2>
            <p className="text-slate-400">
              Pilih paket yang sesuai dengan kebutuhan trading Anda
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier) => {
              const limits = SUBSCRIPTION_LIMITS[tier];
              const style = tierStyles[tier];
              const isCurrentPlan = tier === currentTier;
              const isSelected = tier === selectedTier;
              const isDowngrade = tiers.indexOf(tier) < tiers.indexOf(currentTier);

              return (
                <div
                  key={tier}
                  onClick={() => !isCurrentPlan && !isDowngrade && setSelectedTier(tier)}
                  className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                    isCurrentPlan
                      ? 'border-slate-600 bg-slate-800/30 cursor-default opacity-70'
                      : isSelected
                        ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                        : isDowngrade
                          ? 'border-slate-700/50 bg-slate-800/20 cursor-not-allowed opacity-50'
                          : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/30'
                  }`}
                >
                  {/* Popular Badge */}
                  {style.popular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-bold text-white">
                      POPULAR
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-600 rounded-full text-xs font-bold text-white">
                      PAKET SAAT INI
                    </div>
                  )}

                  {/* Header */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-4`}>
                    <span className="material-icons-round text-white text-2xl">{style.icon}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{limits.name}</h3>
                  <p className={`text-2xl font-bold mb-4 ${tier === 'elite' ? 'text-amber-400' : 'text-white'}`}>
                    {formatPrice(limits.price)}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {limits.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="material-icons-round text-emerald-400 text-sm mt-0.5">check_circle</span>
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Payment Section */}
          {selectedTier !== 'free' && selectedTier !== currentTier && (
            <div className="mt-8 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4">Metode Pembayaran</h3>
              
              {/* Payment Methods */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { name: 'QRIS', icon: '📱' },
                  { name: 'Transfer Bank', icon: '🏦' },
                  { name: 'GoPay', icon: '💚' },
                  { name: 'OVO', icon: '💜' },
                ].map((method) => (
                  <button
                    key={method.name}
                    className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-center transition-all"
                  >
                    <span className="text-2xl mb-1 block">{method.icon}</span>
                    <span className="text-xs text-slate-300">{method.name}</span>
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl mb-4">
                <div>
                  <p className="text-slate-400 text-sm">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-white">
                    {formatPrice(SUBSCRIPTION_LIMITS[selectedTier].price)}
                  </p>
                </div>
                <button
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="material-icons-round animate-spin text-lg">sync</span>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <span className="material-icons-round text-lg">lock</span>
                      Bayar Sekarang
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-500 text-center">
                🔒 Pembayaran aman dengan enkripsi SSL. Bisa dibatalkan kapan saja.
              </p>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="p-6 bg-slate-800/30 border-t border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <span className="material-icons-round text-3xl text-emerald-400 mb-2">security</span>
              <h4 className="font-bold text-white mb-1">Aman & Terpercaya</h4>
              <p className="text-sm text-slate-400">Data Anda dilindungi enkripsi bank-grade</p>
            </div>
            <div>
              <span className="material-icons-round text-3xl text-blue-400 mb-2">support_agent</span>
              <h4 className="font-bold text-white mb-1">Dukungan 24/7</h4>
              <p className="text-sm text-slate-400">Tim support siap membantu kapan saja</p>
            </div>
            <div>
              <span className="material-icons-round text-3xl text-purple-400 mb-2">autorenew</span>
              <h4 className="font-bold text-white mb-1">Garansi Uang Kembali</h4>
              <p className="text-sm text-slate-400">7 hari garansi uang kembali 100%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
