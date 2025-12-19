import React, { useState, useEffect, useCallback } from 'react';
import { StockTicker } from '../types';
import {
  NewsArticle,
  fetchAndAnalyzeNews,
  getNewsSentimentSummary,
  formatRelativeTime,
} from '../services/newsService';

interface NewsSentimentPanelProps {
  ticker: StockTicker;
  isOpen: boolean;
  onClose: () => void;
}

const NewsSentimentPanel: React.FC<NewsSentimentPanelProps> = ({
  ticker,
  isOpen,
  onClose,
}) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallSentiment, setOverallSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [sentimentScore, setSentimentScore] = useState(0);
  const [sentimentStats, setSentimentStats] = useState({ bullish: 0, bearish: 0, neutral: 0 });
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const loadNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const summary = await getNewsSentimentSummary(ticker.symbol);
      setNews(summary.latestNews);
      setOverallSentiment(summary.overallSentiment);
      setSentimentScore(summary.averageScore);
      setSentimentStats({
        bullish: summary.bullishCount,
        bearish: summary.bearishCount,
        neutral: summary.neutralCount,
      });
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setIsLoading(false);
    }
  }, [ticker.symbol]);

  useEffect(() => {
    if (isOpen) {
      loadNews();
    }
  }, [isOpen, loadNews]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-emerald-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'bg-emerald-500/20 border-emerald-500/30';
      case 'bearish': return 'bg-red-500/20 border-red-500/30';
      default: return 'bg-slate-700/50 border-slate-600/30';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'trending_up';
      case 'bearish': return 'trending_down';
      default: return 'trending_flat';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'BULLISH 🐂';
      case 'bearish': return 'BEARISH 🐻';
      default: return 'NEUTRAL ⚖️';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#141c2f] rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="material-icons-round text-white">article</span>
              </div>
              News Sentiment: {ticker.symbol}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-icons-round text-lg">close</span>
            </button>
          </div>

          {/* Overall Sentiment Card */}
          {!isLoading && (
            <div className={`mt-4 p-4 rounded-xl border ${getSentimentBg(overallSentiment)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    overallSentiment === 'bullish' ? 'bg-emerald-500/30' :
                    overallSentiment === 'bearish' ? 'bg-red-500/30' : 'bg-slate-600/30'
                  }`}>
                    <span className={`material-icons-round text-2xl ${getSentimentColor(overallSentiment)}`}>
                      {getSentimentIcon(overallSentiment)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Overall Sentiment</p>
                    <p className={`text-lg font-bold ${getSentimentColor(overallSentiment)}`}>
                      {getSentimentLabel(overallSentiment)}
                    </p>
                  </div>
                </div>
                
                {/* Sentiment Meter */}
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Sentiment Score</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          sentimentScore > 0 ? 'bg-emerald-500' : sentimentScore < 0 ? 'bg-red-500' : 'bg-slate-500'
                        }`}
                        style={{ 
                          width: `${Math.abs(sentimentScore) * 50 + 50}%`,
                          marginLeft: sentimentScore < 0 ? `${50 - Math.abs(sentimentScore) * 50}%` : '50%'
                        }}
                      />
                    </div>
                    <span className={`font-mono font-bold ${getSentimentColor(overallSentiment)}`}>
                      {sentimentScore > 0 ? '+' : ''}{(sentimentScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-700/30">
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{sentimentStats.bullish}</p>
                  <p className="text-[10px] text-slate-500">Bullish</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-400">{sentimentStats.neutral}</p>
                  <p className="text-[10px] text-slate-500">Neutral</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-400">{sentimentStats.bearish}</p>
                  <p className="text-[10px] text-slate-500">Bearish</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* News List */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <span className="material-icons-round text-4xl text-blue-400 animate-spin">sync</span>
              <p className="text-slate-500">Menganalisis berita dengan AI...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <span className="material-icons-round text-4xl mb-2 block">newspaper</span>
              <p>Tidak ada berita terbaru</p>
            </div>
          ) : (
            <div className="space-y-3">
              {news.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(selectedArticle?.id === article.id ? null : article)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedArticle?.id === article.id 
                      ? 'bg-slate-800/50 border-blue-500/30' 
                      : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Sentiment Badge */}
                    <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${
                      article.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                      article.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' : 
                      'bg-slate-700/50 text-slate-400'
                    }`}>
                      <span className="material-icons-round">
                        {getSentimentIcon(article.sentiment || 'neutral')}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                        <span>{article.source}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(article.publishedAt)}</span>
                      </div>
                    </div>

                    {/* Score Badge */}
                    {article.sentimentScore !== undefined && (
                      <div className={`px-2 py-1 rounded-lg text-xs font-mono font-bold ${
                        article.sentimentScore > 0 ? 'bg-emerald-500/20 text-emerald-400' :
                        article.sentimentScore < 0 ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {article.sentimentScore > 0 ? '+' : ''}{(article.sentimentScore * 100).toFixed(0)}
                      </div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {selectedArticle?.id === article.id && (
                    <div className="mt-4 pt-4 border-t border-slate-700/30 space-y-3">
                      <p className="text-sm text-slate-300">{article.summary}</p>
                      
                      {article.sentimentReason && (
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-xs text-slate-500 mb-1">🤖 Analisis AI</p>
                          <p className="text-sm text-slate-300">{article.sentimentReason}</p>
                        </div>
                      )}

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Baca selengkapnya
                        <span className="material-icons-round text-sm">open_in_new</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              <span className="material-icons-round text-sm align-middle mr-1">psychology</span>
              Powered by RIZBOT AI
            </p>
            <button
              onClick={loadNews}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all text-xs disabled:opacity-50"
            >
              <span className={`material-icons-round text-sm ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsSentimentPanel;
