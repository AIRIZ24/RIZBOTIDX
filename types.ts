export interface StockData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector: string;
  market?: 'IDX' | 'US' | 'CRYPTO';
  high?: number;
  low?: number;
  open?: number;
  volume?: number;
  lastUpdate?: string;
  isLoading?: boolean;
}

export type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y';

export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  ANALYSIS = 'ANALYSIS',
  LIVE_ASSISTANT = 'LIVE_ASSISTANT',
  MAPS_LOCATOR = 'MAPS_LOCATOR',
  NEWS = 'NEWS',
  PORTFOLIO = 'PORTFOLIO',
}

export interface PredictionResult {
  forecast: string;
  confidence: number;
  targetPrice: number;
  reasoning: string;
}

export type SentimentType = 'bullish' | 'bearish' | 'neutral';

export interface MarketSummary {
  ihsg: number;
  ihsgChange: number;
  ihsgChangePercent: number;
  totalVolume: number;
  totalValue: number;
  topGainers: StockTicker[];
  topLosers: StockTicker[];
  mostActive: StockTicker[];
}

// Gemini Types extensions for window
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    webkitAudioContext: typeof AudioContext;
    aistudio?: AIStudio;
  }
}