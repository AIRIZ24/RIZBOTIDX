import React, { useState } from 'react';
import StockChart from './StockChart';
import TradingViewChart from './TradingViewChart';
import QuickAnalysis from './QuickAnalysis';
import NewsSentimentPanel from './NewsSentimentPanel';
import { StockTicker, StockData, TimeRange } from '../types';

interface RealTimeMarketReviewProps {
  ticker: StockTicker;
  chartData: StockData[];
  timeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  loading: boolean;
  isNewsOpen: boolean;
  onOpenNews: () => void;
  onCloseNews: () => void;
}

const RealTimeMarketReview: React.FC<RealTimeMarketReviewProps> = ({
  ticker,
  chartData,
  timeRange,
  onRangeChange,
  loading,
  isNewsOpen,
  onOpenNews,
  onCloseNews,
}) => {
  const [chartStyle, setChartStyle] = useState<'tradingview' | 'advanced'>('tradingview');

  return (
    <div className="bg-[#141c2f] rounded-2xl p-6 border border-slate-800/60 shadow-xl flex flex-col gap-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <span className="material-icons-round text-blue-400">insights</span>
          Ulasan Pasar Real-Time
        </h2>
        <div className="flex items-center gap-2">
          {/* Chart Style Toggle */}
          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
            <button
              onClick={() => setChartStyle('tradingview')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1 ${
                chartStyle === 'tradingview'
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-icons-round text-sm">candlestick_chart</span>
              TradingView
            </button>
            <button
              onClick={() => setChartStyle('advanced')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1 ${
                chartStyle === 'advanced'
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-icons-round text-sm">analytics</span>
              Advanced
            </button>
          </div>
          <button
            onClick={onOpenNews}
            className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 p-2.5 rounded-xl transition-all border border-slate-700/50 hover:border-cyan-500/30"
          >
            <span className="material-icons-round text-lg">article</span>
            <span className="ml-2 text-xs font-semibold hidden sm:inline">Sentimen Berita</span>
          </button>
        </div>
      </div>
      
      {/* Chart - TradingView Style or Advanced */}
      {chartStyle === 'tradingview' ? (
        <TradingViewChart
          data={chartData}
          symbol={ticker.symbol}
          timeRange={timeRange}
          onRangeChange={onRangeChange}
          loading={loading}
        />
      ) : (
        <StockChart
          data={chartData}
          symbol={ticker.symbol}
          timeRange={timeRange}
          onRangeChange={onRangeChange}
          loading={loading}
        />
      )}
      
      {/* Quick Analysis */}
      <QuickAnalysis ticker={ticker} chartData={chartData} />
      {/* News Sentiment Modal */}
      <NewsSentimentPanel
        ticker={ticker}
        isOpen={isNewsOpen}
        onClose={onCloseNews}
      />
    </div>
  );
};

export default RealTimeMarketReview;
