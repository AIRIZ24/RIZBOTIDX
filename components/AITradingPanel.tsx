import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StockData, StockTicker } from '../types';

// AI Model Types
export type AIModel = 'gemini-2.0-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gpt-4o' | 'claude-sonnet';

interface AIModelConfig {
  id: AIModel;
  name: string;
  provider: string;
  description: string;
  icon: string;
  color: string;
  speed: 'fast' | 'medium' | 'slow';
  accuracy: number;
  features: string[];
}

const AI_MODELS: AIModelConfig[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'RIZBOT Flash',
    provider: 'RIZBOT AI',
    description: 'Ultra-fast model for real-time trading signals',
    icon: '⚡',
    color: '#4285f4',
    speed: 'fast',
    accuracy: 85,
    features: ['Real-time Analysis', 'Quick Decisions', 'Pattern Recognition'],
  },
  {
    id: 'gemini-2.5-pro',
    name: 'RIZBOT Pro',
    provider: 'RIZBOT AI',
    description: 'Advanced model with deep market analysis',
    icon: '🧠',
    color: '#ea4335',
    speed: 'medium',
    accuracy: 94,
    features: ['Deep Analysis', 'Multi-factor Models', 'Risk Assessment'],
  },
  {
    id: 'gemini-2.5-flash',
    name: 'RIZBOT Turbo',
    provider: 'RIZBOT AI',
    description: 'Balanced speed and accuracy for trading',
    icon: '💎',
    color: '#34a853',
    speed: 'fast',
    accuracy: 90,
    features: ['Balanced Performance', 'Quick Insights', 'Market Sentiment'],
  },
  {
    id: 'gpt-4o',
    name: 'RIZBOT Ultra',
    provider: 'RIZBOT AI',
    description: 'Multimodal AI with chart pattern expertise',
    icon: '🤖',
    color: '#10a37f',
    speed: 'medium',
    accuracy: 92,
    features: ['Chart Patterns', 'News Analysis', 'Technical Indicators'],
  },
  {
    id: 'claude-sonnet',
    name: 'RIZBOT Elite',
    provider: 'RIZBOT AI',
    description: 'Thoughtful analysis with risk-first approach',
    icon: '🎭',
    color: '#cc785c',
    speed: 'slow',
    accuracy: 91,
    features: ['Risk Analysis', 'Conservative Strategy', 'Long-term View'],
  },
];

// Trading Signal Types
interface TradingSignal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
  confidence: number;
  targetPrice: number;
  stopLoss: number;
  takeProfit: number;
  reasoning: string[];
  indicators: {
    rsi: number;
    macd: string;
    trend: string;
    volume: string;
  };
  timestamp: Date;
  model: AIModel;
  executed?: boolean;
  profit?: number;
}

interface AITradingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentStock: StockTicker | null;
  stockData: StockData[];
  onExecuteTrade?: (signal: TradingSignal) => void;
}

// Simulated AI Signal Generator (in real app, this would call actual AI APIs)
const generateAISignal = (
  stock: StockTicker,
  data: StockData[],
  model: AIModel,
  riskLevel: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
): TradingSignal => {
  const latestData = data[data.length - 1];
  const prevData = data[data.length - 2];
  
  // Calculate simple indicators
  const priceChange = ((latestData?.close || stock.price) - (prevData?.close || stock.price)) / (prevData?.close || stock.price) * 100;
  const avgVolume = data.slice(-20).reduce((sum, d) => sum + (d.volume || 0), 0) / 20;
  const volumeRatio = (latestData?.volume || 0) / avgVolume;
  
  // RSI calculation (simplified)
  const gains = data.slice(-14).filter((d, i, arr) => i > 0 && d.close > arr[i-1].close).length;
  const rsi = (gains / 14) * 100;
  
  // Determine signal based on indicators
  let action: TradingSignal['action'] = 'HOLD';
  let confidence = 50;
  const reasoning: string[] = [];
  
  if (rsi < 30 && volumeRatio > 1.2) {
    action = priceChange > -3 ? 'STRONG_BUY' : 'BUY';
    confidence = 75 + Math.random() * 20;
    reasoning.push('RSI menunjukkan oversold');
    reasoning.push('Volume di atas rata-rata');
  } else if (rsi > 70 && volumeRatio > 1.2) {
    action = priceChange < 3 ? 'STRONG_SELL' : 'SELL';
    confidence = 70 + Math.random() * 20;
    reasoning.push('RSI menunjukkan overbought');
    reasoning.push('Potensi koreksi tinggi');
  } else if (priceChange > 2) {
    action = 'BUY';
    confidence = 60 + Math.random() * 15;
    reasoning.push('Momentum positif terdeteksi');
  } else if (priceChange < -2) {
    action = 'SELL';
    confidence = 55 + Math.random() * 15;
    reasoning.push('Momentum negatif terdeteksi');
  }
  
  // Add model-specific reasoning
  const modelConfig = AI_MODELS.find(m => m.id === model);
  if (modelConfig) {
    confidence = confidence * (modelConfig.accuracy / 100);
    reasoning.push(`Analisis ${modelConfig.name}: ${modelConfig.features[0]}`);
  }
  
  const currentPrice = latestData?.close || stock.price;
  
  // Calculate ATR-like volatility for better stop/target
  const recentPrices = data.slice(-20).map(d => d.close);
  const priceVolatility = recentPrices.length > 1 
    ? Math.abs(Math.max(...recentPrices) - Math.min(...recentPrices)) / currentPrice * 100
    : 5;
  
  // Adjust targets based on volatility (min 3%, max 15%)
  const baseVolatility = Math.max(3, Math.min(15, priceVolatility)) / 100;
  
  // Risk level multipliers
  const riskMultipliers = {
    conservative: { target: 0.8, stop: 0.7, profit: 1.0 },
    moderate: { target: 1.0, stop: 1.0, profit: 1.0 },
    aggressive: { target: 1.5, stop: 1.3, profit: 1.8 },
  };
  const rm = riskMultipliers[riskLevel];
  
  // Calculate price levels based on action type
  let targetPrice: number;
  let stopLoss: number;
  let takeProfit: number;
  
  if (action.includes('BUY')) {
    // BUY: expecting price to go UP
    // Target Price: based on volatility and risk level
    targetPrice = Math.round(currentPrice * (1 + baseVolatility * 1.5 * rm.target));
    // Stop Loss: tighter for conservative, wider for aggressive
    stopLoss = Math.round(currentPrice * (1 - baseVolatility * rm.stop));
    // Take Profit: bigger for aggressive traders
    takeProfit = Math.round(currentPrice * (1 + baseVolatility * 2.5 * rm.profit));
  } else if (action.includes('SELL')) {
    // SELL: recommendation to exit/avoid, expecting price to go DOWN
    // Target Price: expected support level
    targetPrice = Math.round(currentPrice * (1 - baseVolatility * 1.5 * rm.target));
    // Stop Loss: resistance level (if wrong)
    stopLoss = Math.round(currentPrice * (1 + baseVolatility * rm.stop));
    // Take Profit: deeper support for aggressive
    takeProfit = Math.round(currentPrice * (1 - baseVolatility * 2.5 * rm.profit));
  } else {
    // HOLD: small range around current price
    targetPrice = Math.round(currentPrice * (1 + 0.02 * rm.target));
    stopLoss = Math.round(currentPrice * (1 - 0.02 * rm.stop));
    takeProfit = Math.round(currentPrice * (1 + 0.05 * rm.profit));
  }
  
  // Add risk level to reasoning
  const riskLabels = {
    conservative: 'Konservatif - Stop loss ketat',
    moderate: 'Moderat - Balanced risk/reward',
    aggressive: 'Agresif - Target lebih tinggi',
  };
  reasoning.push(riskLabels[riskLevel]);
  
  return {
    id: `signal-${Date.now()}`,
    symbol: stock.symbol,
    action,
    confidence: Math.min(95, Math.round(confidence)),
    targetPrice,
    stopLoss,
    takeProfit,
    reasoning,
    indicators: {
      rsi: Math.round(rsi),
      macd: priceChange > 0 ? 'Bullish' : 'Bearish',
      trend: priceChange > 1 ? 'Uptrend' : priceChange < -1 ? 'Downtrend' : 'Sideways',
      volume: volumeRatio > 1.2 ? 'High' : volumeRatio < 0.8 ? 'Low' : 'Normal',
    },
    timestamp: new Date(),
    model,
  };
};

const AITradingPanel: React.FC<AITradingPanelProps> = ({
  isOpen,
  onClose,
  currentStock,
  stockData,
  onExecuteTrade,
}) => {
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-2.5-flash');
  const [autoTrading, setAutoTrading] = useState(false);
  const [riskLevel, setRiskLevel] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'signals' | 'settings' | 'history'>('signals');
  const [tradeHistory, setTradeHistory] = useState<TradingSignal[]>([]);

  const currentModelConfig = useMemo(() => 
    AI_MODELS.find(m => m.id === selectedModel)!,
    [selectedModel]
  );

  // Generate AI Signal
  const generateSignal = useCallback(async () => {
    if (!currentStock || stockData.length < 20) return;
    
    setIsAnalyzing(true);
    
    // Simulate API delay based on model speed
    const delay = currentModelConfig.speed === 'fast' ? 1000 : 
                  currentModelConfig.speed === 'medium' ? 2000 : 3000;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const signal = generateAISignal(currentStock, stockData, selectedModel, riskLevel);
    setSignals(prev => [signal, ...prev.slice(0, 9)]);
    setIsAnalyzing(false);
    
    // Auto-execute if enabled
    if (autoTrading && signal.confidence >= 75 && signal.action !== 'HOLD') {
      handleExecuteTrade(signal);
    }
  }, [currentStock, stockData, selectedModel, currentModelConfig, autoTrading, riskLevel]);

  // Auto-refresh signals
  useEffect(() => {
    if (!isOpen || !currentStock) return;
    
    generateSignal();
    
    const interval = setInterval(() => {
      if (!isAnalyzing) {
        generateSignal();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [isOpen, currentStock, generateSignal, isAnalyzing]);

  const handleExecuteTrade = (signal: TradingSignal) => {
    const executedSignal = { ...signal, executed: true };
    setTradeHistory(prev => [executedSignal, ...prev]);
    setSignals(prev => prev.map(s => s.id === signal.id ? executedSignal : s));
    onExecuteTrade?.(signal);
  };

  const getActionColor = (action: TradingSignal['action']) => {
    switch (action) {
      case 'STRONG_BUY': return 'from-emerald-500 to-green-600';
      case 'BUY': return 'from-emerald-400 to-green-500';
      case 'SELL': return 'from-red-400 to-rose-500';
      case 'STRONG_SELL': return 'from-red-500 to-rose-600';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  const getActionIcon = (action: TradingSignal['action']) => {
    switch (action) {
      case 'STRONG_BUY': return '🚀';
      case 'BUY': return '📈';
      case 'SELL': return '📉';
      case 'STRONG_SELL': return '⚠️';
      default: return '⏸️';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-[#0f1629] to-[#1a1f3c] rounded-3xl border border-slate-700/50 shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header */}
        <div className="relative p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  AI Trading Engine
                  <span className="text-xs px-2 py-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                    PRO
                  </span>
                </h2>
                <p className="text-slate-400 text-sm">
                  {currentModelConfig.name} • {currentModelConfig.provider}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto Trading Toggle */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                autoTrading 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                  : 'bg-slate-800/50 border-slate-700 text-slate-400'
              }`}>
                <span className="material-icons text-lg">
                  {autoTrading ? 'autorenew' : 'pan_tool'}
                </span>
                <span className="text-sm font-medium">Auto Trade</span>
                <button
                  onClick={() => setAutoTrading(!autoTrading)}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    autoTrading ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-lg ${
                    autoTrading ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
          </div>

          {/* Current Stock Info */}
          {currentStock && (
            <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg font-bold">
                    {currentStock.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{currentStock.symbol}</p>
                    <p className="text-slate-500 text-sm">{currentStock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white font-mono">
                    Rp {currentStock.price.toLocaleString()}
                  </p>
                  <p className={`text-sm font-mono ${currentStock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentStock.change >= 0 ? '+' : ''}{currentStock.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {(['signals', 'settings', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                    : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/50 border border-transparent'
                }`}
              >
                <span className="material-icons text-sm">
                  {tab === 'signals' ? 'insights' : tab === 'settings' ? 'tune' : 'history'}
                </span>
                {tab === 'signals' ? 'AI Signals' : tab === 'settings' ? 'Settings' : 'History'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'signals' && (
            <div className="space-y-4">
              {/* Generate Signal Button */}
              <button
                onClick={generateSignal}
                disabled={isAnalyzing || !currentStock}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3"
              >
                {isAnalyzing ? (
                  <>
                    <span className="material-icons animate-spin">sync</span>
                    Menganalisis dengan {currentModelConfig.name}...
                  </>
                ) : (
                  <>
                    <span className="material-icons">auto_awesome</span>
                    Generate AI Signal
                  </>
                )}
              </button>

              {/* Signal Cards */}
              {signals.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                    <span className="material-icons text-4xl">psychology</span>
                  </div>
                  <p className="text-lg font-medium">Belum Ada Signal</p>
                  <p className="text-sm mt-1">Klik tombol di atas untuk generate AI trading signal</p>
                </div>
              ) : (
                signals.map((signal, index) => (
                  <div
                    key={signal.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      signal.executed 
                        ? 'bg-slate-800/20 border-slate-700/30 opacity-60'
                        : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Signal Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getActionColor(signal.action)} flex items-center justify-center text-2xl shadow-lg`}>
                          {getActionIcon(signal.action)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                              signal.action.includes('BUY') 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : signal.action.includes('SELL')
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {signal.action.replace('_', ' ')}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {signal.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-white font-bold text-lg mt-1">{signal.symbol}</p>
                        </div>
                      </div>
                      
                      {/* Confidence Meter */}
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                signal.confidence >= 80 ? 'bg-emerald-500' :
                                signal.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${signal.confidence}%` }}
                            />
                          </div>
                          <span className={`text-lg font-bold font-mono ${
                            signal.confidence >= 80 ? 'text-emerald-400' :
                            signal.confidence >= 60 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {signal.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price Targets */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 bg-slate-900/50 rounded-xl">
                        <p className="text-[10px] text-slate-500 uppercase">
                          {signal.action.includes('BUY') ? 'Target Harga' : 'Support Level'}
                        </p>
                        <p className={`font-mono font-bold ${
                          signal.action.includes('BUY') ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          Rp {signal.targetPrice.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-600">
                          {signal.action.includes('BUY') 
                            ? `+${((signal.targetPrice / (currentStock?.price || signal.targetPrice) - 1) * 100).toFixed(1)}%`
                            : `${((signal.targetPrice / (currentStock?.price || signal.targetPrice) - 1) * 100).toFixed(1)}%`
                          }
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-xl">
                        <p className="text-[10px] text-slate-500 uppercase">
                          {signal.action.includes('BUY') ? 'Stop Loss' : 'Resistance'}
                        </p>
                        <p className="text-red-400 font-mono font-bold">
                          Rp {signal.stopLoss.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-600">
                          {signal.action.includes('BUY')
                            ? `${((signal.stopLoss / (currentStock?.price || signal.stopLoss) - 1) * 100).toFixed(1)}%`
                            : `+${((signal.stopLoss / (currentStock?.price || signal.stopLoss) - 1) * 100).toFixed(1)}%`
                          }
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-xl">
                        <p className="text-[10px] text-slate-500 uppercase">
                          {signal.action.includes('BUY') ? 'Take Profit' : 'Target Turun'}
                        </p>
                        <p className={`font-mono font-bold ${
                          signal.action.includes('BUY') ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          Rp {signal.takeProfit.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-600">
                          {signal.action.includes('BUY')
                            ? `+${((signal.takeProfit / (currentStock?.price || signal.takeProfit) - 1) * 100).toFixed(1)}%`
                            : `${((signal.takeProfit / (currentStock?.price || signal.takeProfit) - 1) * 100).toFixed(1)}%`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Indicators */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        signal.indicators.rsi < 30 ? 'bg-emerald-500/20 text-emerald-400' :
                        signal.indicators.rsi > 70 ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        RSI: {signal.indicators.rsi}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        signal.indicators.macd === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        MACD: {signal.indicators.macd}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        signal.indicators.trend === 'Uptrend' ? 'bg-emerald-500/20 text-emerald-400' :
                        signal.indicators.trend === 'Downtrend' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {signal.indicators.trend}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-mono ${
                        signal.indicators.volume === 'High' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        Vol: {signal.indicators.volume}
                      </span>
                    </div>

                    {/* Reasoning */}
                    <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-700/30 mb-4">
                      <p className="text-[10px] text-slate-500 uppercase mb-2">AI Analysis</p>
                      <ul className="space-y-1">
                        {signal.reasoning.map((reason, i) => (
                          <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    {!signal.executed && signal.action !== 'HOLD' && (
                      <button
                        onClick={() => handleExecuteTrade(signal)}
                        className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                          signal.action.includes('BUY')
                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-lg shadow-red-500/20'
                        }`}
                      >
                        <span className="material-icons text-sm">
                          {signal.action.includes('BUY') ? 'add_shopping_cart' : 'sell'}
                        </span>
                        Execute {signal.action.replace('_', ' ')} Order
                      </button>
                    )}
                    
                    {signal.executed && (
                      <div className="w-full py-3 rounded-xl bg-slate-700/30 text-slate-400 text-center font-medium flex items-center justify-center gap-2">
                        <span className="material-icons text-sm">check_circle</span>
                        Order Executed
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Model Selection */}
              <div>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <span className="material-icons text-blue-400">psychology</span>
                  AI Model Selection
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {AI_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        selectedModel === model.id
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50'
                          : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${model.color}20` }}
                          >
                            {model.icon}
                          </div>
                          <div>
                            <p className="text-white font-bold">{model.name}</p>
                            <p className="text-slate-500 text-xs">{model.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Accuracy</p>
                            <p className="text-emerald-400 font-bold font-mono">{model.accuracy}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Speed</p>
                            <p className={`font-bold text-sm ${
                              model.speed === 'fast' ? 'text-emerald-400' :
                              model.speed === 'medium' ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {model.speed === 'fast' ? '⚡ Fast' : model.speed === 'medium' ? '🔄 Medium' : '🐢 Slow'}
                            </p>
                          </div>
                          {selectedModel === model.id && (
                            <span className="material-icons text-blue-400">check_circle</span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm mt-2">{model.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {model.features.map((feature, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-lg">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Level */}
              <div>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <span className="material-icons text-amber-400">warning</span>
                  Risk Management
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['conservative', 'moderate', 'aggressive'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setRiskLevel(level)}
                      className={`p-4 rounded-xl border transition-all ${
                        riskLevel === level
                          ? level === 'conservative' ? 'bg-blue-500/20 border-blue-500/50' :
                            level === 'moderate' ? 'bg-amber-500/20 border-amber-500/50' :
                            'bg-red-500/20 border-red-500/50'
                          : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                      }`}
                    >
                      <span className="text-2xl">
                        {level === 'conservative' ? '🛡️' : level === 'moderate' ? '⚖️' : '🔥'}
                      </span>
                      <p className={`font-bold mt-2 ${
                        level === 'conservative' ? 'text-blue-400' :
                        level === 'moderate' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {level === 'conservative' ? 'Low risk, stable returns' :
                         level === 'moderate' ? 'Balanced approach' :
                         'High risk, high reward'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Trading Settings */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <span className="material-icons text-emerald-400">autorenew</span>
                  Auto Trading Configuration
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">Enable Auto Trading</p>
                      <p className="text-slate-500 text-xs">Automatically execute high-confidence signals</p>
                    </div>
                    <button
                      onClick={() => setAutoTrading(!autoTrading)}
                      className={`relative w-14 h-7 rounded-full transition-all ${
                        autoTrading ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-lg ${
                        autoTrading ? 'left-8' : 'left-1'
                      }`} />
                    </button>
                  </div>
                  
                  {autoTrading && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                      <div className="flex items-start gap-2">
                        <span className="material-icons text-amber-400 text-sm mt-0.5">warning</span>
                        <div>
                          <p className="text-amber-400 text-sm font-medium">Auto Trading Active</p>
                          <p className="text-slate-400 text-xs mt-1">
                            Signals dengan confidence ≥75% akan dieksekusi otomatis. Pastikan Anda memahami risiko trading otomatis.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {tradeHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <span className="material-icons text-4xl mb-3 block">receipt_long</span>
                  <p className="text-lg">Belum Ada Trade History</p>
                  <p className="text-sm mt-1">Execute trading signals to see history here</p>
                </div>
              ) : (
                tradeHistory.map(trade => (
                  <div
                    key={trade.id}
                    className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          trade.action.includes('BUY') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          <span className="material-icons">
                            {trade.action.includes('BUY') ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-bold">{trade.symbol}</p>
                          <p className="text-slate-500 text-xs">{trade.action.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono">Rp {trade.targetPrice.toLocaleString()}</p>
                        <p className="text-slate-500 text-xs">{trade.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              🚀 {currentModelConfig.name} Active
            </div>
            <p className="text-xs text-slate-600">
              ⚠️ Sinyal AI hanya sebagai referensi. Selalu lakukan riset sendiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITradingPanel;
