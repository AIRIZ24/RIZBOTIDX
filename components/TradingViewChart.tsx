import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  ReferenceLine,
  Cell,
} from 'recharts';
import { StockData, TimeRange } from '../types';
import ChartDrawingTools, { DrawingToolbar, DrawingObject, DrawingType } from './ChartDrawingTools';

interface TradingViewChartProps {
  data: StockData[];
  symbol: string;
  timeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  loading?: boolean;
}

const RANGES: TimeRange[] = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y'];

const COLORS = {
  Bullish: '#26a69a',     // TradingView green
  Bearish: '#ef5350',     // TradingView red
  MA: '#2962ff',          // Blue moving average
  Grid: '#363a45',        // Dark grid
  GridLight: '#2a2e39',   // Lighter grid  
  Background: '#131722',  // TradingView dark bg
  Text: '#787b86',        // Muted text
  TextLight: '#d1d4dc',   // Light text
  VolumeUp: '#26a69a80',  // Semi-transparent green
  VolumeDown: '#ef535080', // Semi-transparent red
};

// Calculate SMA (Simple Moving Average)
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

// Custom Candlestick Shape - TradingView Style
const TradingViewCandle = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) return null;
  
  const { open, close, high, low } = payload;
  const isBullish = close >= open;
  const color = isBullish ? COLORS.Bullish : COLORS.Bearish;
  
  const range = high - low;
  if (range <= 0 || width <= 0 || height <= 0) return null;

  // Calculate positions
  const yHigh = y;
  const yLow = y + height;
  const yOpen = y + (height * (high - open) / range);
  const yClose = y + (height * (high - close) / range);
  
  const bodyTop = Math.min(yOpen, yClose);
  const bodyBottom = Math.max(yOpen, yClose);
  const bodyHeight = Math.max(1, bodyBottom - bodyTop);
  
  const cx = x + width / 2;
  const candleWidth = Math.max(1, Math.min(width * 0.8, 12));
  const wickWidth = 1;

  return (
    <g>
      {/* Upper wick */}
      <line 
        x1={cx} 
        y1={yHigh} 
        x2={cx} 
        y2={bodyTop} 
        stroke={color} 
        strokeWidth={wickWidth}
      />
      {/* Lower wick */}
      <line 
        x1={cx} 
        y1={bodyBottom} 
        x2={cx} 
        y2={yLow} 
        stroke={color} 
        strokeWidth={wickWidth}
      />
      {/* Body */}
      <rect 
        x={cx - candleWidth / 2} 
        y={bodyTop} 
        width={candleWidth} 
        height={bodyHeight || 1}
        fill={isBullish ? COLORS.Background : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// Custom Tooltip - TradingView Style
const TradingViewTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload.find((p: any) => p.dataKey === 'priceRange')?.payload;
  if (!data) return null;

  const { open, high, low, close, volume } = data;
  const change = close - open;
  const changePercent = ((change / open) * 100).toFixed(2);
  const isBullish = close >= open;

  return (
    <div className="bg-[#1e222d] border border-[#363a45] rounded-lg p-3 shadow-xl text-xs font-mono">
      <div className="text-[#787b86] mb-2">{label}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-[#787b86]">O</span>
        <span className="text-[#d1d4dc]">{open?.toLocaleString()}</span>
        <span className="text-[#787b86]">H</span>
        <span className="text-[#26a69a]">{high?.toLocaleString()}</span>
        <span className="text-[#787b86]">L</span>
        <span className="text-[#ef5350]">{low?.toLocaleString()}</span>
        <span className="text-[#787b86]">C</span>
        <span className={isBullish ? 'text-[#26a69a]' : 'text-[#ef5350]'}>{close?.toLocaleString()}</span>
      </div>
      <div className="mt-2 pt-2 border-t border-[#363a45] flex justify-between">
        <span className="text-[#787b86]">Vol</span>
        <span className="text-[#d1d4dc]">{(volume / 1000).toFixed(1)}K</span>
      </div>
      <div className={`mt-1 text-right font-bold ${isBullish ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
        {change >= 0 ? '+' : ''}{changePercent}%
      </div>
    </div>
  );
};

// Volume Tooltip
const VolumeTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-[#1e222d] border border-[#363a45] rounded px-2 py-1 text-xs font-mono">
      <span className="text-[#787b86]">Vol: </span>
      <span className="text-[#d1d4dc]">{(data.volume / 1000).toFixed(1)}K</span>
    </div>
  );
};

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  data, 
  symbol, 
  timeRange, 
  onRangeChange, 
  loading 
}) => {
  const [crosshairData, setCrosshairData] = useState<any>(null);
  const [showMA, setShowMA] = useState(true);
  const [maPeriod, setMaPeriod] = useState(20);
  
  // Drawing tools state
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingType | null>(null);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 350 });
  
  // Load drawings from localStorage
  useEffect(() => {
    const savedDrawings = localStorage.getItem(`chart_drawings_${symbol}`);
    if (savedDrawings) {
      try {
        setDrawings(JSON.parse(savedDrawings));
      } catch (e) {
        console.error('Failed to load drawings:', e);
      }
    }
  }, [symbol]);
  
  // Save drawings to localStorage
  useEffect(() => {
    if (drawings.length > 0) {
      localStorage.setItem(`chart_drawings_${symbol}`, JSON.stringify(drawings));
    } else {
      localStorage.removeItem(`chart_drawings_${symbol}`);
    }
  }, [drawings, symbol]);
  
  // Update chart dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        setChartDimensions({
          width: chartContainerRef.current.offsetWidth,
          height: 350,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate chart data with MA
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const sma = calculateSMA(data, maPeriod);
    
    return data.map((d, i) => ({
      ...d,
      priceRange: [d.low, d.high],
      sma: sma[i],
      volumeColor: d.close >= d.open ? COLORS.Bullish : COLORS.Bearish,
    }));
  }, [data, maPeriod]);

  // Get price domain with padding
  const priceDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    let min = Math.min(...chartData.map(d => d.low));
    let max = Math.max(...chartData.map(d => d.high));
    const padding = (max - min) * 0.05;
    
    return [min - padding, max + padding];
  }, [chartData]);

  // Get latest price info
  const latestData = chartData[chartData.length - 1];
  const prevData = chartData[chartData.length - 2];
  const priceChange = latestData && prevData ? latestData.close - prevData.close : 0;
  const priceChangePercent = prevData ? ((priceChange / prevData.close) * 100).toFixed(2) : '0.00';

  return (
    <div className="w-full bg-[#131722] rounded-xl overflow-hidden border border-[#2a2e39]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2a2e39] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#d1d4dc]">{symbol}</span>
            {loading && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </div>
          
          {latestData && (
            <div className="flex items-center gap-3 text-sm font-mono">
              <span className="text-[#d1d4dc] text-lg font-semibold">
                {latestData.close?.toLocaleString()}
              </span>
              <span className={`px-2 py-0.5 rounded ${
                priceChange >= 0 
                  ? 'bg-[#26a69a20] text-[#26a69a]' 
                  : 'bg-[#ef535020] text-[#ef5350]'
              }`}>
                {priceChange >= 0 ? '+' : ''}{priceChangePercent}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Drawing Tools Toggle */}
          <button
            onClick={() => setShowDrawingTools(!showDrawingTools)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1 ${
              showDrawingTools 
                ? 'bg-[#ff980020] text-[#ff9800] border border-[#ff980050]' 
                : 'bg-[#2a2e39] text-[#787b86] border border-transparent hover:text-[#d1d4dc]'
            }`}
          >
            <span className="material-icons-round text-sm">draw</span>
            Draw
            {drawings.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#ff9800] text-white text-[9px] rounded-full">
                {drawings.length}
              </span>
            )}
          </button>
          
          {/* MA Toggle */}
          <button
            onClick={() => setShowMA(!showMA)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              showMA 
                ? 'bg-[#2962ff20] text-[#2962ff] border border-[#2962ff50]' 
                : 'bg-[#2a2e39] text-[#787b86] border border-transparent'
            }`}
          >
            MA{maPeriod}
          </button>
          
          {/* Time Range */}
          <div className="flex bg-[#1e222d] rounded-lg p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                  timeRange === r
                    ? 'bg-[#2962ff] text-white'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Drawing Toolbar */}
      {showDrawingTools && (
        <div className="px-4 py-2 border-b border-[#2a2e39] bg-[#131722]">
          <DrawingToolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            onClearAll={() => setDrawings([])}
            drawingsCount={drawings.length}
          />
        </div>
      )}

      {/* OHLC Info Bar */}
      {crosshairData && (
        <div className="px-4 py-1 bg-[#1e222d] border-b border-[#2a2e39] flex items-center gap-4 text-xs font-mono">
          <span className="text-[#787b86]">O <span className="text-[#d1d4dc]">{crosshairData.open?.toLocaleString()}</span></span>
          <span className="text-[#787b86]">H <span className="text-[#26a69a]">{crosshairData.high?.toLocaleString()}</span></span>
          <span className="text-[#787b86]">L <span className="text-[#ef5350]">{crosshairData.low?.toLocaleString()}</span></span>
          <span className="text-[#787b86]">C <span className={crosshairData.close >= crosshairData.open ? 'text-[#26a69a]' : 'text-[#ef5350]'}>{crosshairData.close?.toLocaleString()}</span></span>
          {showMA && crosshairData.sma && (
            <span className="text-[#787b86]">MA <span className="text-[#2962ff]">{crosshairData.sma?.toFixed(0)}</span></span>
          )}
        </div>
      )}

      {/* Main Chart Area */}
      <div className="relative" ref={chartContainerRef}>
        {/* Price Chart */}
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 60, left: 0, bottom: 0 }}
              onMouseMove={(e: any) => {
                if (e?.activePayload?.[0]?.payload && !activeTool) {
                  setCrosshairData(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setCrosshairData(null)}
            >
              <defs>
                <linearGradient id="maGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2962ff" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#2962ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                stroke={COLORS.GridLight}
                strokeDasharray="none"
                horizontal={true}
                vertical={true}
                opacity={0.5}
              />
              
              <XAxis
                dataKey="time"
                stroke={COLORS.Text}
                tick={{ fontSize: 10, fill: COLORS.Text }}
                tickLine={false}
                axisLine={{ stroke: COLORS.Grid }}
                minTickGap={60}
              />
              
              <YAxis
                domain={priceDomain}
                orientation="right"
                stroke={COLORS.Text}
                tick={{ fontSize: 10, fill: COLORS.Text }}
                tickLine={false}
                axisLine={{ stroke: COLORS.Grid }}
                tickFormatter={(val) => val.toLocaleString()}
                width={55}
              />

              <Tooltip content={<TradingViewTooltip />} />

              {/* Moving Average Area (subtle fill) */}
              {showMA && (
                <Area
                  type="monotone"
                  dataKey="sma"
                  stroke="none"
                  fill="url(#maGradient)"
                  fillOpacity={1}
                  isAnimationActive={false}
                />
              )}

              {/* Candlesticks */}
              <Bar
                dataKey="priceRange"
                shape={<TradingViewCandle />}
                isAnimationActive={false}
              />

              {/* Moving Average Line */}
              {showMA && (
                <Line
                  type="monotone"
                  dataKey="sma"
                  stroke={COLORS.MA}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}

              {/* Current Price Line */}
              {latestData && (
                <ReferenceLine
                  y={latestData.close}
                  stroke={priceChange >= 0 ? COLORS.Bullish : COLORS.Bearish}
                  strokeDasharray="3 3"
                  strokeOpacity={0.8}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Drawing Tools SVG Overlay */}
          {showDrawingTools && chartDimensions.width > 0 && (
            <ChartDrawingTools
              width={chartDimensions.width}
              height={350}
              priceMin={priceDomain[0]}
              priceMax={priceDomain[1]}
              dataLength={chartData.length}
              drawings={drawings}
              onDrawingsChange={setDrawings}
              activeTool={activeTool}
              onToolComplete={() => setActiveTool(null)}
              chartPadding={{ top: 10, right: 60, bottom: 0, left: 0 }}
            />
          )}
        </div>

        {/* Current Price Label */}
        {latestData && (
          <div 
            className={`absolute right-0 px-2 py-1 text-xs font-mono font-bold rounded-l ${
              priceChange >= 0 ? 'bg-[#26a69a] text-white' : 'bg-[#ef5350] text-white'
            }`}
            style={{ 
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          >
            {latestData.close?.toLocaleString()}
          </div>
        )}

        {/* Volume Chart */}
        <div className="h-[120px] border-t border-[#2a2e39]">
          <div className="px-4 py-1 text-xs text-[#787b86] font-mono flex items-center gap-2">
            <span>Vol</span>
            {latestData && (
              <span className={latestData.close >= latestData.open ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
                {(latestData.volume / 1000).toFixed(1)}K
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <ComposedChart
              data={chartData}
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
            >
              <CartesianGrid 
                stroke={COLORS.GridLight}
                horizontal={true}
                vertical={false}
                opacity={0.3}
              />
              
              <XAxis
                dataKey="time"
                stroke={COLORS.Text}
                tick={{ fontSize: 10, fill: COLORS.Text }}
                tickLine={false}
                axisLine={{ stroke: COLORS.Grid }}
                minTickGap={60}
              />
              
              <YAxis
                orientation="right"
                stroke={COLORS.Text}
                tick={{ fontSize: 9, fill: COLORS.Text }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (val / 1000).toFixed(0) + 'K'}
                width={55}
              />

              <Tooltip content={<VolumeTooltip />} />

              <Bar 
                dataKey="volume" 
                isAnimationActive={false}
                maxBarSize={15}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.close >= entry.open ? COLORS.Bullish : COLORS.Bearish}
                    fillOpacity={0.7}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#2a2e39] flex items-center justify-between text-[10px] text-[#787b86]">
        <div className="flex items-center gap-4">
          <span>📊 TradingView Style</span>
          {showMA && <span className="text-[#2962ff]">● MA{maPeriod}</span>}
          {drawings.length > 0 && (
            <span className="text-[#ff9800]">✏️ {drawings.length} drawings</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeTool && (
            <span className="text-[#ff9800] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#ff9800] rounded-full animate-pulse" />
              Drawing: {activeTool}
            </span>
          )}
          <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>UTC+7</span>
        </div>
      </div>
    </div>
  );
};

export default TradingViewChart;
