import React, { useState, useEffect, useCallback } from 'react';
import { StockTicker } from '../types';
import { fetchStockPrice } from '../services/stockApiService';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (stock: StockTicker) => void;
  existingSymbols: string[];
}

// Daftar saham IDX populer untuk pencarian
const IDX_STOCKS: { symbol: string; name: string; sector: string }[] = [
  // Banking
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk', sector: 'Finance' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Finance' },
  { symbol: 'BMRI', name: 'Bank Mandiri', sector: 'Finance' },
  { symbol: 'BBNI', name: 'Bank Negara Indonesia', sector: 'Finance' },
  { symbol: 'BRIS', name: 'Bank Syariah Indonesia', sector: 'Finance' },
  { symbol: 'BTPS', name: 'Bank BTPN Syariah', sector: 'Finance' },
  { symbol: 'MEGA', name: 'Bank Mega', sector: 'Finance' },
  { symbol: 'NISP', name: 'Bank OCBC NISP', sector: 'Finance' },
  
  // Telco & Tech
  { symbol: 'TLKM', name: 'Telkom Indonesia', sector: 'Infrastructure' },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', sector: 'Tech' },
  { symbol: 'BUKA', name: 'Bukalapak', sector: 'Tech' },
  { symbol: 'EMTK', name: 'Elang Mahkota Teknologi', sector: 'Tech' },
  { symbol: 'DCII', name: 'DCI Indonesia', sector: 'Tech' },
  
  // Consumer
  { symbol: 'ASII', name: 'Astra International', sector: 'Consumer' },
  { symbol: 'UNVR', name: 'Unilever Indonesia', sector: 'Consumer' },
  { symbol: 'ICBP', name: 'Indofood CBP', sector: 'Consumer' },
  { symbol: 'INDF', name: 'Indofood Sukses Makmur', sector: 'Consumer' },
  { symbol: 'MYOR', name: 'Mayora Indah', sector: 'Consumer' },
  { symbol: 'KLBF', name: 'Kalbe Farma', sector: 'Healthcare' },
  { symbol: 'SIDO', name: 'Sido Muncul', sector: 'Healthcare' },
  { symbol: 'HMSP', name: 'HM Sampoerna', sector: 'Consumer' },
  { symbol: 'GGRM', name: 'Gudang Garam', sector: 'Consumer' },
  
  // Mining & Energy
  { symbol: 'ANTM', name: 'Aneka Tambang', sector: 'Mining' },
  { symbol: 'PTBA', name: 'Bukit Asam', sector: 'Mining' },
  { symbol: 'INCO', name: 'Vale Indonesia', sector: 'Mining' },
  { symbol: 'ADRO', name: 'Adaro Energy', sector: 'Mining' },
  { symbol: 'ITMG', name: 'Indo Tambangraya', sector: 'Mining' },
  { symbol: 'MDKA', name: 'Merdeka Copper Gold', sector: 'Mining' },
  { symbol: 'PGAS', name: 'Perusahaan Gas Negara', sector: 'Energy' },
  { symbol: 'AKRA', name: 'AKR Corporindo', sector: 'Energy' },
  
  // Property & Construction
  { symbol: 'BSDE', name: 'Bumi Serpong Damai', sector: 'Property' },
  { symbol: 'CTRA', name: 'Ciputra Development', sector: 'Property' },
  { symbol: 'SMRA', name: 'Summarecon Agung', sector: 'Property' },
  { symbol: 'PWON', name: 'Pakuwon Jati', sector: 'Property' },
  { symbol: 'WIKA', name: 'Wijaya Karya', sector: 'Construction' },
  { symbol: 'WSKT', name: 'Waskita Karya', sector: 'Construction' },
  { symbol: 'PTPP', name: 'PP (Persero)', sector: 'Construction' },
  { symbol: 'ADHI', name: 'Adhi Karya', sector: 'Construction' },
  
  // Industrial
  { symbol: 'SMGR', name: 'Semen Indonesia', sector: 'Industrial' },
  { symbol: 'INTP', name: 'Indocement', sector: 'Industrial' },
  { symbol: 'BRPT', name: 'Barito Pacific', sector: 'Industrial' },
  { symbol: 'TPIA', name: 'Chandra Asri', sector: 'Industrial' },
  
  // Others
  { symbol: 'ACES', name: 'Ace Hardware Indonesia', sector: 'Retail' },
  { symbol: 'ERAA', name: 'Erajaya Swasembada', sector: 'Retail' },
  { symbol: 'MAPI', name: 'Mitra Adiperkasa', sector: 'Retail' },
  { symbol: 'LPPF', name: 'Matahari Department Store', sector: 'Retail' },
  { symbol: 'JSMR', name: 'Jasa Marga', sector: 'Infrastructure' },
  { symbol: 'EXCL', name: 'XL Axiata', sector: 'Telco' },
  { symbol: 'ISAT', name: 'Indosat Ooredoo', sector: 'Telco' },
  { symbol: 'TOWR', name: 'Sarana Menara Nusantara', sector: 'Infrastructure' },
  { symbol: 'TBIG', name: 'Tower Bersama', sector: 'Infrastructure' },
  
  // Media & Entertainment
  { symbol: 'SCMA', name: 'Surya Citra Media', sector: 'Media' },
  { symbol: 'MNCN', name: 'Media Nusantara Citra', sector: 'Media' },
  { symbol: 'FILM', name: 'MD Pictures', sector: 'Media' },
];

const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, onAddStock, existingSymbols }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStocks, setFilteredStocks] = useState(IDX_STOCKS);
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('All');

  const sectors = ['All', ...Array.from(new Set(IDX_STOCKS.map(s => s.sector)))];

  useEffect(() => {
    const query = searchQuery.toUpperCase();
    let results = IDX_STOCKS.filter(stock => 
      !existingSymbols.includes(stock.symbol) &&
      (stock.symbol.includes(query) || stock.name.toUpperCase().includes(query))
    );
    
    if (selectedSector !== 'All') {
      results = results.filter(stock => stock.sector === selectedSector);
    }
    
    setFilteredStocks(results);
  }, [searchQuery, existingSymbols, selectedSector]);

  const handleAddStock = useCallback(async (stock: { symbol: string; name: string; sector: string }) => {
    setLoadingSymbol(stock.symbol);
    try {
      const priceData = await fetchStockPrice(stock.symbol);
      const newStock: StockTicker = {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        price: priceData.price,
        change: priceData.change,
        changePercent: priceData.changePercent,
        high: priceData.high,
        low: priceData.low,
        volume: priceData.volume,
      };
      onAddStock(newStock);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to fetch stock price:', error);
      // Add with default values
      const newStock: StockTicker = {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        price: 0,
        change: 0,
        changePercent: 0,
        isLoading: true,
      };
      onAddStock(newStock);
    } finally {
      setLoadingSymbol(null);
    }
  }, [onAddStock]);

  if (!isOpen) return null;

  // Get sector icon
  const getSectorIcon = (sector: string): string => {
    const icons: Record<string, string> = {
      'Finance': 'account_balance',
      'Tech': 'memory',
      'Consumer': 'shopping_cart',
      'Mining': 'hardware',
      'Energy': 'bolt',
      'Property': 'apartment',
      'Construction': 'construction',
      'Industrial': 'factory',
      'Healthcare': 'local_hospital',
      'Retail': 'storefront',
      'Infrastructure': 'cell_tower',
      'Telco': 'phone_android',
      'Media': 'live_tv',
    };
    return icons[sector] || 'category';
  };

  // Get sector color
  const getSectorColor = (sector: string): string => {
    const colors: Record<string, string> = {
      'Finance': 'from-blue-500 to-blue-600',
      'Tech': 'from-purple-500 to-indigo-600',
      'Consumer': 'from-orange-500 to-amber-600',
      'Mining': 'from-yellow-500 to-yellow-600',
      'Energy': 'from-green-500 to-emerald-600',
      'Property': 'from-cyan-500 to-teal-600',
      'Construction': 'from-slate-500 to-slate-600',
      'Industrial': 'from-gray-500 to-zinc-600',
      'Healthcare': 'from-red-500 to-rose-600',
      'Retail': 'from-pink-500 to-fuchsia-600',
      'Infrastructure': 'from-sky-500 to-blue-600',
      'Telco': 'from-violet-500 to-purple-600',
      'Media': 'from-rose-500 to-pink-600',
    };
    return colors[sector] || 'from-slate-500 to-slate-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-b from-[#141c2f] to-[#0d1321] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/20">
                <span className="material-icons-round text-white text-xl">add_chart</span>
              </div>
              <div>
                <span className="block">Tambah Saham</span>
                <span className="text-xs font-normal text-slate-400">Pilih saham untuk ditambahkan ke watchlist</span>
              </div>
            </h2>
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all hover:rotate-90 duration-300"
            >
              <span className="material-icons-round text-lg">close</span>
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative group">
            <span className="material-icons-round absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode atau nama saham... (contoh: SCMA)"
              className="w-full bg-[#0a0e17]/80 border-2 border-slate-700/50 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <span className="material-icons-round text-sm">close</span>
              </button>
            )}
          </div>
          
          {/* Sector Filter */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
            {sectors.map(sector => (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedSector === sector
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {sector !== 'All' && (
                  <span className="material-icons-round text-sm">{getSectorIcon(sector)}</span>
                )}
                {sector === 'All' ? '🔥 Semua' : sector}
              </button>
            ))}
          </div>
        </div>
        
        {/* Stock List */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {filteredStocks.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <span className="material-icons-round text-5xl text-slate-600">search_off</span>
              </div>
              <p className="font-semibold text-lg text-slate-400">Tidak ada saham ditemukan</p>
              <p className="text-sm mt-2 text-slate-500">Coba kata kunci lain atau ubah filter sektor</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredStocks.map(stock => (
                <button
                  key={stock.symbol}
                  onClick={() => handleAddStock(stock)}
                  disabled={loadingSymbol === stock.symbol}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 hover:border-emerald-500/30 transition-all group disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getSectorColor(stock.sector)} flex items-center justify-center text-sm font-bold text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{stock.symbol}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-400 font-medium">IDX</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{stock.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 font-medium flex items-center gap-1">
                      <span className="material-icons-round text-xs">{getSectorIcon(stock.sector)}</span>
                      {stock.sector}
                    </span>
                    {loadingSymbol === stock.symbol ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <span className="material-icons-round text-emerald-400 animate-spin">sync</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-700/50 group-hover:bg-emerald-500 flex items-center justify-center transition-all">
                        <span className="material-icons-round text-slate-400 group-hover:text-white transition-colors">add</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-emerald-400">{filteredStocks.length}</span> saham tersedia
              </p>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="material-icons-round text-sm">touch_app</span>
              Klik untuk menambahkan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStockModal;
