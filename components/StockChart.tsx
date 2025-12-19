import React, { useMemo, useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  Brush,
  Scatter,
  ReferenceLine,
  LineChart,
} from 'recharts';
import { StockData, TimeRange } from '../types';

interface StockChartProps {
  data: StockData[];
  symbol: string;
  timeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  loading?: boolean;
}

const RANGES: TimeRange[] = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y'];

const COLORS = {
  Blue: '#38bdf8',    // sky-400
  Emerald: '#34d399', // emerald-400
  Purple: '#a78bfa',  // violet-400
  Amber: '#fbbf24',   // amber-400
  Bullish: '#22c55e', // green-500
  Bearish: '#ef4444', // red-500
  Grid: '#1e293b',    // slate-800
  Text: '#64748b',    // slate-500
  SignalBuy: '#00ff00',
  SignalSell: '#ff0000',
};

// --- Custom Shapes ---

const CandleShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  
  const isBullish = close >= open;
  const color = isBullish ? COLORS.Bullish : COLORS.Bearish;
  
  const range = high - low;
  if (range <= 0 || width <= 0) return null;

  const yOpen = y + (height * (high - open) / range);
  const yClose = y + (height * (high - close) / range);
  
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
  
  const cx = x + width / 2;
  const bodyWidth = Math.max(1, width * 0.65);
  const bodyX = cx - bodyWidth / 2;

  return (
    <g className="recharts-layer recharts-candlestick">
      <line 
        x1={cx} 
        y1={y} 
        x2={cx} 
        y2={y + height} 
        stroke={color} 
        strokeWidth={1.5} 
        opacity={1} 
      />
      <rect 
        x={bodyX} 
        y={bodyTop} 
        width={bodyWidth} 
        height={bodyHeight} 
        fill={color}
        rx={1}
      />
    </g>
  );
};

// Custom Signal Markers
const BuySignalMarker = (props: any) => {
  const { cx, cy } = props;
  return (
    <g transform={`translate(${cx},${cy + 15})`}>
      <circle r={10} fill="#22c55e" fillOpacity={0.2} />
      <path d="M0 -6 L-5 4 L5 4 Z" fill="#22c55e" stroke="#064e3b" strokeWidth={1} />
    </g>
  );
};

const SellSignalMarker = (props: any) => {
  const { cx, cy } = props;
  return (
    <g transform={`translate(${cx},${cy - 15})`}>
      <circle r={10} fill="#ef4444" fillOpacity={0.2} />
      <path d="M0 6 L-5 -4 L5 -4 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth={1} />
    </g>
  );
};

// Reversal Engine Pro Markers
const ReversalBuyMarker = (props: any) => {
  const { cx, cy, payload } = props;
  const strength = payload?.reversalStrength || 0;
  const size = 12 + (strength / 100) * 6; // Size based on strength
  return (
    <g transform={`translate(${cx},${cy + 20})`}>
      <circle r={size} fill="#00ff88" fillOpacity={0.3} className="animate-pulse" />
      <circle r={size * 0.7} fill="#00ff88" fillOpacity={0.5} />
      <text x={0} y={4} textAnchor="middle" fill="#00ff88" fontSize={10} fontWeight="bold">↑</text>
      <text x={0} y={size + 12} textAnchor="middle" fill="#00ff88" fontSize={8} fontWeight="bold">REV</text>
    </g>
  );
};

const ReversalSellMarker = (props: any) => {
  const { cx, cy, payload } = props;
  const strength = payload?.reversalStrength || 0;
  const size = 12 + (strength / 100) * 6;
  return (
    <g transform={`translate(${cx},${cy - 20})`}>
      <circle r={size} fill="#ff4488" fillOpacity={0.3} className="animate-pulse" />
      <circle r={size * 0.7} fill="#ff4488" fillOpacity={0.5} />
      <text x={0} y={4} textAnchor="middle" fill="#ff4488" fontSize={10} fontWeight="bold">↓</text>
      <text x={0} y={-(size + 6)} textAnchor="middle" fill="#ff4488" fontSize={8} fontWeight="bold">REV</text>
    </g>
  );
};

// --- Custom Tooltip ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Find the main data payload (usually the first one, but check for stock data structure)
    const stockPayload = payload.find((p: any) => p.dataKey === 'close' || p.dataKey === 'priceRange')?.payload;
    
    if (!stockPayload) return null;

    const data = stockPayload;
    const isBullish = data.close >= data.open;
    const change = data.close - data.open;
    const changePercent = (change / data.open) * 100;

    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-50 min-w-[220px]">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
          <span className={`text-xs font-bold font-mono px-2 py-1 rounded-md ${isBullish ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </div>
        
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Open</span>
            <span className="text-slate-200">{data.open.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">High</span>
            <span className="text-emerald-400">{data.high.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Low</span>
            <span className="text-red-400">{data.low.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Close</span>
            <span className="text-slate-200 font-bold">{data.close.toLocaleString()}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-slate-500">Vol</span>
            <span className="text-amber-400 font-bold">{(data.volume / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K</span>
          </div>
          {data.rsi > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">RSI</span>
              <span className={`font-bold ${
                data.rsi >= 70 ? 'text-red-400' : data.rsi <= 30 ? 'text-emerald-400' : 'text-purple-400'
              }`}>
                {data.rsi.toFixed(1)}
                <span className="text-[9px] ml-1 opacity-70">
                  {data.rsi >= 70 ? '(OB)' : data.rsi <= 30 ? '(OS)' : ''}
                </span>
              </span>
            </div>
          )}
          {data.buySignal && (
            <div className="pt-2 mt-2 border-t border-slate-800 flex items-center gap-2 text-emerald-400 font-bold animate-pulse">
              <span className="material-icons text-sm">trending_up</span> BUY SIGNAL
            </div>
          )}
          {data.sellSignal && (
             <div className="pt-2 mt-2 border-t border-slate-800 flex items-center gap-2 text-red-400 font-bold animate-pulse">
               <span className="material-icons text-sm">trending_down</span> SELL SIGNAL
             </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// --- Helper Functions ---

const calculateEMA = (data: StockData[], period: number, key: keyof StockData = 'close'): number[] => {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  
  let ema = data[0][key] as number;
  emaArray.push(ema);

  for (let i = 1; i < data.length; i++) {
    const price = data[i][key] as number;
    ema = price * k + ema * (1 - k);
    emaArray.push(ema);
  }
  return emaArray;
};

const calculateRSI = (data: StockData[], period: number = 14): number[] => {
  const rsiArray: number[] = new Array(data.length).fill(0);
  
  let gains = 0;
  let losses = 0;

  // First period avg
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Subsequent periods
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsiArray[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsiArray[i] = 100 - (100 / (1 + rs));
    }
  }
  return rsiArray;
};

// MACD Calculation
const calculateMACD = (data: StockData[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  
  // MACD Line = EMA(12) - EMA(26)
  const macdLine: number[] = emaFast.map((fast, i) => fast - emaSlow[i]);
  
  // Signal Line = EMA(9) of MACD Line
  const signalLine: number[] = [];
  const k = 2 / (signalPeriod + 1);
  let signalEma = macdLine[0];
  signalLine.push(signalEma);
  
  for (let i = 1; i < macdLine.length; i++) {
    signalEma = macdLine[i] * k + signalEma * (1 - k);
    signalLine.push(signalEma);
  }
  
  // Histogram = MACD Line - Signal Line
  const histogram: number[] = macdLine.map((macd, i) => macd - signalLine[i]);
  
  return { macdLine, signalLine, histogram };
};

// Volume Analysis
const calculateVolumeAnalysis = (data: StockData[], period: number = 20) => {
  const volumeMA: number[] = [];
  const volumeRatio: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      volumeMA.push(data[i].volume);
      volumeRatio.push(1);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const avgVolume = slice.reduce((sum, d) => sum + d.volume, 0) / period;
      volumeMA.push(avgVolume);
      volumeRatio.push(data[i].volume / avgVolume);
    }
  }
  
  return { volumeMA, volumeRatio };
};

// Reversal Engine Pro - Combines MACD + RSI + Volume
interface ReversalSignal {
  type: 'bullish' | 'bearish' | null;
  strength: number; // 0-100
  reasons: string[];
}

const calculateReversalEnginePro = (
  data: StockData[],
  rsi: number[],
  macd: { macdLine: number[]; signalLine: number[]; histogram: number[] },
  volumeAnalysis: { volumeMA: number[]; volumeRatio: number[] }
): ReversalSignal[] => {
  const signals: ReversalSignal[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < 30) {
      signals.push({ type: null, strength: 0, reasons: [] });
      continue;
    }
    
    const reasons: string[] = [];
    let bullishScore = 0;
    let bearishScore = 0;
    
    // RSI Analysis
    const currRsi = rsi[i];
    const prevRsi = rsi[i - 1];
    
    if (currRsi <= 30) {
      bullishScore += 25;
      reasons.push('RSI Oversold');
    } else if (currRsi <= 40 && prevRsi < currRsi) {
      bullishScore += 15;
      reasons.push('RSI Recovering');
    }
    
    if (currRsi >= 70) {
      bearishScore += 25;
      reasons.push('RSI Overbought');
    } else if (currRsi >= 60 && prevRsi > currRsi) {
      bearishScore += 15;
      reasons.push('RSI Weakening');
    }
    
    // MACD Analysis
    const currMacd = macd.macdLine[i];
    const prevMacd = macd.macdLine[i - 1];
    const currSignal = macd.signalLine[i];
    const prevSignal = macd.signalLine[i - 1];
    const currHist = macd.histogram[i];
    const prevHist = macd.histogram[i - 1];
    
    // MACD Crossover
    if (prevMacd < prevSignal && currMacd > currSignal) {
      bullishScore += 30;
      reasons.push('MACD Bullish Cross');
    }
    if (prevMacd > prevSignal && currMacd < currSignal) {
      bearishScore += 30;
      reasons.push('MACD Bearish Cross');
    }
    
    // MACD Histogram momentum
    if (currHist > 0 && currHist > prevHist) {
      bullishScore += 10;
      reasons.push('MACD Momentum Up');
    }
    if (currHist < 0 && currHist < prevHist) {
      bearishScore += 10;
      reasons.push('MACD Momentum Down');
    }
    
    // MACD Zero Line Cross
    if (prevMacd < 0 && currMacd > 0) {
      bullishScore += 15;
      reasons.push('MACD Above Zero');
    }
    if (prevMacd > 0 && currMacd < 0) {
      bearishScore += 15;
      reasons.push('MACD Below Zero');
    }
    
    // Volume Analysis
    const volRatio = volumeAnalysis.volumeRatio[i];
    const priceChange = (data[i].close - data[i - 1].close) / data[i - 1].close;
    
    // High volume with price up = bullish confirmation
    if (volRatio > 1.5 && priceChange > 0.01) {
      bullishScore += 20;
      reasons.push('Volume Surge (Up)');
    }
    
    // High volume with price down = bearish confirmation
    if (volRatio > 1.5 && priceChange < -0.01) {
      bearishScore += 20;
      reasons.push('Volume Surge (Down)');
    }
    
    // Volume divergence (price up, volume down = weak rally)
    if (priceChange > 0.01 && volRatio < 0.7) {
      bearishScore += 10;
      reasons.push('Weak Volume Rally');
    }
    
    // Volume divergence (price down, volume down = weak selloff)
    if (priceChange < -0.01 && volRatio < 0.7) {
      bullishScore += 10;
      reasons.push('Weak Volume Selloff');
    }
    
    // Determine signal
    const netScore = bullishScore - bearishScore;
    
    if (netScore >= 30) {
      signals.push({
        type: 'bullish',
        strength: Math.min(100, bullishScore),
        reasons: reasons.filter(r => 
          r.includes('Oversold') || r.includes('Recovering') || 
          r.includes('Bullish') || r.includes('Up') || 
          r.includes('Above') || r.includes('Weak Volume Selloff')
        )
      });
    } else if (netScore <= -30) {
      signals.push({
        type: 'bearish',
        strength: Math.min(100, bearishScore),
        reasons: reasons.filter(r => 
          r.includes('Overbought') || r.includes('Weakening') || 
          r.includes('Bearish') || r.includes('Down') || 
          r.includes('Below') || r.includes('Weak Volume Rally')
        )
      });
    } else {
      signals.push({ type: null, strength: 0, reasons: [] });
    }
  }
  
  return signals;
};

const calculateIndicators = (data: StockData[], settings: any) => {
  if (data.length < 50) return data; // Need enough data for EMA50

  // 1. Bollinger Bands
  const bbData = calculateBollingerBands(data, settings.smaPeriod, settings.stdDev);

  // 2. EMAs for Signals
  const ema20 = calculateEMA(data, 20);
  const ema50 = calculateEMA(data, 50);
  
  // 3. RSI with configurable period
  const rsiPeriod = settings.rsiPeriod || 14;
  const rsi = calculateRSI(data, rsiPeriod);
  
  // 4. MACD
  const macd = calculateMACD(data, 12, 26, 9);
  
  // 5. Volume Analysis
  const volumeAnalysis = calculateVolumeAnalysis(data, 20);
  
  // 6. Reversal Engine Pro
  const reversalSignals = settings.showReversalEngine 
    ? calculateReversalEnginePro(data, rsi, macd, volumeAnalysis)
    : [];

  // 7. Merge and Detect Signals
  return bbData.map((d: any, i: number) => {
    const reversalSignal = reversalSignals[i] || { type: null, strength: 0, reasons: [] };
    
    const newData = { 
      ...d, 
      ema20: ema20[i], 
      ema50: ema50[i], 
      rsi: rsi[i],
      macdLine: macd.macdLine[i],
      macdSignal: macd.signalLine[i],
      macdHistogram: macd.histogram[i],
      volumeMA: volumeAnalysis.volumeMA[i],
      volumeRatio: volumeAnalysis.volumeRatio[i],
      reversalType: reversalSignal.type,
      reversalStrength: reversalSignal.strength,
      reversalReasons: reversalSignal.reasons,
      buySignal: undefined, 
      sellSignal: undefined,
      reversalBuy: undefined,
      reversalSell: undefined,
    };

    // Skip beginning where indicators stabilize
    if (i > 50) {
      const prevEma20 = ema20[i-1];
      const prevEma50 = ema50[i-1];
      const currEma20 = ema20[i];
      const currEma50 = ema50[i];
      
      const prevRsi = rsi[i-1];
      const currRsi = rsi[i];

      // Classic Signals (EMA Cross)
      if (settings.showSignals) {
        // BUY: EMA20 Cross Up EMA50 AND RSI < 60
        const crossUp = prevEma20 < prevEma50 && currEma20 > currEma50;
        if (crossUp && currRsi < 60) {
          newData.buySignal = d.low * 0.98;
        }

        // SELL: EMA20 Cross Down EMA50 OR RSI Cross Up 70
        const crossDown = prevEma20 > prevEma50 && currEma20 < currEma50;
        const rsiOverbought = prevRsi <= 70 && currRsi > 70;
        
        if (crossDown || rsiOverbought) {
          newData.sellSignal = d.high * 1.02;
        }
      }
      
      // Reversal Engine Pro Signals
      if (settings.showReversalEngine && reversalSignal.type && reversalSignal.strength >= 40) {
        if (reversalSignal.type === 'bullish') {
          newData.reversalBuy = d.low * 0.97;
        } else if (reversalSignal.type === 'bearish') {
          newData.reversalSell = d.high * 1.03;
        }
      }
    }
    return newData;
  });
};

const calculateBollingerBands = (data: StockData[], period: number, multiplier: number) => {
  if (data.length < period) return data;

  const result = [];
  for (let i = 0; i < data.length; i++) {
    const datum = { 
      ...data[i],
      priceRange: [data[i].low, data[i].high],
      bbUpper: undefined as number | undefined, 
      bbMiddle: undefined as number | undefined, 
      bbLower: undefined as number | undefined 
    };
    
    if (i >= period - 1) {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
      const mean = sum / period;
      
      const squaredDiffs = slice.map(d => Math.pow(d.close - mean, 2));
      const variance = squaredDiffs.reduce((acc, curr) => acc + curr, 0) / period;
      const stdDev = Math.sqrt(variance);
      
      datum.bbMiddle = mean;
      datum.bbUpper = mean + (multiplier * stdDev);
      datum.bbLower = mean - (multiplier * stdDev);
    }
    result.push(datum);
  }
  return result;
};

const StockChart: React.FC<StockChartProps> = ({ data, symbol, timeRange, onRangeChange, loading }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Initialize settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('stockChartSettings');
      return saved ? JSON.parse(saved) : {
        smaPeriod: 20,
        stdDev: 2,
        themeColor: COLORS.Blue,
        chartType: 'candles' as 'candles' | 'line',
        showBB: true,
        showSignals: true,
        showRSI: true,
        rsiPeriod: 14,
        showReversalEngine: true,
        showMACD: true,
      };
    } catch (e) {
      return {
        smaPeriod: 20,
        stdDev: 2,
        themeColor: COLORS.Blue,
        chartType: 'candles' as 'candles' | 'line',
        showBB: true,
        showSignals: true,
        showRSI: true,
        rsiPeriod: 14,
        showReversalEngine: true,
        showMACD: true,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('stockChartSettings', JSON.stringify(settings));
  }, [settings]);

  // Calculate Chart Data with Indicators & Signals
  const chartData = useMemo(() => {
    return calculateIndicators(data, settings);
  }, [data, settings.smaPeriod, settings.stdDev, settings.showSignals, settings.rsiPeriod, settings.showReversalEngine]); // Recalculate if params change
  
  // Get latest reversal signal for display
  const latestReversal = useMemo(() => {
    if (!settings.showReversalEngine || chartData.length === 0) return null;
    // Find last significant reversal signal
    for (let i = chartData.length - 1; i >= Math.max(0, chartData.length - 10); i--) {
      const d = chartData[i];
      if (d.reversalType && d.reversalStrength >= 40) {
        return {
          type: d.reversalType,
          strength: d.reversalStrength,
          reasons: d.reversalReasons || [],
        };
      }
    }
    return null;
  }, [chartData, settings.showReversalEngine]);

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-slate-800/60 shadow-xl flex flex-col relative group overflow-hidden">
      
      {/* Subtle Background Mesh */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 z-20 relative">
        <div className="flex flex-col gap-1">
          <h3 className="text-3xl font-bold text-slate-100 font-mono flex items-center gap-3 tracking-tight">
            {symbol}
            {loading && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </h3>
          <div className="flex items-center gap-3 text-xs font-medium flex-wrap">
             <span className="text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">IDX Market</span>
             {settings.showBB && (
               <span className="text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                 BB({settings.smaPeriod},{settings.stdDev})
               </span>
            )}
            {settings.showRSI && (
               <span className="text-purple-500/80 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-mono">
                 RSI({settings.rsiPeriod})
               </span>
            )}
            {settings.showMACD && (
               <span className="text-cyan-500/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-mono">
                 MACD
               </span>
            )}
            {settings.showReversalEngine && (
               <span className="text-pink-500/80 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20 font-mono flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span> Reversal Pro
               </span>
            )}
            {settings.showSignals && (
               <span className="text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Signals
               </span>
            )}
          </div>
          {/* Reversal Engine Status */}
          {settings.showReversalEngine && latestReversal && (
            <div className={`mt-2 p-2 rounded-lg border ${
              latestReversal.type === 'bullish' 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`material-icons text-sm ${
                  latestReversal.type === 'bullish' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {latestReversal.type === 'bullish' ? 'trending_up' : 'trending_down'}
                </span>
                <span className={`text-xs font-bold ${
                  latestReversal.type === 'bullish' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {latestReversal.type === 'bullish' ? 'BULLISH' : 'BEARISH'} REVERSAL
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                  {latestReversal.strength}%
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {latestReversal.reasons.slice(0, 3).map((reason, idx) => (
                  <span key={idx} className="text-[9px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Time Range Selector */}
          <div className="flex-1 xl:flex-none bg-slate-950/50 rounded-lg p-1 border border-slate-800 overflow-x-auto flex shadow-inner">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                className={`flex-1 xl:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap min-w-[40px] text-center ${
                  timeRange === r 
                    ? 'text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
                style={timeRange === r ? { 
                  backgroundColor: settings.themeColor, 
                  boxShadow: `0 2px 10px -2px ${settings.themeColor}50` 
                } : {}}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Settings Toggle */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 rounded-lg border transition-all ${
              isSettingsOpen 
                ? 'bg-slate-800 text-white border-slate-600 shadow-lg' 
                : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600'
            }`}
          >
            <span className="material-icons text-xl">tune</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="absolute top-20 right-4 sm:right-6 z-30 w-72 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl p-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-700">
            <h4 className="font-bold text-slate-200 text-sm tracking-wide uppercase">Configuration</h4>
            <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
              <span className="material-icons text-sm">close</span>
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Chart Style</label>
              <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-700">
                <button 
                  onClick={() => setSettings({...settings, chartType: 'candles'})}
                  className={`flex-1 py-1.5 text-xs rounded font-medium transition-all ${settings.chartType === 'candles' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Candles
                </button>
                <button 
                  onClick={() => setSettings({...settings, chartType: 'line'})}
                  className={`flex-1 py-1.5 text-xs rounded font-medium transition-all ${settings.chartType === 'line' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Line
                </button>
              </div>
            </div>
            
            {/* Reversal Engine Pro - Featured */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-pink-400">🚀 Reversal Engine Pro</span>
                  <span className="text-[9px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded">NEW</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.showReversalEngine} 
                  onChange={(e) => setSettings({...settings, showReversalEngine: e.target.checked})} 
                  className="rounded border-pink-600 bg-slate-800 text-pink-500 focus:ring-offset-slate-900 w-4 h-4"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Combines MACD + RSI + Volume to detect high-probability reversal points
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Indicators</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <span className="text-sm text-slate-300">Bollinger Bands</span>
                  <input 
                    type="checkbox" 
                    checked={settings.showBB} 
                    onChange={(e) => setSettings({...settings, showBB: e.target.checked})} 
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-offset-slate-900 w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <span className="text-sm text-slate-300 flex items-center gap-2">
                    RSI Indicator
                    <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">({settings.rsiPeriod})</span>
                  </span>
                  <input 
                    type="checkbox" 
                    checked={settings.showRSI} 
                    onChange={(e) => setSettings({...settings, showRSI: e.target.checked})} 
                    className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-offset-slate-900 w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <span className="text-sm text-slate-300 flex items-center gap-2">
                    MACD
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      {settings.macdFast},{settings.macdSlow},{settings.macdSignal}
                    </span>
                  </span>
                  <input 
                    type="checkbox" 
                    checked={settings.showMACD} 
                    onChange={(e) => setSettings({...settings, showMACD: e.target.checked})} 
                    className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-offset-slate-900 w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <span className="text-sm text-slate-300 flex items-center gap-2">
                    Classic Signals
                    <span className="flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                       <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    </span>
                  </span>
                  <input 
                    type="checkbox" 
                    checked={settings.showSignals} 
                    onChange={(e) => setSettings({...settings, showSignals: e.target.checked})} 
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-offset-slate-900 w-4 h-4"
                  />
                </div>
              </div>
            </div>
            
            {settings.showBB && (
              <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-slate-700 ml-1">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Period (SMA)</label>
                  <input 
                    type="number" 
                    value={settings.smaPeriod}
                    onChange={(e) => setSettings({...settings, smaPeriod: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">StdDev</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={settings.stdDev}
                    onChange={(e) => setSettings({...settings, stdDev: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>
            )}
            
            {settings.showRSI && (
              <div className="pl-2 border-l-2 border-purple-700 ml-1">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">RSI Period</label>
                  <input 
                    type="number" 
                    min="2"
                    max="50"
                    value={settings.rsiPeriod}
                    onChange={(e) => setSettings({...settings, rsiPeriod: Math.max(2, Math.min(50, Number(e.target.value)))})}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                  />
                  <p className="text-[9px] text-slate-600 mt-1">Default: 14 • Range: 2-50</p>
                </div>
              </div>
            )}
            
            {settings.showMACD && (
              <div className="pl-2 border-l-2 border-cyan-700 ml-1">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Fast</label>
                    <input 
                      type="number" 
                      min="2"
                      max="50"
                      value={settings.macdFast}
                      onChange={(e) => setSettings({...settings, macdFast: Math.max(2, Math.min(50, Number(e.target.value)))})}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Slow</label>
                    <input 
                      type="number" 
                      min="2"
                      max="100"
                      value={settings.macdSlow}
                      onChange={(e) => setSettings({...settings, macdSlow: Math.max(2, Math.min(100, Number(e.target.value)))})}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Signal</label>
                    <input 
                      type="number" 
                      min="2"
                      max="50"
                      value={settings.macdSignal}
                      onChange={(e) => setSettings({...settings, macdSignal: Math.max(2, Math.min(50, Number(e.target.value)))})}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-slate-600 mt-1">Default: 12, 26, 9</p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Accent Color</label>
              <div className="flex gap-3 justify-between">
                {Object.entries(COLORS).slice(0, 4).map(([name, color]) => (
                  <button
                    key={name}
                    onClick={() => setSettings({...settings, themeColor: color})}
                    className={`w-8 h-8 rounded-lg ring-2 ring-offset-2 ring-offset-slate-800 transition-all ${settings.themeColor === color ? 'ring-white scale-110 shadow-lg' : 'ring-transparent hover:scale-105 hover:ring-slate-600'}`}
                    style={{ backgroundColor: color }}
                    title={name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chart Area */}
      <div className={`w-full min-h-0 relative z-10 ${
        settings.showRSI && settings.showMACD 
          ? 'h-[380px] lg:h-[420px]' 
          : settings.showRSI || settings.showMACD 
          ? 'h-[450px] lg:h-[500px]' 
          : 'h-[550px] lg:h-[650px]'
      }`}>
        {chartData.length === 0 && !loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-mono text-sm">
                No market data available for this range
            </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            key={timeRange}
            data={chartData} 
            margin={{ top: 20, right: 0, left: -10, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={COLORS.Grid}
              vertical={false} 
              opacity={0.5}
            />
            <XAxis 
              dataKey="time" 
              stroke={COLORS.Text} 
              tick={{fontSize: 10, fill: COLORS.Text, fontFamily: 'JetBrains Mono'}}
              tickLine={false}
              axisLine={false}
              minTickGap={50}
              dy={10}
            />
            <YAxis 
              yAxisId="volume" 
              orientation="left" 
              tick={false} 
              axisLine={false}
              width={0}
              domain={[0, 'dataMax * 5']} // Push volume down further
            />
            <YAxis 
              yAxisId="price" 
              orientation="right" 
              domain={['auto', 'auto']} 
              stroke={COLORS.Text}
              tick={{fontSize: 11, fill: COLORS.Text, fontFamily: 'JetBrains Mono'}}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val.toLocaleString('id-ID')}
              width={65}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.Text, strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            <Bar 
              yAxisId="volume" 
              dataKey="volume" 
              fill={settings.themeColor} 
              opacity={0.15} 
              barSize={timeRange === '1D' ? 6 : 3}
              isAnimationActive={false}
            />
            
            {settings.showBB && (
              <>
                <Area
                   yAxisId="price"
                   type="monotone"
                   dataKey="bbUpper"
                   stroke="none"
                   fill={settings.themeColor}
                   fillOpacity={0.05}
                />
                <Area
                   yAxisId="price"
                   type="monotone"
                   dataKey="bbLower"
                   stroke="none"
                   fill="transparent"
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="bbUpper"
                  stroke="#22d3ee" 
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="bbLower"
                  stroke="#22d3ee"
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  dot={false}
                  isAnimationActive={false}
                />
                 <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="bbMiddle"
                  stroke="#fbbf24"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}

            {settings.chartType === 'candles' ? (
              <Bar
                yAxisId="price"
                dataKey="priceRange"
                shape={<CandleShape />}
                isAnimationActive={false}
              />
            ) : (
              <>
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke={settings.themeColor}
                  fill={settings.themeColor}
                  fillOpacity={0.1}
                  strokeWidth={0}
                  activeDot={false}
                />
                <Line 
                  yAxisId="price"
                  type="monotone" 
                  dataKey="close" 
                  stroke={settings.themeColor} 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4, fill: '#fff', stroke: settings.themeColor, strokeWidth: 0 }}
                />
              </>
            )}

            {settings.showSignals && (
              <>
                <Scatter yAxisId="price" dataKey="buySignal" shape={<BuySignalMarker />} isAnimationActive={false} />
                <Scatter yAxisId="price" dataKey="sellSignal" shape={<SellSignalMarker />} isAnimationActive={false} />
              </>
            )}
            
            {/* Reversal Engine Pro Signals */}
            {settings.showReversalEngine && (
              <>
                <Scatter yAxisId="price" dataKey="reversalBuy" shape={<ReversalBuyMarker />} isAnimationActive={false} />
                <Scatter yAxisId="price" dataKey="reversalSell" shape={<ReversalSellMarker />} isAnimationActive={false} />
              </>
            )}
            
            <Brush 
              dataKey="time"
              height={20}
              stroke={COLORS.Grid}
              fill="#0f172a" 
              tickFormatter={() => ''}
              travellerWidth={8}
            />

          </ComposedChart>
        </ResponsiveContainer>
        )}
      </div>
      
      {/* MACD Panel */}
      {settings.showMACD && chartData.length > 0 && (
        <div className="w-full h-[120px] mt-2 relative z-10">
          {/* MACD Header */}
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400">MACD</span>
              <span className="text-[10px] text-slate-500 font-mono">(12,26,9)</span>
              {chartData.length > 0 && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  chartData[chartData.length - 1].macdHistogram > 0 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {chartData[chartData.length - 1].macdHistogram?.toFixed(2) || '0.00'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-cyan-400"></span> MACD
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-orange-400"></span> Signal
              </span>
            </div>
          </div>
          
          {/* MACD Chart */}
          <ResponsiveContainer width="100%" height="85%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 55, left: -10, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={COLORS.Grid}
                vertical={false} 
                opacity={0.3}
              />
              <XAxis 
                dataKey="time" 
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{fontSize: 9, fill: COLORS.Text, fontFamily: 'JetBrains Mono'}}
                tickLine={false}
                axisLine={false}
                orientation="right"
                width={45}
                tickFormatter={(val) => val.toFixed(0)}
              />
              
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" strokeOpacity={0.5} />
              
              {/* MACD Histogram */}
              <Bar 
                dataKey="macdHistogram" 
                fill="#22d3ee"
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <rect 
                    key={`hist-${index}`}
                    fill={entry.macdHistogram >= 0 ? '#22c55e' : '#ef4444'}
                    fillOpacity={0.6}
                  />
                ))}
              </Bar>
              
              {/* MACD Line */}
              <Line 
                type="monotone" 
                dataKey="macdLine" 
                stroke="#22d3ee"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              
              {/* Signal Line */}
              <Line 
                type="monotone" 
                dataKey="macdSignal" 
                stroke="#f97316"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const crossover = data.macdLine > data.macdSignal;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 px-3 py-2 rounded-lg shadow-xl">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 text-xs">MACD:</span>
                            <span className="text-white font-mono text-xs">{data.macdLine?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-orange-400 text-xs">Signal:</span>
                            <span className="text-white font-mono text-xs">{data.macdSignal?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-xs">Histogram:</span>
                            <span className={`font-mono text-xs ${data.macdHistogram >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {data.macdHistogram?.toFixed(2)}
                            </span>
                          </div>
                          <div className={`text-[10px] pt-1 border-t border-slate-700 ${crossover ? 'text-emerald-400' : 'text-red-400'}`}>
                            {crossover ? '📈 Bullish' : '📉 Bearish'}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* RSI Panel */}
      {settings.showRSI && chartData.length > 0 && (
        <div className="w-full h-[120px] mt-2 relative z-10">
          {/* RSI Header */}
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-400">RSI</span>
              <span className="text-[10px] text-slate-500 font-mono">({settings.rsiPeriod})</span>
              {chartData.length > 0 && chartData[chartData.length - 1].rsi > 0 && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  chartData[chartData.length - 1].rsi >= 70 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : chartData[chartData.length - 1].rsi <= 30 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                }`}>
                  {chartData[chartData.length - 1].rsi.toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-red-500/60"></span> Overbought (70)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-emerald-500/60"></span> Oversold (30)
              </span>
            </div>
          </div>
          
          {/* RSI Chart */}
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData} margin={{ top: 5, right: 55, left: -10, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={COLORS.Grid}
                vertical={false} 
                opacity={0.3}
              />
              <XAxis 
                dataKey="time" 
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]}
                ticks={[0, 30, 50, 70, 100]}
                tick={{fontSize: 9, fill: COLORS.Text, fontFamily: 'JetBrains Mono'}}
                tickLine={false}
                axisLine={false}
                orientation="right"
                width={35}
              />
              
              {/* Overbought Zone */}
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={50} stroke="#64748b" strokeDasharray="2 2" strokeOpacity={0.3} />
              
              {/* RSI Area for visual */}
              <defs>
                <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="rsi" 
                stroke="none"
                fill="url(#rsiGradient)"
                isAnimationActive={false}
              />
              
              {/* RSI Line */}
              <Line 
                type="monotone" 
                dataKey="rsi" 
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length && payload[0].value !== undefined) {
                    const rsiValue = payload[0].value as number;
                    const status = rsiValue >= 70 ? 'Overbought' : rsiValue <= 30 ? 'Oversold' : 'Neutral';
                    const statusColor = rsiValue >= 70 ? 'text-red-400' : rsiValue <= 30 ? 'text-emerald-400' : 'text-slate-300';
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 px-3 py-2 rounded-lg shadow-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400 font-bold text-sm">RSI:</span>
                          <span className="text-white font-mono font-bold">{rsiValue.toFixed(1)}</span>
                          <span className={`text-xs ${statusColor}`}>({status})</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* MACD Panel */}
      {settings.showMACD && chartData.length > 0 && (
        <div className="w-full h-[120px] mt-2 relative z-10">
          {/* MACD Header */}
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400">MACD</span>
              <span className="text-[10px] text-slate-500 font-mono">({settings.macdFast},{settings.macdSlow},{settings.macdSignal})</span>
              {chartData.length > 0 && chartData[chartData.length - 1].macdLine !== undefined && (
                <>
                  <span className="text-xs font-mono text-cyan-400">
                    {chartData[chartData.length - 1].macdLine?.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-orange-400">
                    {chartData[chartData.length - 1].macdSignal?.toFixed(2)}
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    (chartData[chartData.length - 1].macdHistogram || 0) >= 0 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {chartData[chartData.length - 1].macdHistogram?.toFixed(2)}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-cyan-400"></span> MACD
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-orange-400"></span> Signal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500/60"></span> Histogram
              </span>
            </div>
          </div>
          
          {/* MACD Chart */}
          <ResponsiveContainer width="100%" height="85%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 55, left: -10, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={COLORS.Grid}
                vertical={false} 
                opacity={0.3}
              />
              <XAxis 
                dataKey="time" 
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{fontSize: 9, fill: COLORS.Text, fontFamily: 'JetBrains Mono'}}
                tickLine={false}
                axisLine={false}
                orientation="right"
                width={45}
                tickFormatter={(value) => value.toFixed(0)}
              />
              
              {/* Zero Line */}
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" strokeOpacity={0.5} />
              
              {/* Histogram Bars */}
              <Bar 
                dataKey="macdHistogram" 
                fill="#22c55e"
                isAnimationActive={false}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isPositive = (payload.macdHistogram || 0) >= 0;
                  const fillColor = isPositive ? '#22c55e' : '#ef4444';
                  const opacity = Math.min(Math.abs(payload.macdHistogram || 0) / 50 + 0.3, 0.8);
                  return (
                    <rect 
                      x={x} 
                      y={isPositive ? y : y} 
                      width={width} 
                      height={Math.abs(height)} 
                      fill={fillColor}
                      opacity={opacity}
                      rx={1}
                    />
                  );
                }}
              />
              
              {/* MACD Line */}
              <Line 
                type="monotone" 
                dataKey="macdLine" 
                stroke="#22d3ee"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              
              {/* Signal Line */}
              <Line 
                type="monotone" 
                dataKey="macdSignal" 
                stroke="#fb923c"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    if (data.macdLine === undefined) return null;
                    
                    const crossover = (data.macdLine || 0) > (data.macdSignal || 0);
                    
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 px-3 py-2 rounded-lg shadow-xl">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-bold text-xs">MACD:</span>
                            <span className="text-white font-mono text-sm">{data.macdLine?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-orange-400 font-bold text-xs">Signal:</span>
                            <span className="text-white font-mono text-sm">{data.macdSignal?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-bold text-xs">Histogram:</span>
                            <span className={`font-mono text-sm font-bold ${(data.macdHistogram || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {data.macdHistogram?.toFixed(2)}
                            </span>
                          </div>
                          <div className={`text-xs pt-1 border-t border-slate-700 ${crossover ? 'text-emerald-400' : 'text-red-400'}`}>
                            {crossover ? '📈 Bullish Crossover' : '📉 Bearish Crossover'}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default StockChart;