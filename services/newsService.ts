/**
 * News Service
 * Fetches and analyzes stock news with AI sentiment analysis
 */

import { analyzeNewsSentiment } from './geminiService';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  relatedSymbols: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  sentimentScore?: number; // -1 to 1
  sentimentReason?: string;
  imageUrl?: string;
}

export interface NewsSentimentResult {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  reason: string;
  keyPoints: string[];
  recommendation: string;
}

// Cache untuk berita
const newsCache: Map<string, { data: NewsArticle[]; timestamp: number }> = new Map();
const NEWS_CACHE_DURATION = 5 * 60 * 1000; // 5 menit

// Mock news data untuk demo (karena API berita berbayar)
const MOCK_NEWS: Record<string, NewsArticle[]> = {
  'BBCA': [
    {
      id: 'bbca-1',
      title: 'BCA Catat Laba Bersih Rp40,7 Triliun di 2024, Naik 12,5%',
      summary: 'PT Bank Central Asia Tbk (BBCA) mencatatkan pertumbuhan laba bersih sebesar 12,5% menjadi Rp40,7 triliun pada tahun 2024. Kredit tumbuh 11,2% dan NIM tetap stabil di 5,8%.',
      source: 'CNBC Indonesia',
      url: 'https://cnbcindonesia.com',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['BBCA'],
    },
    {
      id: 'bbca-2', 
      title: 'Analis: Saham BBCA Masih Undervalued, Target Harga Rp11.000',
      summary: 'Sejumlah analis menilai valuasi saham BBCA masih menarik dengan target harga di Rp11.000. Fundamental yang kuat dan posisi sebagai bank terbesar menjadi pendorong.',
      source: 'Bisnis.com',
      url: 'https://bisnis.com',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['BBCA'],
    },
    {
      id: 'bbca-3',
      title: 'BCA Ekspansi Digital Banking, Siapkan Investasi Rp5 Triliun',
      summary: 'BCA mengalokasikan Rp5 triliun untuk investasi teknologi dan digital banking di 2025. Fokus pada pengembangan super app dan AI-powered services.',
      source: 'Kompas',
      url: 'https://kompas.com',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['BBCA'],
    },
  ],
  'BBRI': [
    {
      id: 'bbri-1',
      title: 'BRI Salurkan KUR Rp489 Triliun, Capai 97% Target 2024',
      summary: 'Bank BRI berhasil menyalurkan Kredit Usaha Rakyat (KUR) sebesar Rp489 triliun hingga November 2024, mencapai 97% dari target. Fokus pada sektor UMKM produktif.',
      source: 'Detik Finance',
      url: 'https://finance.detik.com',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['BBRI'],
    },
    {
      id: 'bbri-2',
      title: 'NPL BRI Naik Tipis ke 2,8%, Manajemen Optimistis Terkendali',
      summary: 'Rasio kredit bermasalah (NPL) BRI naik tipis ke 2,8% dari 2,6% di kuartal sebelumnya. Manajemen menyebut masih dalam batas wajar dan terkendali.',
      source: 'Reuters',
      url: 'https://reuters.com',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['BBRI'],
    },
  ],
  'TLKM': [
    {
      id: 'tlkm-1',
      title: 'Telkom Siap Luncurkan Layanan 5G di 50 Kota Tahun Depan',
      summary: 'PT Telkom Indonesia berencana meluncurkan layanan 5G di 50 kota besar Indonesia pada 2025. Investasi infrastruktur mencapai Rp28 triliun.',
      source: 'Tempo',
      url: 'https://tempo.co',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['TLKM'],
    },
    {
      id: 'tlkm-2',
      title: 'Pendapatan Data Center Telkom Tumbuh 35% YoY',
      summary: 'Segmen data center Telkom mencatat pertumbuhan pendapatan 35% year-on-year didorong permintaan cloud computing dan AI infrastructure.',
      source: 'IDX Channel',
      url: 'https://idxchannel.com',
      publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['TLKM'],
    },
  ],
  'GOTO': [
    {
      id: 'goto-1',
      title: 'GoTo Pangkas Rugi 60%, Targetkan BEP di 2025',
      summary: 'PT GoTo Gojek Tokopedia Tbk berhasil memangkas kerugian hingga 60% dan menargetkan break-even point pada pertengahan 2025.',
      source: 'Bloomberg',
      url: 'https://bloomberg.com',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['GOTO'],
    },
    {
      id: 'goto-2',
      title: 'Tokopedia dan Shopee Bersaing Ketat di Harbolnas 12.12',
      summary: 'Persaingan e-commerce semakin sengit menjelang Harbolnas 12.12. Tokopedia menawarkan promo agresif untuk merebut market share.',
      source: 'Tech in Asia',
      url: 'https://techinasia.com',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['GOTO', 'BUKA'],
    },
  ],
  'ANTM': [
    {
      id: 'antm-1',
      title: 'Harga Emas Tembus $2.100, ANTM Diuntungkan',
      summary: 'Harga emas dunia menembus $2.100 per troy ounce, level tertinggi sepanjang sejarah. Aneka Tambang (ANTM) diperkirakan mendapat windfall profit.',
      source: 'Kontan',
      url: 'https://kontan.co.id',
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['ANTM', 'MDKA'],
    },
    {
      id: 'antm-2',
      title: 'ANTM Resmikan Smelter Nikel Baru di Sulawesi',
      summary: 'ANTM meresmikan fasilitas smelter nikel baru di Sulawesi dengan kapasitas 40.000 ton per tahun. Investasi mencapai $500 juta.',
      source: 'Investor Daily',
      url: 'https://investor.id',
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['ANTM', 'INCO'],
    },
  ],
};

// Tambahan news untuk saham lain
const ADDITIONAL_NEWS: Record<string, NewsArticle[]> = {
  'ASII': [
    {
      id: 'asii-1',
      title: 'Penjualan Mobil Astra Naik 15%, Didorong Toyota dan Daihatsu',
      summary: 'Astra International mencatat kenaikan penjualan mobil 15% YoY, didorong oleh permintaan tinggi terhadap Toyota dan Daihatsu.',
      source: 'Bisnis.com',
      url: 'https://bisnis.com',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['ASII'],
    },
    {
      id: 'asii-2',
      title: 'Astra Otoparts Ekspansi ke Pasar Kendaraan Listrik',
      summary: 'Anak usaha Astra mulai memproduksi komponen untuk kendaraan listrik, antisipasi pertumbuhan pasar EV di Indonesia.',
      source: 'Kontan',
      url: 'https://kontan.co.id',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['ASII', 'AUTO'],
    },
  ],
  'UNVR': [
    {
      id: 'unvr-1',
      title: 'Unilever Indonesia Fokus Produk Premium di 2025',
      summary: 'Unilever Indonesia akan fokus pada produk premium dan sustainable untuk meningkatkan margin di tengah persaingan ketat.',
      source: 'CNBC Indonesia',
      url: 'https://cnbcindonesia.com',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['UNVR'],
    },
  ],
  'BMRI': [
    {
      id: 'bmri-1',
      title: 'Bank Mandiri Catat Laba Rp35 Triliun, Tumbuh 10%',
      summary: 'PT Bank Mandiri Tbk mencatatkan laba bersih Rp35 triliun di 2024, tumbuh 10% didorong pertumbuhan kredit dan efisiensi.',
      source: 'Bloomberg',
      url: 'https://bloomberg.com',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['BMRI'],
    },
  ],
};

// Default news untuk saham yang tidak ada di mock
const DEFAULT_NEWS: NewsArticle[] = [
  {
    id: 'idx-1',
    title: 'IHSG Menguat 0,8%, Investor Asing Net Buy Rp1,2 Triliun',
    summary: 'Indeks Harga Saham Gabungan (IHSG) ditutup menguat 0,8% ke level 7.450. Investor asing mencatatkan net buy sebesar Rp1,2 triliun.',
    source: 'IDX News',
    url: 'https://idx.co.id',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    relatedSymbols: [],
  },
  {
    id: 'idx-2',
    title: 'BI Pertahankan Suku Bunga 6%, Rupiah Stabil',
    summary: 'Bank Indonesia memutuskan mempertahankan suku bunga acuan di 6%. Rupiah stabil di kisaran Rp15.500 per dolar AS.',
    source: 'Bank Indonesia',
    url: 'https://bi.go.id',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    relatedSymbols: [],
  },
  {
    id: 'idx-3',
    title: 'Ekonomi Indonesia Tumbuh 5,1% di Q3 2024',
    summary: 'Pertumbuhan ekonomi Indonesia tercatat 5,1% year-on-year di kuartal III 2024, didorong konsumsi rumah tangga dan investasi.',
    source: 'BPS',
    url: 'https://bps.go.id',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    relatedSymbols: [],
  },
];

/**
 * Fetch news for a specific stock symbol
 */
export const fetchStockNews = async (symbol: string): Promise<NewsArticle[]> => {
  const cacheKey = `news_${symbol}`;
  const cached = newsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < NEWS_CACHE_DURATION) {
    return cached.data;
  }

  // In production, this would call a real news API
  // For now, return mock data with slight variations
  let news = MOCK_NEWS[symbol] || ADDITIONAL_NEWS[symbol] || DEFAULT_NEWS.map(n => ({
    ...n,
    id: `${symbol}-${n.id}`,
    relatedSymbols: [symbol, ...n.relatedSymbols],
  }));

  // Add some randomization to make it feel more dynamic
  news = news.map(article => ({
    ...article,
    publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
  }));

  newsCache.set(cacheKey, { data: news, timestamp: Date.now() });
  return news;
};

/**
 * Analyze sentiment of a news article using Gemini AI
 */
export const analyzeArticleSentiment = async (
  article: NewsArticle,
  symbol: string
): Promise<NewsArticle> => {
  try {
    const result = await analyzeNewsSentiment(article.title, article.summary, symbol);
    
    return {
      ...article,
      sentiment: result.sentiment,
      sentimentScore: result.score,
      sentimentReason: result.reason,
    };
  } catch (error) {
    console.error('Failed to analyze sentiment:', error);
    // Return neutral sentiment as fallback
    return {
      ...article,
      sentiment: 'neutral',
      sentimentScore: 0,
      sentimentReason: 'Tidak dapat menganalisis sentimen',
    };
  }
};

/**
 * Fetch and analyze all news for a stock
 */
export const fetchAndAnalyzeNews = async (symbol: string): Promise<NewsArticle[]> => {
  const news = await fetchStockNews(symbol);
  
  // Analyze sentiment for each article in parallel
  const analyzedNews = await Promise.all(
    news.map(article => analyzeArticleSentiment(article, symbol))
  );
  
  return analyzedNews;
};

/**
 * Get overall sentiment summary for a stock based on news
 */
export const getNewsSentimentSummary = async (symbol: string): Promise<{
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  averageScore: number;
  newsCount: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  latestNews: NewsArticle[];
}> => {
  const news = await fetchAndAnalyzeNews(symbol);
  
  let totalScore = 0;
  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;
  
  news.forEach(article => {
    totalScore += article.sentimentScore || 0;
    if (article.sentiment === 'bullish') bullishCount++;
    else if (article.sentiment === 'bearish') bearishCount++;
    else neutralCount++;
  });
  
  const averageScore = news.length > 0 ? totalScore / news.length : 0;
  let overallSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  
  if (averageScore > 0.2) overallSentiment = 'bullish';
  else if (averageScore < -0.2) overallSentiment = 'bearish';
  
  return {
    overallSentiment,
    averageScore,
    newsCount: news.length,
    bullishCount,
    bearishCount,
    neutralCount,
    latestNews: news.slice(0, 5),
  };
};

/**
 * Format relative time
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID');
};

export default {
  fetchStockNews,
  analyzeArticleSentiment,
  fetchAndAnalyzeNews,
  getNewsSentimentSummary,
  formatRelativeTime,
};
