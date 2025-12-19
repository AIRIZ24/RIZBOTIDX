import React, { useState, useCallback, useEffect, useRef } from 'react';
import { analyzeStockDeep, speakAnalysis } from '../services/geminiService';
import { StockTicker, StockData } from '../types';

interface PredictorProps {
  ticker: StockTicker;
  chartData?: StockData[];
}

// Built-in Technical Analysis (used when API fails)
const generateLocalAnalysis = (ticker: StockTicker, chartData?: StockData[]): string => {
  const price = ticker.price;
  const change = ticker.change || 0;
  const changePercent = ticker.changePercent || 0;
  const high = ticker.high || price;
  const low = ticker.low || price;
  const open = ticker.open || price;
  
  // Calculate indicators from chart data if available
  let rsi = 50;
  let trend = 'sideways';
  let support = low * 0.97;
  let resistance = high * 1.03;
  let volumeTrend = 'normal';
  let ma5 = price;
  let ma20 = price;
  
  if (chartData && chartData.length >= 20) {
    // RSI calculation
    let gains = 0, losses = 0;
    const rsiPeriod = Math.min(14, chartData.length - 1);
    for (let i = chartData.length - rsiPeriod; i < chartData.length; i++) {
      const diff = chartData[i].close - chartData[i - 1].close;
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / rsiPeriod;
    const avgLoss = losses / rsiPeriod;
    rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    
    // MA calculations
    ma5 = chartData.slice(-5).reduce((s, d) => s + d.close, 0) / 5;
    ma20 = chartData.slice(-20).reduce((s, d) => s + d.close, 0) / 20;
    
    // Trend detection
    trend = ma5 > ma20 * 1.01 ? 'uptrend' : ma5 < ma20 * 0.99 ? 'downtrend' : 'sideways';
    
    // Support/Resistance
    const lows = chartData.slice(-20).map(d => d.low);
    const highs = chartData.slice(-20).map(d => d.high);
    support = Math.min(...lows);
    resistance = Math.max(...highs);
    
    // Volume trend
    const recentVol = chartData.slice(-5).reduce((s, d) => s + d.volume, 0) / 5;
    const prevVol = chartData.slice(-10, -5).reduce((s, d) => s + d.volume, 0) / 5;
    volumeTrend = recentVol > prevVol * 1.2 ? 'tinggi' : recentVol < prevVol * 0.8 ? 'rendah' : 'normal';
  }
  
  // Determine signal
  let signal = 'HOLD';
  let confidence = 50;
  let signalEmoji = '⏸️';
  
  if (rsi < 30 && trend !== 'downtrend') {
    signal = 'STRONG BUY';
    confidence = 80;
    signalEmoji = '🟢';
  } else if (rsi < 40 && trend === 'uptrend') {
    signal = 'BUY';
    confidence = 70;
    signalEmoji = '🟢';
  } else if (rsi > 70 && trend !== 'uptrend') {
    signal = 'STRONG SELL';
    confidence = 80;
    signalEmoji = '🔴';
  } else if (rsi > 60 && trend === 'downtrend') {
    signal = 'SELL';
    confidence = 70;
    signalEmoji = '🔴';
  } else if (trend === 'uptrend' && changePercent > 0) {
    signal = 'BUY';
    confidence = 60;
    signalEmoji = '🟢';
  } else if (trend === 'downtrend' && changePercent < 0) {
    signal = 'SELL';
    confidence = 60;
    signalEmoji = '🔴';
  }
  
  // Calculate targets
  const targetUp = Math.round(price * 1.05);
  const targetDown = Math.round(price * 0.95);
  const stopLoss = Math.round(price * 0.97);
  const takeProfit = Math.round(price * 1.08);
  
  // Generate analysis text
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **KESIMPULAN & REKOMENDASI UTAMA**

| Parameter | Nilai |
|-----------|-------|
| ${signalEmoji} Sinyal | **${signal}** |
| 📊 Keyakinan | **${confidence}%** |
| 📈 Trend | **${trend === 'uptrend' ? '↗️ Uptrend' : trend === 'downtrend' ? '↘️ Downtrend' : '↔️ Sideways'}** |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **ANALISIS INDIKATOR TEKNIKAL**

**RSI (14)**: ${rsi.toFixed(1)}
- Status: ${rsi < 30 ? '🟢 OVERSOLD - Potensi rebound!' : rsi > 70 ? '🔴 OVERBOUGHT - Waspada koreksi!' : '⚪ NEUTRAL'}
- ${rsi < 30 ? 'RSI di bawah 30 menunjukkan saham oversold, peluang buy.' : rsi > 70 ? 'RSI di atas 70 menunjukkan overbought, pertimbangkan taking profit.' : 'RSI dalam zona netral, tunggu konfirmasi lebih lanjut.'}

**Moving Average**:
- MA5: Rp ${Math.round(ma5).toLocaleString()}
- MA20: Rp ${Math.round(ma20).toLocaleString()}
- ${ma5 > ma20 ? '✅ Golden Cross - MA5 di atas MA20 (Bullish)' : '❌ Death Cross - MA5 di bawah MA20 (Bearish)'}

**Volume**: ${volumeTrend === 'tinggi' ? '📈 Di atas rata-rata (konfirmasi momentum)' : volumeTrend === 'rendah' ? '📉 Di bawah rata-rata (momentum lemah)' : '➡️ Normal'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 **KONDISI HARGA SAAT INI**

| Level | Harga |
|-------|-------|
| 🔼 High Hari Ini | Rp ${high.toLocaleString()} |
| ⚪ Harga Saat Ini | Rp ${price.toLocaleString()} |
| 🔽 Low Hari Ini | Rp ${low.toLocaleString()} |
| 📊 Perubahan | ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}% |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **LEVEL-LEVEL KUNCI**

| Level | Harga | Keterangan |
|-------|-------|------------|
| 🔴 Resistance | Rp ${Math.round(resistance).toLocaleString()} | Level tertinggi 20 hari |
| 🎯 Target | Rp ${targetUp.toLocaleString()} | Target +5% |
| ⚪ Harga Saat Ini | Rp ${price.toLocaleString()} | - |
| 🟢 Support | Rp ${Math.round(support).toLocaleString()} | Level terendah 20 hari |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **STRATEGI TRADING**

${signal.includes('BUY') ? `**Untuk Entry BELI:**
- 🟢 Entry Point: Rp ${Math.round(price * 0.99).toLocaleString()} - Rp ${price.toLocaleString()}
- 🎯 Target 1: Rp ${targetUp.toLocaleString()} (+5%)
- 🎯 Target 2: Rp ${takeProfit.toLocaleString()} (+8%)
- 🛑 Stop Loss: Rp ${stopLoss.toLocaleString()} (-3%)
- ⚖️ Risk/Reward: 1:2.5` : 
signal.includes('SELL') ? `**Rekomendasi JUAL/HINDARI:**
- ⚠️ Pertimbangkan taking profit jika memiliki posisi
- 🛑 Stop Loss: Rp ${Math.round(price * 1.03).toLocaleString()} (+3%)
- 📉 Target koreksi: Rp ${targetDown.toLocaleString()} (-5%)` :
`**HOLD - Tunggu Konfirmasi:**
- Belum ada sinyal yang jelas
- Pantau level Support: Rp ${Math.round(support).toLocaleString()}
- Pantau level Resistance: Rp ${Math.round(resistance).toLocaleString()}`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **PERINGATAN & CATATAN**

1. ${rsi > 70 ? '⚠️ RSI overbought - risiko koreksi tinggi' : rsi < 30 ? '💡 RSI oversold - potensi technical rebound' : '📊 RSI dalam zona netral'}
2. ${volumeTrend === 'tinggi' ? '✅ Volume tinggi mendukung pergerakan harga' : '⚠️ Volume rendah - hati-hati false breakout'}
3. ${trend === 'uptrend' ? '📈 Trend utama masih bullish' : trend === 'downtrend' ? '📉 Trend utama bearish - trading melawan arah berisiko' : '↔️ Pasar dalam konsolidasi'}

📌 **DISCLAIMER**: Analisis ini bersifat edukatif dan BUKAN merupakan ajakan untuk membeli atau menjual. Selalu lakukan riset mandiri (DYOR) dan sesuaikan dengan profil risiko Anda. Pasang STOP LOSS untuk melindungi modal!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 *Analisis dihasilkan secara lokal berdasarkan indikator teknikal*
🕐 *Timestamp: ${new Date().toLocaleString('id-ID')}*`;
};

const Predictor: React.FC<PredictorProps> = ({ ticker, chartData }) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [displayedText, setDisplayedText] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Typing effect like ChatGPT
  useEffect(() => {
    if (!analysis || displayedText === analysis) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const chars = analysis.split('');
    let currentIndex = displayedText.length;

    const typingInterval = setInterval(() => {
      if (currentIndex < chars.length) {
        // Type multiple characters at once for faster effect
        const charsToAdd = Math.min(3, chars.length - currentIndex);
        setDisplayedText(prev => prev + chars.slice(currentIndex, currentIndex + charsToAdd).join(''));
        currentIndex += charsToAdd;
        
        // Auto-scroll to bottom
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 15); // Fast typing speed

    return () => clearInterval(typingInterval);
  }, [analysis]);

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setAnalysis("");
    setDisplayedText("");
    
    // Simulate thinking phases
    const phases = [
      "Menganalisis pola chart...",
      "Memeriksa indikator teknikal...",
      "Evaluasi momentum pasar...",
      "Menyusun rekomendasi..."
    ];
    
    let phaseIndex = 0;
    const phaseInterval = setInterval(() => {
      setThinkingPhase(phases[phaseIndex % phases.length]);
      phaseIndex++;
    }, 2000);

    try {
      // Create comprehensive data summary for analysis
      const priceChange = ticker.change || 0;
      const priceChangePercent = ticker.changePercent || 0;
      const volume = ticker.volume || 0;
      const high = ticker.high || ticker.price;
      const low = ticker.low || ticker.price;
      const open = ticker.open || ticker.price;
      
      const summary = `
=== DATA SAHAM ${ticker.symbol} ===
📊 HARGA & PERUBAHAN:
- Harga Terakhir: Rp ${ticker.price.toLocaleString('id-ID')}
- Open: Rp ${open.toLocaleString('id-ID')}
- High: Rp ${high.toLocaleString('id-ID')}
- Low: Rp ${low.toLocaleString('id-ID')}
- Perubahan: ${priceChange >= 0 ? '+' : ''}${priceChange.toLocaleString('id-ID')} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)

📈 INFORMASI TAMBAHAN:
- Sektor: ${ticker.sector || 'Tidak tersedia'}
- Volume: ${volume > 0 ? volume.toLocaleString('id-ID') : 'Tidak tersedia'}
- Market Cap: ${ticker.marketCap ? 'Rp ' + (ticker.marketCap / 1000000000000).toFixed(2) + ' T' : 'Tidak tersedia'}

📉 KONDISI PASAR:
- Status: ${priceChangePercent > 2 ? 'Strong Bullish' : priceChangePercent > 0 ? 'Bullish' : priceChangePercent < -2 ? 'Strong Bearish' : priceChangePercent < 0 ? 'Bearish' : 'Neutral'}
- Range Hari Ini: ${((high - low) / low * 100).toFixed(2)}%
- Posisi dalam Range: ${((ticker.price - low) / (high - low) * 100).toFixed(0)}%

Lakukan analisis teknikal lengkap berdasarkan data di atas.
      `;
      
      const result = await analyzeStockDeep(ticker.symbol, summary);
      
      // Check if API returned error, use local analysis as fallback
      if (result.startsWith('❌')) {
        console.log('API failed, using local analysis fallback');
        const localResult = generateLocalAnalysis(ticker, chartData);
        setAnalysis(localResult);
      } else {
        setAnalysis(result);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Use local analysis as fallback on any error
      const localResult = generateLocalAnalysis(ticker, chartData);
      setAnalysis(localResult);
    } finally {
      clearInterval(phaseInterval);
      setThinkingPhase("");
      setLoading(false);
    }
  }, [ticker, chartData]);

  const handleSpeak = useCallback(async () => {
    if (!analysis) return;
    setIsPlaying(true);
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = await speakAnalysis(analysis.substring(0, 400) + "...");
      if (buffer) {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        source.onended = () => setIsPlaying(false);
      } else {
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
  }, [analysis]);

  return (
    <div className="bg-[#141c2f] rounded-2xl p-6 border border-slate-800/60 shadow-xl h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2.5 text-white">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="material-icons-round text-white text-lg">psychology</span>
            </div>
            Analisis AI
          </h2>
          <p className="text-[11px] text-slate-500 mt-1.5 ml-[46px]">
            Berbasis <span className="text-blue-400">Technical Analysis for Mega Profit</span>
          </p>
        </div>
        <span className="text-[10px] bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/20 font-mono flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          RIZBOT AI
        </span>
      </div>

      {/* Analysis Content */}
      <div 
        ref={containerRef}
        className="flex-1 bg-[#0a0e17] rounded-xl p-4 mb-5 overflow-y-auto font-mono text-sm border border-slate-800/40 custom-scrollbar relative min-h-[200px]"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-5">
            {/* Animated Brain */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-xl shadow-blue-500/30">
                <span className="material-icons-round text-white text-3xl">psychology</span>
              </div>
              <div className="absolute -inset-2 bg-blue-500/20 rounded-3xl animate-ping"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-blue-400 font-bold text-sm">Sedang Berpikir Keras...</p>
              <p className="text-slate-500 text-xs animate-pulse">{thinkingPhase}</p>
            </div>
            {/* Progress Dots */}
            <div className="flex gap-1.5">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-500/50"
                  style={{ 
                    animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`
                  }}
                />
              ))}
            </div>
          </div>
        ) : displayedText ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-slate-300 leading-relaxed text-[13px] whitespace-pre-wrap">
              {displayedText.split('\n').map((line, i) => {
                // Format horizontal separator
                if (line.includes('━━━━━━') || line.includes('───────')) {
                  return (
                    <div key={i} className="border-t border-slate-700/50 my-4"></div>
                  );
                }
                // Format main headers with emojis
                if (line.startsWith('🎯') || line.startsWith('📊') || line.startsWith('📈') || 
                    line.startsWith('📉') || line.startsWith('🕯️') || line.startsWith('✅') || 
                    line.startsWith('⚠️') || line.startsWith('💰') || line.startsWith('🔊') ||
                    line.startsWith('🧠') || line.startsWith('📍') || line.startsWith('🔄')) {
                  return (
                    <div key={i} className="text-blue-400 font-bold mt-5 mb-3 text-[14px] flex items-center gap-2">
                      {line}
                    </div>
                  );
                }
                // Format table headers
                if (line.includes('| Level |') || line.includes('| Sinyal |') || line.includes('|-----')) {
                  if (line.includes('|-----')) {
                    return null; // Skip separator line
                  }
                  return (
                    <div key={i} className="text-xs text-slate-500 font-mono bg-slate-800/30 px-3 py-2 rounded-t-lg mt-3 border-b border-slate-700/50">
                      {line}
                    </div>
                  );
                }
                // Format table rows
                if (line.startsWith('|') && line.includes('|')) {
                  const isResistance = line.includes('🔴') || line.includes('🟠') || line.includes('Resistance');
                  const isSupport = line.includes('🟢') || line.includes('Support');
                  const isCurrent = line.includes('⚪') || line.includes('Saat Ini');
                  
                  let rowClass = 'text-slate-300';
                  if (isResistance) rowClass = 'text-red-400';
                  if (isSupport) rowClass = 'text-emerald-400';
                  if (isCurrent) rowClass = 'text-yellow-400 font-bold';
                  
                  return (
                    <div key={i} className={`text-xs font-mono bg-slate-800/20 px-3 py-1.5 ${rowClass}`}>
                      {line}
                    </div>
                  );
                }
                // Format bold text with **
                if (line.includes('**')) {
                  const parts = line.split(/\*\*(.*?)\*\*/g);
                  return (
                    <div key={i} className="my-1">
                      {parts.map((part, j) => 
                        j % 2 === 1 ? (
                          <span key={j} className="text-white font-bold">{part}</span>
                        ) : (
                          <span key={j}>{part}</span>
                        )
                      )}
                    </div>
                  );
                }
                // Format bullet points
                if (line.startsWith('-') || line.startsWith('•')) {
                  const content = line.replace(/^[-•]\s*/, '');
                  // Check for sub-items with arrows or colons
                  const hasValue = content.includes(':') || content.includes('→');
                  
                  return (
                    <div key={i} className="ml-4 text-slate-300 flex items-start gap-2 my-1.5">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span className={hasValue ? 'flex-1' : ''}>{content}</span>
                    </div>
                  );
                }
                // Format numbered lists
                if (/^\d+\./.test(line)) {
                  return (
                    <div key={i} className="ml-4 text-slate-300 flex items-start gap-2 my-1.5">
                      <span className="text-blue-400 font-mono text-xs">{line.match(/^\d+/)?.[0]}.</span>
                      <span>{line.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  );
                }
                // Format STRONG BUY / BUY signals
                if (line.includes('STRONG BUY') || line.includes('🟢')) {
                  return (
                    <div key={i} className="text-emerald-400 font-bold my-2 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                      {line}
                    </div>
                  );
                }
                // Format BUY signals
                if (line.includes('BUY') && !line.includes('STRONG')) {
                  return (
                    <div key={i} className="text-emerald-400 font-semibold my-1">
                      {line}
                    </div>
                  );
                }
                // Format STRONG SELL / SELL signals
                if (line.includes('STRONG SELL') || line.includes('🔴')) {
                  return (
                    <div key={i} className="text-red-400 font-bold my-2 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                      {line}
                    </div>
                  );
                }
                if (line.includes('SELL') && !line.includes('STRONG')) {
                  return (
                    <div key={i} className="text-red-400 font-semibold my-1">
                      {line}
                    </div>
                  );
                }
                // Format HOLD signals
                if (line.includes('HOLD') || line.includes('TAHAN') || line.includes('⚪')) {
                  return (
                    <div key={i} className="text-yellow-400 font-semibold my-1">
                      {line}
                    </div>
                  );
                }
                // Format Entry/Target/Stop Loss
                if (line.includes('Entry') || line.includes('🟢 Entry')) {
                  return (
                    <div key={i} className="text-emerald-400 my-1 flex items-center gap-2">
                      <span className="text-emerald-500">▸</span> {line}
                    </div>
                  );
                }
                if (line.includes('Target') || line.includes('🎯')) {
                  return (
                    <div key={i} className="text-blue-400 my-1 flex items-center gap-2">
                      <span className="text-blue-500">▸</span> {line}
                    </div>
                  );
                }
                if (line.includes('Stop Loss') || line.includes('🛑')) {
                  return (
                    <div key={i} className="text-red-400 my-1 flex items-center gap-2">
                      <span className="text-red-500">▸</span> {line}
                    </div>
                  );
                }
                // Format Risk/Reward
                if (line.includes('Risk/Reward') || line.includes('⚖️')) {
                  return (
                    <div key={i} className="text-purple-400 my-1 flex items-center gap-2">
                      <span className="text-purple-500">▸</span> {line}
                    </div>
                  );
                }
                // Format DISCLAIMER
                if (line.includes('DISCLAIMER') || line.includes('📌')) {
                  return (
                    <div key={i} className="text-amber-400/80 text-xs mt-4 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 italic">
                      {line}
                    </div>
                  );
                }
                // Format indicator values (RSI, MACD, etc.)
                if (line.includes('RSI:') || line.includes('MACD:') || line.includes('Histogram:')) {
                  return (
                    <div key={i} className="text-cyan-400 my-1 font-mono text-xs">
                      {line}
                    </div>
                  );
                }
                // Format Uptrend/Downtrend/Sideways
                if (line.includes('Uptrend') || line.includes('↗️')) {
                  return <div key={i} className="text-emerald-400 my-1">{line}</div>;
                }
                if (line.includes('Downtrend') || line.includes('↘️')) {
                  return <div key={i} className="text-red-400 my-1">{line}</div>;
                }
                if (line.includes('Sideways') || line.includes('↔️')) {
                  return <div key={i} className="text-yellow-400 my-1">{line}</div>;
                }
                // Default line
                return <div key={i} className="my-0.5">{line}</div>;
              })}
              {/* Typing cursor */}
              {isTyping && (
                <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-slate-600 flex flex-col items-center justify-center h-full gap-4 text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
              <span className="material-icons-round text-slate-600 text-3xl">analytics</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400 font-medium">Siap Menganalisis {ticker.symbol}</p>
              <p className="text-xs text-slate-600">Klik tombol di bawah untuk memulai analisis teknikal profesional</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAnalyze}
          disabled={loading || isTyping}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <span className="material-icons-round text-lg">{loading ? 'hourglass_top' : isTyping ? 'edit_note' : 'auto_awesome'}</span>
          {loading ? 'Menganalisis...' : isTyping ? 'Mengetik...' : 'Mulai Analisis'}
        </button>
        {analysis && (
          <button
            onClick={handleSpeak}
            disabled={isPlaying}
            className={`w-14 rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${
              isPlaying 
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-slate-800/50 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
            }`}
            title="Bacakan Analisis"
          >
            <span className="material-icons-round">{isPlaying ? 'volume_up' : 'volume_mute'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Predictor;