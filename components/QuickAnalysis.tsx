import React from 'react';
import { StockTicker, StockData } from '../types';

interface QuickAnalysisProps {
  ticker: StockTicker;
  chartData: StockData[];
}

// Helper to calculate simple indicators
const calculateQuickIndicators = (data: StockData[], ticker: StockTicker) => {
  if (data.length < 14) {
    return null;
  }

  // RSI calculation
  let gains = 0, losses = 0;
  for (let i = data.length - 14; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  // Simple trend detection
  const shortMA = data.slice(-5).reduce((s, d) => s + d.close, 0) / 5;
  const longMA = data.slice(-20).reduce((s, d) => s + d.close, 0) / 20;
  const trend = shortMA > longMA ? 'up' : shortMA < longMA ? 'down' : 'sideways';

  // Volume trend
  const recentVol = data.slice(-5).reduce((s, d) => s + d.volume, 0) / 5;
  const prevVol = data.slice(-10, -5).reduce((s, d) => s + d.volume, 0) / 5;
  const volumeChange = ((recentVol - prevVol) / prevVol) * 100;

  // Support/Resistance (simple)
  const recentLows = data.slice(-20).map(d => d.low);
  const recentHighs = data.slice(-20).map(d => d.high);
  const support = Math.min(...recentLows);
  const resistance = Math.max(...recentHighs);

  // Quick signal
  let signal: 'buy' | 'sell' | 'hold' = 'hold';
  let signalStrength = 0;

  if (rsi < 30 && trend === 'up') {
    signal = 'buy';
    signalStrength = 80;
  } else if (rsi < 40 && trend === 'up') {
    signal = 'buy';
    signalStrength = 60;
  } else if (rsi > 70 && trend === 'down') {
    signal = 'sell';
    signalStrength = 80;
  } else if (rsi > 60 && trend === 'down') {
    signal = 'sell';
    signalStrength = 60;
  } else if (trend === 'up') {
    signal = 'buy';
    signalStrength = 40;
  } else if (trend === 'down') {
    signal = 'sell';
    signalStrength = 40;
  }

  return {
    rsi,
    trend,
    volumeChange,
    support,
    resistance,
    signal,
    signalStrength,
    shortMA,
    longMA
  };
};

const QuickAnalysis: React.FC<QuickAnalysisProps> = ({ ticker, chartData }) => {
  const indicators = calculateQuickIndicators(chartData, ticker);

  if (!indicators) {
    return (
      <div className="bg-[#141c2f] rounded-xl p-4 border border-slate-800/60">
        <div className="flex items-center justify-center h-20 text-slate-500 text-sm">
          Loading analysis...
        </div>
      </div>
    );
  }

  const getSignalColor = () => {
    if (indicators.signal === 'buy') return 'emerald';
    if (indicators.signal === 'sell') return 'red';
    return 'yellow';
  };

  const color = getSignalColor();

  return (
    <div className="bg-[#141c2f] rounded-xl p-4 border border-slate-800/60">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <span className="material-icons-round text-sm text-blue-400">speed</span>
          Quick Analysis
        </h4>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-${color}-500/20 text-${color}-400 border border-${color}-500/30`}>
          {indicators.signal}
        </div>
      </div>

      {/* Signal Strength Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>Signal Strength</span>
          <span className={`text-${color}-400 font-bold`}>{indicators.signalStrength}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              indicators.signal === 'buy' ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
              indicators.signal === 'sell' ? 'bg-gradient-to-r from-red-500 to-rose-400' :
              'bg-gradient-to-r from-yellow-500 to-amber-400'
            }`}
            style={{ width: `${indicators.signalStrength}%` }}
          />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* RSI */}
        <div className="bg-slate-800/30 rounded-lg p-2">
          <div className="text-slate-500 text-[10px] mb-0.5">RSI (14)</div>
          <div className={`font-bold font-mono ${
            indicators.rsi < 30 ? 'text-emerald-400' : 
            indicators.rsi > 70 ? 'text-red-400' : 'text-slate-300'
          }`}>
            {indicators.rsi.toFixed(1)}
            <span className="text-[9px] ml-1 font-normal text-slate-500">
              {indicators.rsi < 30 ? 'Oversold' : indicators.rsi > 70 ? 'Overbought' : 'Neutral'}
            </span>
          </div>
        </div>

        {/* Trend */}
        <div className="bg-slate-800/30 rounded-lg p-2">
          <div className="text-slate-500 text-[10px] mb-0.5">Trend</div>
          <div className={`font-bold flex items-center gap-1 ${
            indicators.trend === 'up' ? 'text-emerald-400' : 
            indicators.trend === 'down' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            <span className="material-icons-round text-sm">
              {indicators.trend === 'up' ? 'trending_up' : 
               indicators.trend === 'down' ? 'trending_down' : 'trending_flat'}
            </span>
            {indicators.trend === 'up' ? 'Uptrend' : 
             indicators.trend === 'down' ? 'Downtrend' : 'Sideways'}
          </div>
        </div>

        {/* Support */}
        <div className="bg-slate-800/30 rounded-lg p-2">
          <div className="text-slate-500 text-[10px] mb-0.5">Support</div>
          <div className="font-bold font-mono text-emerald-400">
            {indicators.support.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Resistance */}
        <div className="bg-slate-800/30 rounded-lg p-2">
          <div className="text-slate-500 text-[10px] mb-0.5">Resistance</div>
          <div className="font-bold font-mono text-red-400">
            {indicators.resistance.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Volume Indicator */}
      <div className="mt-3 flex items-center justify-between bg-slate-800/20 rounded-lg px-3 py-2">
        <span className="text-slate-500 text-[10px]">Volume Trend</span>
        <span className={`text-xs font-bold flex items-center gap-1 ${
          indicators.volumeChange > 10 ? 'text-emerald-400' : 
          indicators.volumeChange < -10 ? 'text-red-400' : 'text-slate-400'
        }`}>
          <span className="material-icons-round text-sm">
            {indicators.volumeChange > 10 ? 'arrow_upward' : 
             indicators.volumeChange < -10 ? 'arrow_downward' : 'remove'}
          </span>
          {indicators.volumeChange > 0 ? '+' : ''}{indicators.volumeChange.toFixed(1)}%
        </span>
      </div>

      {/* MA Cross */}
      <div className="mt-2 text-[10px] text-center">
        {indicators.shortMA > indicators.longMA ? (
          <span className="text-emerald-400">
            ✓ Golden Cross Active (MA5 {'>'} MA20)
          </span>
        ) : (
          <span className="text-red-400">
            ✗ Death Cross Active (MA5 {'<'} MA20)
          </span>
        )}
      </div>
    </div>
  );
};

export default QuickAnalysis;
