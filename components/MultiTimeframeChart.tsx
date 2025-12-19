import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StockData, TimeRange } from '../types';
import { fetchHistoricalData } from '../services/stockApiService';

interface MultiTimeframeChartProps {
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TimeframeData {
  range: TimeRange;
  label: string;
  days: number;
  data: StockData[];
  loading: boolean;
  change: number;
  changePercent: number;
}

const TIMEFRAMES: { range: TimeRange; label: string; days: number }[] = [
  { range: '1D', label: '1 Hari', days: 1 },
  { range: '5D', label: '5 Hari', days: 5 },
  { range: '1M', label: '1 Bulan', days: 30 },
  { range: '3M', label: '3 Bulan', days: 90 },
];

const COLORS = {
  Bullish: '#26a69a',
  Bearish: '#ef5350',
  MA: '#2962ff',
  Grid: '#363a45',
  Background: '#131722',
  Text: '#787b86',
  TextLight: '#d1d4dc',
};

// Calculate SMA
const calculateSMA = (data: StockData[], period: number): (number | null)[] => {
  const sma: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
      sma.push(sum / period);
    }
  }
  return sma;
};

// Mini Chart Tooltip
const MiniTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload.find((p: any) => p.dataKey === 'close')?.payload;
  if (!data) return null;

  const isBullish = data.close >= data.open;

  return (
    <div className="bg-[#1e222d] border border-[#363a45] rounded px-2 py-1 text-[10px] font-mono">
      <div className="text-[#787b86]">{data.date}</div>
      <div className={isBullish ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
        Rp {data.close?.toLocaleString()}
      </div>
    </div>
  );
};

const MultiTimeframeChart: React.FC<MultiTimeframeChartProps> = ({ 
  symbol, 
  isOpen, 
  onClose 
}) => {
  const [timeframes, setTimeframes] = useState<TimeframeData[]>(
    TIMEFRAMES.map(tf => ({
      ...tf,
      data: [],
      loading: true,
      change: 0,
      changePercent: 0,
    }))
  );
  const [layout, setLayout] = useState<'2x2' | '1x4'>('2x2');

  useEffect(() => {
    if (!isOpen || !symbol) return;
    
    const loadAllTimeframes = async () => {
      // Reset loading state
      setTimeframes(prev => prev.map(tf => ({ ...tf, loading: true })));
      
      // Load data for each timeframe
      const promises = TIMEFRAMES.map(async (tf) => {
        try {
          const data = await fetchHistoricalData(symbol, tf.days);
          const change = data.length > 1 
            ? data[data.length - 1].close - data[0].close 
            : 0;
          const changePercent = data.length > 1 && data[0].close > 0
            ? (change / data[0].close) * 100
            : 0;
          
          return {
            ...tf,
            data,
            loading: false,
            change,
            changePercent,
          };
        } catch (error) {
          console.error(`Error loading ${tf.range} data:`, error);
          return {
            ...tf,
            data: [],
            loading: false,
            change: 0,
            changePercent: 0,
          };
        }
      });

      const results = await Promise.all(promises);
      setTimeframes(results);
    };

    loadAllTimeframes();
  }, [symbol, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#131722] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="material-icons-round text-white">grid_view</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Multi-Timeframe Analysis</h2>
              <p className="text-sm text-slate-400">{symbol} - Perbandingan berbagai periode</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Layout Toggle */}
            <div className="flex bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setLayout('2x2')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  layout === '2x2' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2×2 Grid
              </button>
              <button
                onClick={() => setLayout('1x4')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  layout === '1x4' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1×4 Row
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
            >
              <span className="material-icons-round">close</span>
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className={`flex-1 p-4 overflow-auto ${
          layout === '2x2' 
            ? 'grid grid-cols-2 gap-4' 
            : 'grid grid-cols-4 gap-3'
        }`}>
          {timeframes.map((tf, index) => {
            const chartData = tf.data.map((d, i) => {
              const sma20 = calculateSMA(tf.data, 20);
              return {
                ...d,
                sma20: sma20[i],
              };
            });

            const isBullish = tf.change >= 0;
            const latestPrice = tf.data.length > 0 ? tf.data[tf.data.length - 1].close : 0;
            const minPrice = Math.min(...tf.data.map(d => d.low || d.close));
            const maxPrice = Math.max(...tf.data.map(d => d.high || d.close));

            return (
              <div
                key={tf.range}
                className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden"
              >
                {/* Chart Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{tf.label}</span>
                    <span className="text-xs text-slate-500">({tf.range})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-white">
                      Rp {latestPrice.toLocaleString()}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                      isBullish 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {isBullish ? '+' : ''}{tf.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Chart Area */}
                <div className={layout === '2x2' ? 'h-64' : 'h-48'}>
                  {tf.loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent"></div>
                    </div>
                  ) : tf.data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                      <span className="material-icons-round mr-2">error_outline</span>
                      Data tidak tersedia
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart 
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke={COLORS.Grid} 
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 9, fill: COLORS.Text }}
                          axisLine={{ stroke: COLORS.Grid }}
                          tickLine={false}
                          interval="preserveStartEnd"
                          minTickGap={30}
                        />
                        <YAxis 
                          domain={[minPrice * 0.99, maxPrice * 1.01]}
                          tick={{ fontSize: 9, fill: COLORS.Text }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v}
                          width={50}
                        />
                        <Tooltip content={<MiniTooltip />} />
                        
                        {/* Area fill */}
                        <defs>
                          <linearGradient id={`gradient-${tf.range}`} x1="0" y1="0" x2="0" y2="1">
                            <stop 
                              offset="0%" 
                              stopColor={isBullish ? COLORS.Bullish : COLORS.Bearish} 
                              stopOpacity={0.3}
                            />
                            <stop 
                              offset="100%" 
                              stopColor={isBullish ? COLORS.Bullish : COLORS.Bearish} 
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        
                        {/* Price line with area */}
                        <Line
                          type="monotone"
                          dataKey="close"
                          stroke={isBullish ? COLORS.Bullish : COLORS.Bearish}
                          strokeWidth={2}
                          dot={false}
                          fill={`url(#gradient-${tf.range})`}
                        />
                        
                        {/* SMA Line */}
                        <Line
                          type="monotone"
                          dataKey="sma20"
                          stroke={COLORS.MA}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Chart Footer Stats */}
                <div className="grid grid-cols-4 gap-1 px-3 py-2 bg-slate-900/50 text-center">
                  <div>
                    <p className="text-[9px] text-slate-500">Open</p>
                    <p className="text-[10px] font-mono text-slate-300">
                      {tf.data.length > 0 ? tf.data[0].open.toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500">High</p>
                    <p className="text-[10px] font-mono text-emerald-400">
                      {maxPrice > 0 ? maxPrice.toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500">Low</p>
                    <p className="text-[10px] font-mono text-red-400">
                      {minPrice > 0 && minPrice < Infinity ? minPrice.toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500">Change</p>
                    <p className={`text-[10px] font-mono ${isBullish ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isBullish ? '+' : ''}{tf.change.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-[#26a69a]"></div>
                <span className="text-xs text-slate-400">Bullish</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-[#ef5350]"></div>
                <span className="text-xs text-slate-400">Bearish</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-[#2962ff] border-dashed"></div>
                <span className="text-xs text-slate-400">SMA 20</span>
              </div>
            </div>
            
            <div className="text-xs text-slate-500">
              Multi-timeframe analysis membantu melihat tren di berbagai periode waktu
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiTimeframeChart;
