import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { User, logout } from '../services/authService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser?: (updates: Partial<User>) => void;
  onLogout?: () => void;
}

type SettingsTab = 'profile' | 'personalization' | 'notifications' | 'privacy' | 'help';

interface NotificationSettings {
  priceAlerts: boolean;
  newsAlerts: boolean;
  portfolioUpdates: boolean;
  weeklyReport: boolean;
  marketOpen: boolean;
  emailNotifications: boolean;
}

interface PrivacySettings {
  showProfile: boolean;
  showPortfolio: boolean;
  allowAnalytics: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdateUser, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Avatar/Profile photo
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return localStorage.getItem(`rizbot_avatar_${user.email}`) || '';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [bugReportText, setBugReportText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  
  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('rizbot_notification_settings');
    return saved ? JSON.parse(saved) : {
      priceAlerts: true,
      newsAlerts: true,
      portfolioUpdates: true,
      weeklyReport: false,
      marketOpen: false,
      emailNotifications: false,
    };
  });
  
  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>(() => {
    const saved = localStorage.getItem('rizbot_privacy_settings');
    return saved ? JSON.parse(saved) : {
      showProfile: false,
      showPortfolio: false,
      allowAnalytics: true,
    };
  });
  
  // UI preferences
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('rizbot_font_size') as 'small' | 'medium' | 'large') || 'medium';
  });
  
  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem('rizbot_accent_color') || 'blue';
  });
  
  const [chartStyle, setChartStyle] = useState<'default' | 'candlestick' | 'line' | 'area'>(() => {
    return (localStorage.getItem('rizbot_chart_style') as any) || 'candlestick';
  });
  
  const [language, setLanguage] = useState<'id' | 'en'>(() => {
    return (localStorage.getItem('rizbot_language') as 'id' | 'en') || 'id';
  });

  useEffect(() => {
    if (isOpen) {
      setEditName(user.name);
      setEditEmail(user.email);
      setIsEditing(false);
      setSaveStatus('idle');
    }
  }, [isOpen, user]);

  // Save notification settings
  useEffect(() => {
    localStorage.setItem('rizbot_notification_settings', JSON.stringify(notifications));
  }, [notifications]);

  // Save privacy settings
  useEffect(() => {
    localStorage.setItem('rizbot_privacy_settings', JSON.stringify(privacy));
  }, [privacy]);

  // Save UI preferences
  useEffect(() => {
    localStorage.setItem('rizbot_font_size', fontSize);
    document.documentElement.style.setProperty('--font-scale', 
      fontSize === 'small' ? '0.9' : fontSize === 'large' ? '1.1' : '1'
    );
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('rizbot_accent_color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('rizbot_chart_style', chartStyle);
  }, [chartStyle]);

  useEffect(() => {
    localStorage.setItem('rizbot_language', language);
  }, [language]);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle avatar/photo change
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran file maksimal 2MB', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        localStorage.setItem(`rizbot_avatar_${user.email}`, base64);
        showToast('Foto profil berhasil diubah', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    try {
      // Remove user from users list
      const users = JSON.parse(localStorage.getItem('rizbot_users') || '{}');
      delete users[user.email];
      localStorage.setItem('rizbot_users', JSON.stringify(users));
      
      // Remove avatar
      localStorage.removeItem(`rizbot_avatar_${user.email}`);
      
      // Remove current session
      localStorage.removeItem('rizbot_user');
      localStorage.removeItem('rizbot_session');
      
      // Remove user-specific data
      localStorage.removeItem('rizbot_watchlist');
      localStorage.removeItem('rizbot_portfolio');
      localStorage.removeItem('rizbot_alerts');
      
      showToast('Akun berhasil dihapus', 'success');
      setShowDeleteConfirm(false);
      
      // Logout and close
      if (onLogout) {
        setTimeout(() => {
          logout();
          onLogout();
          onClose();
        }, 1000);
      }
    } catch {
      showToast('Gagal menghapus akun', 'error');
    }
  };

  // Handle export data
  const handleExportData = () => {
    try {
      const exportData = {
        profile: {
          name: user.name,
          email: user.email,
          subscription: user.subscription,
          createdAt: user.createdAt,
        },
        watchlist: JSON.parse(localStorage.getItem('rizbot_watchlist') || '[]'),
        portfolio: JSON.parse(localStorage.getItem('rizbot_portfolio') || '[]'),
        alerts: JSON.parse(localStorage.getItem('rizbot_alerts') || '[]'),
        settings: {
          notifications: JSON.parse(localStorage.getItem('rizbot_notification_settings') || '{}'),
          privacy: JSON.parse(localStorage.getItem('rizbot_privacy_settings') || '{}'),
          theme: localStorage.getItem('rizbot_theme'),
          fontSize: localStorage.getItem('rizbot_font_size'),
          accentColor: localStorage.getItem('rizbot_accent_color'),
          chartStyle: localStorage.getItem('rizbot_chart_style'),
          language: localStorage.getItem('rizbot_language'),
        },
        exportedAt: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rizbot_data_${user.email.split('@')[0]}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Data berhasil di-export', 'success');
    } catch {
      showToast('Gagal export data', 'error');
    }
  };

  // Handle clear cache
  const handleClearCache = () => {
    try {
      // Clear cache data but keep user authentication
      const keysToKeep = ['rizbot_user', 'rizbot_users', 'rizbot_session', `rizbot_avatar_${user.email}`];
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rizbot_') && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage
      sessionStorage.clear();
      
      showToast('Cache berhasil dihapus', 'success');
      setShowClearCacheConfirm(false);
    } catch {
      showToast('Gagal menghapus cache', 'error');
    }
  };

  // Handle send feedback
  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    
    setFeedbackStatus('sending');
    
    // Simulate sending feedback (in real app, send to backend)
    setTimeout(() => {
      const feedbacks = JSON.parse(localStorage.getItem('rizbot_feedbacks') || '[]');
      feedbacks.push({
        email: user.email,
        message: feedbackText,
        type: 'feedback',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('rizbot_feedbacks', JSON.stringify(feedbacks));
      
      setFeedbackStatus('sent');
      showToast('Terima kasih atas feedback Anda!', 'success');
      
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackText('');
        setFeedbackStatus('idle');
      }, 1500);
    }, 1000);
  };

  // Handle send bug report
  const handleSendBugReport = () => {
    if (!bugReportText.trim()) return;
    
    setFeedbackStatus('sending');
    
    setTimeout(() => {
      const reports = JSON.parse(localStorage.getItem('rizbot_bug_reports') || '[]');
      reports.push({
        email: user.email,
        message: bugReportText,
        type: 'bug',
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('rizbot_bug_reports', JSON.stringify(reports));
      
      setFeedbackStatus('sent');
      showToast('Laporan bug berhasil dikirim', 'success');
      
      setTimeout(() => {
        setShowBugReportModal(false);
        setBugReportText('');
        setFeedbackStatus('idle');
      }, 1500);
    }, 1000);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) return;
    
    setSaveStatus('saving');
    try {
      // Update user in localStorage
      const users = JSON.parse(localStorage.getItem('rizbot_users') || '{}');
      if (users[user.email]) {
        users[user.email].name = editName.trim();
        localStorage.setItem('rizbot_users', JSON.stringify(users));
      }
      
      // Update current session
      const currentUser = JSON.parse(localStorage.getItem('rizbot_user') || '{}');
      currentUser.name = editName.trim();
      localStorage.setItem('rizbot_user', JSON.stringify(currentUser));
      
      if (onUpdateUser) {
        onUpdateUser({ name: editName.trim() });
      }
      
      setSaveStatus('saved');
      setIsEditing(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const accentColors = [
    { name: 'blue', color: 'bg-blue-500', label: 'Biru' },
    { name: 'purple', color: 'bg-purple-500', label: 'Ungu' },
    { name: 'emerald', color: 'bg-emerald-500', label: 'Hijau' },
    { name: 'amber', color: 'bg-amber-500', label: 'Kuning' },
    { name: 'rose', color: 'bg-rose-500', label: 'Pink' },
    { name: 'cyan', color: 'bg-cyan-500', label: 'Cyan' },
  ];

  const tabs: { id: SettingsTab; icon: string; label: string }[] = [
    { id: 'profile', icon: 'person', label: 'Profil' },
    { id: 'personalization', icon: 'palette', label: 'Personalisasi' },
    { id: 'notifications', icon: 'notifications', label: 'Notifikasi' },
    { id: 'privacy', icon: 'security', label: 'Privasi' },
    { id: 'help', icon: 'help', label: 'Bantuan' },
  ];

  if (!isOpen) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1629] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl">
              <span className="material-icons-round text-slate-400">settings</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Pengaturan</h2>
              <p className="text-sm text-slate-400">Kelola akun dan preferensi Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-icons-round text-slate-400">close</span>
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-56 border-r border-slate-700/50 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <span className="material-icons-round text-lg">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Informasi Profil</h3>
                  
                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="w-20 h-20 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                          {initials}
                        </div>
                      )}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                        title="Ganti foto"
                      >
                        <span className="material-icons-round text-white text-sm">edit</span>
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-sm text-slate-400">@{user.email.split('@')[0]}</p>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                      >
                        Ganti foto profil
                      </button>
                      {avatarUrl && (
                        <button 
                          onClick={() => {
                            setAvatarUrl('');
                            localStorage.removeItem(`rizbot_avatar_${user.email}`);
                            showToast('Foto profil dihapus', 'info');
                          }}
                          className="mt-2 ml-3 text-sm text-red-400 hover:text-red-300"
                        >
                          Hapus foto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Nama Lengkap</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                          isEditing ? 'border-blue-500/50' : 'border-slate-700/50'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        disabled
                        className="w-full px-4 py-3 bg-slate-800/30 border border-slate-700/50 rounded-xl text-slate-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500 mt-1">Email tidak dapat diubah</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Edit Profil
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleSaveProfile}
                            disabled={saveStatus === 'saving'}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            {saveStatus === 'saving' && (
                              <span className="material-icons-round animate-spin text-sm">refresh</span>
                            )}
                            {saveStatus === 'saved' ? 'Tersimpan!' : 'Simpan'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditName(user.name);
                            }}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Batal
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="pt-6 border-t border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">Informasi Akun</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <span className="text-slate-400">Subscription</span>
                      <span className="text-white font-medium capitalize">{user.subscription} Plan</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <span className="text-slate-400">Member sejak</span>
                      <span className="text-white font-medium">
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {user.isAdmin && (
                      <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <span className="text-emerald-400">Status</span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <span className="material-icons-round text-sm">verified</span>
                          Administrator
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-slate-700/50">
                  <h4 className="text-sm font-semibold text-red-400 uppercase mb-4">Zona Berbahaya</h4>
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-400 font-medium">Hapus Akun</p>
                        <p className="text-sm text-red-400/70">Akun dan semua data akan dihapus permanen</p>
                      </div>
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        Hapus Akun
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personalization Tab */}
            {activeTab === 'personalization' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Tema & Tampilan</h3>
                  
                  {/* Dark/Light Mode */}
                  <div className="p-4 bg-slate-800/30 rounded-xl mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-icons-round text-slate-400">
                          {isDark ? 'dark_mode' : 'light_mode'}
                        </span>
                        <div>
                          <p className="text-white font-medium">Mode Gelap</p>
                          <p className="text-sm text-slate-400">
                            {isDark ? 'Mode gelap aktif' : 'Mode terang aktif'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          isDark ? 'bg-blue-500' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            isDark ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="p-4 bg-slate-800/30 rounded-xl mb-4">
                    <p className="text-white font-medium mb-3">Warna Aksen</p>
                    <div className="flex items-center gap-2">
                      {accentColors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setAccentColor(color.name)}
                          className={`w-10 h-10 ${color.color} rounded-lg flex items-center justify-center transition-transform ${
                            accentColor === color.name ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''
                          }`}
                          title={color.label}
                        >
                          {accentColor === color.name && (
                            <span className="material-icons-round text-white text-sm">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className="p-4 bg-slate-800/30 rounded-xl mb-4">
                    <p className="text-white font-medium mb-3">Ukuran Font</p>
                    <div className="flex items-center gap-2">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setFontSize(size)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            fontSize === size
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {size === 'small' ? 'Kecil' : size === 'medium' ? 'Sedang' : 'Besar'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="p-4 bg-slate-800/30 rounded-xl mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-icons-round text-slate-400">language</span>
                        <div>
                          <p className="text-white font-medium">Bahasa</p>
                          <p className="text-sm text-slate-400">Pilih bahasa tampilan</p>
                        </div>
                      </div>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
                        className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="id">🇮🇩 Indonesia</option>
                        <option value="en">🇬🇧 English</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Chart Settings */}
                <div className="pt-6 border-t border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Pengaturan Grafik</h3>
                  
                  <div className="p-4 bg-slate-800/30 rounded-xl">
                    <p className="text-white font-medium mb-3">Gaya Grafik Default</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['candlestick', 'line', 'area', 'default'] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => setChartStyle(style)}
                          className={`p-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            chartStyle === style
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          <span className="material-icons-round text-lg">
                            {style === 'candlestick' ? 'candlestick_chart' : 
                             style === 'line' ? 'show_chart' : 
                             style === 'area' ? 'area_chart' : 'auto_graph'}
                          </span>
                          {style === 'candlestick' ? 'Candlestick' : 
                           style === 'line' ? 'Line Chart' : 
                           style === 'area' ? 'Area Chart' : 'Auto'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Notifikasi Push</h3>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'priceAlerts', icon: 'trending_up', label: 'Alert Harga', desc: 'Notifikasi saat harga mencapai target' },
                      { key: 'newsAlerts', icon: 'article', label: 'Berita Terkini', desc: 'Update berita pasar terbaru' },
                      { key: 'portfolioUpdates', icon: 'account_balance_wallet', label: 'Update Portfolio', desc: 'Perubahan nilai portfolio' },
                      { key: 'marketOpen', icon: 'schedule', label: 'Pasar Buka/Tutup', desc: 'Pengingat jam trading' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="material-icons-round text-slate-400">{item.icon}</span>
                          <div>
                            <p className="text-white font-medium">{item.label}</p>
                            <p className="text-sm text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setNotifications({
                            ...notifications,
                            [item.key]: !notifications[item.key as keyof NotificationSettings]
                          })}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            notifications[item.key as keyof NotificationSettings] ? 'bg-blue-500' : 'bg-slate-600'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              notifications[item.key as keyof NotificationSettings] ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Email</h3>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'weeklyReport', icon: 'summarize', label: 'Laporan Mingguan', desc: 'Ringkasan portfolio setiap minggu' },
                      { key: 'emailNotifications', icon: 'email', label: 'Email Notifikasi', desc: 'Terima notifikasi via email' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="material-icons-round text-slate-400">{item.icon}</span>
                          <div>
                            <p className="text-white font-medium">{item.label}</p>
                            <p className="text-sm text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setNotifications({
                            ...notifications,
                            [item.key]: !notifications[item.key as keyof NotificationSettings]
                          })}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            notifications[item.key as keyof NotificationSettings] ? 'bg-blue-500' : 'bg-slate-600'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              notifications[item.key as keyof NotificationSettings] ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Privasi</h3>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'showProfile', icon: 'visibility', label: 'Tampilkan Profil', desc: 'Profil dapat dilihat pengguna lain' },
                      { key: 'showPortfolio', icon: 'account_balance', label: 'Tampilkan Portfolio', desc: 'Portfolio dapat dilihat pengguna lain' },
                      { key: 'allowAnalytics', icon: 'analytics', label: 'Analitik Penggunaan', desc: 'Bantu kami meningkatkan layanan' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="material-icons-round text-slate-400">{item.icon}</span>
                          <div>
                            <p className="text-white font-medium">{item.label}</p>
                            <p className="text-sm text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPrivacy({
                            ...privacy,
                            [item.key]: !privacy[item.key as keyof PrivacySettings]
                          })}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            privacy[item.key as keyof PrivacySettings] ? 'bg-blue-500' : 'bg-slate-600'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              privacy[item.key as keyof PrivacySettings] ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Data</h3>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={handleExportData}
                      className="w-full flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-icons-round text-slate-400">download</span>
                        <div className="text-left">
                          <p className="text-white font-medium">Export Data</p>
                          <p className="text-sm text-slate-400">Download semua data Anda</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-400">chevron_right</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowClearCacheConfirm(true)}
                      className="w-full flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-icons-round text-slate-400">delete_sweep</span>
                        <div className="text-left">
                          <p className="text-white font-medium">Hapus Cache</p>
                          <p className="text-sm text-slate-400">Bersihkan data tersimpan</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-400">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Help Tab */}
            {activeTab === 'help' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Pusat Bantuan</h3>
                  
                  <div className="space-y-3">
                    {/* Panduan Pengguna */}
                    <button 
                      onClick={() => window.open('https://rizbot.id/panduan', '_blank')}
                      className="w-full flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-icons-round text-slate-400">menu_book</span>
                        <div className="text-left">
                          <p className="text-white font-medium">Panduan Pengguna</p>
                          <p className="text-sm text-slate-400">Pelajari cara menggunakan RIZBOT</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-400">open_in_new</span>
                    </button>
                    
                    {/* FAQ */}
                    <button 
                      onClick={() => window.open('https://rizbot.id/faq', '_blank')}
                      className="w-full flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-icons-round text-slate-400">live_help</span>
                        <div className="text-left">
                          <p className="text-white font-medium">FAQ</p>
                          <p className="text-sm text-slate-400">Pertanyaan yang sering ditanyakan</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-400">open_in_new</span>
                    </button>
                    
                    {/* Support via WhatsApp */}
                    <button 
                      onClick={() => window.open('https://wa.me/6281234567890?text=Halo%20RIZBOT%20Support', '_blank')}
                      className="w-full flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-icons-round text-slate-400">support_agent</span>
                        <div className="text-left">
                          <p className="text-white font-medium">Hubungi Support</p>
                          <p className="text-sm text-slate-400">Butuh bantuan? Chat via WhatsApp</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-400">open_in_new</span>
                    </button>
                    
                    {/* Feedback */}
                    <button 
                      onClick={() => setShowFeedbackModal(true)}
                      className="w-full flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-icons-round text-slate-400">feedback</span>
                        <div className="text-left">
                          <p className="text-white font-medium">Kirim Feedback</p>
                          <p className="text-sm text-slate-400">Bantu kami meningkatkan layanan</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-400">chevron_right</span>
                    </button>
                    
                    {/* Bug Report */}
                    <button 
                      onClick={() => setShowBugReportModal(true)}
                      className="w-full flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-icons-round text-slate-400">bug_report</span>
                        <div className="text-left">
                          <p className="text-white font-medium">Laporkan Bug</p>
                          <p className="text-sm text-slate-400">Temukan masalah? Laporkan disini</p>
                        </div>
                      </div>
                      <span className="material-icons-round text-slate-400">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Tentang</h3>
                  
                  <div className="p-4 bg-slate-800/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Versi Aplikasi</span>
                      <span className="text-white font-medium">1.0.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Build</span>
                      <span className="text-white font-medium">2024.12.19</span>
                    </div>
                    <div className="pt-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-4">
                        <a href="https://rizbot.id/terms" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300">Syarat & Ketentuan</a>
                        <a href="https://rizbot.id/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300">Kebijakan Privasi</a>
                        <a href="https://rizbot.id/license" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300">Lisensi</a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="pt-6 border-t border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Ikuti Kami</h3>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => window.open('https://rizbot.id', '_blank')}
                      className="p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                      title="Website"
                    >
                      <span className="material-icons-round text-slate-400">public</span>
                    </button>
                    <button 
                      onClick={() => window.open('https://youtube.com/@rizbot', '_blank')}
                      className="p-3 bg-slate-800/30 rounded-xl hover:bg-red-500/20 transition-colors"
                      title="YouTube"
                    >
                      <span className="material-icons-round text-slate-400">smart_display</span>
                    </button>
                    <button 
                      onClick={() => window.open('https://discord.gg/rizbot', '_blank')}
                      className="p-3 bg-slate-800/30 rounded-xl hover:bg-indigo-500/20 transition-colors"
                      title="Discord"
                    >
                      <span className="material-icons-round text-slate-400">chat</span>
                    </button>
                    <button 
                      onClick={() => window.open('https://twitter.com/rizbot', '_blank')}
                      className="p-3 bg-slate-800/30 rounded-xl hover:bg-blue-500/20 transition-colors"
                      title="Twitter/X"
                    >
                      <span className="material-icons-round text-slate-400">tag</span>
                    </button>
                    <button 
                      onClick={() => window.open('https://t.me/rizbot', '_blank')}
                      className="p-3 bg-slate-800/30 rounded-xl hover:bg-cyan-500/20 transition-colors"
                      title="Telegram"
                    >
                      <span className="material-icons-round text-slate-400">send</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-[60] animate-slide-up ${
          toast.type === 'success' ? 'bg-emerald-500' : 
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          <span className="material-icons-round text-white text-sm">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="text-white text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-[#1a2235] rounded-2xl border border-red-500/30 p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <span className="material-icons-round text-red-400 text-2xl">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Hapus Akun?</h3>
                <p className="text-sm text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Semua data Anda akan dihapus secara permanen termasuk:
            </p>
            <ul className="text-sm text-slate-400 mb-6 space-y-1">
              <li className="flex items-center gap-2">
                <span className="material-icons-round text-xs">remove</span>
                Profil dan pengaturan akun
              </li>
              <li className="flex items-center gap-2">
                <span className="material-icons-round text-xs">remove</span>
                Watchlist dan portfolio
              </li>
              <li className="flex items-center gap-2">
                <span className="material-icons-round text-xs">remove</span>
                Alert dan riwayat analisis
              </li>
            </ul>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cache Confirmation Modal */}
      {showClearCacheConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-[#1a2235] rounded-2xl border border-slate-700/50 p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <span className="material-icons-round text-amber-400 text-2xl">delete_sweep</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Hapus Cache?</h3>
                <p className="text-sm text-slate-400">Data cache akan dihapus</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Cache yang akan dihapus:
            </p>
            <ul className="text-sm text-slate-400 mb-6 space-y-1">
              <li className="flex items-center gap-2">
                <span className="material-icons-round text-xs">remove</span>
                Data harga tersimpan
              </li>
              <li className="flex items-center gap-2">
                <span className="material-icons-round text-xs">remove</span>
                Cache analisis
              </li>
              <li className="flex items-center gap-2">
                <span className="material-icons-round text-xs">remove</span>
                Session data
              </li>
            </ul>
            <p className="text-xs text-emerald-400 mb-4">
              ✓ Akun, watchlist, dan portfolio Anda tetap aman
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowClearCacheConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleClearCache}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
              >
                Ya, Hapus Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-[#1a2235] rounded-2xl border border-slate-700/50 p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <span className="material-icons-round text-blue-400">feedback</span>
                </div>
                <h3 className="text-lg font-bold text-white">Kirim Feedback</h3>
              </div>
              <button 
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                  setFeedbackStatus('idle');
                }}
                className="p-1 hover:bg-slate-800 rounded-lg"
              >
                <span className="material-icons-round text-slate-400">close</span>
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Bagikan pendapat, saran, atau ide Anda untuk membantu kami meningkatkan RIZBOT.
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tulis feedback Anda disini..."
              className="w-full h-32 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              disabled={feedbackStatus !== 'idle'}
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                disabled={feedbackStatus === 'sending'}
              >
                Batal
              </button>
              <button
                onClick={handleSendFeedback}
                disabled={!feedbackText.trim() || feedbackStatus !== 'idle'}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {feedbackStatus === 'sending' && (
                  <span className="material-icons-round animate-spin text-sm">refresh</span>
                )}
                {feedbackStatus === 'sent' && (
                  <span className="material-icons-round text-sm">check</span>
                )}
                {feedbackStatus === 'sent' ? 'Terkirim!' : feedbackStatus === 'sending' ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bug Report Modal */}
      {showBugReportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-[#1a2235] rounded-2xl border border-slate-700/50 p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <span className="material-icons-round text-red-400">bug_report</span>
                </div>
                <h3 className="text-lg font-bold text-white">Laporkan Bug</h3>
              </div>
              <button 
                onClick={() => {
                  setShowBugReportModal(false);
                  setBugReportText('');
                  setFeedbackStatus('idle');
                }}
                className="p-1 hover:bg-slate-800 rounded-lg"
              >
                <span className="material-icons-round text-slate-400">close</span>
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Jelaskan bug yang Anda temukan dengan detail. Sertakan langkah-langkah untuk mereproduksi masalah.
            </p>
            <textarea
              value={bugReportText}
              onChange={(e) => setBugReportText(e.target.value)}
              placeholder="Contoh: Ketika saya klik tombol X, terjadi error Y..."
              className="w-full h-32 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
              disabled={feedbackStatus !== 'idle'}
            />
            <div className="mt-2 p-2 bg-slate-800/30 rounded-lg">
              <p className="text-xs text-slate-500">
                <span className="material-icons-round text-xs align-middle mr-1">info</span>
                Info browser akan otomatis disertakan untuk membantu debugging
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowBugReportModal(false);
                  setBugReportText('');
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                disabled={feedbackStatus === 'sending'}
              >
                Batal
              </button>
              <button
                onClick={handleSendBugReport}
                disabled={!bugReportText.trim() || feedbackStatus !== 'idle'}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {feedbackStatus === 'sending' && (
                  <span className="material-icons-round animate-spin text-sm">refresh</span>
                )}
                {feedbackStatus === 'sent' && (
                  <span className="material-icons-round text-sm">check</span>
                )}
                {feedbackStatus === 'sent' ? 'Terkirim!' : feedbackStatus === 'sending' ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;
