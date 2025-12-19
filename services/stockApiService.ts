/**
 * Stock API Service - Real-time IDX Stock Data
 * 
 * Menggunakan beberapa sumber data:
 * 1. Yahoo Finance (primary)
 * 2. Multiple CORS proxies for reliability
 * 3. Fallback ke mock data jika API gagal
 */

import { StockTicker, StockData } from '../types';

// Cache untuk mengurangi API calls
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 30000; // 30 detik untuk data lebih fresh

// Multiple CORS proxies for reliability
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

let currentProxyIndex = 0;

const getNextProxy = () => {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
  return CORS_PROXIES[currentProxyIndex];
};

// Updated fallback prices with more accurate current market values (Dec 2024)
const FALLBACK_PRICES: Record<string, { price: number; change: number }> = {
  // US Stocks
  'AAPL': { price: 195.50, change: 0.85 },
  'MSFT': { price: 425.20, change: 1.10 },
  'GOOGL': { price: 175.80, change: -0.45 },
  'AMZN': { price: 185.30, change: 0.92 },
  'TSLA': { price: 255.10, change: -1.20 },
  'NVDA': { price: 495.90, change: 2.30 },
  'META': { price: 585.40, change: 1.15 },
  'NFLX': { price: 895.60, change: 0.78 },
  'AMD': { price: 138.20, change: 1.45 },
  'INTC': { price: 21.10, change: -0.85 },

  // Crypto
  'BTC-USD': { price: 106500.00, change: 2.15 },
  'ETH-USD': { price: 3950.20, change: 1.85 },
  'BNB-USD': { price: 720.10, change: 0.95 },
  'XRP-USD': { price: 2.45, change: 3.20 },
  'ADA-USD': { price: 1.05, change: 2.15 },
  'SOL-USD': { price: 225.20, change: 4.80 },
  'DOGE-USD': { price: 0.40, change: 1.55 },

  // Banking - Blue Chips (Updated Dec 2024)
  'BBCA': { price: 10050, change: -0.50 },
  'BBRI': { price: 4640, change: -1.14 },
  'BMRI': { price: 6500, change: -1.52 },
  'BBNI': { price: 4950, change: -0.80 },
  'BRIS': { price: 2700, change: 0.75 },
  'BTPS': { price: 1305, change: -0.38 },
  
  // Infrastructure & Telco
  'TLKM': { price: 2680, change: -1.47 },
  'EXCL': { price: 2160, change: -0.92 },
  'ISAT': { price: 10025, change: 0.50 },
  'TOWR': { price: 755, change: -0.66 },
  
  // Consumer & Retail
  'ASII': { price: 4660, change: -1.27 },
  'UNVR': { price: 1760, change: -0.56 },
  'INDF': { price: 6425, change: -0.77 },
  'ICBP': { price: 10475, change: -0.95 },
  'MYOR': { price: 2270, change: 0.44 },
  'GGRM': { price: 15975, change: -2.43 },
  'HMSP': { price: 665, change: -1.48 },
  'KLBF': { price: 1420, change: -0.70 },
  
  // Mining & Energy
  'ANTM': { price: 1290, change: -3.00 },
  'PTBA': { price: 2480, change: -1.58 },
  'ADRO': { price: 2520, change: -0.79 },
  'INCO': { price: 4800, change: 1.69 },
  'MEDC': { price: 1190, change: -0.83 },
  'ITMG': { price: 25500, change: -1.16 },
  
  // Tech & Digital
  'GOTO': { price: 65, change: -1.52 },
  'BUKA': { price: 115, change: -2.54 },
  'EMTK': { price: 394, change: -3.90 },
  'DCII': { price: 35000, change: 0.58 },
  
  // Property & Construction  
  'BSDE': { price: 980, change: -0.51 },
  'SMRA': { price: 595, change: -0.83 },
  'CTRA': { price: 990, change: -1.00 },
  'WIKA': { price: 394, change: -1.50 },
  'PTPP': { price: 478, change: -0.83 },
  
  // Others
  'ACES': { price: 600, change: -1.64 },
  'ERAA': { price: 394, change: -2.96 },
  'MDKA': { price: 2370, change: -0.84 },
  'TPIA': { price: 8375, change: -0.30 },
  'AMRT': { price: 3110, change: 2.98 },
  'SCMA': { price: 119, change: -0.83 },
};

// Sector mapping - Complete
const SECTOR_MAP: Record<string, string> = {
  // Banking
  'BBCA': 'Finance', 'BBRI': 'Finance', 'BMRI': 'Finance', 'BBNI': 'Finance',
  'BRIS': 'Finance', 'BTPS': 'Finance',
  // Telco
  'TLKM': 'Infrastructure', 'EXCL': 'Infrastructure', 'ISAT': 'Infrastructure', 'TOWR': 'Infrastructure',
  // Consumer
  'ASII': 'Consumer', 'UNVR': 'Consumer', 'INDF': 'Consumer', 'ICBP': 'Consumer',
  'MYOR': 'Consumer', 'GGRM': 'Consumer', 'HMSP': 'Consumer', 'KLBF': 'Healthcare',
  // Mining
  'ANTM': 'Mining', 'PTBA': 'Mining', 'ADRO': 'Mining', 'INCO': 'Mining',
  'MEDC': 'Energy', 'ITMG': 'Mining', 'MDKA': 'Mining',
  // Tech
  'GOTO': 'Tech', 'BUKA': 'Tech', 'EMTK': 'Tech', 'DCII': 'Tech',
  // Property
  'BSDE': 'Property', 'SMRA': 'Property', 'CTRA': 'Property', 
  'WIKA': 'Infrastructure', 'PTPP': 'Infrastructure',
  // Others
  'ACES': 'Retail', 'ERAA': 'Retail', 'TPIA': 'Chemicals', 'AMRT': 'Retail',
  'SCMA': 'Media',
};

// Company names - Complete
const COMPANY_NAMES: Record<string, string> = {
  // Banking
  'BBCA': 'Bank Central Asia', 'BBRI': 'Bank Rakyat Indonesia',
  'BMRI': 'Bank Mandiri', 'BBNI': 'Bank Negara Indonesia',
  'BRIS': 'Bank Syariah Indonesia', 'BTPS': 'Bank BTPN Syariah',
  // Telco & Infrastructure
  'TLKM': 'Telkom Indonesia', 'EXCL': 'XL Axiata',
  'ISAT': 'Indosat Ooredoo', 'TOWR': 'Sarana Menara Nusantara',
  // Consumer
  'ASII': 'Astra International', 'UNVR': 'Unilever Indonesia',
  'INDF': 'Indofood Sukses Makmur', 'ICBP': 'Indofood CBP',
  'MYOR': 'Mayora Indah', 'GGRM': 'Gudang Garam',
  'HMSP': 'HM Sampoerna', 'KLBF': 'Kalbe Farma',
  // Mining & Energy
  'ANTM': 'Aneka Tambang', 'PTBA': 'Bukit Asam',
  'ADRO': 'Adaro Energy', 'INCO': 'Vale Indonesia',
  'MEDC': 'Medco Energi', 'ITMG': 'Indo Tambangraya',
  'MDKA': 'Merdeka Copper Gold',
  // Tech
  'GOTO': 'GoTo Gojek Tokopedia', 'BUKA': 'Bukalapak',
  'EMTK': 'Elang Mahkota', 'DCII': 'DCI Indonesia',
  // Property & Construction
  'BSDE': 'Bumi Serpong Damai', 'SMRA': 'Summarecon Agung',
  'CTRA': 'Ciputra Development', 'WIKA': 'Wijaya Karya',
  'PTPP': 'PP (Persero)',
  // Others
  'ACES': 'Ace Hardware Indonesia', 'ERAA': 'Erajaya Swasembada',
  'TPIA': 'Chandra Asri', 'AMRT': 'Sumber Alfaria',
  'SCMA': 'Surya Citra Media',
};

/**
 * Fetch stock price from multiple sources with fallback
 */
export const fetchStockPrice = async (symbol: string, market: 'IDX' | 'US' | 'CRYPTO' = 'IDX'): Promise<{
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  lastUpdate: string;
}> => {
  const cacheKey = `price_${symbol}_${market}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Try Yahoo Finance via proxy (more reliable)
    const data = await fetchFromYahoo(symbol, market);
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.warn(`Yahoo API failed for ${symbol}, trying alternative...`);
  }

  if (market === 'IDX') {
    try {
      // Try alternative: scraping IDX
      const data = await fetchFromIDXAlternative(symbol);
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.warn(`Alternative API failed for ${symbol}, using fallback...`);
    }
  }

  // Fallback to mock data with slight randomization
  const fallback = FALLBACK_PRICES[symbol] || { price: 1000, change: 0 };
  const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
  const price = Math.round(fallback.price * (1 + randomVariation));
  const changePercent = fallback.change + (Math.random() - 0.5) * 0.5;
  const change = Math.round(price * changePercent / 100);
  
  return {
    price,
    change,
    changePercent: parseFloat(changePercent.toFixed(2)),
    high: Math.round(price * 1.02),
    low: Math.round(price * 0.98),
    open: Math.round(price - change),
    volume: Math.floor(Math.random() * 50000000) + 10000000,
    lastUpdate: new Date().toLocaleTimeString('id-ID'),
  };
};

/**
 * Fetch from Yahoo Finance (most reliable)
 * Uses multiple CORS proxies for reliability
 */
const fetchFromYahoo = async (symbol: string, market: 'IDX' | 'US' | 'CRYPTO', retries = 3): Promise<any> => {
  let yahooSymbol = symbol;
  if (market === 'IDX') {
    yahooSymbol = `${symbol}.JK`;
  }
  // US and CRYPTO symbols are usually correct as is (e.g. AAPL, BTC-USD)
  
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const proxy = CORS_PROXIES[attempt % CORS_PROXIES.length];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
      
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON response');
      }
      
      const quote = data.chart?.result?.[0];
      
      if (!quote) {
        throw new Error('No data returned from Yahoo Finance');
      }
      
      const meta = quote.meta;
      const indicators = quote.indicators?.quote?.[0];
      
      // Get the most recent valid price
      let price = meta.regularMarketPrice;
      let previousClose = meta.chartPreviousClose || meta.previousClose;
      
      // If regularMarketPrice is not available, use the last close from indicators
      if (!price && indicators?.close) {
        const closes = indicators.close.filter((c: number | null) => c !== null);
        price = closes[closes.length - 1];
      }
      
      if (!price) {
        price = previousClose;
      }
      
      const change = price - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;
      
      return {
        price: Math.round(price),
        change: Math.round(change),
        changePercent: parseFloat(changePercent.toFixed(2)),
        high: Math.round(meta.regularMarketDayHigh || meta.dayHigh || price * 1.01),
        low: Math.round(meta.regularMarketDayLow || meta.dayLow || price * 0.99),
        open: Math.round(meta.regularMarketOpen || meta.open || previousClose),
        volume: meta.regularMarketVolume || 0,
        lastUpdate: new Date().toLocaleTimeString('id-ID'),
        source: 'yahoo',
      };
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed for ${symbol}:`, (error as Error).message);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('Yahoo API failed after retries');
};

/**
 * Alternative IDX data source using Sectors API
 */
const fetchFromIDXAlternative = async (symbol: string): Promise<any> => {
  // Try multiple proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const url = `https://api.sectors.app/v1/daily/${symbol}/?start=${getDateString(-5)}&end=${getDateString(0)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const latest = data[data.length - 1];
        const prev = data.length > 1 ? data[data.length - 2] : latest;
        
        const price = latest.close || latest.last;
        const prevPrice = prev.close || prev.last;
        const change = price - prevPrice;
        const changePercent = (change / prevPrice) * 100;
        
        return {
          price: Math.round(price),
          change: Math.round(change),
          changePercent: parseFloat(changePercent.toFixed(2)),
          high: Math.round(latest.high || price),
          low: Math.round(latest.low || price),
          open: Math.round(latest.open || price),
          volume: latest.volume || 0,
          lastUpdate: new Date().toLocaleTimeString('id-ID'),
          source: 'sectors',
        };
      }
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('IDX Alternative API failed');
};

// Helper to get date string
const getDateString = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

/**
 * Fetch historical data for chart
 */
export const fetchHistoricalData = async (symbol: string, days: number = 100, market: 'IDX' | 'US' | 'CRYPTO' = 'IDX'): Promise<StockData[]> => {
  const cacheKey = `history_${symbol}_${days}_${market}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 10) {
    return cached.data;
  }

  // Try each proxy
  for (let proxyIndex = 0; proxyIndex < CORS_PROXIES.length; proxyIndex++) {
    try {
      let yahooSymbol = symbol;
      if (market === 'IDX') {
        yahooSymbol = `${symbol}.JK`;
      }
      
      const range = days <= 7 ? '5d' : days <= 30 ? '1mo' : days <= 90 ? '3mo' : days <= 180 ? '6mo' : '1y';
      const interval = days <= 7 ? '15m' : '1d';
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
      
      const proxy = CORS_PROXIES[proxyIndex];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON');
      }
      
      const result = json.chart?.result?.[0];
      
      if (!result || !result.timestamp) {
        throw new Error('No historical data');
      }
      
      const timestamps = result.timestamp;
      const quotes = result.indicators?.quote?.[0];
      
      if (!quotes) {
        throw new Error('No quote data');
      }
      
      const data: StockData[] = timestamps.map((ts: number, i: number) => {
        const date = new Date(ts * 1000);
        const timeStr = days <= 7 
          ? date.toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        
        return {
          time: timeStr,
          open: Math.round(quotes.open?.[i] || 0),
          high: Math.round(quotes.high?.[i] || 0),
          low: Math.round(quotes.low?.[i] || 0),
          close: Math.round(quotes.close?.[i] || 0),
          volume: quotes.volume?.[i] || 0,
        };
      }).filter((d: StockData) => d.close > 0);
      
      if (data.length > 0) {
        cache.set(cacheKey, { data, timestamp: Date.now() });
        console.log(`✓ Historical data loaded for ${symbol} from proxy ${proxyIndex + 1}`);
        return data;
      }
    } catch (error) {
      console.warn(`Proxy ${proxyIndex + 1} failed for historical ${symbol}:`, (error as Error).message);
    }
  }
  
  console.warn(`Failed to fetch historical data for ${symbol}, generating mock data...`);
  return generateMockHistoricalData(symbol, days);
};

/**
 * Generate mock historical data as fallback
 */
const generateMockHistoricalData = (symbol: string, days: number): StockData[] => {
  const data: StockData[] = [];
  const basePrice = FALLBACK_PRICES[symbol]?.price || 5000;
  let price = basePrice * 0.9; // Start 10% lower
  const now = new Date();
  
  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const volatility = price * 0.025;
    const trend = (basePrice - price) / basePrice * 0.1; // Trend toward current price
    const change = (Math.random() - 0.5 + trend) * volatility;
    
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 50000000) + 10000000;

    data.push({
      time: date.toLocaleDateString('id-ID'),
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume
    });

    price = close;
  }
  
  return data;
};

/**
 * Fetch all watchlist stocks at once
 */
export const fetchWatchlistData = async (symbols: string[]): Promise<StockTicker[]> => {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const data = await fetchStockPrice(symbol);
        return {
          symbol,
          name: COMPANY_NAMES[symbol] || symbol,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          sector: SECTOR_MAP[symbol] || 'Other',
          high: data.high,
          low: data.low,
          volume: data.volume,
          lastUpdate: data.lastUpdate,
        };
      } catch (error) {
        // Return fallback data
        const fallback = FALLBACK_PRICES[symbol] || { price: 0, change: 0 };
        return {
          symbol,
          name: COMPANY_NAMES[symbol] || symbol,
          price: fallback.price,
          change: Math.round(fallback.price * fallback.change / 100),
          changePercent: fallback.change,
          sector: SECTOR_MAP[symbol] || 'Other',
        };
      }
    })
  );
  
  return results;
};

/**
 * Get trending stocks
 */
export const fetchTrendingStocks = async (): Promise<string[]> => {
  // Most active IDX stocks
  return ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI', 'ANTM', 'UNVR'];
};

/**
 * Search stocks by name or symbol
 */
export const searchStocks = async (query: string): Promise<StockTicker[]> => {
  const upperQuery = query.toUpperCase();
  const allSymbols = Object.keys(COMPANY_NAMES);
  
  const matches = allSymbols.filter(symbol => 
    symbol.includes(upperQuery) || 
    COMPANY_NAMES[symbol].toUpperCase().includes(upperQuery)
  );
  
  return fetchWatchlistData(matches.slice(0, 10));
};

/**
 * Clear cache (useful for forcing refresh)
 */
export const clearCache = () => {
  cache.clear();
};

/**
 * Get real-time price updates (polling with faster refresh)
 */
export const subscribeToPrice = (
  symbol: string, 
  callback: (data: { price: number; change: number; changePercent: number }) => void,
  interval: number = 15000 // 15 seconds default
): (() => void) => {
  let isActive = true;
  let timeoutId: NodeJS.Timeout;
  
  const fetchUpdate = async () => {
    if (!isActive) return;
    
    try {
      // Clear cache to force fresh data
      const cacheKey = `price_${symbol}_IDX`;
      cache.delete(cacheKey);
      
      const data = await fetchStockPrice(symbol);
      if (isActive) {
        callback({
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
        });
      }
    } catch (error) {
      console.error('Price update failed:', error);
    }
    
    // Schedule next update
    if (isActive) {
      timeoutId = setTimeout(fetchUpdate, interval);
    }
  };
  
  // Initial fetch
  fetchUpdate();
  
  // Return unsubscribe function
  return () => {
    isActive = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};

export default {
  fetchStockPrice,
  fetchHistoricalData,
  fetchWatchlistData,
  fetchTrendingStocks,
  searchStocks,
  clearCache,
  subscribeToPrice,
};
