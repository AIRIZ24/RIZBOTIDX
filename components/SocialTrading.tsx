import React, { useState, useEffect } from 'react';

interface Trader {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
  rank: number;
  totalReturn: number;
  monthlyReturn: number;
  winRate: number;
  totalTrades: number;
  followers: number;
  copiers: number;
  riskScore: 1 | 2 | 3 | 4 | 5;
  tradingStyle: 'Conservative' | 'Moderate' | 'Aggressive' | 'Scalper' | 'Swing';
  avgHoldingDays: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  description: string;
  topStocks: string[];
  recentTrades: TraderTrade[];
  joinedDate: string;
  isFollowing?: boolean;
  isCopying?: boolean;
}

interface TraderTrade {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  date: string;
  profit?: number;
  profitPercent?: number;
  status: 'open' | 'closed';
}

interface CopySettings {
  traderId: string;
  amount: number;
  maxRiskPercent: number;
  copyNewTrades: boolean;
  copyExisting: boolean;
  stopLossPercent: number;
  takeProfitPercent: number;
}

interface SocialTradingProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance?: number;
}

// Mock top traders data
const MOCK_TRADERS: Trader[] = [
  {
    id: 'trader-1',
    name: 'Budi Santoso',
    username: '@budi_trader',
    avatar: '👨‍💼',
    verified: true,
    rank: 1,
    totalReturn: 156.8,
    monthlyReturn: 12.5,
    winRate: 78.5,
    totalTrades: 342,
    followers: 15420,
    copiers: 2341,
    riskScore: 3,
    tradingStyle: 'Moderate',
    avgHoldingDays: 5,
    maxDrawdown: 12.3,
    sharpeRatio: 2.1,
    profitFactor: 2.4,
    description: 'Fokus pada saham blue chip dengan analisis fundamental. Pengalaman trading 8 tahun di pasar IDX.',
    topStocks: ['BBCA', 'BBRI', 'TLKM', 'ASII'],
    recentTrades: [
      { id: 't1', symbol: 'BBCA', action: 'BUY', price: 9875, date: '2024-12-17', profit: 125000, profitPercent: 2.5, status: 'closed' },
      { id: 't2', symbol: 'BMRI', action: 'SELL', price: 6525, date: '2024-12-16', profit: 87500, profitPercent: 1.8, status: 'closed' },
      { id: 't3', symbol: 'TLKM', action: 'BUY', price: 2680, date: '2024-12-18', status: 'open' },
    ],
    joinedDate: '2022-03-15',
  },
  {
    id: 'trader-2',
    name: 'Siti Rahayu',
    username: '@siti_invest',
    avatar: '👩‍💻',
    verified: true,
    rank: 2,
    totalReturn: 142.3,
    monthlyReturn: 15.2,
    winRate: 72.1,
    totalTrades: 567,
    followers: 12350,
    copiers: 1876,
    riskScore: 4,
    tradingStyle: 'Aggressive',
    avgHoldingDays: 2,
    maxDrawdown: 18.5,
    sharpeRatio: 1.9,
    profitFactor: 2.1,
    description: 'Spesialis saham teknologi dan growth stocks. Menggunakan kombinasi technical dan momentum trading.',
    topStocks: ['GOTO', 'BUKA', 'EMTK', 'MAPI'],
    recentTrades: [
      { id: 't4', symbol: 'GOTO', action: 'BUY', price: 65, date: '2024-12-17', profit: 50000, profitPercent: 5.2, status: 'closed' },
      { id: 't5', symbol: 'BUKA', action: 'BUY', price: 125, date: '2024-12-18', status: 'open' },
    ],
    joinedDate: '2021-08-20',
  },
  {
    id: 'trader-3',
    name: 'Ahmad Wijaya',
    username: '@ahmad_saham',
    avatar: '👨‍🎓',
    verified: true,
    rank: 3,
    totalReturn: 98.7,
    monthlyReturn: 8.3,
    winRate: 82.4,
    totalTrades: 198,
    followers: 8920,
    copiers: 1245,
    riskScore: 2,
    tradingStyle: 'Conservative',
    avgHoldingDays: 14,
    maxDrawdown: 8.2,
    sharpeRatio: 2.5,
    profitFactor: 3.1,
    description: 'Value investor dengan fokus pada dividen. Strategi jangka panjang dengan risiko minimal.',
    topStocks: ['BBRI', 'BMRI', 'UNVR', 'HMSP'],
    recentTrades: [
      { id: 't6', symbol: 'BBRI', action: 'BUY', price: 4640, date: '2024-12-10', status: 'open' },
      { id: 't7', symbol: 'UNVR', action: 'BUY', price: 2450, date: '2024-12-05', profit: 45000, profitPercent: 1.2, status: 'closed' },
    ],
    joinedDate: '2020-11-10',
  },
  {
    id: 'trader-4',
    name: 'Dewi Lestari',
    username: '@dewi_scalper',
    avatar: '👩‍🔬',
    verified: false,
    rank: 4,
    totalReturn: 187.5,
    monthlyReturn: 22.1,
    winRate: 65.3,
    totalTrades: 1245,
    followers: 6780,
    copiers: 892,
    riskScore: 5,
    tradingStyle: 'Scalper',
    avgHoldingDays: 0.5,
    maxDrawdown: 25.4,
    sharpeRatio: 1.6,
    profitFactor: 1.8,
    description: 'Day trader aktif dengan fokus pada momentum intraday. High frequency trading.',
    topStocks: ['ANTM', 'INCO', 'MDKA', 'TINS'],
    recentTrades: [
      { id: 't8', symbol: 'ANTM', action: 'BUY', price: 1485, date: '2024-12-18', status: 'open' },
      { id: 't9', symbol: 'INCO', action: 'SELL', price: 4250, date: '2024-12-18', profit: 32000, profitPercent: 0.8, status: 'closed' },
    ],
    joinedDate: '2023-01-05',
  },
  {
    id: 'trader-5',
    name: 'Rudi Hartono',
    username: '@rudi_swing',
    avatar: '👨‍🏫',
    verified: true,
    rank: 5,
    totalReturn: 112.4,
    monthlyReturn: 9.8,
    winRate: 75.6,
    totalTrades: 289,
    followers: 5430,
    copiers: 678,
    riskScore: 3,
    tradingStyle: 'Swing',
    avgHoldingDays: 7,
    maxDrawdown: 14.1,
    sharpeRatio: 2.0,
    profitFactor: 2.3,
    description: 'Swing trader dengan analisis teknikal. Fokus pada breakout dan trend following.',
    topStocks: ['ADRO', 'PTBA', 'ITMG', 'MEDC'],
    recentTrades: [
      { id: 't10', symbol: 'ADRO', action: 'BUY', price: 2650, date: '2024-12-15', status: 'open' },
      { id: 't11', symbol: 'PTBA', action: 'SELL', price: 2780, date: '2024-12-14', profit: 156000, profitPercent: 3.2, status: 'closed' },
    ],
    joinedDate: '2021-06-18',
  },
  {
    id: 'trader-6',
    name: 'Linda Permata',
    username: '@linda_idx',
    avatar: '👩‍💼',
    verified: false,
    rank: 6,
    totalReturn: 78.9,
    monthlyReturn: 6.5,
    winRate: 79.8,
    totalTrades: 156,
    followers: 3210,
    copiers: 423,
    riskScore: 2,
    tradingStyle: 'Conservative',
    avgHoldingDays: 21,
    maxDrawdown: 6.8,
    sharpeRatio: 2.3,
    profitFactor: 2.8,
    description: 'Investor jangka panjang dengan fokus pada saham consumer goods dan perbankan.',
    topStocks: ['ICBP', 'MYOR', 'BBCA', 'KLBF'],
    recentTrades: [
      { id: 't12', symbol: 'ICBP', action: 'BUY', price: 10250, date: '2024-12-01', status: 'open' },
    ],
    joinedDate: '2022-09-22',
  },
];

const STORAGE_KEY = 'rizbot_social_trading';

const SocialTrading: React.FC<SocialTradingProps> = ({ isOpen, onClose, userBalance = 100000000 }) => {
  const [traders, setTraders] = useState<Trader[]>(MOCK_TRADERS);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'following' | 'copying'>('leaderboard');
  const [sortBy, setSortBy] = useState<'rank' | 'return' | 'winRate' | 'copiers'>('rank');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySettings, setCopySettings] = useState<CopySettings>({
    traderId: '',
    amount: 10000000,
    maxRiskPercent: 10,
    copyNewTrades: true,
    copyExisting: false,
    stopLossPercent: 5,
    takeProfitPercent: 15,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setTraders(prev => prev.map(t => ({
          ...t,
          isFollowing: data.following?.includes(t.id),
          isCopying: data.copying?.includes(t.id),
        })));
      }
    } catch (e) {
      console.error('Failed to load social trading data:', e);
    }
  }, []);

  // Save data
  const saveData = (following: string[], copying: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ following, copying }));
  };

  const handleFollow = (traderId: string) => {
    setTraders(prev => {
      const updated = prev.map(t => 
        t.id === traderId ? { ...t, isFollowing: !t.isFollowing, followers: t.isFollowing ? t.followers - 1 : t.followers + 1 } : t
      );
      const following = updated.filter(t => t.isFollowing).map(t => t.id);
      const copying = updated.filter(t => t.isCopying).map(t => t.id);
      saveData(following, copying);
      return updated;
    });
  };

  const handleStartCopy = (trader: Trader) => {
    setCopySettings(prev => ({ ...prev, traderId: trader.id }));
    setShowCopyModal(true);
  };

  const handleConfirmCopy = () => {
    setTraders(prev => {
      const updated = prev.map(t => 
        t.id === copySettings.traderId ? { ...t, isCopying: true, copiers: t.copiers + 1 } : t
      );
      const following = updated.filter(t => t.isFollowing).map(t => t.id);
      const copying = updated.filter(t => t.isCopying).map(t => t.id);
      saveData(following, copying);
      return updated;
    });
    setShowCopyModal(false);
  };

  const handleStopCopy = (traderId: string) => {
    if (confirm('Stop copy trading dari trader ini?')) {
      setTraders(prev => {
        const updated = prev.map(t => 
          t.id === traderId ? { ...t, isCopying: false, copiers: t.copiers - 1 } : t
        );
        const following = updated.filter(t => t.isFollowing).map(t => t.id);
        const copying = updated.filter(t => t.isCopying).map(t => t.id);
        saveData(following, copying);
        return updated;
      });
    }
  };

  // Filter and sort traders
  const filteredTraders = traders
    .filter(t => {
      if (activeTab === 'following') return t.isFollowing;
      if (activeTab === 'copying') return t.isCopying;
      if (filterStyle !== 'all' && t.tradingStyle !== filterStyle) return false;
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !t.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'return': return b.totalReturn - a.totalReturn;
        case 'winRate': return b.winRate - a.winRate;
        case 'copiers': return b.copiers - a.copiers;
        default: return a.rank - b.rank;
      }
    });

  const getRiskColor = (risk: number) => {
    if (risk <= 2) return 'text-emerald-400 bg-emerald-500/20';
    if (risk <= 3) return 'text-amber-400 bg-amber-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getRiskLabel = (risk: number) => {
    if (risk <= 2) return 'Low';
    if (risk <= 3) return 'Medium';
    return 'High';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#131722] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
              <span className="material-icons-round text-white text-2xl">groups</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Social Trading</h2>
              <p className="text-sm text-slate-400">Copy trader sukses & tingkatkan profit Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        {/* Tabs & Filters */}
        <div className="px-6 py-4 border-b border-slate-700/30 bg-slate-800/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Tabs */}
            <div className="flex bg-slate-800/50 rounded-xl p-1">
              {[
                { id: 'leaderboard', label: 'Leaderboard', icon: 'emoji_events' },
                { id: 'following', label: 'Following', icon: 'person_add' },
                { id: 'copying', label: 'Copying', icon: 'content_copy' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="material-icons-round text-lg">{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'copying' && traders.filter(t => t.isCopying).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
                      {traders.filter(t => t.isCopying).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Cari trader..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500/50 w-48"
                />
              </div>
              
              <select
                value={filterStyle}
                onChange={(e) => setFilterStyle(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/50"
              >
                <option value="all">Semua Style</option>
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
                <option value="Scalper">Scalper</option>
                <option value="Swing">Swing</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/50"
              >
                <option value="rank">Ranking</option>
                <option value="return">Total Return</option>
                <option value="winRate">Win Rate</option>
                <option value="copiers">Copiers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {selectedTrader ? (
            // Trader Detail View
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={() => setSelectedTrader(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-icons-round">arrow_back</span>
                Kembali ke daftar
              </button>

              {/* Profile Header */}
              <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center text-4xl">
                      {selectedTrader.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold text-white">{selectedTrader.name}</h3>
                        {selectedTrader.verified && (
                          <span className="material-icons-round text-blue-400 text-xl">verified</span>
                        )}
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
                          #{selectedTrader.rank}
                        </span>
                      </div>
                      <p className="text-slate-400">{selectedTrader.username}</p>
                      <p className="text-sm text-slate-500 mt-1">{selectedTrader.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFollow(selectedTrader.id)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                        selectedTrader.isFollowing
                          ? 'bg-slate-700 text-white'
                          : 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
                      }`}
                    >
                      <span className="material-icons-round text-lg">
                        {selectedTrader.isFollowing ? 'person_remove' : 'person_add'}
                      </span>
                      {selectedTrader.isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    {selectedTrader.isCopying ? (
                      <button
                        onClick={() => handleStopCopy(selectedTrader.id)}
                        className="px-4 py-2 rounded-xl font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center gap-2"
                      >
                        <span className="material-icons-round text-lg">stop_circle</span>
                        Stop Copy
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartCopy(selectedTrader)}
                        className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-400 hover:to-rose-500 transition-all flex items-center gap-2"
                      >
                        <span className="material-icons-round text-lg">content_copy</span>
                        Copy Trader
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-6 gap-4 mt-6">
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Total Return</p>
                    <p className="text-xl font-bold text-emerald-400">+{selectedTrader.totalReturn}%</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Monthly</p>
                    <p className="text-xl font-bold text-emerald-400">+{selectedTrader.monthlyReturn}%</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Win Rate</p>
                    <p className="text-xl font-bold text-white">{selectedTrader.winRate}%</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Max Drawdown</p>
                    <p className="text-xl font-bold text-red-400">-{selectedTrader.maxDrawdown}%</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Sharpe Ratio</p>
                    <p className="text-xl font-bold text-blue-400">{selectedTrader.sharpeRatio}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Risk Level</p>
                    <p className={`text-xl font-bold ${getRiskColor(selectedTrader.riskScore).split(' ')[0]}`}>
                      {getRiskLabel(selectedTrader.riskScore)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Stocks & Recent Trades */}
              <div className="grid grid-cols-2 gap-6">
                {/* Top Stocks */}
                <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30">
                  <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span className="material-icons-round text-amber-400">star</span>
                    Saham Favorit
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrader.topStocks.map(stock => (
                      <span key={stock} className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-white font-mono text-sm">
                        {stock}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trading Info */}
                <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30">
                  <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span className="material-icons-round text-cyan-400">info</span>
                    Info Trading
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Style</p>
                      <p className="text-white font-medium">{selectedTrader.tradingStyle}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Avg. Holding</p>
                      <p className="text-white font-medium">{selectedTrader.avgHoldingDays} hari</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Total Trades</p>
                      <p className="text-white font-medium">{selectedTrader.totalTrades}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Profit Factor</p>
                      <p className="text-white font-medium">{selectedTrader.profitFactor}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Trades */}
              <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span className="material-icons-round text-emerald-400">swap_horiz</span>
                  Transaksi Terakhir
                </h4>
                <div className="space-y-2">
                  {selectedTrader.recentTrades.map(trade => (
                    <div key={trade.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          trade.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          <span className="material-icons-round">
                            {trade.action === 'BUY' ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-bold">{trade.symbol}</p>
                          <p className="text-xs text-slate-500">{trade.date} • Rp {trade.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {trade.status === 'open' ? (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">
                            Open Position
                          </span>
                        ) : (
                          <div>
                            <p className={`font-mono font-bold ${trade.profit && trade.profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {trade.profit && trade.profit > 0 ? '+' : ''}Rp {trade.profit?.toLocaleString()}
                            </p>
                            <p className={`text-xs ${trade.profitPercent && trade.profitPercent > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {trade.profitPercent && trade.profitPercent > 0 ? '+' : ''}{trade.profitPercent}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Trader List
            <div className="space-y-4">
              {filteredTraders.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <span className="material-icons-round text-6xl mb-4 block">person_search</span>
                  <p className="text-lg">
                    {activeTab === 'following' ? 'Belum ada trader yang difollow' :
                     activeTab === 'copying' ? 'Belum ada trader yang dicopy' :
                     'Tidak ada trader ditemukan'}
                  </p>
                </div>
              ) : (
                filteredTraders.map((trader, index) => (
                  <div
                    key={trader.id}
                    className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30 hover:border-pink-500/30 transition-all cursor-pointer group"
                    onClick={() => setSelectedTrader(trader)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                          trader.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                          trader.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                          trader.rank === 3 ? 'bg-orange-700/20 text-orange-400' :
                          'bg-slate-700/50 text-slate-400'
                        }`}>
                          {trader.rank <= 3 ? (
                            <span className="material-icons-round">
                              {trader.rank === 1 ? 'emoji_events' : trader.rank === 2 ? 'military_tech' : 'workspace_premium'}
                            </span>
                          ) : (
                            `#${trader.rank}`
                          )}
                        </div>

                        {/* Avatar & Info */}
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center text-2xl">
                          {trader.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold group-hover:text-pink-400 transition-colors">
                              {trader.name}
                            </h3>
                            {trader.verified && (
                              <span className="material-icons-round text-blue-400 text-sm">verified</span>
                            )}
                          </div>
                          <p className="text-slate-500 text-sm">{trader.username}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getRiskColor(trader.riskScore)}`}>
                              {trader.tradingStyle}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatNumber(trader.followers)} followers • {formatNumber(trader.copiers)} copiers
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500">Total Return</p>
                          <p className="text-lg font-bold text-emerald-400">+{trader.totalReturn}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500">Win Rate</p>
                          <p className="text-lg font-bold text-white">{trader.winRate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500">Monthly</p>
                          <p className="text-lg font-bold text-cyan-400">+{trader.monthlyReturn}%</p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleFollow(trader.id)}
                            className={`p-2 rounded-lg transition-all ${
                              trader.isFollowing
                                ? 'bg-pink-500/20 text-pink-400'
                                : 'bg-slate-700/50 text-slate-400 hover:text-white'
                            }`}
                            title={trader.isFollowing ? 'Unfollow' : 'Follow'}
                          >
                            <span className="material-icons-round text-lg">
                              {trader.isFollowing ? 'person_remove' : 'person_add'}
                            </span>
                          </button>
                          {trader.isCopying ? (
                            <button
                              onClick={() => handleStopCopy(trader.id)}
                              className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-xs font-medium"
                            >
                              Stop
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartCopy(trader)}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-400 hover:to-rose-500 transition-all text-xs font-medium"
                            >
                              Copy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Copy Modal */}
        {showCopyModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-[#1a1f2e] rounded-2xl p-6 w-full max-w-md border border-slate-700/50 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="material-icons-round text-pink-400">content_copy</span>
                Copy Trader Settings
              </h3>

              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Jumlah Investasi</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                    <input
                      type="number"
                      value={copySettings.amount}
                      onChange={(e) => setCopySettings(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white font-mono focus:outline-none focus:border-pink-500/50"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Saldo tersedia: Rp {userBalance.toLocaleString()}
                  </p>
                </div>

                {/* Max Risk */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Maksimal Risiko per Trade</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="25"
                      value={copySettings.maxRiskPercent}
                      onChange={(e) => setCopySettings(prev => ({ ...prev, maxRiskPercent: Number(e.target.value) }))}
                      className="flex-1 accent-pink-500"
                    />
                    <span className="text-white font-mono w-12">{copySettings.maxRiskPercent}%</span>
                  </div>
                </div>

                {/* Stop Loss */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Auto Stop Loss</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="3"
                      max="15"
                      value={copySettings.stopLossPercent}
                      onChange={(e) => setCopySettings(prev => ({ ...prev, stopLossPercent: Number(e.target.value) }))}
                      className="flex-1 accent-red-500"
                    />
                    <span className="text-red-400 font-mono w-12">-{copySettings.stopLossPercent}%</span>
                  </div>
                </div>

                {/* Take Profit */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Auto Take Profit</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={copySettings.takeProfitPercent}
                      onChange={(e) => setCopySettings(prev => ({ ...prev, takeProfitPercent: Number(e.target.value) }))}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="text-emerald-400 font-mono w-12">+{copySettings.takeProfitPercent}%</span>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={copySettings.copyNewTrades}
                      onChange={(e) => setCopySettings(prev => ({ ...prev, copyNewTrades: e.target.checked }))}
                      className="w-4 h-4 accent-pink-500"
                    />
                    <span className="text-slate-300 text-sm">Copy trade baru secara otomatis</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={copySettings.copyExisting}
                      onChange={(e) => setCopySettings(prev => ({ ...prev, copyExisting: e.target.checked }))}
                      className="w-4 h-4 accent-pink-500"
                    />
                    <span className="text-slate-300 text-sm">Copy posisi yang sudah ada</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmCopy}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white rounded-xl font-bold transition-all"
                >
                  Mulai Copy Trading
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-slate-400">
                <span className="text-white font-bold">{traders.length}</span> Top Traders
              </span>
              <span className="text-slate-400">
                <span className="text-pink-400 font-bold">{traders.filter(t => t.isFollowing).length}</span> Following
              </span>
              <span className="text-slate-400">
                <span className="text-emerald-400 font-bold">{traders.filter(t => t.isCopying).length}</span> Copying
              </span>
            </div>
            <p className="text-xs text-slate-500">
              ⚠️ Copy trading melibatkan risiko. Performa masa lalu tidak menjamin hasil di masa depan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialTrading;
