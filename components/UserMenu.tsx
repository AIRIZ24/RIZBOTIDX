import React from 'react';
import { User, logout, SUBSCRIPTION_LIMITS, SubscriptionTier, getRemainingUsage } from '../services/authService';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  onUpgrade: () => void;
  onManageSubscription?: () => void;
  onAdminPaymentSettings?: () => void;
  onAPIKeySettings?: () => void;
  onSettings?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onUpgrade, onManageSubscription, onAdminPaymentSettings, onAPIKeySettings, onSettings }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  
  const remaining = getRemainingUsage();
  const limits = SUBSCRIPTION_LIMITS[user.subscription];

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    onLogout();
    setIsOpen(false);
  };

  const getSubscriptionBadge = (tier: SubscriptionTier) => {
    const badges: Record<SubscriptionTier, { bg: string; text: string; icon: string }> = {
      free: { bg: 'bg-slate-600', text: 'Free', icon: 'person' },
      basic: { bg: 'bg-blue-600', text: 'Basic', icon: 'star' },
      pro: { bg: 'bg-purple-600', text: 'Pro', icon: 'workspace_premium' },
      elite: { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'Elite', icon: 'diamond' },
    };
    return badges[tier];
  };

  const badge = getSubscriptionBadge(user.subscription);

  // Get initials for avatar
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-all"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
        
        {/* Name & Subscription (hidden on mobile) */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white leading-tight">{user.name.split(' ')[0]}</p>
          <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${badge.bg}`}>
            <span className="material-icons-round" style={{ fontSize: '10px' }}>{badge.icon}</span>
            {badge.text}
          </div>
        </div>
        
        <span className="material-icons-round text-slate-400 text-lg">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#141c2f] rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{user.name}</p>
                <p className="text-sm text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            
            {/* Subscription Badge */}
            <div className="flex items-center gap-2 mt-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-white ${badge.bg}`}>
                <span className="material-icons-round text-sm">{badge.icon}</span>
                {limits.name} Plan
              </div>
              {user.isAdmin && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30">
                  <span className="material-icons-round text-sm">verified</span>
                  ADMIN
                </div>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="p-4 border-b border-slate-700/50 space-y-3">
            <p className="text-xs text-slate-500 uppercase font-bold">Penggunaan Hari Ini</p>
            
            {/* Analysis Usage */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-400">Analisis AI</span>
                <span className="text-white font-medium">
                  {remaining.analysis === 'unlimited' ? '∞' : `${remaining.analysis}/${limits.dailyAnalysis}`}
                </span>
              </div>
              {remaining.analysis !== 'unlimited' && (
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ 
                      width: `${Math.max(0, (remaining.analysis as number) / limits.dailyAnalysis * 100)}%` 
                    }}
                  />
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-800/50 rounded-lg">
                <p className="text-slate-500">Watchlist</p>
                <p className="text-white font-bold">{remaining.watchlist === 'unlimited' ? '∞' : remaining.watchlist} max</p>
              </div>
              <div className="p-2 bg-slate-800/50 rounded-lg">
                <p className="text-slate-500">Alerts</p>
                <p className="text-white font-bold">{remaining.alert === 'unlimited' ? '∞' : remaining.alert} max</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {/* Admin Menu */}
            {user.isAdmin && (
              <>
                <div className="px-3 py-1 mb-1">
                  <p className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Admin Menu</p>
                </div>
                <button 
                  onClick={() => {
                    if (onAdminPaymentSettings) {
                      onAdminPaymentSettings();
                      setIsOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 transition-all text-left"
                >
                  <span className="material-icons-round text-lg">payments</span>
                  <span className="text-sm">Setting Pembayaran</span>
                </button>
                <div className="my-2 border-b border-slate-700/50" />
              </>
            )}
            
            <button 
              onClick={() => {
                if (onManageSubscription) {
                  onManageSubscription();
                  setIsOpen(false);
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-all text-left"
            >
              <span className="material-icons-round text-lg">card_membership</span>
              <span className="text-sm">Kelola Subscription</span>
            </button>
            
            <button 
              onClick={() => {
                if (onAPIKeySettings) {
                  onAPIKeySettings();
                  setIsOpen(false);
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-all text-left"
            >
              <span className="material-icons-round text-lg">key</span>
              <span className="text-sm">API Key Settings</span>
            </button>
            
            <button 
              onClick={() => {
                if (onSettings) {
                  onSettings();
                  setIsOpen(false);
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-all text-left"
            >
              <span className="material-icons-round text-lg">settings</span>
              <span className="text-sm">Pengaturan</span>
            </button>
            
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-all text-left">
              <span className="material-icons-round text-lg">history</span>
              <span className="text-sm">Riwayat Transaksi</span>
            </button>
            
            {user.subscription !== 'elite' && (
              <button 
                onClick={() => {
                  onUpgrade();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-400 transition-all text-left"
              >
                <span className="material-icons-round text-lg">upgrade</span>
                <span className="text-sm font-medium">Upgrade ke {user.subscription === 'free' ? 'Pro' : 'Elite'}</span>
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-slate-700/50">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-all text-left"
            >
              <span className="material-icons-round text-lg">logout</span>
              <span className="text-sm">Keluar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
