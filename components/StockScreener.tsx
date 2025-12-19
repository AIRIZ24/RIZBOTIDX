import React, { useState, useMemo, useCallback } from 'react';
import { StockTicker } from '../types';

interface ScreenerStock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  pbRatio: number;
  eps: number;
  dividend: number;
  rsi: number;
  ma20: number;
  ma50: number;
  high52w: number;
  low52w: number;
}

interface FilterCriteria {
  sector: string;
  priceMin: number | '';
  priceMax: number | '';
  volumeMin: number | '';
  peMin: number | '';
  peMax: number | '';
  pbMin: number | '';
  pbMax: number | '';
  rsiMin: number | '';
  rsiMax: number | '';
  changeMin: number | '';
  changeMax: number | '';
  marketCapMin: number | '';
  dividendMin: number | '';
  aboveMA20: boolean;
  aboveMA50: boolean;
  near52wHigh: boolean;
  near52wLow: boolean;
}

interface StockScreenerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
}

// Sample IDX stocks data with fundamentals - Updated Dec 2024
const SCREENER_DATA: ScreenerStock[] = [
  { symbol: 'BBCA', name: 'Bank Central Asia', sector: 'Finance', price: 10050, change: -50, changePercent: -0.50, volume: 12500000, marketCap: 1250000000000000, peRatio: 22.5, pbRatio: 4.5, eps: 447, dividend: 1.1, rsi: 52, ma20: 10100, ma50: 10200, high52w: 10825, low52w: 8675 },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Finance', price: 4640, change: -54, changePercent: -1.14, volume: 85000000, marketCap: 700000000000000, peRatio: 11.2, pbRatio: 2.0, eps: 414, dividend: 4.2, rsi: 38, ma20: 4780, ma50: 4900, high52w: 5725, low52w: 4560 },
  { symbol: 'TLKM', name: 'Telkom Indonesia', sector: 'Telecom', price: 2680, change: -40, changePercent: -1.47, volume: 45000000, marketCap: 265000000000000, peRatio: 12.8, pbRatio: 2.2, eps: 209, dividend: 5.5, rsi: 35, ma20: 2750, ma50: 2850, high52w: 4310, low52w: 2650 },
  { symbol: 'ASII', name: 'Astra International', sector: 'Consumer', price: 4660, change: -60, changePercent: -1.27, volume: 22000000, marketCap: 189000000000000, peRatio: 7.8, pbRatio: 1.1, eps: 598, dividend: 6.2, rsi: 42, ma20: 4750, ma50: 4850, high52w: 5650, low52w: 4500 },
  { symbol: 'UNVR', name: 'Unilever Indonesia', sector: 'Consumer', price: 1760, change: -10, changePercent: -0.56, volume: 8500000, marketCap: 67000000000000, peRatio: 15.2, pbRatio: 8.5, eps: 116, dividend: 5.8, rsi: 28, ma20: 1820, ma50: 1900, high52w: 3600, low52w: 1730 },
  { symbol: 'BMRI', name: 'Bank Mandiri', sector: 'Finance', price: 6500, change: -100, changePercent: -1.52, volume: 28000000, marketCap: 605000000000000, peRatio: 9.8, pbRatio: 1.7, eps: 663, dividend: 4.8, rsi: 45, ma20: 6650, ma50: 6750, high52w: 7575, low52w: 5600 },
  { symbol: 'ICBP', name: 'Indofood CBP', sector: 'Consumer', price: 10475, change: -100, changePercent: -0.95, volume: 3800000, marketCap: 122000000000000, peRatio: 16.5, pbRatio: 2.8, eps: 635, dividend: 2.5, rsi: 42, ma20: 10600, ma50: 10800, high52w: 12550, low52w: 9100 },
  { symbol: 'GGRM', name: 'Gudang Garam', sector: 'Consumer', price: 15975, change: -400, changePercent: -2.43, volume: 1200000, marketCap: 31000000000000, peRatio: 10.2, pbRatio: 0.9, eps: 1566, dividend: 4.5, rsi: 32, ma20: 16500, ma50: 17200, high52w: 25775, low52w: 15400 },
  { symbol: 'HMSP', name: 'HM Sampoerna', sector: 'Consumer', price: 665, change: -10, changePercent: -1.48, volume: 18000000, marketCap: 78000000000000, peRatio: 10.5, pbRatio: 3.2, eps: 63, dividend: 7.8, rsi: 34, ma20: 695, ma50: 720, high52w: 945, low52w: 640 },
  { symbol: 'KLBF', name: 'Kalbe Farma', sector: 'Healthcare', price: 1420, change: -10, changePercent: -0.70, volume: 15000000, marketCap: 66000000000000, peRatio: 18.5, pbRatio: 2.8, eps: 77, dividend: 3.2, rsi: 38, ma20: 1470, ma50: 1520, high52w: 1735, low52w: 1400 },
  { symbol: 'INDF', name: 'Indofood Sukses', sector: 'Consumer', price: 6425, change: -50, changePercent: -0.77, volume: 5200000, marketCap: 56000000000000, peRatio: 6.8, pbRatio: 0.85, eps: 945, dividend: 5.2, rsi: 45, ma20: 6500, ma50: 6650, high52w: 7450, low52w: 5925 },
  { symbol: 'SMGR', name: 'Semen Indonesia', sector: 'Materials', price: 3680, change: -45, changePercent: -1.21, volume: 9500000, marketCap: 22000000000000, peRatio: 15.5, pbRatio: 0.75, eps: 237, dividend: 4.0, rsi: 40, ma20: 3750, ma50: 3850, high52w: 5075, low52w: 3500 },
  { symbol: 'PTBA', name: 'Bukit Asam', sector: 'Energy', price: 2480, change: -40, changePercent: -1.58, volume: 11000000, marketCap: 28000000000000, peRatio: 5.2, pbRatio: 1.1, eps: 477, dividend: 9.2, rsi: 42, ma20: 2550, ma50: 2650, high52w: 3150, low52w: 2280 },
  { symbol: 'ADRO', name: 'Adaro Energy', sector: 'Energy', price: 2520, change: -20, changePercent: -0.79, volume: 42000000, marketCap: 78000000000000, peRatio: 4.5, pbRatio: 0.95, eps: 560, dividend: 8.5, rsi: 48, ma20: 2580, ma50: 2650, high52w: 3180, low52w: 2310 },
  { symbol: 'ANTM', name: 'Aneka Tambang', sector: 'Materials', price: 1290, change: -40, changePercent: -3.00, volume: 55000000, marketCap: 31000000000000, peRatio: 7.8, pbRatio: 1.0, eps: 165, dividend: 3.5, rsi: 35, ma20: 1350, ma50: 1420, high52w: 1940, low52w: 1260 },
  { symbol: 'INCO', name: 'Vale Indonesia', sector: 'Materials', price: 4800, change: 80, changePercent: 1.69, volume: 8200000, marketCap: 47000000000000, peRatio: 11.2, pbRatio: 1.35, eps: 429, dividend: 3.8, rsi: 55, ma20: 4720, ma50: 4650, high52w: 5625, low52w: 4100 },
  { symbol: 'EXCL', name: 'XL Axiata', sector: 'Telecom', price: 2160, change: -20, changePercent: -0.92, volume: 14000000, marketCap: 27000000000000, peRatio: 25.5, pbRatio: 1.65, eps: 85, dividend: 0, rsi: 40, ma20: 2220, ma50: 2280, high52w: 2530, low52w: 1915 },
  { symbol: 'PGAS', name: 'Perusahaan Gas Negara', sector: 'Energy', price: 1180, change: -15, changePercent: -1.25, volume: 22000000, marketCap: 28500000000000, peRatio: 6.2, pbRatio: 0.65, eps: 190, dividend: 6.2, rsi: 38, ma20: 1220, ma50: 1260, high52w: 1595, low52w: 1115 },
  { symbol: 'JSMR', name: 'Jasa Marga', sector: 'Infrastructure', price: 4280, change: 30, changePercent: 0.71, volume: 6500000, marketCap: 31000000000000, peRatio: 14.2, pbRatio: 1.45, eps: 301, dividend: 2.2, rsi: 52, ma20: 4250, ma50: 4320, high52w: 5150, low52w: 3900 },
  { symbol: 'BBNI', name: 'Bank Negara Indonesia', sector: 'Finance', price: 4950, change: -40, changePercent: -0.80, volume: 19000000, marketCap: 92000000000000, peRatio: 7.8, pbRatio: 1.15, eps: 635, dividend: 4.8, rsi: 44, ma20: 5020, ma50: 5150, high52w: 5925, low52w: 4600 },
  { symbol: 'ACES', name: 'Ace Hardware', sector: 'Retail', price: 600, change: -10, changePercent: -1.64, volume: 11000000, marketCap: 10300000000000, peRatio: 14.2, pbRatio: 2.2, eps: 42, dividend: 2.8, rsi: 38, ma20: 625, ma50: 650, high52w: 815, low52w: 580 },
  { symbol: 'ERAA', name: 'Erajaya Swasembada', sector: 'Retail', price: 394, change: -12, changePercent: -2.96, volume: 28000000, marketCap: 12500000000000, peRatio: 6.5, pbRatio: 1.25, eps: 61, dividend: 4.2, rsi: 32, ma20: 420, ma50: 450, high52w: 566, low52w: 386 },
  { symbol: 'MNCN', name: 'Media Nusantara Citra', sector: 'Media', price: 298, change: -8, changePercent: -2.61, volume: 35000000, marketCap: 4200000000000, peRatio: 4.2, pbRatio: 0.35, eps: 71, dividend: 5.5, rsi: 28, ma20: 315, ma50: 340, high52w: 730, low52w: 290 },
  { symbol: 'CPIN', name: 'Charoen Pokphand', sector: 'Consumer', price: 4960, change: -40, changePercent: -0.80, volume: 5500000, marketCap: 81000000000000, peRatio: 16.8, pbRatio: 3.5, eps: 295, dividend: 1.8, rsi: 45, ma20: 5020, ma50: 5100, high52w: 5775, low52w: 4200 },
  { symbol: 'TOWR', name: 'Sarana Menara', sector: 'Infrastructure', price: 755, change: -5, changePercent: -0.66, volume: 42000000, marketCap: 38500000000000, peRatio: 28.5, pbRatio: 4.5, eps: 26, dividend: 1.5, rsi: 35, ma20: 780, ma50: 820, high52w: 1155, low52w: 740 },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', sector: 'Tech', price: 65, change: -1, changePercent: -1.52, volume: 450000000, marketCap: 76000000000000, peRatio: -1, pbRatio: 0.75, eps: -5, dividend: 0, rsi: 32, ma20: 68, ma50: 72, high52w: 112, low52w: 52 },
  { symbol: 'EMTK', name: 'Elang Mahkota', sector: 'Tech', price: 394, change: -16, changePercent: -3.90, volume: 8500000, marketCap: 21500000000000, peRatio: 8.5, pbRatio: 0.85, eps: 46, dividend: 0, rsi: 28, ma20: 425, ma50: 465, high52w: 665, low52w: 386 },
];

const SECTORS = ['All', 'Finance', 'Consumer', 'Telecom', 'Energy', 'Materials', 'Healthcare', 'Infrastructure', 'Retail', 'Media'];

const PRESET_FILTERS = [
  { name: 'Value Stocks', icon: '💎', filters: { peMax: 15, pbMax: 1.5, dividendMin: 3 } },
  { name: 'Growth Stocks', icon: '🚀', filters: { changeMin: 1, rsiMin: 50, aboveMA20: true } },
  { name: 'High Dividend', icon: '💰', filters: { dividendMin: 4 } },
  { name: 'Oversold', icon: '📉', filters: { rsiMax: 35 } },
  { name: 'Overbought', icon: '📈', filters: { rsiMin: 70 } },
  { name: 'High Volume', icon: '🔥', filters: { volumeMin: 20000000 } },
  { name: 'Blue Chips', icon: '👑', filters: { marketCapMin: 100000000000000 } },
  { name: 'Penny Stocks', icon: '🪙', filters: { priceMax: 500 } },
];

const defaultFilters: FilterCriteria = {
  sector: 'All',
  priceMin: '',
  priceMax: '',
  volumeMin: '',
  peMin: '',
  peMax: '',
  pbMin: '',
  pbMax: '',
  rsiMin: '',
  rsiMax: '',
  changeMin: '',
  changeMax: '',
  marketCapMin: '',
  dividendMin: '',
  aboveMA20: false,
  aboveMA50: false,
  near52wHigh: false,
  near52wLow: false,
};

const StockScreener: React.FC<StockScreenerProps> = ({ isOpen, onClose, onSelectStock }) => {
  const [filters, setFilters] = useState<FilterCriteria>(defaultFilters);
  const [sortBy, setSortBy] = useState<keyof ScreenerStock>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'screener' | 'presets'>('screener');

  // Apply preset filter
  const applyPreset = (presetFilters: Partial<FilterCriteria>) => {
    setFilters({ ...defaultFilters, ...presetFilters });
    setActiveTab('screener');
  };

  // Reset filters
  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    let result = SCREENER_DATA.filter(stock => {
      // Sector filter
      if (filters.sector !== 'All' && stock.sector !== filters.sector) return false;
      
      // Price filter
      if (filters.priceMin !== '' && stock.price < filters.priceMin) return false;
      if (filters.priceMax !== '' && stock.price > filters.priceMax) return false;
      
      // Volume filter
      if (filters.volumeMin !== '' && stock.volume < filters.volumeMin) return false;
      
      // PE Ratio filter
      if (filters.peMin !== '' && stock.peRatio < filters.peMin) return false;
      if (filters.peMax !== '' && stock.peRatio > filters.peMax) return false;
      
      // PB Ratio filter
      if (filters.pbMin !== '' && stock.pbRatio < filters.pbMin) return false;
      if (filters.pbMax !== '' && stock.pbRatio > filters.pbMax) return false;
      
      // RSI filter
      if (filters.rsiMin !== '' && stock.rsi < filters.rsiMin) return false;
      if (filters.rsiMax !== '' && stock.rsi > filters.rsiMax) return false;
      
      // Change filter
      if (filters.changeMin !== '' && stock.changePercent < filters.changeMin) return false;
      if (filters.changeMax !== '' && stock.changePercent > filters.changeMax) return false;
      
      // Market Cap filter
      if (filters.marketCapMin !== '' && stock.marketCap < filters.marketCapMin) return false;
      
      // Dividend filter
      if (filters.dividendMin !== '' && stock.dividend < filters.dividendMin) return false;
      
      // MA filters
      if (filters.aboveMA20 && stock.price < stock.ma20) return false;
      if (filters.aboveMA50 && stock.price < stock.ma50) return false;
      
      // 52W filters
      if (filters.near52wHigh && stock.price < stock.high52w * 0.95) return false;
      if (filters.near52wLow && stock.price > stock.low52w * 1.05) return false;
      
      return true;
    });

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [filters, sortBy, sortOrder]);

  const handleSort = (column: keyof ScreenerStock) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1000000000000000) return (value / 1000000000000000).toFixed(1) + ' Q';
    if (value >= 1000000000000) return (value / 1000000000000).toFixed(1) + ' T';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' B';
    return (value / 1000000).toFixed(1) + ' M';
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.sector !== 'All') count++;
    if (filters.priceMin !== '') count++;
    if (filters.priceMax !== '') count++;
    if (filters.volumeMin !== '') count++;
    if (filters.peMin !== '') count++;
    if (filters.peMax !== '') count++;
    if (filters.pbMin !== '') count++;
    if (filters.pbMax !== '') count++;
    if (filters.rsiMin !== '') count++;
    if (filters.rsiMax !== '') count++;
    if (filters.changeMin !== '') count++;
    if (filters.changeMax !== '') count++;
    if (filters.marketCapMin !== '') count++;
    if (filters.dividendMin !== '') count++;
    if (filters.aboveMA20) count++;
    if (filters.aboveMA50) count++;
    if (filters.near52wHigh) count++;
    if (filters.near52wLow) count++;
    return count;
  }, [filters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#0f1629] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="material-icons text-white text-2xl">filter_list</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Stock Screener
                {activeFiltersCount > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">
                    {activeFiltersCount} filter aktif
                  </span>
                )}
              </h2>
              <p className="text-slate-400 text-sm">
                Filter {filteredStocks.length} saham dari {SCREENER_DATA.length} total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4 flex gap-2">
          <button
            onClick={() => setActiveTab('screener')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'screener'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="material-icons text-sm mr-1 align-middle">tune</span>
            Custom Filter
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'presets'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="material-icons text-sm mr-1 align-middle">auto_awesome</span>
            Quick Presets
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'presets' ? (
            /* Presets Grid */
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRESET_FILTERS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.filters)}
                  className="p-4 bg-slate-800/30 hover:bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-all text-left group"
                >
                  <span className="text-2xl mb-2 block">{preset.icon}</span>
                  <span className="text-white font-medium group-hover:text-amber-400 transition-colors">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="p-5 border-b border-slate-700/50 space-y-4">
                {/* Row 1: Sector & Price */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Sector</label>
                    <select
                      value={filters.sector}
                      onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    >
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Price Min</label>
                    <input
                      type="number"
                      value={filters.priceMin}
                      onChange={(e) => setFilters({ ...filters, priceMin: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="0"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Price Max</label>
                    <input
                      type="number"
                      value={filters.priceMax}
                      onChange={(e) => setFilters({ ...filters, priceMax: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="∞"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Volume Min</label>
                    <input
                      type="number"
                      value={filters.volumeMin}
                      onChange={(e) => setFilters({ ...filters, volumeMin: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="0"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Market Cap</label>
                    <input
                      type="number"
                      value={filters.marketCapMin}
                      onChange={(e) => setFilters({ ...filters, marketCapMin: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="0"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                </div>

                {/* Row 2: Fundamentals */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">PE Min</label>
                    <input
                      type="number"
                      value={filters.peMin}
                      onChange={(e) => setFilters({ ...filters, peMin: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="0"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">PE Max</label>
                    <input
                      type="number"
                      value={filters.peMax}
                      onChange={(e) => setFilters({ ...filters, peMax: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="∞"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">PB Min</label>
                    <input
                      type="number"
                      step="0.1"
                      value={filters.pbMin}
                      onChange={(e) => setFilters({ ...filters, pbMin: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="0"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">PB Max</label>
                    <input
                      type="number"
                      step="0.1"
                      value={filters.pbMax}
                      onChange={(e) => setFilters({ ...filters, pbMax: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="∞"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Dividend %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={filters.dividendMin}
                      onChange={(e) => setFilters({ ...filters, dividendMin: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="0"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Change %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={filters.changeMin}
                      onChange={(e) => setFilters({ ...filters, changeMin: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="Min"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                </div>

                {/* Row 3: Technical + Reset */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">RSI:</label>
                    <input
                      type="number"
                      value={filters.rsiMin}
                      onChange={(e) => setFilters({ ...filters, rsiMin: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="Min"
                      className="w-16 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="number"
                      value={filters.rsiMax}
                      onChange={(e) => setFilters({ ...filters, rsiMax: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="Max"
                      className="w-16 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-sm text-white focus:border-amber-500/50 outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.aboveMA20}
                        onChange={(e) => setFilters({ ...filters, aboveMA20: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500"
                      />
                      <span className="text-xs text-slate-400">Above MA20</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.aboveMA50}
                        onChange={(e) => setFilters({ ...filters, aboveMA50: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500"
                      />
                      <span className="text-xs text-slate-400">Above MA50</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.near52wHigh}
                        onChange={(e) => setFilters({ ...filters, near52wHigh: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500"
                      />
                      <span className="text-xs text-slate-400">Near 52W High</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.near52wLow}
                        onChange={(e) => setFilters({ ...filters, near52wLow: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500"
                      />
                      <span className="text-xs text-slate-400">Near 52W Low</span>
                    </label>
                  </div>

                  <button
                    onClick={resetFilters}
                    className="ml-auto px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all flex items-center gap-1"
                  >
                    <span className="material-icons text-sm">refresh</span>
                    Reset
                  </button>
                </div>
              </div>

              {/* Results Table */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
                    <tr className="text-left text-[10px] text-slate-500 uppercase">
                      <th className="px-4 py-3 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('symbol')}>
                        Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 font-bold">Sector</th>
                      <th className="px-4 py-3 font-bold text-right cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                        Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 font-bold text-right cursor-pointer hover:text-white" onClick={() => handleSort('changePercent')}>
                        Change {sortBy === 'changePercent' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 font-bold text-right cursor-pointer hover:text-white" onClick={() => handleSort('volume')}>
                        Volume {sortBy === 'volume' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 font-bold text-right cursor-pointer hover:text-white" onClick={() => handleSort('marketCap')}>
                        M.Cap {sortBy === 'marketCap' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 font-bold text-right cursor-pointer hover:text-white" onClick={() => handleSort('peRatio')}>
                        PE {sortBy === 'peRatio' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 font-bold text-right cursor-pointer hover:text-white" onClick={() => handleSort('pbRatio')}>
                        PB {sortBy === 'pbRatio' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 font-bold text-right cursor-pointer hover:text-white" onClick={() => handleSort('dividend')}>
                        Div% {sortBy === 'dividend' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 font-bold text-right cursor-pointer hover:text-white" onClick={() => handleSort('rsi')}>
                        RSI {sortBy === 'rsi' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredStocks.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                          <span className="material-icons text-4xl mb-2 block">search_off</span>
                          Tidak ada saham yang cocok dengan filter
                        </td>
                      </tr>
                    ) : (
                      filteredStocks.map((stock) => (
                        <tr 
                          key={stock.symbol}
                          className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                          onClick={() => {
                            onSelectStock(stock.symbol);
                            onClose();
                          }}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-bold text-white">{stock.symbol}</span>
                              <span className="block text-[10px] text-slate-500 truncate max-w-[120px]">{stock.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-[10px] rounded">{stock.sector}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-white">
                            {stock.price.toLocaleString()}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-medium ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-400">
                            {formatVolume(stock.volume)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-400">
                            {formatMarketCap(stock.marketCap)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300">
                            {stock.peRatio.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300">
                            {stock.pbRatio.toFixed(1)}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono ${stock.dividend >= 4 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {stock.dividend.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                              stock.rsi >= 70 ? 'bg-red-500/20 text-red-400' :
                              stock.rsi <= 30 ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-slate-700/50 text-slate-400'
                            }`}>
                              {stock.rsi}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectStock(stock.symbol);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-all"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            💡 Tip: Klik header kolom untuk sorting
          </span>
          <span className="text-xs text-slate-500">
            Data terakhir diperbarui: {new Date().toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StockScreener;
