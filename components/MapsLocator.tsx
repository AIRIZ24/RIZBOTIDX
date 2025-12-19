import React, { useState, useCallback, useEffect } from 'react';
import { findCompanyHeadquarters } from '../services/geminiService';
import {
  CompanyLocation,
  searchCompanyLocation,
  getGoogleMapsUrl,
  getNearbyCompanies,
  getCompaniesByCity,
} from '../services/locationService';

// Company suggestions with sectors
const COMPANY_SUGGESTIONS = [
  { name: 'Bank Central Asia', symbol: 'BBCA', sector: 'Banking' },
  { name: 'Telkom Indonesia', symbol: 'TLKM', sector: 'Telco' },
  { name: 'Astra International', symbol: 'ASII', sector: 'Consumer' },
  { name: 'Bank Rakyat Indonesia', symbol: 'BBRI', sector: 'Banking' },
  { name: 'GoTo Gojek Tokopedia', symbol: 'GOTO', sector: 'Tech' },
  { name: 'Aneka Tambang', symbol: 'ANTM', sector: 'Mining' },
  { name: 'Indofood', symbol: 'INDF', sector: 'Consumer' },
  { name: 'Bukalapak', symbol: 'BUKA', sector: 'Tech' },
];

// City filter options
const CITY_OPTIONS = ['Semua Kota', 'Jakarta', 'Tangerang', 'Surabaya', 'Bandung'];

const MapsLocator: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<CompanyLocation | null>(null);
  const [searchResults, setSearchResults] = useState<CompanyLocation[]>([]);
  const [selectedCity, setSelectedCity] = useState('Semua Kota');
  const [showMap, setShowMap] = useState(true);
  const [viewMode, setViewMode] = useState<'search' | 'browse'>('search');

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rizbot_location_history');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Save search history
  const saveHistory = useCallback((searchQuery: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.toLowerCase() !== searchQuery.toLowerCase());
      const newHistory = [searchQuery, ...filtered].slice(0, 8);
      localStorage.setItem('rizbot_location_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Search handler with local database first, AI fallback
  const handleSearch = useCallback(async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setResult('');
    setSearchResults([]);
    setSelectedLocation(null);
    
    try {
      // Step 1: Search in local database first
      const localResults = searchCompanyLocation(finalQuery);
      
      if (localResults.length > 0) {
        // Found in local database
        setSearchResults(localResults);
        setSelectedLocation(localResults[0]); // Auto-select first result
        saveHistory(finalQuery);
        
        // Build result text from local data
        const loc = localResults[0];
        setResult(`📍 **${loc.fullName}** (${loc.symbol})\n\n**Alamat:**\n${loc.address}, ${loc.city}\n\n**Telepon:** ${loc.phone || '-'}\n**Website:** ${loc.website || '-'}\n\n${loc.description || ''}`);
      } else {
        // Step 2: Fallback to AI search
        const lat = -6.2088; 
        const lng = 106.8456;
        const response = await findCompanyHeadquarters(finalQuery, lat, lng);
        setResult(response);
        saveHistory(finalQuery);
      }
    } catch (error) {
      setResult('Gagal mencari lokasi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [query, saveHistory]);

  // Handle company selection from suggestions/results
  const handleCompanySelect = useCallback((company: CompanyLocation) => {
    setSelectedLocation(company);
    setQuery(company.name);
    setResult(`📍 **${company.fullName}** (${company.symbol})\n\n**Alamat:**\n${company.address}, ${company.city}\n\n**Telepon:** ${company.phone || '-'}\n**Website:** ${company.website || '-'}\n\n${company.description || ''}`);
  }, []);

  const handleSuggestionClick = useCallback((name: string) => {
    setQuery(name);
    handleSearch(name);
  }, [handleSearch]);

  // Get nearby companies when a location is selected
  const nearbyCompanies = selectedLocation 
    ? getNearbyCompanies(selectedLocation.symbol, 10).slice(0, 4)
    : [];

  // Filter companies by city for browse mode
  const filteredByCity = selectedCity === 'Semua Kota' 
    ? searchCompanyLocation('') 
    : getCompaniesByCity(selectedCity);

  return (
    <div className="bg-[#141c2f] rounded-2xl border border-slate-800/60 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="material-icons-round text-white">location_on</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">HQ Locator</h2>
              <p className="text-xs text-slate-500">Database 20+ perusahaan IDX</p>
            </div>
          </div>
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800/50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('search')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'search' 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-icons-round text-sm mr-1">search</span>
              Cari
            </button>
            <button
              onClick={() => setViewMode('browse')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'browse' 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-icons-round text-sm mr-1">list</span>
              Browse
            </button>
          </div>
        </div>
        
        {viewMode === 'search' ? (
          <>
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Cari perusahaan (nama/kode saham)..."
                  className="w-full bg-[#0a0e17] border border-slate-800/60 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
              <button 
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className="px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 flex items-center gap-1 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="material-icons-round animate-spin text-lg">sync</span>
                ) : (
                  <span className="material-icons-round text-lg">explore</span>
                )}
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {COMPANY_SUGGESTIONS.map((company) => (
                <button
                  key={company.symbol}
                  onClick={() => handleSuggestionClick(company.name)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-all flex items-center gap-1"
                >
                  <span className="text-red-400 font-mono font-bold text-[10px]">{company.symbol}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-[10px] text-slate-500">{company.sector}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Browse Mode - City Filter */
          <div className="flex flex-wrap gap-2">
            {CITY_OPTIONS.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  selectedCity === city
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Results/Company List */}
        <div className="w-1/2 border-r border-slate-800/40 flex flex-col overflow-hidden">
          {viewMode === 'browse' ? (
            /* Browse Mode - Company List */
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">
                {filteredByCity.length} Perusahaan {selectedCity !== 'Semua Kota' && `di ${selectedCity}`}
              </div>
              {filteredByCity.map(company => (
                <button
                  key={company.symbol}
                  onClick={() => handleCompanySelect(company)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedLocation?.symbol === company.symbol
                      ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30'
                      : 'bg-slate-800/30 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-mono font-bold text-sm">{company.symbol}</span>
                      <span className="text-white text-sm font-medium">{company.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{company.city}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Search Mode - Results */
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center animate-pulse shadow-xl shadow-red-500/20">
                      <span className="material-icons-round text-white text-2xl">location_searching</span>
                    </div>
                  </div>
                  <p className="text-red-400 text-sm">Mencari lokasi...</p>
                </div>
              ) : result ? (
                <div className="space-y-3">
                  {/* Search Results List */}
                  {searchResults.length > 1 && (
                    <div className="space-y-1.5 mb-4">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Hasil Pencarian</div>
                      {searchResults.map(company => (
                        <button
                          key={company.symbol}
                          onClick={() => handleCompanySelect(company)}
                          className={`w-full text-left p-2 rounded-lg transition-all text-xs ${
                            selectedLocation?.symbol === company.symbol
                              ? 'bg-red-500/20 border border-red-500/30'
                              : 'bg-slate-800/30 hover:bg-slate-800/50'
                          }`}
                        >
                          <span className="text-red-400 font-mono font-bold">{company.symbol}</span>
                          <span className="text-slate-400 mx-1">-</span>
                          <span className="text-white">{company.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Location Details */}
                  <div className="bg-[#0a0e17] rounded-xl p-4 border border-slate-800/40">
                    {selectedLocation && (
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/20">
                          <span className="material-icons-round text-red-400">apartment</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-sm">{selectedLocation.fullName}</h3>
                          <span className="text-red-400 text-xs font-mono">{selectedLocation.symbol}</span>
                        </div>
                      </div>
                    )}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-slate-300 leading-relaxed text-xs">{result}</p>
                    </div>
                    
                    {/* Action Buttons */}
                    {selectedLocation && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800/40">
                        <a
                          href={getGoogleMapsUrl(selectedLocation.symbol)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-all"
                        >
                          <span className="material-icons-round text-sm">open_in_new</span>
                          Google Maps
                        </a>
                        <a
                          href={selectedLocation.website || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-all"
                        >
                          <span className="material-icons-round text-sm">language</span>
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Nearby Companies */}
                  {nearbyCompanies.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Perusahaan Terdekat</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {nearbyCompanies.map(company => (
                          <button
                            key={company.symbol}
                            onClick={() => handleCompanySelect(company)}
                            className="p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 text-left transition-all"
                          >
                            <div className="text-red-400 font-mono font-bold text-xs">{company.symbol}</div>
                            <div className="text-slate-400 text-[10px] truncate">{company.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/30 flex items-center justify-center border border-slate-700/50">
                    <span className="material-icons-round text-slate-600 text-3xl">pin_drop</span>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium text-sm">Cari Kantor Pusat</p>
                    <p className="text-slate-600 text-xs mt-1">
                      Ketik nama/kode perusahaan
                    </p>
                  </div>
                  
                  {/* Search History */}
                  {searchHistory.length > 0 && (
                    <div className="mt-4 w-full">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Riwayat</div>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {searchHistory.slice(0, 5).map((item, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(item)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/30 hover:bg-slate-700/50 text-slate-500 hover:text-white transition-all"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Map Preview */}
        <div className="w-1/2 flex flex-col">
          {/* Map Toggle */}
          <div className="p-2 border-b border-slate-800/40 flex items-center justify-between">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <span className="material-icons-round text-sm text-red-400">map</span>
              Peta Lokasi
            </div>
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-xs text-slate-500 hover:text-white transition-all"
            >
              {showMap ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
          
          {showMap && (
            <div className="flex-1 relative bg-slate-900/50">
              {selectedLocation ? (
                <iframe
                  src={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=16&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map of ${selectedLocation.name}`}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                    <span className="material-icons-round text-slate-600 text-3xl">public</span>
                  </div>
                  <p className="text-slate-500 text-sm">Pilih perusahaan untuk melihat lokasi di peta</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapsLocator;