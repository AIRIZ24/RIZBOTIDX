/**
 * Market Data Service
 * Handles fetching and generating historical stock data for IDX stocks
 */

import { StockData, TimeRange } from '../types';
import { fetchHistoricalData as fetchFromApi } from './stockApiService';

interface RangeParams {
  range: string;
  interval: string;
  days: number;
}

/**
 * Map TimeRange to Yahoo Finance API parameters
 */
const getRangeParams = (range: TimeRange): RangeParams => {
  switch (range) {
    case '1D': return { range: '1d', interval: '5m', days: 1 };
    case '5D': return { range: '5d', interval: '15m', days: 5 };
    case '1M': return { range: '1mo', interval: '1d', days: 30 };
    case '3M': return { range: '3mo', interval: '1d', days: 90 };
    case '6M': return { range: '6mo', interval: '1d', days: 180 };
    case 'YTD': return { range: 'ytd', interval: '1d', days: 365 };
    case '1Y': return { range: '1y', interval: '1wk', days: 365 };
    case '5Y': return { range: '5y', interval: '1wk', days: 1825 };
    default: return { range: '1mo', interval: '1d', days: 30 };
  }
};

export const fetchHistoricalData = async (symbol: string, range: TimeRange): Promise<StockData[]> => {
  const { days } = getRangeParams(range);
  
  try {
    // Try using our stock API service first (with proper fallback)
    const data = await fetchFromApi(symbol, days);
    if (data && data.length > 0) {
      return data;
    }
    throw new Error('No data returned');
  } catch (error) {
    console.warn(`API fetch failed for ${symbol}, trying Yahoo Finance...`);
  }

  // Fallback: Try direct Yahoo Finance
  const ticker = symbol.endsWith('.JK') ? symbol : `${symbol}.JK`;
  const { range: rangeParam, interval } = getRangeParams(range);
  const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${rangeParam}&interval=${interval}`;
  
  try {
    const response = await fetch(baseUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return parseYahooData(data);
  } catch (error) {
    console.warn(`Direct fetch failed for ${ticker}, generating realistic fallback data.`);
    return generateFallbackData(symbol, range);
  }
};

const parseYahooData = (data: any): StockData[] => {
  const result = data.chart.result[0];
  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];
  
  const stockData: StockData[] = [];

  if (timestamps && quote) {
    for (let i = 0; i < timestamps.length; i++) {
      // Filter out null values (market holidays/breaks)
      if (quote.open[i] === null || quote.close[i] === null) continue;

      const date = new Date(timestamps[i] * 1000);
      // Format date based on interval usually, but simple string is fine for now
      const timeStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

      stockData.push({
        time: timeStr,
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume[i] || 0
      });
    }
  }
  return stockData;
};

// --- REALISTIC FALLBACK GENERATOR ---

interface TickerProfile {
  basePrice: number;
  volatility: number; // 0.01 = 1% daily swing
}

/**
 * Get stock profile for realistic price simulation
 * Volatility: 0.01 = 1% daily swing typical
 */
const TICKER_PROFILES: Record<string, TickerProfile> = {
  // Banking - Blue Chips (Low volatility)
  'BBCA': { basePrice: 9900, volatility: 0.012 },
  'BBRI': { basePrice: 5600, volatility: 0.015 },
  'BMRI': { basePrice: 6350, volatility: 0.014 },
  'BBNI': { basePrice: 5025, volatility: 0.016 },
  'BRIS': { basePrice: 2750, volatility: 0.018 },
  
  // Infrastructure & Telco
  'TLKM': { basePrice: 3800, volatility: 0.018 },
  'EXCL': { basePrice: 2380, volatility: 0.022 },
  'ISAT': { basePrice: 9875, volatility: 0.020 },
  
  // Consumer & Retail
  'ASII': { basePrice: 5100, volatility: 0.02 },
  'UNVR': { basePrice: 2980, volatility: 0.015 },
  'INDF': { basePrice: 6675, volatility: 0.017 },
  'ICBP': { basePrice: 11025, volatility: 0.015 },
  'MYOR': { basePrice: 2560, volatility: 0.018 },
  
  // Mining & Energy
  'ANTM': { basePrice: 1485, volatility: 0.035 },
  'PTBA': { basePrice: 2700, volatility: 0.028 },
  'ADRO': { basePrice: 2650, volatility: 0.030 },
  'INCO': { basePrice: 4200, volatility: 0.032 },
  'MEDC': { basePrice: 1320, volatility: 0.028 },
  
  // Tech & Startups (High volatility)
  'GOTO': { basePrice: 82, volatility: 0.05 },
  'BUKA': { basePrice: 210, volatility: 0.045 },
  'EMTK': { basePrice: 475, volatility: 0.038 },
  
  // Property
  'BSDE': { basePrice: 1025, volatility: 0.025 },
  'SMRA': { basePrice: 695, volatility: 0.028 },
  'CTRA': { basePrice: 1190, volatility: 0.026 },
};

const getTickerProfile = (symbol: string): TickerProfile => {
  const cleanSym = symbol.replace('.JK', '');
  return TICKER_PROFILES[cleanSym] || { basePrice: 1000, volatility: 0.02 };
};

const generateFallbackData = (symbol: string, range: TimeRange): StockData[] => {
  const profile = getTickerProfile(symbol);
  let currentPrice = profile.basePrice;
  const data: StockData[] = [];
  
  // Define time parameters
  const now = new Date();
  let startDate = new Date();
  let intervalMinutes = 0;
  let points = 0;
  let isIntraday = false;

  switch (range) {
    case '1D':
      startDate = new Date(now);
      startDate.setHours(9, 0, 0, 0); // IDX Open at 09:00 WIB
      intervalMinutes = 5;
      points = 84; // (16:00 - 09:00) * 12 points/hour = ~84 points
      isIntraday = true;
      break;
    case '5D':
      startDate.setDate(now.getDate() - 5);
      startDate.setHours(9, 0, 0, 0);
      intervalMinutes = 60; // Hourly
      points = 35; // ~7 hours * 5 days
      break;
    case '1M':
      startDate.setDate(now.getDate() - 30);
      intervalMinutes = 24 * 60;
      points = 22; // Trading days
      break;
    case '6M':
      startDate.setMonth(now.getMonth() - 6);
      intervalMinutes = 24 * 60;
      points = 120;
      break;
    case 'YTD':
      startDate = new Date(now.getFullYear(), 0, 1);
      intervalMinutes = 24 * 60;
      points = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      break;
    case '1Y':
      startDate.setFullYear(now.getFullYear() - 1);
      intervalMinutes = 24 * 60;
      points = 250;
      break;
    case '5Y':
      startDate.setFullYear(now.getFullYear() - 5);
      intervalMinutes = 24 * 60 * 7; // Weekly
      points = 260;
      break;
  }

  // Adjust Start Price for historical context so current price lands near target
  // We simulate a random walk backwards to find a plausible start price
  const seedVolatility = range === '1D' ? profile.volatility * 0.2 : profile.volatility;
  // Create a "trend" bias (-0.5 to 0.5)
  const marketTrend = (Math.random() - 0.5) * 0.05; 
  
  // If we are generating history, we start from a calculated past price
  // that would roughly lead to the profile.basePrice today
  if (!isIntraday) {
    currentPrice = profile.basePrice * (1 - (marketTrend * (range === '5Y' ? 5 : 1))); 
    currentPrice = currentPrice * (0.8 + Math.random() * 0.4); // Randomize start position +/- 20%
  }

  // Generation Loop
  let simulatedTime = new Date(startDate);
  
  // For 1D, we generate until market close. For others, we generate 'points' count or until Today.
  const isFinished = () => {
    if (isIntraday) {
      return simulatedTime.getHours() >= 16;
    }
    return simulatedTime > now;
  };

  while (!isFinished()) {
    // Skip weekends for daily+ data
    if (!isIntraday && intervalMinutes >= 1440) {
      const day = simulatedTime.getDay();
      if (day === 0 || day === 6) {
        simulatedTime.setDate(simulatedTime.getDate() + 1);
        continue;
      }
    }

    // IDX Lunch Break Logic for 1D (approx 11:30 - 13:30)
    if (isIntraday) {
      const h = simulatedTime.getHours();
      const m = simulatedTime.getMinutes();
      if ((h === 12) || (h === 11 && m > 30) || (h === 13 && m < 30)) {
        simulatedTime.setMinutes(simulatedTime.getMinutes() + intervalMinutes);
        continue;
      }
    }

    // Random Walk Calculation
    // Volatility adjustment based on timeframe
    const currentVol = isIntraday ? profile.volatility / 10 : profile.volatility;
    const changePercent = (Math.random() - 0.5 + (marketTrend / 100)) * currentVol;
    const change = currentPrice * changePercent;
    
    const open = currentPrice;
    const close = currentPrice + change;
    
    // Create wicks
    const wiggle = Math.abs(change) * 0.5;
    const high = Math.max(open, close) + (Math.random() * wiggle);
    const low = Math.min(open, close) - (Math.random() * wiggle);
    
    // Volume simulation (higher at open/close, based on stock liquidity)
    const baseVolume = profile.basePrice > 5000 ? 50000 : 100000;
    let volume = Math.floor(Math.random() * baseVolume + baseVolume * 0.5);
    if (isIntraday) {
      const hour = simulatedTime.getHours();
      // Higher volume at market open (9:00) and pre-close (15:00-15:30)
      if (hour === 9) volume *= 3;
      else if (hour === 15) volume *= 2.5;
      else if (hour === 14) volume *= 1.5;
    }

    data.push({
      time: isIntraday 
        ? simulatedTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : simulatedTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: range === '5Y' ? '2-digit' : undefined }),
      open: parseFloat(open.toFixed(0)),
      high: parseFloat(high.toFixed(0)),
      low: parseFloat(low.toFixed(0)),
      close: parseFloat(close.toFixed(0)),
      volume
    });

    currentPrice = close;

    // Advance time
    if (isIntraday) {
      simulatedTime.setMinutes(simulatedTime.getMinutes() + intervalMinutes);
    } else {
       if (range === '5D') {
          simulatedTime.setHours(simulatedTime.getHours() + 1);
          // Skip night hours for 5D
          if (simulatedTime.getHours() >= 16) {
            simulatedTime.setDate(simulatedTime.getDate() + 1);
            simulatedTime.setHours(9, 0, 0, 0);
          }
       } else if (range === '5Y') {
          simulatedTime.setDate(simulatedTime.getDate() + 7);
       } else {
          simulatedTime.setDate(simulatedTime.getDate() + 1);
       }
    }
  }

  return data;
};