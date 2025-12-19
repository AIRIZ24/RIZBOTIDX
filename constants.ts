import { StockTicker, StockData } from './types';

// Default watchlist symbols
export const DEFAULT_WATCHLIST = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'GOTO'];

// Initial empty tickers (will be populated by API)
export const MOCK_TICKERS: StockTicker[] = [
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk', price: 0, change: 0, changePercent: 0, sector: 'Banking', isLoading: true },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia', price: 0, change: 0, changePercent: 0, sector: 'Banking', isLoading: true },
  { symbol: 'BMRI', name: 'Bank Mandiri', price: 0, change: 0, changePercent: 0, sector: 'Banking', isLoading: true },
  { symbol: 'TLKM', name: 'Telkom Indonesia', price: 0, change: 0, changePercent: 0, sector: 'Telco', isLoading: true },
  { symbol: 'ASII', name: 'Astra International', price: 0, change: 0, changePercent: 0, sector: 'Automotive', isLoading: true },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', price: 0, change: 0, changePercent: 0, sector: 'Tech', isLoading: true },
];

export const generateMockData = (days: number): StockData[] => {
  const data: StockData[] = [];
  let price = 5000;
  const now = new Date();
  
  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = price * 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    data.push({
      time: date.toLocaleDateString('id-ID'),
      open: parseFloat(open.toFixed(0)),
      high: parseFloat(high.toFixed(0)),
      low: parseFloat(low.toFixed(0)),
      close: parseFloat(close.toFixed(0)),
      volume
    });

    price = close;
  }
  return data;
};

export const INITIAL_BBCA_DATA = generateMockData(100);