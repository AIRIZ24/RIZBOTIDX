import React, { useState, useCallback, useEffect } from 'react';
import { StockTicker, StockData } from '../types';

interface TradingRecommendationProps {
  ticker: StockTicker;
  chartData: StockData[];
}

interface TechnicalIndicators {
  rsi: number;
  rsiStatus: 'oversold' | 'neutral' | 'overbought';
  macd: { line: number; signal: number; histogram: number; trend: 'bullish' | 'bearish' };
  ema20: number;
  ema50: number;
  sma200: number;
  bollingerBands: { upper: number; middle: number; lower: number; position: 'above' | 'middle' | 'below' };
  atr: number;
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number;
}

interface TradingSignal {
  action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  score: number;
  reasons: string[];
}

interface TradeSetup {
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
  target3: number;
  riskRewardRatio: number;
  positionSize: number;
}

// Calculate RSI
const calculateRSI = (data: StockData[], period: number = 14): number => {
  if (data.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Calculate EMA
const calculateEMA = (data: StockData[], period: number): number => {
  if (data.length < period) return data[data.length - 1]?.close || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
  }
  
  return ema;
};

// Calculate SMA
const calculateSMA = (data: StockData[], period: number): number => {
  if (data.length < period) return data[data.length - 1]?.close || 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, d) => sum + d.close, 0) / period;
};

// Calculate MACD
const calculateMACD = (data: StockData[]): { line: number; signal: number; histogram: number; trend: 'bullish' | 'bearish' } => {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12 - ema26;
  
  // Simplified signal line calculation
  const signalLine = macdLine * 0.8; // Approximation
  const histogram = macdLine - signalLine;
  
  return {
    line: macdLine,
    signal: signalLine,
    histogram,
    trend: histogram > 0 ? 'bullish' : 'bearish'
  };
};

// Calculate Bollinger Bands
const calculateBollingerBands = (data: StockData[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number; position: 'above' | 'middle' | 'below' } => {
  if (data.length < period) {
    const price = data[data.length - 1]?.close || 0;
    return { upper: price, middle: price, lower: price, position: 'middle' };
  }
  
  const slice = data.slice(-period);
  const sma = slice.reduce((sum, d) => sum + d.close, 0) / period;
  const variance = slice.reduce((sum, d) => sum + Math.pow(d.close - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  const upper = sma + (std * stdDev);
  const lower = sma - (std * stdDev);
  const currentPrice = data[data.length - 1].close;
  
  let position: 'above' | 'middle' | 'below' = 'middle';
  if (currentPrice > upper) position = 'above';
  else if (currentPrice < lower) position = 'below';
  
  return { upper, middle: sma, lower, position };
};

// Calculate ATR
const calculateATR = (data: StockData[], period: number = 14): number => {
  if (data.length < period + 1) return 0;
  
  let atrSum = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    atrSum += tr;
  }
  
  return atrSum / period;
};

// Analyze volume trend
const analyzeVolumeTrend = (data: StockData[]): 'increasing' | 'decreasing' | 'stable' => {
  if (data.length < 10) return 'stable';
  
  const recent = data.slice(-5).reduce((sum, d) => sum + d.volume, 0) / 5;
  const previous = data.slice(-10, -5).reduce((sum, d) => sum + d.volume, 0) / 5;
  
  const change = (recent - previous) / previous;
  if (change > 0.2) return 'increasing';
  if (change < -0.2) return 'decreasing';
  return 'stable';
};

// Calculate trend strength (0-100)
const calculateTrendStrength = (data: StockData[]): number => {
  if (data.length < 20) return 50;
  
  const ema20 = calculateEMA(data, 20);
  const ema50 = calculateEMA(data, 50);
  const currentPrice = data[data.length - 1].close;
  
  let strength = 50;
  
  // Price above both EMAs = bullish
  if (currentPrice > ema20 && currentPrice > ema50) {
    strength += 25;
  } else if (currentPrice < ema20 && currentPrice < ema50) {
    strength -= 25;
  }
  
  // EMA20 above EMA50 = bullish trend
  if (ema20 > ema50) {
    strength += 15;
  } else {
    strength -= 15;
  }
  
  // Recent momentum
  const change5d = (currentPrice - data[data.length - 5]?.close || currentPrice) / (data[data.length - 5]?.close || currentPrice) * 100;
  strength += Math.min(10, Math.max(-10, change5d * 2));
  
  return Math.min(100, Math.max(0, strength));
};

// Generate trading signal
const generateSignal = (indicators: TechnicalIndicators, ticker: StockTicker): TradingSignal => {
  let score = 0;
  const reasons: string[] = [];
  
  // RSI Analysis (weight: 20)
  if (indicators.rsi < 30) {
    score += 20;
    reasons.push(`RSI ${indicators.rsi.toFixed(1)} menunjukkan OVERSOLD - peluang rebound`);
  } else if (indicators.rsi > 70) {
    score -= 20;
    reasons.push(`RSI ${indicators.rsi.toFixed(1)} menunjukkan OVERBOUGHT - waspada koreksi`);
  } else if (indicators.rsi < 45) {
    score += 10;
    reasons.push(`RSI ${indicators.rsi.toFixed(1)} di zona netral-bawah`);
  } else if (indicators.rsi > 55) {
    score -= 5;
    reasons.push(`RSI ${indicators.rsi.toFixed(1)} di zona netral-atas`);
  }
  
  // MACD Analysis (weight: 25)
  if (indicators.macd.trend === 'bullish') {
    score += 20;
    if (indicators.macd.histogram > 0) {
      score += 5;
      reasons.push('MACD histogram positif & menguat - momentum bullish');
    }
  } else {
    score -= 20;
    reasons.push('MACD histogram negatif - momentum bearish');
  }
  
  // EMA Analysis (weight: 25)
  const price = ticker.price;
  if (price > indicators.ema20 && price > indicators.ema50) {
    score += 20;
    reasons.push(`Harga di atas EMA20 (${indicators.ema20.toFixed(0)}) & EMA50 (${indicators.ema50.toFixed(0)}) - uptrend`);
  } else if (price < indicators.ema20 && price < indicators.ema50) {
    score -= 20;
    reasons.push(`Harga di bawah EMA20 & EMA50 - downtrend`);
  } else if (price > indicators.ema20) {
    score += 10;
    reasons.push('Harga di atas EMA20 - short-term bullish');
  }
  
  // Golden/Death Cross
  if (indicators.ema20 > indicators.ema50) {
    score += 5;
    reasons.push('Golden Cross aktif (EMA20 > EMA50)');
  } else {
    score -= 5;
    reasons.push('Death Cross aktif (EMA20 < EMA50)');
  }
  
  // Bollinger Bands (weight: 15)
  if (indicators.bollingerBands.position === 'below') {
    score += 15;
    reasons.push('Harga di bawah Lower BB - oversold, potensi rebound');
  } else if (indicators.bollingerBands.position === 'above') {
    score -= 10;
    reasons.push('Harga di atas Upper BB - overbought');
  }
  
  // Volume Analysis (weight: 10)
  if (indicators.volumeTrend === 'increasing') {
    const volumeImpact = score > 0 ? 10 : -5;
    score += volumeImpact;
    reasons.push(score > 0 ? 'Volume meningkat mendukung uptrend' : 'Volume meningkat saat downtrend - tekanan jual');
  }
  
  // Trend Strength (weight: 5)
  if (indicators.trendStrength > 60) {
    score += 5;
  } else if (indicators.trendStrength < 40) {
    score -= 5;
  }
  
  // Determine action
  let action: TradingSignal['action'];
  if (score >= 50) action = 'STRONG_BUY';
  else if (score >= 20) action = 'BUY';
  else if (score >= -20) action = 'HOLD';
  else if (score >= -50) action = 'SELL';
  else action = 'STRONG_SELL';
  
  const confidence = Math.min(95, Math.max(30, 50 + Math.abs(score)));
  
  return { action, confidence, score, reasons };
};

// Calculate trade setup
const calculateTradeSetup = (ticker: StockTicker, indicators: TechnicalIndicators, signal: TradingSignal): TradeSetup => {
  const price = ticker.price;
  const atr = indicators.atr || price * 0.02;
  
  let entryLow: number, entryHigh: number, stopLoss: number;
  let target1: number, target2: number, target3: number;
  
  if (signal.action === 'STRONG_BUY' || signal.action === 'BUY') {
    // Buy setup
    entryLow = Math.round(price * 0.98);
    entryHigh = Math.round(price * 1.01);
    stopLoss = Math.round(price - (atr * 2));
    target1 = Math.round(price + (atr * 2));
    target2 = Math.round(price + (atr * 3));
    target3 = Math.round(price + (atr * 5));
  } else if (signal.action === 'STRONG_SELL' || signal.action === 'SELL') {
    // Sell/Short setup
    entryLow = Math.round(price * 0.99);
    entryHigh = Math.round(price * 1.02);
    stopLoss = Math.round(price + (atr * 2));
    target1 = Math.round(price - (atr * 2));
    target2 = Math.round(price - (atr * 3));
    target3 = Math.round(price - (atr * 5));
  } else {
    // Hold - no trade setup
    entryLow = price;
    entryHigh = price;
    stopLoss = Math.round(price - (atr * 1.5));
    target1 = Math.round(price + (atr * 1.5));
    target2 = Math.round(price + (atr * 2));
    target3 = Math.round(price + (atr * 3));
  }
  
  const risk = Math.abs(price - stopLoss);
  const reward = Math.abs(target1 - price);
  const riskRewardRatio = risk > 0 ? reward / risk : 0;
  
  // Position size calculation (assuming 2% risk per trade, 10M portfolio)
  const portfolioSize = 10000000; // 10 juta rupiah
  const riskPerTrade = portfolioSize * 0.02; // 2% risk
  const positionSize = risk > 0 ? Math.floor(riskPerTrade / risk) : 0;
  
  return {
    entryLow,
    entryHigh,
    stopLoss,
    target1,
    target2,
    target3,
    riskRewardRatio,
    positionSize
  };
};

const TradingRecommendation: React.FC<TradingRecommendationProps> = ({ ticker, chartData }) => {
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [tradeSetup, setTradeSetup] = useState<TradeSetup | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate indicators when data changes
  useEffect(() => {
    if (chartData.length < 20) return;
    
    setIsCalculating(true);
    
    // Simulate calculation delay for UX
    setTimeout(() => {
      const rsi = calculateRSI(chartData);
      const macd = calculateMACD(chartData);
      const ema20 = calculateEMA(chartData, 20);
      const ema50 = calculateEMA(chartData, 50);
      const sma200 = calculateSMA(chartData, 200);
      const bb = calculateBollingerBands(chartData);
      const atr = calculateATR(chartData);
      const volumeTrend = analyzeVolumeTrend(chartData);
      const trendStrength = calculateTrendStrength(chartData);
      
      const newIndicators: TechnicalIndicators = {
        rsi,
        rsiStatus: rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral',
        macd,
        ema20,
        ema50,
        sma200,
        bollingerBands: bb,
        atr,
        volumeTrend,
        trendStrength
      };
      
      setIndicators(newIndicators);
      
      const newSignal = generateSignal(newIndicators, ticker);
      setSignal(newSignal);
      
      const newSetup = calculateTradeSetup(ticker, newIndicators, newSignal);
      setTradeSetup(newSetup);
      
      setIsCalculating(false);
    }, 500);
  }, [chartData, ticker]);

  const getActionColor = (action: TradingSignal['action']) => {
    switch (action) {
      case 'STRONG_BUY': return 'from-emerald-500 to-green-600';
      case 'BUY': return 'from-emerald-400 to-teal-500';
      case 'HOLD': return 'from-yellow-500 to-amber-500';
      case 'SELL': return 'from-orange-500 to-red-500';
      case 'STRONG_SELL': return 'from-red-500 to-rose-600';
    }
  };

  const getActionIcon = (action: TradingSignal['action']) => {
    switch (action) {
      case 'STRONG_BUY': return '🚀';
      case 'BUY': return '📈';
      case 'HOLD': return '⏸️';
      case 'SELL': return '📉';
      case 'STRONG_SELL': return '🔻';
    }
  };

  const getActionText = (action: TradingSignal['action']) => {
    switch (action) {
      case 'STRONG_BUY': return 'STRONG BUY';
      case 'BUY': return 'BUY';
      case 'HOLD': return 'HOLD';
      case 'SELL': return 'SELL';
      case 'STRONG_SELL': return 'STRONG SELL';
    }
  };

  if (!indicators || !signal || !tradeSetup) {
    return (
      <div className="bg-[#141c2f] rounded-2xl p-6 border border-slate-800/60 shadow-xl">
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center animate-pulse">
              <span className="material-icons-round text-blue-400 text-2xl">analytics</span>
            </div>
            <p className="text-slate-500 text-sm">
              {isCalculating ? 'Menganalisis data...' : 'Memuat indikator teknikal...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141c2f] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
      {/* Header with Signal */}
      <div className={`bg-gradient-to-r ${getActionColor(signal.action)} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getActionIcon(signal.action)}</span>
            <div>
              <h3 className="text-white font-bold text-xl">{getActionText(signal.action)}</h3>
              <p className="text-white/80 text-sm">{ticker.symbol} - Rekomendasi Trading</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/90 text-sm">Confidence</div>
            <div className="text-white font-bold text-2xl">{signal.confidence.toFixed(0)}%</div>
          </div>
        </div>
        
        {/* Confidence Bar */}
        <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-800/30 rounded-xl p-3 text-center">
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">RSI</div>
            <div className={`font-bold font-mono ${
              indicators.rsiStatus === 'oversold' ? 'text-emerald-400' : 
              indicators.rsiStatus === 'overbought' ? 'text-red-400' : 'text-slate-300'
            }`}>
              {indicators.rsi.toFixed(1)}
            </div>
            <div className={`text-[9px] mt-0.5 ${
              indicators.rsiStatus === 'oversold' ? 'text-emerald-500' : 
              indicators.rsiStatus === 'overbought' ? 'text-red-500' : 'text-slate-500'
            }`}>
              {indicators.rsiStatus === 'oversold' ? 'OVERSOLD' : 
               indicators.rsiStatus === 'overbought' ? 'OVERBOUGHT' : 'NEUTRAL'}
            </div>
          </div>
          
          <div className="bg-slate-800/30 rounded-xl p-3 text-center">
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">MACD</div>
            <div className={`font-bold font-mono ${
              indicators.macd.trend === 'bullish' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {indicators.macd.histogram > 0 ? '+' : ''}{indicators.macd.histogram.toFixed(0)}
            </div>
            <div className={`text-[9px] mt-0.5 ${
              indicators.macd.trend === 'bullish' ? 'text-emerald-500' : 'text-red-500'
            }`}>
              {indicators.macd.trend === 'bullish' ? 'BULLISH' : 'BEARISH'}
            </div>
          </div>
          
          <div className="bg-slate-800/30 rounded-xl p-3 text-center">
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Trend</div>
            <div className="font-bold font-mono text-blue-400">
              {indicators.trendStrength.toFixed(0)}%
            </div>
            <div className={`text-[9px] mt-0.5 ${
              indicators.trendStrength > 60 ? 'text-emerald-500' : 
              indicators.trendStrength < 40 ? 'text-red-500' : 'text-yellow-500'
            }`}>
              {indicators.trendStrength > 60 ? 'STRONG' : 
               indicators.trendStrength < 40 ? 'WEAK' : 'MODERATE'}
            </div>
          </div>
          
          <div className="bg-slate-800/30 rounded-xl p-3 text-center">
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Volume</div>
            <div className={`font-bold text-sm ${
              indicators.volumeTrend === 'increasing' ? 'text-emerald-400' : 
              indicators.volumeTrend === 'decreasing' ? 'text-red-400' : 'text-slate-300'
            }`}>
              {indicators.volumeTrend === 'increasing' ? '↑' : 
               indicators.volumeTrend === 'decreasing' ? '↓' : '→'}
            </div>
            <div className="text-[9px] mt-0.5 text-slate-500">
              {indicators.volumeTrend === 'increasing' ? 'RISING' : 
               indicators.volumeTrend === 'decreasing' ? 'FALLING' : 'STABLE'}
            </div>
          </div>
        </div>
      </div>

      {/* Trade Setup */}
      <div className="p-4 border-b border-slate-800/50">
        <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
          <span className="material-icons-round text-base">swap_vert</span>
          Trade Setup
        </h4>
        
        <div className="space-y-2">
          {/* Entry Zone */}
          <div className="flex items-center justify-between bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-blue-400 text-sm font-medium">Entry Zone</span>
            </div>
            <span className="text-white font-mono font-bold">
              Rp {tradeSetup.entryLow.toLocaleString('id-ID')} - {tradeSetup.entryHigh.toLocaleString('id-ID')}
            </span>
          </div>
          
          {/* Targets */}
          <div className="flex items-center justify-between bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400 text-sm font-medium">Target 1</span>
            </div>
            <span className="text-white font-mono font-bold">
              Rp {tradeSetup.target1.toLocaleString('id-ID')}
              <span className="text-emerald-400 text-xs ml-2">
                (+{((tradeSetup.target1 - ticker.price) / ticker.price * 100).toFixed(1)}%)
              </span>
            </span>
          </div>
          
          <div className="flex items-center justify-between bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-400 text-sm font-medium">Target 2</span>
            </div>
            <span className="text-white font-mono font-bold">
              Rp {tradeSetup.target2.toLocaleString('id-ID')}
              <span className="text-emerald-400 text-xs ml-2">
                (+{((tradeSetup.target2 - ticker.price) / ticker.price * 100).toFixed(1)}%)
              </span>
            </span>
          </div>
          
          {/* Stop Loss */}
          <div className="flex items-center justify-between bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="text-red-400 text-sm font-medium">Stop Loss</span>
            </div>
            <span className="text-white font-mono font-bold">
              Rp {tradeSetup.stopLoss.toLocaleString('id-ID')}
              <span className="text-red-400 text-xs ml-2">
                ({((tradeSetup.stopLoss - ticker.price) / ticker.price * 100).toFixed(1)}%)
              </span>
            </span>
          </div>
        </div>
        
        {/* Risk/Reward */}
        <div className="mt-3 flex items-center justify-between px-3 py-2 bg-slate-800/30 rounded-lg">
          <span className="text-slate-400 text-sm">Risk/Reward Ratio</span>
          <span className={`font-bold font-mono ${
            tradeSetup.riskRewardRatio >= 2 ? 'text-emerald-400' : 
            tradeSetup.riskRewardRatio >= 1 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            1 : {tradeSetup.riskRewardRatio.toFixed(2)}
          </span>
        </div>
        
        {/* Position Size */}
        <div className="mt-2 flex items-center justify-between px-3 py-2 bg-slate-800/30 rounded-lg">
          <span className="text-slate-400 text-sm">Lot Rekomendasi (2% Risk)</span>
          <span className="text-white font-bold font-mono">
            {tradeSetup.positionSize.toLocaleString('id-ID')} lot
          </span>
        </div>
      </div>

      {/* Analysis Reasons */}
      <div className="p-4">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="material-icons-round text-base">psychology</span>
            Analisis Detail ({signal.reasons.length} faktor)
          </span>
          <span className="material-icons-round text-base transition-transform" style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </button>
        
        {showDetails && (
          <div className="mt-3 space-y-2">
            {signal.reasons.map((reason, i) => (
              <div 
                key={i}
                className="flex items-start gap-2 text-sm text-slate-300 bg-slate-800/20 rounded-lg p-2"
              >
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="px-4 pb-4">
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <p className="text-[10px] text-amber-400/80 leading-relaxed">
            ⚠️ <strong>DISCLAIMER:</strong> Rekomendasi ini berdasarkan analisis teknikal dan BUKAN merupakan nasihat investasi. 
            Selalu lakukan riset mandiri dan sesuaikan dengan profil risiko Anda. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TradingRecommendation;
