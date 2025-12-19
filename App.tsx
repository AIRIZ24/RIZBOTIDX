import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MOCK_TICKERS, DEFAULT_WATCHLIST } from './constants';
import { StockTicker, AppMode, TimeRange, StockData } from './types';
import StockChart from './components/StockChart';
import AITradingPanel from './components/AITradingPanel';
import StockScreener from './components/StockScreener';
import MultiTimeframeChart from './components/MultiTimeframeChart';
import RealTimeMarketReview from './components/RealTimeMarketReview';
import Predictor from './components/Predictor';
import TradingRecommendation from './components/TradingRecommendation';
import QuickAnalysis from './components/QuickAnalysis';
import LiveAssistant from './components/LiveAssistant';
import MapsLocator from './components/MapsLocator';
import AddStockModal from './components/AddStockModal';
import WatchlistSearch from './components/WatchlistSearch';
import PriceAlertModal from './components/PriceAlertModal';
import PortfolioTracker from './components/PortfolioTracker';
import AddTransactionModal from './components/AddTransactionModal';
import NewsSentimentPanel from './components/NewsSentimentPanel';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import UpgradeModal from './components/UpgradeModal';
import SubscriptionManager from './components/SubscriptionManager';
import UsageLimitModal, { LimitType } from './components/UsageLimitModal';
import AdminPaymentSettings from './components/AdminPaymentSettings';
import SocialTrading from './components/SocialTrading';
import ThemeToggle from './components/ThemeToggle';
import APIKeySettings from './components/APIKeySettings';
import SettingsModal from './components/SettingsModal';
import { useTheme } from './contexts/ThemeContext';
import { getQuickSentiment } from './services/geminiService';
import { fetchHistoricalData } from './services/marketData';
import { fetchWatchlistData, subscribeToPrice, clearCache } from './services/stockApiService';
import { 
  checkAlerts, 
  triggerAlertNotification, 
  requestNotificationPermission, 
  getActiveAlerts,
  PriceAlert 
} from './services/priceAlertService';
import {
  getPortfolioSymbols,
} from './services/portfolioService';
import {
  User,
  getSession,
  logout,
  canUseFeature,
  incrementUsage,
  initializeDefaultAdminAccounts,
  SUBSCRIPTION_LIMITS,
} from './services/authService';
import { checkFeatureUsage, isPremiumFeatureAvailable } from './services/usageLimiter';
import { hasAPIKey } from './services/securityService';

// LocalStorage keys
const WATCHLIST_STORAGE_KEY = 'rizbot_watchlist';

// Load watchlist from localStorage
const loadWatchlistFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load watchlist from storage:', e);
  }
  return DEFAULT_WATCHLIST;
};

// Save watchlist to localStorage
const saveWatchlistToStorage = (symbols: string[]) => {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(symbols));
  } catch (e) {
    console.error('Failed to save watchlist to storage:', e);
  }
};

const App: React.FC = () => {
  const { isDark } = useTheme();
  const [watchlist, setWatchlist] = useState<StockTicker[]>(MOCK_TICKERS);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(loadWatchlistFromStorage);
  const [selectedTicker, setSelectedTicker] = useState<StockTicker>(MOCK_TICKERS[0]);
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [sentiment, setSentiment] = useState<string>('NEUTRAL');
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWatchlistSearchOpen, setIsWatchlistSearchOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [transactionSymbol, setTransactionSymbol] = useState<string>('');
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [triggeredAlert, setTriggeredAlert] = useState<PriceAlert | null>(null);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSubscriptionManagerOpen, setIsSubscriptionManagerOpen] = useState(false);
  const [isAdminPaymentSettingsOpen, setIsAdminPaymentSettingsOpen] = useState(false);
  
  // API Key Settings State
  const [isAPIKeySettingsOpen, setIsAPIKeySettingsOpen] = useState(false);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(hasAPIKey());
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // AI Trading Panel State
  const [isAITradingOpen, setIsAITradingOpen] = useState(false);
  
  // Stock Screener State
  const [isScreenerOpen, setIsScreenerOpen] = useState(false);
  
  // Multi-Timeframe State
  const [isMultiTimeframeOpen, setIsMultiTimeframeOpen] = useState(false);
  
  // Social Trading State
  const [isSocialTradingOpen, setIsSocialTradingOpen] = useState(false);
  
  // Usage Limit State
  const [isUsageLimitOpen, setIsUsageLimitOpen] = useState(false);
  const [usageLimitType, setUsageLimitType] = useState<LimitType>('analysis');
  const [usageLimitInfo, setUsageLimitInfo] = useState<{ current: number; max: number; featureName?: string }>({ current: 0, max: 0 });
  
  // Market Data State
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [chartData, setChartData] = useState<StockData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load Material Icons & check market status & request notification permission
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Request notification permission
    requestNotificationPermission();
    
    // Load initial alerts count
    setActiveAlertsCount(getActiveAlerts().length);
    
    // Load portfolio count
    setPortfolioCount(getPortfolioSymbols().length);
    
    // Load user session
    const user = getSession();
    if (user) {
      setCurrentUser(user);
    }
    
    // Initialize default admin accounts
    initializeDefaultAdminAccounts();

    // Update time every minute
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      // IDX Market Hours: Mon-Fri 09:00-16:00 WIB (UTC+7)
      const hour = now.getHours();
      const day = now.getDay();
      setIsMarketOpen(day >= 1 && day <= 5 && hour >= 9 && hour < 16);
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch real-time watchlist data on mount
  useEffect(() => {
    const loadWatchlist = async () => {
      setIsLoadingWatchlist(true);
      try {
        const data = await fetchWatchlistData(watchlistSymbols);
        setWatchlist(data);
        // Update selected ticker with real data
        const updated = data.find(t => t.symbol === selectedTicker.symbol);
        if (updated) {
          setSelectedTicker(updated);
        } else if (data.length > 0) {
          setSelectedTicker(data[0]);
        }
        setLastRefresh(new Date().toLocaleTimeString('id-ID'));
      } catch (error) {
        console.error('Failed to load watchlist:', error);
      } finally {
        setIsLoadingWatchlist(false);
      }
    };

    loadWatchlist();

    // Refresh watchlist every 30 seconds for more real-time data
    const refreshInterval = setInterval(loadWatchlist, 30000);
    return () => clearInterval(refreshInterval);
  }, [watchlistSymbols]);

  // Subscribe to price updates for selected ticker & check alerts
  useEffect(() => {
    const unsubscribe = subscribeToPrice(selectedTicker.symbol, (data) => {
      setSelectedTicker(prev => ({
        ...prev,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
      }));
      // Also update in watchlist
      setWatchlist(prev => prev.map(t => 
        t.symbol === selectedTicker.symbol 
          ? { ...t, price: data.price, change: data.change, changePercent: data.changePercent }
          : t
      ));
      
      // Check price alerts
      const triggered = checkAlerts(selectedTicker.symbol, data.price);
      if (triggered.length > 0) {
        triggered.forEach(alert => {
          triggerAlertNotification(alert, data.price);
          setTriggeredAlert(alert);
        });
        setActiveAlertsCount(getActiveAlerts().length);
        
        // Clear triggered alert notification after 5 seconds
        setTimeout(() => setTriggeredAlert(null), 5000);
      }
    });

    return () => unsubscribe();
  }, [selectedTicker.symbol]);

  // Fetch data when ticker or range changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const data = await fetchHistoricalData(selectedTicker.symbol, timeRange);
        setChartData(data);
      } catch (e) {
        console.error("Failed to load chart data", e);
      } finally {
        setIsLoadingData(false);
      }
      
      // Also update sentiment
      getQuickSentiment(`Latest earnings report for ${selectedTicker.name} shows strong growth.`).then(setSentiment);
    };

    loadData();
  }, [selectedTicker, timeRange]);

  // Live Feed Simulation for 1D/5D ranges
  useEffect(() => {
    if (timeRange !== '1D' && timeRange !== '5D') return;

    const interval = setInterval(() => {
        setChartData(prev => {
            if (prev.length === 0) return prev;
            // Clone the array to avoid mutation issues
            const newData = [...prev];
            const lastCandle = newData[newData.length - 1];
            
            // Simple random walk for the last candle close
            const volatility = 0.0005; // 0.05% move
            const change = lastCandle.close * (Math.random() - 0.5) * volatility;
            
            // Update last candle
            const newClose = lastCandle.close + change;
            newData[newData.length - 1] = {
                ...lastCandle,
                close: newClose,
                high: Math.max(lastCandle.high, newClose),
                low: Math.min(lastCandle.low, newClose),
                volume: lastCandle.volume + Math.floor(Math.random() * 500)
            };
            
            // Update selected ticker price in UI
            setSelectedTicker(t => ({
                ...t,
                price: parseFloat(newClose.toFixed(0)),
                change: newClose - prev[0].open, // approx daily change
                changePercent: parseFloat((((newClose - prev[0].open) / prev[0].open) * 100).toFixed(2))
            }));

            return newData;
        });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [timeRange, selectedTicker.symbol]);

  // Memoized price display
  const priceDisplay = useMemo(() => ({
    formatted: selectedTicker.price.toLocaleString('id-ID'),
    changeFormatted: (selectedTicker.change >= 0 ? '+' : '') + selectedTicker.change.toLocaleString('id-ID'),
    percentFormatted: (selectedTicker.changePercent >= 0 ? '+' : '') + selectedTicker.changePercent.toFixed(2) + '%',
    isPositive: selectedTicker.change >= 0
  }), [selectedTicker]);

  // Handle ticker selection
  const handleTickerSelect = useCallback((ticker: StockTicker) => {
    setSelectedTicker(ticker);
    setMode(AppMode.DASHBOARD);
  }, []);

  // Handle add stock to watchlist
  const handleAddStock = useCallback((stock: StockTicker) => {
    setWatchlist(prev => [...prev, stock]);
    setWatchlistSymbols(prev => {
      const newSymbols = [...prev, stock.symbol];
      saveWatchlistToStorage(newSymbols);
      return newSymbols;
    });
    setIsAddModalOpen(false);
  }, []);

  // Handle remove stock from watchlist
  const handleRemoveStock = useCallback((symbol: string) => {
    if (watchlist.length <= 1) {
      alert('Watchlist harus memiliki minimal 1 saham!');
      return;
    }
    
    setWatchlist(prev => prev.filter(t => t.symbol !== symbol));
    setWatchlistSymbols(prev => {
      const newSymbols = prev.filter(s => s !== symbol);
      saveWatchlistToStorage(newSymbols);
      return newSymbols;
    });
    
    // If removing selected ticker, select another one
    if (selectedTicker.symbol === symbol) {
      const remaining = watchlist.filter(t => t.symbol !== symbol);
      if (remaining.length > 0) {
        setSelectedTicker(remaining[0]);
      }
    }
  }, [watchlist, selectedTicker]);

  // Handle add transaction (buy/sell)
  const handleAddTransaction = useCallback((symbol: string, type: 'buy' | 'sell') => {
    setTransactionSymbol(symbol);
    setTransactionType(type);
    setIsTransactionModalOpen(true);
  }, []);

  // Handle transaction completion
  const handleTransactionComplete = useCallback(() => {
    setIsTransactionModalOpen(false);
    setPortfolioCount(getPortfolioSymbols().length);
  }, []);

  // Handle auth success
  const handleAuthSuccess = useCallback((user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    setCurrentUser(null);
  }, []);

  // Handle upgrade click
  const handleUpgradeClick = useCallback(() => {
    setIsUpgradeModalOpen(true);
  }, []);

  // Handle upgrade success
  const handleUpgradeSuccess = useCallback((updatedUser: User) => {
    setCurrentUser(updatedUser);
    setIsUpgradeModalOpen(false);
  }, []);

  // Handle subscription manager
  const handleManageSubscription = useCallback(() => {
    setIsSubscriptionManagerOpen(true);
  }, []);

  // Show usage limit modal
  const showUsageLimit = useCallback((limitType: LimitType, current: number, max: number, featureName?: string) => {
    setUsageLimitType(limitType);
    setUsageLimitInfo({ current, max, featureName });
    setIsUsageLimitOpen(true);
  }, []);

  // Check and handle feature access
  const checkFeatureAccess = useCallback((feature: 'analysis' | 'watchlist' | 'alert' | 'portfolio', currentCount?: number): boolean => {
    const check = checkFeatureUsage(feature, currentCount);
    
    if (!check.allowed) {
      showUsageLimit(
        feature,
        check.currentUsage,
        check.maxUsage,
      );
      return false;
    }
    return true;
  }, [showUsageLimit]);

  // Check premium feature access
  const checkPremiumAccess = useCallback((feature: string, featureName: string): boolean => {
    const { available, requiredTier } = isPremiumFeatureAvailable(feature);
    
    if (!available) {
      showUsageLimit('feature', 0, 0, featureName);
      return false;
    }
    return true;
  }, [showUsageLimit]);

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0a0e17] text-slate-200' 
        : 'bg-slate-100 text-slate-800'
    }`}>
      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={isUsageLimitOpen}
        onClose={() => setIsUsageLimitOpen(false)}
        onUpgrade={() => {
          setIsUsageLimitOpen(false);
          setIsUpgradeModalOpen(true);
        }}
        onLogin={() => setIsAuthModalOpen(true)}
        limitType={usageLimitType}
        currentTier={currentUser?.subscription || null}
        currentUsage={usageLimitInfo.current}
        maxUsage={usageLimitInfo.max}
        featureName={usageLimitInfo.featureName}
      />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={handleUpgradeSuccess}
      />
      
      {/* Subscription Manager */}
      <SubscriptionManager
        isOpen={isSubscriptionManagerOpen}
        onClose={() => setIsSubscriptionManagerOpen(false)}
        onUserUpdate={(user) => setCurrentUser(user)}
      />
      
      {/* Admin Payment Settings */}
      <AdminPaymentSettings
        isOpen={isAdminPaymentSettingsOpen}
        onClose={() => setIsAdminPaymentSettingsOpen(false)}
      />
      
      {/* API Key Settings Modal */}
      <APIKeySettings
        isOpen={isAPIKeySettingsOpen}
        onClose={() => setIsAPIKeySettingsOpen(false)}
        onKeySet={() => setApiKeyAvailable(true)}
      />
      
      {/* Settings Modal */}
      {currentUser && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          user={currentUser}
          onUpdateUser={(updates) => {
            setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
          }}
          onLogout={handleLogout}
        />
      )}
      
      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStock={handleAddStock}
        existingSymbols={watchlistSymbols}
      />
      
      {/* Watchlist Search Modal */}
      <WatchlistSearch
        isOpen={isWatchlistSearchOpen}
        onClose={() => setIsWatchlistSearchOpen(false)}
        onAddStock={handleAddStock}
        onRemoveStock={handleRemoveStock}
        existingSymbols={watchlistSymbols}
        watchlist={watchlist}
      />
      
      {/* Price Alert Modal */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        ticker={selectedTicker}
        onAlertCreated={() => setActiveAlertsCount(getActiveAlerts().length)}
      />
      
      {/* Portfolio Tracker Modal */}
      <PortfolioTracker
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
        watchlist={watchlist}
        onAddTransaction={handleAddTransaction}
      />
      
      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        symbol={transactionSymbol}
        currentPrice={watchlist.find(w => w.symbol === transactionSymbol)?.price || 0}
        initialType={transactionType}
        onSuccess={handleTransactionComplete}
      />
      
      {/* News Sentiment Panel */}
      <NewsSentimentPanel
        isOpen={isNewsOpen}
        onClose={() => setIsNewsOpen(false)}
        ticker={selectedTicker}
      />
      
      {/* AI Trading Panel */}
      <AITradingPanel
        isOpen={isAITradingOpen}
        onClose={() => setIsAITradingOpen(false)}
        currentStock={selectedTicker}
        stockData={chartData}
        onExecuteTrade={(signal) => {
          console.log('Execute trade:', signal);
          // Here you would integrate with actual trading API
        }}
      />
      
      {/* Stock Screener */}
      <StockScreener
        isOpen={isScreenerOpen}
        onClose={() => setIsScreenerOpen(false)}
        onSelectStock={(symbol) => {
          const ticker = watchlist.find(w => w.symbol === symbol);
          if (ticker) {
            setSelectedTicker(ticker);
          } else {
            // If stock not in watchlist, create a placeholder ticker
            setSelectedTicker({
              symbol,
              name: symbol,
              price: 0,
              change: 0,
              changePercent: 0,
              volume: 0,
              high: 0,
              low: 0,
              open: 0,
              prevClose: 0,
              marketCap: 0,
            });
          }
          setMode(AppMode.DASHBOARD);
        }}
      />
      
      {/* Multi-Timeframe Chart */}
      <MultiTimeframeChart
        symbol={selectedTicker.symbol}
        isOpen={isMultiTimeframeOpen}
        onClose={() => setIsMultiTimeframeOpen(false)}
      />
      
      {/* Social Trading */}
      <SocialTrading
        isOpen={isSocialTradingOpen}
        onClose={() => setIsSocialTradingOpen(false)}
      />
      
      {/* Triggered Alert Toast */}
      {triggeredAlert && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <span className="material-icons-round text-2xl animate-bounce">notifications_active</span>
            <div>
              <p className="font-bold">🔔 Alert Triggered!</p>
              <p className="text-sm opacity-90">
                {triggeredAlert.symbol} {triggeredAlert.condition === 'above' ? '≥' : '≤'} Rp {triggeredAlert.targetPrice.toLocaleString()}
              </p>
            </div>
            <button 
              onClick={() => setTriggeredAlert(null)}
              className="ml-2 hover:bg-white/20 p-1 rounded-lg transition-colors"
            >
              <span className="material-icons-round">close</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <aside className={`w-20 lg:w-72 border-r flex flex-col flex-shrink-0 sticky top-0 h-screen transition-colors duration-300 ${
        isDark 
          ? 'bg-[#0f1629] border-slate-800/60' 
          : 'bg-white border-slate-200'
      }`}>
        {/* Logo */}
        <div className={`p-5 flex items-center gap-3 border-b transition-colors ${
          isDark ? 'border-slate-800/60' : 'border-slate-200'
        }`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-emerald-500 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center">
            <span className="material-icons-round text-white text-xl">show_chart</span>
          </div>
          <div className="hidden lg:block">
            <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>RIZBOT</span>
            <span className="text-xl font-bold text-blue-500 ml-1">IDX</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>{isMarketOpen ? 'Market Open' : 'Market Closed'}</span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5">
          <div className={`text-[10px] uppercase font-bold mb-3 px-3 hidden lg:block tracking-wider ${
            isDark ? 'text-slate-600' : 'text-slate-500'
          }`}>Menu</div>
          <SidebarItem 
            icon="dashboard" 
            label="Dashboard" 
            active={mode === AppMode.DASHBOARD} 
            onClick={() => setMode(AppMode.DASHBOARD)}
            isDark={isDark}
          />
          <SidebarItem 
            icon="mic" 
            label="Live Assistant" 
            active={mode === AppMode.LIVE_ASSISTANT} 
            onClick={() => {
              if (checkPremiumAccess('live_assistant', 'Live Assistant')) {
                setMode(AppMode.LIVE_ASSISTANT);
              }
            }} 
            badge="PRO"
            isDark={isDark}
          />
          <SidebarItem 
            icon="location_on" 
            label="HQ Locator" 
            active={mode === AppMode.MAPS_LOCATOR} 
            onClick={() => setMode(AppMode.MAPS_LOCATOR)}
            isDark={isDark}
          />
        </nav>

        {/* Watchlist */}
        <div className={`p-3 border-t transition-colors ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between px-3 mb-3">
            <span className={`text-[10px] uppercase font-bold hidden lg:block tracking-wider ${
              isDark ? 'text-slate-500' : 'text-slate-600'
            }`}>Watchlist</span>
            <div className="flex items-center gap-2">
              {isLoadingWatchlist && (
                <span className="material-icons-round text-xs text-blue-400 animate-spin">sync</span>
              )}
              <span className={`text-[10px] hidden lg:block ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>{watchlist.length} stocks</span>
              <button
                onClick={async () => {
                  clearCache();
                  setIsLoadingWatchlist(true);
                  try {
                    const data = await fetchWatchlistData(watchlistSymbols);
                    setWatchlist(data);
                    const updated = data.find(t => t.symbol === selectedTicker.symbol);
                    if (updated) setSelectedTicker(updated);
                    setLastRefresh(new Date().toLocaleTimeString('id-ID'));
                  } catch (error) {
                    console.error('Refresh failed:', error);
                  } finally {
                    setIsLoadingWatchlist(false);
                  }
                }}
                className="w-6 h-6 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 flex items-center justify-center text-amber-400 hover:text-amber-300 transition-all"
                title="Refresh Data Real-time"
              >
                <span className={`material-icons-round text-sm ${isLoadingWatchlist ? 'animate-spin' : ''}`}>refresh</span>
              </button>
              <button
                onClick={() => setIsWatchlistSearchOpen(true)}
                className="w-6 h-6 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-all"
                title="Cari & Kelola Watchlist"
              >
                <span className="material-icons-round text-sm">search</span>
              </button>
              <button
                onClick={() => {
                  // Check watchlist limit
                  if (checkFeatureAccess('watchlist', watchlist.length)) {
                    setIsAddModalOpen(true);
                  }
                }}
                className="w-6 h-6 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-all"
                title="Tambah Saham"
              >
                <span className="material-icons-round text-sm">add</span>
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
            {watchlist.map(t => (
              <div
                key={t.symbol}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group relative ${
                  selectedTicker.symbol === t.symbol 
                    ? 'bg-blue-500/10 border border-blue-500/30 shadow-lg shadow-blue-500/5' 
                    : isDark 
                      ? 'hover:bg-slate-800/50 border border-transparent'
                      : 'hover:bg-slate-100 border border-transparent'
                }`}
              >
                <button
                  onClick={() => handleTickerSelect(t)}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    selectedTicker.symbol === t.symbol 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : isDark 
                        ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                        : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                  }`}>
                    {t.symbol.slice(0, 2)}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className={`font-semibold text-sm ${
                      selectedTicker.symbol === t.symbol 
                        ? 'text-blue-400' 
                        : isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}>
                      {t.symbol}
                    </span>
                    <span className={`text-[10px] hidden lg:block truncate max-w-[100px] ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {t.sector}
                    </span>
                  </div>
                </button>
                <div className="hidden lg:flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    {t.isLoading ? (
                      <span className="text-xs text-slate-500">Loading...</span>
                    ) : (
                      <>
                        <span className={`text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t.price.toLocaleString()}</span>
                        <span className={`text-[10px] font-mono font-medium ${t.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {t.change >= 0 ? '+' : ''}{t.changePercent.toFixed(2)}%
                        </span>
                      </>
                    )}
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStock(t.symbol);
                    }}
                    className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
                    title="Hapus dari Watchlist"
                  >
                    <span className="material-icons-round text-sm">close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t hidden lg:block transition-colors ${
          isDark ? 'border-slate-800/60' : 'border-slate-200'
        }`}>
          <div className={`text-[10px] text-center ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
            Powered by <span className="text-blue-500">RIZBOT AI</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto custom-scrollbar transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-[#0a0e17] via-[#0d1220] to-[#0a0e17]' 
          : 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100'
      }`}>
        {/* Header */}
        <header className={`backdrop-blur-xl border-b sticky top-0 z-20 transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-r from-[#0f1629]/95 via-[#141c2f]/95 to-[#0f1629]/95 border-slate-800/40' 
            : 'bg-white/95 border-slate-200'
        }`}>
          <div className="flex items-center justify-between px-6 h-16">
            <div className="flex items-center gap-4">
              {mode === AppMode.DASHBOARD ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border flex items-center justify-center ${
                      isDark ? 'border-blue-500/30' : 'border-blue-400/50'
                    }`}>
                      <span className="text-blue-500 font-bold text-sm">{selectedTicker.symbol.slice(0,2)}</span>
                    </div>
                    <div>
                      <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
                        isDark ? 'text-white' : 'text-slate-800'
                      }`}>
                        {selectedTicker.symbol}
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          sentiment === 'BULLISH' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : sentiment === 'BEARISH'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : isDark 
                              ? 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                        }`}>
                          <span className="material-icons-round text-[10px] mr-0.5">psychology</span>
                          {sentiment}
                        </span>
                      </h1>
                      <span className="text-slate-500 font-normal text-xs">{selectedTicker.name}</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 ml-4 pl-4 border-l border-slate-700/50">
                    <div className="text-right">
                      <span className={`text-xl font-mono font-bold ${priceDisplay.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        Rp {priceDisplay.formatted}
                      </span>
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`text-xs font-mono font-semibold flex items-center gap-1 ${
                          priceDisplay.isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          <span className="material-icons-round text-xs">{priceDisplay.isPositive ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
                          {priceDisplay.changeFormatted}
                        </span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-lg ${
                          priceDisplay.isPositive 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {priceDisplay.percentFormatted}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <h1 className={`text-xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border flex items-center justify-center ${
                    isDark ? 'border-blue-500/30' : 'border-blue-400/50'
                  }`}>
                    <span className="material-icons-round text-blue-400">
                      {mode === AppMode.LIVE_ASSISTANT ? 'mic' : 'location_on'}
                    </span>
                  </div>
                  {mode === AppMode.LIVE_ASSISTANT ? 'Live Assistant' : 'HQ Locator'}
                </h1>
              )}
            </div>
          
          <div className="flex items-center gap-3">
            {/* AI Trading Button */}
            <button 
              onClick={() => {
                if (checkPremiumAccess('ai_trading', 'AI Trading Engine')) {
                  setIsAITradingOpen(true);
                }
              }}
              className="relative bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white p-2.5 rounded-xl transition-all border border-blue-500/30 hover:border-purple-500/50 shadow-lg shadow-purple-500/10 group"
              title="AI Trading Engine"
            >
              <span className="material-icons-round text-lg group-hover:scale-110 transition-transform">smart_toy</span>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">AI</span>
            </button>
            
            {/* Stock Screener Button */}
            <button 
              onClick={() => setIsScreenerOpen(true)}
              className="relative bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-white p-2.5 rounded-xl transition-all border border-amber-500/30 hover:border-orange-500/50 shadow-lg shadow-amber-500/10 group"
              title="Stock Screener"
            >
              <span className="material-icons-round text-lg group-hover:scale-110 transition-transform">filter_list</span>
            </button>
            
            {/* Multi-Timeframe Button */}
            <button 
              onClick={() => setIsMultiTimeframeOpen(true)}
              className="relative bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white p-2.5 rounded-xl transition-all border border-cyan-500/30 hover:border-blue-500/50 shadow-lg shadow-cyan-500/10 group"
              title="Multi-Timeframe Analysis"
            >
              <span className="material-icons-round text-lg group-hover:scale-110 transition-transform">grid_view</span>
            </button>
            
            {/* Social Trading Button */}
            <button 
              onClick={() => setIsSocialTradingOpen(true)}
              className="relative bg-gradient-to-r from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30 text-white p-2.5 rounded-xl transition-all border border-pink-500/30 hover:border-rose-500/50 shadow-lg shadow-pink-500/10 group"
              title="Social Trading - Copy Trader"
            >
              <span className="material-icons-round text-lg group-hover:scale-110 transition-transform">groups</span>
            </button>
            
            {/* News Sentiment Button */}
            <button 
              onClick={() => {
                if (checkPremiumAccess('news_sentiment', 'News Sentiment')) {
                  setIsNewsOpen(true);
                }
              }}
              className="relative bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 p-2.5 rounded-xl transition-all border border-slate-700/50 hover:border-cyan-500/30"
              title="News Sentiment"
            >
              <span className="material-icons-round text-lg">article</span>
            </button>
            
            {/* Portfolio Button */}
            <button 
              onClick={() => {
                if (checkPremiumAccess('portfolio_tracker', 'Portfolio Tracker')) {
                  setIsPortfolioOpen(true);
                }
              }}
              className="relative bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-purple-400 p-2.5 rounded-xl transition-all border border-slate-700/50 hover:border-purple-500/30"
              title="Portfolio Tracker"
            >
              <span className="material-icons-round text-lg">account_balance_wallet</span>
              {portfolioCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {portfolioCount}
                </span>
              )}
            </button>
            
            {/* Price Alert Button */}
            <button 
              onClick={() => {
                // Check alert limit before opening
                if (checkFeatureAccess('alert', activeAlertsCount)) {
                  setIsAlertModalOpen(true);
                }
              }}
              className="relative bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-amber-400 p-2.5 rounded-xl transition-all border border-slate-700/50 hover:border-amber-500/30"
              title="Price Alerts"
            >
              <span className="material-icons-round text-lg">notifications</span>
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeAlertsCount}
                </span>
              )}
            </button>
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            <div className={`hidden md:flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-colors ${
              isDark 
                ? 'text-slate-500 bg-slate-800/30 border-slate-700/50' 
                : 'text-slate-600 bg-white/50 border-slate-300'
            }`}>
              <span className="material-icons-round text-sm">schedule</span>
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </div>
            
            {/* API Key Status Indicator */}
            {!apiKeyAvailable && (
              <button
                onClick={() => setIsAPIKeySettingsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-xs font-medium transition-colors"
                title="Konfigurasi API Key"
              >
                <span className="material-icons-round text-sm">key_off</span>
                <span className="hidden sm:inline">Setup API Key</span>
              </button>
            )}
            
            {/* User Menu or Login Button */}
            {currentUser ? (
              <UserMenu 
                user={currentUser}
                onLogout={handleLogout}
                onUpgrade={handleUpgradeClick}
                onManageSubscription={handleManageSubscription}
                onAdminPaymentSettings={() => setIsAdminPaymentSettingsOpen(true)}
                onAPIKeySettings={() => setIsAPIKeySettingsOpen(true)}
                onSettings={() => setIsSettingsOpen(true)}
              />
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 active:scale-[0.98] flex items-center gap-2"
              >
                <span className="material-icons-round text-sm">login</span>
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-4 lg:p-6 max-w-[1920px] mx-auto">
          
          {mode === AppMode.DASHBOARD && (
            <>
              {/* Quick Stats Bar */}
              <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <QuickStatPill 
                  label="Open" 
                  value={`Rp ${selectedTicker.open?.toLocaleString('id-ID') || selectedTicker.price.toLocaleString('id-ID')}`}
                  icon="schedule"
                />
                <QuickStatPill 
                  label="High" 
                  value={`Rp ${(selectedTicker.high || selectedTicker.price * 1.02).toLocaleString('id-ID', {maximumFractionDigits: 0})}`}
                  icon="arrow_upward"
                  trend="up"
                />
                <QuickStatPill 
                  label="Low" 
                  value={`Rp ${(selectedTicker.low || selectedTicker.price * 0.98).toLocaleString('id-ID', {maximumFractionDigits: 0})}`}
                  icon="arrow_downward"
                  trend="down"
                />
                <QuickStatPill 
                  label="Prev Close" 
                  value={`Rp ${(selectedTicker.prevClose || selectedTicker.price).toLocaleString('id-ID')}`}
                  icon="history"
                />
                <QuickStatPill 
                  label="Volume" 
                  value={selectedTicker.volume ? `${(selectedTicker.volume / 1000000).toFixed(1)}M` : '12.5M'}
                  icon="bar_chart"
                />
                <QuickStatPill 
                  label="Market Cap" 
                  value={selectedTicker.marketCap ? `${(selectedTicker.marketCap / 1000000000000).toFixed(1)}T` : 'N/A'}
                  icon="account_balance"
                />
                <QuickStatPill 
                  label="52W High" 
                  value={`Rp ${(selectedTicker.price * 1.25).toLocaleString('id-ID', {maximumFractionDigits: 0})}`}
                  icon="trending_up"
                  trend="up"
                />
                <QuickStatPill 
                  label="52W Low" 
                  value={`Rp ${(selectedTicker.price * 0.75).toLocaleString('id-ID', {maximumFractionDigits: 0})}`}
                  icon="trending_down"
                  trend="down"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Chart Section - Spans 8 cols */}
                <div className="xl:col-span-8 space-y-6">
                  {/* Real-Time Market Review Panel */}
                  <RealTimeMarketReview
                    ticker={selectedTicker}
                    chartData={chartData}
                    timeRange={timeRange}
                    onRangeChange={setTimeRange}
                    loading={isLoadingData}
                    isNewsOpen={isNewsOpen}
                    onOpenNews={() => setIsNewsOpen(true)}
                    onCloseNews={() => setIsNewsOpen(false)}
                  />
                  
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-r from-[#141c2f] via-[#1a2540] to-[#141c2f] rounded-2xl p-4 border border-slate-800/60">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="material-icons-round text-blue-400 text-lg">bolt</span>
                        Quick Actions
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <QuickActionButton 
                        icon="smart_toy"
                        label="AI Trading"
                        gradient="from-blue-500 to-purple-500"
                        onClick={() => checkPremiumAccess('ai_trading', 'AI Trading Engine') && setIsAITradingOpen(true)}
                      />
                      <QuickActionButton 
                        icon="filter_list"
                        label="Screener"
                        gradient="from-amber-500 to-orange-500"
                        onClick={() => setIsScreenerOpen(true)}
                      />
                      <QuickActionButton 
                        icon="grid_view"
                        label="Multi-TF"
                        gradient="from-cyan-500 to-blue-500"
                        onClick={() => setIsMultiTimeframeOpen(true)}
                      />
                      <QuickActionButton 
                        icon="groups"
                        label="Social Trading"
                        gradient="from-pink-500 to-rose-500"
                        onClick={() => setIsSocialTradingOpen(true)}
                      />
                    </div>
                  </div>
                </div>

              {/* Sidebar / AI Panel - Spans 4 cols */}
              <div className="xl:col-span-4 space-y-6">
                {/* Trading Recommendation */}
                <TradingRecommendation ticker={selectedTicker} chartData={chartData} />
                
                {/* AI Analysis */}
                <Predictor ticker={selectedTicker} chartData={chartData} />
                
                {/* Order Book */}
                <div className="bg-gradient-to-br from-[#141c2f] to-[#0f1629] rounded-2xl p-5 border border-slate-800/60 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="material-icons-round text-blue-400 text-lg">menu_book</span>
                      Order Book
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
                    </div>
                  </div>
                  
                  {/* Headers */}
                  <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mb-3 px-3">
                    <span>Price (Rp)</span>
                    <span>Volume (Lot)</span>
                  </div>
                  
                  <div className="space-y-1.5 font-mono text-sm">
                    {/* Ask (Sell) Orders */}
                    <OrderBookRow 
                      price={(selectedTicker.price * 1.015).toFixed(0)} 
                      volume="250" 
                      type="ask" 
                      depth={30}
                    />
                    <OrderBookRow 
                      price={(selectedTicker.price * 1.01).toFixed(0)} 
                      volume="450" 
                      type="ask" 
                      depth={50}
                    />
                    <OrderBookRow 
                      price={(selectedTicker.price * 1.005).toFixed(0)} 
                      volume="1,200" 
                      type="ask" 
                      depth={80}
                    />
                    
                    {/* Current Price */}
                    <div className="flex justify-between items-center py-3 my-2 px-3 rounded-xl bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-blue-500/20 border border-emerald-500/30">
                      <span className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></span>
                        {selectedTicker.price.toLocaleString()}
                      </span>
                      <span className="text-emerald-400 font-semibold">2,300</span>
                    </div>
                    
                    {/* Bid (Buy) Orders */}
                    <OrderBookRow 
                      price={(selectedTicker.price * 0.995).toFixed(0)} 
                      volume="5,000" 
                      type="bid" 
                      depth={100}
                    />
                    <OrderBookRow 
                      price={(selectedTicker.price * 0.99).toFixed(0)} 
                      volume="3,200" 
                      type="bid" 
                      depth={70}
                    />
                    <OrderBookRow 
                      price={(selectedTicker.price * 0.985).toFixed(0)} 
                      volume="1,800" 
                      type="bid" 
                      depth={40}
                    />
                  </div>
                  
                  {/* Market Depth Summary */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-emerald-500/30"></span>
                        <span className="text-slate-400">Total Bid</span>
                        <span className="text-emerald-400 font-semibold">10,000</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-semibold">1,900</span>
                        <span className="text-slate-400">Total Ask</span>
                        <span className="w-3 h-3 rounded bg-red-500/30"></span>
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden flex">
                      <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full" style={{width: '84%'}}></div>
                      <div className="bg-gradient-to-r from-red-400 to-red-500 h-full" style={{width: '16%'}}></div>
                    </div>
                    <div className="text-center mt-2 text-[10px] text-slate-500">Buy Pressure: 84%</div>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}

          {mode === AppMode.LIVE_ASSISTANT && (
            <div className="h-[calc(100vh-140px)]">
              <LiveAssistant />
            </div>
          )}

          {mode === AppMode.MAPS_LOCATOR && (
            <div className="min-h-[500px]">
              <MapsLocator />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Sidebar Navigation Item Component
interface SidebarItemProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
  isDark?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, badge, isDark = true }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative ${
      active 
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/30' 
        : isDark
          ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
    }`}
  >
    <span className={`material-icons-round text-xl transition-transform ${active ? '' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className="hidden lg:block font-medium text-sm">{label}</span>
    {badge && (
      <span className={`hidden lg:block ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${
        active ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

// Order Book Row Component
interface OrderBookRowProps {
  price: string;
  volume: string;
  type: 'bid' | 'ask';
  depth: number;
}

const OrderBookRow: React.FC<OrderBookRowProps> = ({ price, volume, type, depth }) => (
  <div className="relative flex justify-between items-center px-3 py-1.5 rounded-lg overflow-hidden">
    {/* Depth Bar */}
    <div 
      className={`absolute left-0 top-0 bottom-0 ${
        type === 'bid' ? 'bg-emerald-500/10' : 'bg-red-500/10'
      }`}
      style={{ width: `${depth}%` }}
    />
    <span className={`relative z-10 ${type === 'bid' ? 'text-emerald-400' : 'text-red-400'}`}>
      {parseInt(price).toLocaleString()}
    </span>
    <span className="relative z-10 text-slate-400">{volume} Lot</span>
  </div>
);

// Quick Stat Pill Component
interface QuickStatPillProps {
  label: string;
  value: string;
  icon?: string;
  trend?: 'up' | 'down';
}

const QuickStatPill: React.FC<QuickStatPillProps> = ({ label, value, icon, trend }) => (
  <div className="bg-gradient-to-br from-[#141c2f] to-[#0f1629] px-4 py-3 rounded-xl border border-slate-800/60 hover:border-slate-700/60 transition-all duration-200 group">
    <div className="flex items-center gap-2 mb-1">
      {icon && (
        <span className={`material-icons-round text-sm ${
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-blue-400'
        }`}>{icon}</span>
      )}
      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</span>
    </div>
    <div className={`text-sm font-mono font-semibold truncate ${
      trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-200'
    }`}>
      {value}
    </div>
  </div>
);

// Quick Action Button Component
interface QuickActionButtonProps {
  icon: string;
  label: string;
  gradient: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, gradient, onClick }) => (
  <button
    onClick={onClick}
    className={`bg-gradient-to-r ${gradient} p-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
  >
    <span className="material-icons-round text-lg">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// Statistics Card Component (kept for backward compatibility)
interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend }) => (
  <div className="bg-gradient-to-br from-[#141c2f] to-[#0f1629] p-4 rounded-xl border border-slate-800/60 shadow-lg hover:border-slate-700/60 transition-all duration-200 group hover:shadow-blue-900/10">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</span>
      {icon && (
        <span className={`material-icons-round text-sm ${
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'
        }`}>{icon}</span>
      )}
    </div>
    <div className={`text-xl font-mono font-bold ${
      trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-200'
    }`}>
      {value}
    </div>
  </div>
);

export default App;