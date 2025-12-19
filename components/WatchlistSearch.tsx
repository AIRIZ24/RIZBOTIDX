import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StockTicker } from '../types';
import { fetchStockPrice } from '../services/stockApiService';

interface WatchlistSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (stock: StockTicker) => void;
  onRemoveStock: (symbol: string) => void;
  existingSymbols: string[];
  watchlist: StockTicker[];
}

// Daftar lengkap saham IDX untuk pencarian
const IDX_STOCKS: { symbol: string; name: string; sector: string; market: 'IDX' }[] = [
  // Banking & Finance
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk', sector: 'Banking', market: 'IDX' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Banking', market: 'IDX' },
  { symbol: 'BMRI', name: 'Bank Mandiri', sector: 'Banking', market: 'IDX' },
  { symbol: 'BBNI', name: 'Bank Negara Indonesia', sector: 'Banking', market: 'IDX' },
  { symbol: 'BRIS', name: 'Bank Syariah Indonesia', sector: 'Banking', market: 'IDX' },
  { symbol: 'BTPS', name: 'Bank BTPN Syariah', sector: 'Banking', market: 'IDX' },
  { symbol: 'MEGA', name: 'Bank Mega', sector: 'Banking', market: 'IDX' },
  { symbol: 'NISP', name: 'Bank OCBC NISP', sector: 'Banking', market: 'IDX' },
  { symbol: 'BDMN', name: 'Bank Danamon', sector: 'Banking', market: 'IDX' },
  { symbol: 'BNLI', name: 'Bank Permata', sector: 'Banking', market: 'IDX' },
  { symbol: 'BJTM', name: 'Bank Jatim', sector: 'Banking', market: 'IDX' },
  { symbol: 'BJBR', name: 'Bank Jabar Banten', sector: 'Banking', market: 'IDX' },
  { symbol: 'ARTO', name: 'Bank Jago', sector: 'Banking', market: 'IDX' },
  { symbol: 'BBYB', name: 'Bank Neo Commerce', sector: 'Banking', market: 'IDX' },
  { symbol: 'AGRO', name: 'Bank BRI Agroniaga', sector: 'Banking', market: 'IDX' },
  
  // Telco & Tech
  { symbol: 'TLKM', name: 'Telkom Indonesia', sector: 'Telco', market: 'IDX' },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', sector: 'Tech', market: 'IDX' },
  { symbol: 'BUKA', name: 'Bukalapak', sector: 'Tech', market: 'IDX' },
  { symbol: 'EMTK', name: 'Elang Mahkota Teknologi', sector: 'Tech', market: 'IDX' },
  { symbol: 'DCII', name: 'DCI Indonesia', sector: 'Tech', market: 'IDX' },
  { symbol: 'EXCL', name: 'XL Axiata', sector: 'Telco', market: 'IDX' },
  { symbol: 'ISAT', name: 'Indosat Ooredoo Hutchison', sector: 'Telco', market: 'IDX' },
  { symbol: 'FREN', name: 'Smartfren Telecom', sector: 'Telco', market: 'IDX' },
  { symbol: 'TOWR', name: 'Sarana Menara Nusantara', sector: 'Infrastructure', market: 'IDX' },
  { symbol: 'TBIG', name: 'Tower Bersama', sector: 'Infrastructure', market: 'IDX' },
  
  // Consumer & Retail
  { symbol: 'ASII', name: 'Astra International', sector: 'Consumer', market: 'IDX' },
  { symbol: 'UNVR', name: 'Unilever Indonesia', sector: 'Consumer', market: 'IDX' },
  { symbol: 'ICBP', name: 'Indofood CBP', sector: 'Consumer', market: 'IDX' },
  { symbol: 'INDF', name: 'Indofood Sukses Makmur', sector: 'Consumer', market: 'IDX' },
  { symbol: 'MYOR', name: 'Mayora Indah', sector: 'Consumer', market: 'IDX' },
  { symbol: 'HMSP', name: 'HM Sampoerna', sector: 'Consumer', market: 'IDX' },
  { symbol: 'GGRM', name: 'Gudang Garam', sector: 'Consumer', market: 'IDX' },
  { symbol: 'CPIN', name: 'Charoen Pokphand', sector: 'Consumer', market: 'IDX' },
  { symbol: 'JPFA', name: 'Japfa Comfeed', sector: 'Consumer', market: 'IDX' },
  { symbol: 'ACES', name: 'Ace Hardware Indonesia', sector: 'Retail', market: 'IDX' },
  { symbol: 'ERAA', name: 'Erajaya Swasembada', sector: 'Retail', market: 'IDX' },
  { symbol: 'MAPI', name: 'Mitra Adiperkasa', sector: 'Retail', market: 'IDX' },
  { symbol: 'LPPF', name: 'Matahari Department Store', sector: 'Retail', market: 'IDX' },
  { symbol: 'AMRT', name: 'Sumber Alfaria (Alfamart)', sector: 'Retail', market: 'IDX' },
  { symbol: 'MPPA', name: 'Matahari Putra Prima', sector: 'Retail', market: 'IDX' },
  
  // Healthcare
  { symbol: 'KLBF', name: 'Kalbe Farma', sector: 'Healthcare', market: 'IDX' },
  { symbol: 'SIDO', name: 'Sido Muncul', sector: 'Healthcare', market: 'IDX' },
  { symbol: 'DVLA', name: 'Darya Varia', sector: 'Healthcare', market: 'IDX' },
  { symbol: 'KAEF', name: 'Kimia Farma', sector: 'Healthcare', market: 'IDX' },
  { symbol: 'INAF', name: 'Indofarma', sector: 'Healthcare', market: 'IDX' },
  { symbol: 'HEAL', name: 'Medikaloka Hermina', sector: 'Healthcare', market: 'IDX' },
  { symbol: 'MIKA', name: 'Mitra Keluarga Karyasehat', sector: 'Healthcare', market: 'IDX' },
  
  // Mining & Energy
  { symbol: 'ANTM', name: 'Aneka Tambang', sector: 'Mining', market: 'IDX' },
  { symbol: 'PTBA', name: 'Bukit Asam', sector: 'Mining', market: 'IDX' },
  { symbol: 'INCO', name: 'Vale Indonesia', sector: 'Mining', market: 'IDX' },
  { symbol: 'ADRO', name: 'Adaro Energy', sector: 'Mining', market: 'IDX' },
  { symbol: 'ITMG', name: 'Indo Tambangraya Megah', sector: 'Mining', market: 'IDX' },
  { symbol: 'MDKA', name: 'Merdeka Copper Gold', sector: 'Mining', market: 'IDX' },
  { symbol: 'MEDC', name: 'Medco Energi', sector: 'Energy', market: 'IDX' },
  { symbol: 'PGAS', name: 'Perusahaan Gas Negara', sector: 'Energy', market: 'IDX' },
  { symbol: 'AKRA', name: 'AKR Corporindo', sector: 'Energy', market: 'IDX' },
  { symbol: 'TINS', name: 'Timah', sector: 'Mining', market: 'IDX' },
  { symbol: 'HRUM', name: 'Harum Energy', sector: 'Mining', market: 'IDX' },
  { symbol: 'UNTR', name: 'United Tractors', sector: 'Mining', market: 'IDX' },
  { symbol: 'MBAP', name: 'Mitrabara Adiperdana', sector: 'Mining', market: 'IDX' },
  
  // Property & Construction
  { symbol: 'BSDE', name: 'Bumi Serpong Damai', sector: 'Property', market: 'IDX' },
  { symbol: 'CTRA', name: 'Ciputra Development', sector: 'Property', market: 'IDX' },
  { symbol: 'SMRA', name: 'Summarecon Agung', sector: 'Property', market: 'IDX' },
  { symbol: 'PWON', name: 'Pakuwon Jati', sector: 'Property', market: 'IDX' },
  { symbol: 'LPKR', name: 'Lippo Karawaci', sector: 'Property', market: 'IDX' },
  { symbol: 'DMAS', name: 'Puradelta Lestari', sector: 'Property', market: 'IDX' },
  { symbol: 'WIKA', name: 'Wijaya Karya', sector: 'Construction', market: 'IDX' },
  { symbol: 'WSKT', name: 'Waskita Karya', sector: 'Construction', market: 'IDX' },
  { symbol: 'PTPP', name: 'PP (Persero)', sector: 'Construction', market: 'IDX' },
  { symbol: 'ADHI', name: 'Adhi Karya', sector: 'Construction', market: 'IDX' },
  { symbol: 'TOTL', name: 'Total Bangun Persada', sector: 'Construction', market: 'IDX' },
  
  // Industrial & Materials
  { symbol: 'SMGR', name: 'Semen Indonesia', sector: 'Industrial', market: 'IDX' },
  { symbol: 'INTP', name: 'Indocement', sector: 'Industrial', market: 'IDX' },
  { symbol: 'BRPT', name: 'Barito Pacific', sector: 'Industrial', market: 'IDX' },
  { symbol: 'TPIA', name: 'Chandra Asri Petrochemical', sector: 'Industrial', market: 'IDX' },
  { symbol: 'SRIL', name: 'Sri Rejeki Isman', sector: 'Industrial', market: 'IDX' },
  { symbol: 'AUTO', name: 'Astra Otoparts', sector: 'Industrial', market: 'IDX' },
  { symbol: 'INKP', name: 'Indah Kiat Pulp & Paper', sector: 'Industrial', market: 'IDX' },
  { symbol: 'TKIM', name: 'Pabrik Kertas Tjiwi Kimia', sector: 'Industrial', market: 'IDX' },
  
  // Transportation & Logistics
  { symbol: 'JSMR', name: 'Jasa Marga', sector: 'Infrastructure', market: 'IDX' },
  { symbol: 'GIAA', name: 'Garuda Indonesia', sector: 'Transportation', market: 'IDX' },
  { symbol: 'BIRD', name: 'Blue Bird', sector: 'Transportation', market: 'IDX' },
  { symbol: 'TAXI', name: 'Express Transindo Utama', sector: 'Transportation', market: 'IDX' },
  { symbol: 'SMDR', name: 'Samudera Indonesia', sector: 'Transportation', market: 'IDX' },
  { symbol: 'TMAS', name: 'Pelayaran Tempuran Emas', sector: 'Transportation', market: 'IDX' },
  
  // Media & Entertainment
  { symbol: 'SCMA', name: 'Surya Citra Media', sector: 'Media', market: 'IDX' },
  { symbol: 'MNCN', name: 'Media Nusantara Citra', sector: 'Media', market: 'IDX' },
  { symbol: 'FILM', name: 'MD Pictures', sector: 'Media', market: 'IDX' },
  
  // Others
  { symbol: 'PNLF', name: 'Panin Financial', sector: 'Finance', market: 'IDX' },
  { symbol: 'DSNG', name: 'Dharma Satya Nusantara', sector: 'Plantation', market: 'IDX' },
  { symbol: 'LSIP', name: 'PP London Sumatra', sector: 'Plantation', market: 'IDX' },
  { symbol: 'AALI', name: 'Astra Agro Lestari', sector: 'Plantation', market: 'IDX' },
  { symbol: 'PALM', name: 'Provident Agro', sector: 'Plantation', market: 'IDX' },
];

// US Stocks
const US_STOCKS: { symbol: string; name: string; sector: string; market: 'US' }[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', market: 'US' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', market: 'US' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', market: 'US' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', market: 'US' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical', market: 'US' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', market: 'US' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', market: 'US' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', market: 'US' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', market: 'US' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology', market: 'US' },
];

// Crypto Assets
const CRYPTO_ASSETS: { symbol: string; name: string; sector: string; market: 'CRYPTO' }[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', sector: 'Crypto', market: 'CRYPTO' },
  { symbol: 'ETH-USD', name: 'Ethereum', sector: 'Crypto', market: 'CRYPTO' },
  { symbol: 'BNB-USD', name: 'Binance Coin', sector: 'Crypto', market: 'CRYPTO' },
  { symbol: 'XRP-USD', name: 'XRP', sector: 'Crypto', market: 'CRYPTO' },
  { symbol: 'ADA-USD', name: 'Cardano', sector: 'Crypto', market: 'CRYPTO' },
  { symbol: 'SOL-USD', name: 'Solana', sector: 'Crypto', market: 'CRYPTO' },
  { symbol: 'DOGE-USD', name: 'Dogecoin', sector: 'Crypto', market: 'CRYPTO' },
];

// Combine all stocks for sector generation
const ALL_STOCKS = [...IDX_STOCKS, ...US_STOCKS, ...CRYPTO_ASSETS];

const WatchlistSearch: React.FC<WatchlistSearchProps> = ({
  isOpen,
  onClose,
  onAddStock,
  onRemoveStock,
  existingSymbols,
  watchlist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('Semua');
  const [selectedMarket, setSelectedMarket] = useState<'IDX' | 'US' | 'CRYPTO'>('IDX');
  const [activeTab, setActiveTab] = useState<'search' | 'watchlist'>('search');
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset sector when market changes
  useEffect(() => {
    setSelectedSector('Semua');
  }, [selectedMarket]);

  // Get sectors for current market
  const currentMarketSectors = useMemo(() => {
    const stocks = ALL_STOCKS.filter(s => s.market === selectedMarket);
    return ['Semua', ...Array.from(new Set(stocks.map(s => s.sector))).sort()];
  }, [selectedMarket]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filter stocks based on search and sector
  const filteredStocks = ALL_STOCKS.filter(stock => {
    const query = searchQuery.toUpperCase().trim();
    const matchesSearch = !query || 
      stock.symbol.includes(query) || 
      stock.name.toUpperCase().includes(query);
    const matchesSector = selectedSector === 'Semua' || stock.sector === selectedSector;
    const matchesMarket = stock.market === selectedMarket;
    const notInWatchlist = !existingSymbols.includes(stock.symbol);
    return matchesSearch && matchesSector && matchesMarket && notInWatchlist;
  });

  // Handle add stock
  const handleAddStock = useCallback(async (stock: { symbol: string; name: string; sector: string; market: 'IDX' | 'US' | 'CRYPTO' }) => {
    setLoadingSymbol(stock.symbol);
    try {
      const priceData = await fetchStockPrice(stock.symbol, stock.market);
      
      const newStock: StockTicker = {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        market: stock.market,
        price: priceData.price,
        change: priceData.change,
        changePercent: priceData.changePercent,
        high: priceData.high,
        low: priceData.low,
        volume: priceData.volume,
      };
      onAddStock(newStock);
      setRecentlyAdded(prev => [stock.symbol, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('Failed to fetch stock price:', error);
      // Add with default values
      const newStock: StockTicker = {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        market: stock.market,
        price: 0,
        change: 0,
        changePercent: 0,
        isLoading: true,
      };
      onAddStock(newStock);
      setRecentlyAdded(prev => [stock.symbol, ...prev.slice(0, 4)]);
    } finally {
      setLoadingSymbol(null);
    }
  }, [onAddStock]);

  // Handle remove stock
  const handleRemoveStock = useCallback((symbol: string) => {
    if (watchlist.length <= 1) {
      alert('Watchlist harus memiliki minimal 1 saham!');
      return;
    }
    onRemoveStock(symbol);
    setRecentlyAdded(prev => prev.filter(s => s !== symbol));
  }, [onRemoveStock, watchlist.length]);

  // Get sector stats
  const getSectorStats = useCallback(() => {
    const stats: { [key: string]: number } = {};
    watchlist.forEach(stock => {
      stats[stock.sector] = (stats[stock.sector] || 0) + 1;
    });
    return stats;
  }, [watchlist]);

  if (!isOpen) return null;

  const sectorStats = getSectorStats();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#141c2f] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="material-icons-round text-white">manage_search</span>
              </div>
              Kelola Watchlist
            </h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-icons-round text-lg">close</span>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'search'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-transparent'
              }`}
            >
              <span className="material-icons-round text-lg">search</span>
              Cari Saham
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'watchlist'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-transparent'
              }`}
            >
              <span className="material-icons-round text-lg">visibility</span>
              Watchlist ({watchlist.length})
            </button>
          </div>
          
          {activeTab === 'search' && (
            <>
              {/* Market Selection */}
              <div className="flex gap-2 mb-3">
                {(['IDX', 'US', 'CRYPTO'] as const).map((market) => (
                  <button
                    key={market}
                    onClick={() => setSelectedMarket(market)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      selectedMarket === market
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
                    }`}
                  >
                    {market === 'IDX' ? '🇮🇩 IDX' : market === 'US' ? '🇺🇸 US Stocks' : '₿ Crypto'}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari ${selectedMarket === 'IDX' ? 'saham IDX' : selectedMarket === 'US' ? 'saham US' : 'aset Crypto'}...`}
                  className="w-full bg-[#0a0e17] border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <span className="material-icons-round text-lg">close</span>
                  </button>
                )}
              </div>
              
              {/* Sector Filter */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 custom-scrollbar">
                {currentMarketSectors.map(sector => (
                  <button
                    key={sector}
                    onClick={() => setSelectedSector(sector)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedSector === sector
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700 border border-transparent'
                    }`}
                  >
                    {sector}
                    {sector !== 'Semua' && (
                      <span className="ml-1 opacity-60">
                        ({ALL_STOCKS.filter(s => s.sector === sector && s.market === selectedMarket && !existingSymbols.includes(s.symbol)).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'search' ? (
            <>
              {/* Recently Added */}
              {recentlyAdded.length > 0 && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-xs text-emerald-400 mb-2 flex items-center gap-1">
                    <span className="material-icons-round text-sm">check_circle</span>
                    Baru ditambahkan:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentlyAdded.map(symbol => (
                      <span key={symbol} className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg">
                        {symbol}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Search Results */}
              {filteredStocks.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <span className="material-icons-round text-5xl mb-3 block opacity-50">search_off</span>
                  <p className="font-medium">Tidak ada saham ditemukan</p>
                  <p className="text-xs mt-1">Coba kata kunci lain atau ubah filter sektor</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredStocks.slice(0, 50).map(stock => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleAddStock(stock)}
                      disabled={loadingSymbol === stock.symbol}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/30 hover:border-blue-500/30 transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-sm font-bold text-slate-300 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                          {stock.symbol.slice(0, 2)}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">{stock.symbol}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[280px]">{stock.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-1 rounded-md bg-slate-700/50 text-slate-400">
                          {stock.sector}
                        </span>
                        {loadingSymbol === stock.symbol ? (
                          <span className="material-icons-round text-blue-400 animate-spin">sync</span>
                        ) : (
                          <span className="material-icons-round text-slate-500 group-hover:text-emerald-400 transition-colors">add_circle</span>
                        )}
                      </div>
                    </button>
                  ))}
                  {filteredStocks.length > 50 && (
                    <p className="text-center text-xs text-slate-500 py-3">
                      Menampilkan 50 dari {filteredStocks.length} hasil. Gunakan pencarian untuk menyaring.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Watchlist Stats */}
              <div className="mb-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <p className="text-sm text-slate-400 mb-3">Distribusi Sektor:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sectorStats).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([sector, count]) => (
                    <span key={sector} className="px-3 py-1.5 bg-slate-700/50 text-slate-300 text-xs rounded-lg flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      {sector}: <strong>{count}</strong>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Watchlist Items */}
              <div className="space-y-2">
                {watchlist.map(stock => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 group hover:bg-slate-800/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-sm font-bold text-slate-300">
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{stock.symbol}</p>
                        <p className="text-xs text-slate-500">{stock.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        {stock.isLoading ? (
                          <span className="text-xs text-slate-500">Loading...</span>
                        ) : (
                          <>
                            <p className="text-sm font-mono text-slate-300">
                              {stock.market === 'US' || stock.market === 'CRYPTO' ? '$' : 'Rp '}
                              {stock.price.toLocaleString()}
                            </p>
                            <p className={`text-xs font-mono ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </p>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-md bg-slate-700/50 text-slate-400">
                        {stock.sector}
                      </span>
                      <button
                        onClick={() => handleRemoveStock(stock.symbol)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all opacity-0 group-hover:opacity-100"
                        title="Hapus dari Watchlist"
                      >
                        <span className="material-icons-round text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {activeTab === 'search' 
                ? `${filteredStocks.length} saham tersedia`
                : `${watchlist.length} saham di watchlist`
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchlistSearch;
