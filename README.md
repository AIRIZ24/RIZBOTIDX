# 🤖 RIZBOT IDX - AI Trading Assistant

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://rizbot-idx.vercel.app)
[![React](https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
</div>

## 📖 Deskripsi

RIZBOT IDX adalah asisten trading AI berbasis React untuk pasar saham Indonesia (IDX). Aplikasi ini menggunakan Google Gemini AI untuk memberikan rekomendasi dan analisis saham real-time.

## ✨ Fitur Utama

- 🤖 **AI Trading Assistant** - Chat dengan AI untuk analisis saham
- 📊 **Real-time Stock Charts** - Grafik saham interaktif
- 🎯 **Stock Prediction** - Prediksi harga dengan AI
- 🗺️ **Maps Locator** - Lokasi sekuritas terdekat
- 🎬 **Veo Studio** - Konten edukatif
- 👤 **Authentication** - Sistem login/register
- 💎 **Subscription Tiers** - Free, Basic, Pro, Elite
- 💳 **Payment Integration** - DANA, GoPay, OVO, BNI, BCA, Mandiri

## 🛠️ Tech Stack

- React 19.2.1
- TypeScript 5.8
- Vite 6.2
- Recharts
- Google Gemini AI SDK

## 📦 Run Locally

**Prerequisites:** Node.js 18+

1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/rizbot-idx.git
   cd rizbot-idx
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file and set your Gemini API key:
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

## 🚀 Deploy ke Vercel

### Cara 1: Via Vercel Dashboard

1. Buat akun di [Vercel](https://vercel.com)
2. Klik **"Add New Project"**
3. Import dari GitHub repository
4. Set Environment Variables:
   - Name: `VITE_GEMINI_API_KEY`
   - Value: API key Google Gemini Anda
5. Klik **"Deploy"**!

### Cara 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy (preview)
vercel

# Deploy ke production
vercel --prod
```

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | ✅ Yes | Google Gemini API Key |

Dapatkan API key di: [Google AI Studio](https://makersuite.google.com/app/apikey)

## 📁 Struktur Project

```
├── components/
│   ├── LiveAssistant.tsx    # AI Chat Assistant
│   ├── MapsLocator.tsx      # Lokasi Sekuritas
│   ├── Predictor.tsx        # Stock Prediction
│   ├── StockChart.tsx       # Charts
│   └── VeoStudio.tsx        # Video Studio
├── services/
│   ├── geminiService.ts     # Gemini AI Integration
│   ├── marketData.ts        # Market Data API
│   ├── authService.ts       # Authentication
│   └── subscriptionService.ts
├── App.tsx
├── types.ts
└── vite.config.ts
```

## 👨‍💼 Admin Access

Email admin: `firmansyahrizki141@gmail.com`
- ✅ Akses unlimited ke semua fitur
- ✅ Otomatis subscription Elite
- ✅ Dapat mengatur nomor rekening pembayaran

## 📜 License

MIT License

## 👥 Author

**Rizki Firmansyah**
- 📧 Email: firmansyahrizki141@gmail.com

---

<div align="center">
Made with ❤️ in Indonesia 🇮🇩
</div>
