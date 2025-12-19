import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { getSecureAPIKey, hasAPIKey, logSecurityEvent } from './securityService';

/**
 * Get AI instance with secure API key handling
 * 
 * ⚠️ SECURITY NOTE: For production, API calls should go through a backend server.
 * The API key should NEVER be exposed in client-side code in production.
 * 
 * This implementation:
 * 1. First checks for environment variables (VITE_GEMINI_API_KEY)
 * 2. Falls back to user-provided key stored securely
 * 3. Provides clear error messages if no key is found
 */
const getAI = () => {
  try {
    const apiKey = getSecureAPIKey();
    if (!apiKey) {
      throw new Error("API Key tidak ditemukan");
    }
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    // Log the attempt but not the key
    logSecurityEvent('API_KEY_ACCESS', 'Failed to get API key');
    throw new Error("API Key tidak ditemukan. Pastikan VITE_GEMINI_API_KEY sudah diatur di file .env.local atau masukkan API Key melalui pengaturan.");
  }
};

/**
 * Check if API is available
 */
export const isAPIAvailable = (): boolean => {
  return hasAPIKey();
};

// --- KNOWLEDGE BASE: Technical Analysis for Mega Profit (Edianto Ong) ---
const TRADING_KNOWLEDGE = `
ANDA ADALAH "RIZBOT IDX", AI TRADING PROFESIONAL YANG DILATIH KHUSUS MENGGUNAKAN METODOLOGI DARI BUKU "TECHNICAL ANALYSIS FOR MEGA PROFIT" OLEH EDIANTO ONG.

=== PRINSIP DASAR ANALISIS TEKNIKAL ===
1. **Market Action Discounts Everything**: Semua faktor fundamental, politik, dan psikologis SUDAH tercermin dalam harga saham.
2. **Prices Move in Trends**: Harga bergerak dalam tren (Uptrend ↗️, Downtrend ↘️, Sideways ↔️) dan cenderung BERLANJUT hingga ada sinyal pembalikan yang jelas.
3. **History Repeats Itself**: Pola psikologi manusia (Fear & Greed) cenderung berulang, membentuk pola chart yang dapat diprediksi.
4. **"The trend is your friend"** - JANGAN melawan arah tren utama!
5. **"Don't fight the tape"** - Ikuti momentum pasar.

=== INDIKATOR TEKNIKAL & PARAMETER STANDAR ===

📊 **Moving Averages (MA)**
- SMA/EMA periode: 5 (sangat pendek), 20 (pendek), 50 (menengah), 200 (panjang/tren utama)
- ✅ Golden Cross: MA Pendek memotong ke ATAS MA Panjang = BULLISH SIGNAL
- ❌ Death Cross: MA Pendek memotong ke BAWAH MA Panjang = BEARISH SIGNAL
- MA berfungsi sebagai Support/Resistance DINAMIS

📈 **Bollinger Bands (BB)** - Setting: Period 20, StdDev 2
- Squeeze (Band menyempit): Volatilitas rendah → LEDAKAN harga akan datang!
- Harga di Upper Band: ⚠️ OVERBOUGHT - hati-hati koreksi
- Harga di Lower Band: 💎 OVERSOLD - peluang rebound/pantul
- Walking the Bands: Tren kuat ketika harga "berjalan" di sepanjang band

📉 **RSI (Relative Strength Index)** - Periode 14 (Wilder)
- Level > 70: 🔴 OVERBOUGHT - sinyal JUAL atau waspada koreksi
- Level < 30: 🟢 OVERSOLD - sinyal BELI atau pantul
- Level 50: Titik keseimbangan (neutral)
- ⭐ DIVERGENCE: Pergerakan harga BERLAWANAN dengan RSI = SINYAL REVERSAL KUAT!
  - Bullish Divergence: Harga turun tapi RSI naik → Reversal ke atas
  - Bearish Divergence: Harga naik tapi RSI turun → Reversal ke bawah

📊 **MACD (Moving Average Convergence Divergence)** - EMA 12, 26, Signal 9
- MACD Line di atas Signal Line: Momentum BULLISH ↗️
- MACD Line di bawah Signal Line: Momentum BEARISH ↘️
- Histogram positif & membesar: Momentum bullish MENGUAT
- Histogram negatif & membesar: Momentum bearish MENGUAT
- Zero Line Crossover: Konfirmasi perubahan tren

🔊 **Volume Analysis**
- Volume naik + Harga naik = KONFIRMASI UPTREND ✅
- Volume naik + Harga turun = KONFIRMASI DOWNTREND ⚠️
- Volume rendah saat breakout = FALSE BREAKOUT ❌
- Volume Spike (lonjakan abnormal) = Perhatian khusus!

=== CHART PATTERNS ===

📈 **Reversal Patterns (Pembalikan Tren)**
- Head and Shoulders / Inverted H&S
- Double Top (M) / Double Bottom (W)
- Triple Top / Triple Bottom
- Rounding Top / Rounding Bottom

📊 **Continuation Patterns (Kelanjutan Tren)**
- Triangles: Symmetrical, Ascending, Descending
- Flags & Pennants (bullish/bearish)
- Wedges: Rising & Falling
- Cup and Handle

🕯️ **Candlestick Patterns**
BULLISH: Hammer ⬆️, Inverted Hammer, Bullish Engulfing, Morning Star, Piercing Line, Three White Soldiers
BEARISH: Shooting Star ⬇️, Hanging Man, Bearish Engulfing, Evening Star, Dark Cloud Cover, Three Black Crows
INDECISION: Doji ✖️ (pasar ragu, potensi reversal)

=== SUPPORT & RESISTANCE ===
- Support: Level dimana harga cenderung BERHENTI turun (banyak pembeli)
- Resistance: Level dimana harga cenderung BERHENTI naik (banyak penjual)
- Breakout: Penembusan S/R dengan volume tinggi = SIGNAL KUAT
- Breakdown: Harga tembus support = Sinyal bearish

=== MONEY MANAGEMENT & PSIKOLOGI ===
💰 **Risk Management**
- WAJIB pasang STOP LOSS! Ini bukan kelemahan, tapi PERLINDUNGAN modal
- Risk per trade maksimal 1-2% dari total modal
- Risk/Reward Ratio minimum 1:2 (risiko 1, potensi profit 2)

🧠 **Psikologi Trading**
- Disiplin pada Trading Plan (Entry, Exit, Stop Loss)
- Hindari "Suicide Anomaly" - menahan posisi rugi tanpa dasar teknikal
- "Let your profits run, cut your losses short"
- Jangan trading berdasarkan emosi (FOMO, Fear, Greed)

=== GAYA KOMUNIKASI ===
Gunakan Bahasa Indonesia yang PROFESIONAL, TEGAS, namun EDUKATIF.
- Jelaskan ALASAN di balik setiap rekomendasi
- Berikan KONTEKS pasar yang relevan
- Sertakan LEVEL HARGA yang spesifik
- Gunakan emoji untuk memperjelas poin penting
- Berikan WARNING/DISCLAIMER tentang risiko
`;

export const LIVE_SYSTEM_INSTRUCTION = `Kamu adalah RIZBOT IDX, asisten trading saham profesional untuk pasar Indonesia (IDX/BEI).

KEPRIBADIAN:
- Profesional, tegas, namun ramah dan edukatif
- Bicara dengan gaya mentor trading yang berpengalaman
- Selalu memberikan alasan teknikal yang jelas
- Gunakan istilah trading yang tepat dengan penjelasan

CARA KOMUNIKASI:
- Gunakan Bahasa Indonesia yang baik dan mudah dipahami
- Jelaskan konsep kompleks dengan analogi sederhana
- Berikan contoh nyata jika memungkinkan
- Ingatkan tentang manajemen risiko

TOPIK KEAHLIAN:
- Analisis teknikal (Support/Resistance, Trend, Patterns)
- Indikator: RSI, MACD, Bollinger Bands, Moving Averages, Volume
- Psikologi trading dan manajemen emosi
- Money management dan risk control
- Kondisi pasar IDX terkini

BATASAN:
- Selalu ingatkan bahwa ini bukan nasihat investasi resmi
- Dorong user untuk melakukan riset sendiri (DYOR)
- Jangan pernah menjanjikan profit pasti
- Ingatkan risiko trading saham`;

// --- Deep Analysis with Gemini ---
export const analyzeStockDeep = async (symbol: string, dataSummary: string): Promise<string> => {
  try {
    const ai = getAI();
    
    const prompt = `${TRADING_KNOWLEDGE}

=== TUGAS ANALISIS ===
Lakukan analisis teknikal MENDALAM untuk saham **${symbol}** (Bursa Efek Indonesia) berdasarkan data berikut:

${dataSummary}

=== FORMAT OUTPUT ===
Berikan analisis komprehensif dengan struktur berikut. Gunakan bahasa yang JELAS, TEGAS, dan EDUKATIF:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **KESIMPULAN & REKOMENDASI UTAMA**

| Sinyal | Keyakinan | Rating |
|--------|-----------|--------|
| [STRONG BUY 🟢 / BUY 🟡 / HOLD ⚪ / SELL 🟠 / STRONG SELL 🔴] | [Low/Medium/High] | [⭐⭐⭐⭐⭐] |

**Ringkasan**: [2-3 kalimat menjelaskan kondisi saham saat ini dan alasan rekomendasi]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 **ANALISIS TREN & STRUKTUR HARGA**

**Tren Utama**: [Uptrend ↗️ / Downtrend ↘️ / Sideways ↔️]
**Kekuatan Tren**: [Lemah / Sedang / Kuat] 

📍 **Posisi Harga vs Moving Averages**:
- MA5: [di atas/di bawah] → [interpretasi]
- MA20: [di atas/di bawah] → [interpretasi]  
- MA50: [di atas/di bawah] → [interpretasi]
- MA200: [di atas/di bawah] → [interpretasi]

🔄 **Golden Cross / Death Cross**: [Ada/Tidak ada - jelaskan]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **ANALISIS INDIKATOR TEKNIKAL**

**RSI (Relative Strength Index)**
- Nilai: [angka]
- Status: [🟢 Oversold / ⚪ Neutral / 🔴 Overbought]
- Divergence: [Ada/Tidak - jelaskan jika ada]
- Interpretasi: [penjelasan detail apa artinya untuk trading]

**MACD**
- MACD Line: [nilai]
- Signal Line: [nilai]
- Histogram: [positif/negatif, menguat/melemah]
- Crossover: [Bullish Cross ✅ / Bearish Cross ❌ / Tidak ada]
- Interpretasi: [penjelasan momentum]

**Bollinger Bands**
- Posisi Harga: [Upper/Middle/Lower Band]
- Kondisi Band: [Squeeze/Expanding/Normal]
- Interpretasi: [apa artinya untuk volatilitas dan arah]

**Volume Analysis**
- Trend Volume: [Meningkat/Menurun/Stabil]
- Volume vs Average: [Di atas/Di bawah rata-rata]
- Konfirmasi: [Volume mendukung pergerakan harga? Ya/Tidak]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🕯️ **POLA CHART & CANDLESTICK**

**Pola Chart yang Teridentifikasi**:
[Sebutkan pola jika ada: Double Bottom, Head & Shoulders, Triangle, dll]
- Implikasi: [apa artinya untuk pergerakan selanjutnya]
- Target dari pola: [jika bisa dihitung]

**Pola Candlestick Terbaru**:
[Sebutkan pola candle terakhir jika signifikan]
- Interpretasi: [sinyal apa yang diberikan]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **LEVEL-LEVEL KUNCI**

| Level | Harga | Keterangan |
|-------|-------|------------|
| 🔴 Resistance 2 | [harga] | [alasan] |
| 🟠 Resistance 1 | [harga] | [alasan] |
| ⚪ Harga Saat Ini | [harga] | - |
| 🟢 Support 1 | [harga] | [alasan] |
| 🟢 Support 2 | [harga] | [alasan] |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **STRATEGI TRADING**

**Untuk Trader BULLISH (Long)**:
- 🟢 Entry Point: Rp [harga] - Rp [harga]
- 🎯 Target 1 (TP1): Rp [harga] (+[%]%)
- 🎯 Target 2 (TP2): Rp [harga] (+[%]%)
- 🛑 Stop Loss: Rp [harga] (-[%]%)
- ⚖️ Risk/Reward: 1:[rasio]

**Untuk Trader BEARISH (Short/Hindari)**:
- Hindari entry jika harga di bawah: Rp [harga]
- Sinyal bearish jika: [kondisi]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **PERINGATAN & CATATAN PENTING**

1. [Risiko atau perhatian khusus untuk saham ini]
2. [Faktor eksternal yang perlu diperhatikan]
3. [Kondisi pasar yang mempengaruhi]

📌 **DISCLAIMER**: Analisis ini bersifat edukatif dan BUKAN merupakan ajakan untuk membeli atau menjual. Selalu lakukan riset mandiri (DYOR) dan sesuaikan dengan profil risiko Anda. Pasang STOP LOSS untuk melindungi modal!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Berikan analisis sebagai seorang MENTOR TRADING PROFESIONAL yang berpengalaman. Jelaskan dengan bahasa yang mudah dipahami namun tetap teknikal.`;

    // Try multiple models in order of preference (updated model names Dec 2024)
    const models = [
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro",
    ];
    
    let lastError: any;
    
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        
        const text = response.text;
        if (text) {
          return text;
        }
      } catch (e: any) {
        console.error(`Model ${model} failed:`, e.message);
        lastError = e;
        continue;
      }
    }
    
    throw lastError || new Error("Semua model gagal");
    
  } catch (error: any) {
    console.error("Analysis error:", error);
    
    const errorMsg = error.message || error.toString() || "";
    
    if (errorMsg.includes("API_KEY") || errorMsg.includes("API key")) {
      return "❌ Error: API Key tidak valid. Pastikan API Key Gemini Anda benar di file .env.local";
    }
    if (errorMsg.includes("quota") || errorMsg.includes("429") || errorMsg.includes("Resource has been exhausted")) {
      return "❌ Error: Kuota API habis. Silakan coba lagi nanti atau gunakan API Key lain.";
    }
    if (errorMsg.includes("not found") || errorMsg.includes("does not exist") || errorMsg.includes("not supported")) {
      return "❌ Error: Model AI tidak tersedia. Pastikan API Key Gemini valid dan aktif. Coba refresh halaman.";
    }
    
    return `❌ Terjadi kesalahan: ${errorMsg}. Silakan coba lagi.`;
  }
};

// --- Fast Response for Sentiment ---
export const getQuickSentiment = async (newsHeadline: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Context: IDX Stock Market. Analyze sentiment for news: "${newsHeadline}". Reply ONLY one word: BULLISH, BEARISH, or NEUTRAL.`,
    });
    const text = response.text?.trim().toUpperCase() || "NEUTRAL";
    if (["BULLISH", "BEARISH", "NEUTRAL"].includes(text)) {
      return text;
    }
    return "NEUTRAL";
  } catch (error) {
    console.error("Sentiment error:", error);
    return "NEUTRAL";
  }
};

// --- News Sentiment Analysis ---
export interface NewsSentimentResult {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  reason: string;
  keyPoints: string[];
  recommendation: string;
}

export const analyzeNewsSentiment = async (
  title: string,
  summary: string,
  symbol: string
): Promise<NewsSentimentResult> => {
  try {
    const ai = getAI();
    
    const prompt = `Kamu adalah analis sentimen berita saham profesional untuk pasar Indonesia (IDX).

Analisis berita berikut untuk saham ${symbol}:
Judul: "${title}"
Ringkasan: "${summary}"

Berikan analisis dalam format JSON yang valid (tanpa markdown):
{
  "sentiment": "bullish" atau "bearish" atau "neutral",
  "score": angka dari -1.0 (sangat bearish) sampai 1.0 (sangat bullish),
  "reason": "penjelasan singkat mengapa sentimen ini (1-2 kalimat)",
  "keyPoints": ["poin penting 1", "poin penting 2"],
  "recommendation": "rekomendasi singkat untuk trader"
}

Pertimbangkan:
- Dampak langsung pada harga saham
- Sentimen pasar secara umum
- Faktor fundamental perusahaan
- Kondisi makro ekonomi jika relevan

PENTING: Respons HANYA JSON valid, tanpa penjelasan tambahan.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    
    // Parse JSON response
    try {
      // Clean up potential markdown formatting
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanJson);
      
      return {
        sentiment: result.sentiment || 'neutral',
        score: parseFloat(result.score) || 0,
        reason: result.reason || 'Tidak ada analisis',
        keyPoints: result.keyPoints || [],
        recommendation: result.recommendation || 'Pantau perkembangan selanjutnya',
      };
    } catch (parseError) {
      console.error('Failed to parse sentiment JSON:', parseError);
      // Fallback: try to extract sentiment from text
      const lowerText = text.toLowerCase();
      if (lowerText.includes('bullish') || lowerText.includes('positif')) {
        return { sentiment: 'bullish', score: 0.5, reason: title, keyPoints: [], recommendation: 'Perhatikan momentum positif' };
      } else if (lowerText.includes('bearish') || lowerText.includes('negatif')) {
        return { sentiment: 'bearish', score: -0.5, reason: title, keyPoints: [], recommendation: 'Waspada tekanan jual' };
      }
      return { sentiment: 'neutral', score: 0, reason: title, keyPoints: [], recommendation: 'Pantau perkembangan' };
    }
  } catch (error) {
    console.error('News sentiment analysis error:', error);
    return {
      sentiment: 'neutral',
      score: 0,
      reason: 'Gagal menganalisis berita',
      keyPoints: [],
      recommendation: 'Coba lagi nanti',
    };
  }
};

// --- Maps Grounding ---
export const findCompanyHeadquarters = async (companyName: string, lat: number, lng: number): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Kamu adalah asisten yang membantu mencari informasi perusahaan Indonesia.

Cari informasi tentang kantor pusat (headquarters) dari perusahaan: "${companyName}"

Berikan informasi dalam format:
📍 **Alamat Lengkap**: [alamat]
🏢 **Deskripsi Singkat**: [deskripsi gedung/lokasi]
📞 **Kontak**: [jika tersedia]

Gunakan Bahasa Indonesia.`,
    });

    return response.text || "Lokasi tidak ditemukan.";
  } catch (error) {
    console.error("Maps error:", error);
    return "Gagal mengambil data lokasi. Silakan coba lagi.";
  }
};

// --- Video Generation (Veo) - Disabled for now ---
export const generateMarketVideo = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string | null> => {
  console.log("Video generation is not available in this version");
  return null;
};

// --- TTS (Text to Speech) - Simplified version ---
export const speakAnalysis = async (text: string): Promise<AudioBuffer | null> => {
  // Use browser's built-in speech synthesis as fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find Indonesian voice
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
    if (idVoice) {
      utterance.voice = idVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
  
  return null;
};

// --- Stop TTS ---
export const stopSpeaking = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// --- Live API Helpers ---
export function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const buffer = new ArrayBuffer(len);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) {
    view[i] = binaryString.charCodeAt(i);
  }
  const int16 = new Int16Array(buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

export function float32ToPCM16(float32: Float32Array): ArrayBuffer {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}