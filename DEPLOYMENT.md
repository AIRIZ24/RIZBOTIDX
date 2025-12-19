# RIZBOT IDX - AI Trading Assistant

Aplikasi siap untuk di-deploy ke Vercel atau Netlify.

## Cara Deploy ke Vercel (Recommended)

### Step 1: Buat Akun Vercel
1. Buka [https://vercel.com](https://vercel.com)
2. Klik "Sign Up"
3. Login dengan GitHub/GitLab/Bitbucket

### Step 2: Upload ke GitHub
```bash
# Buat repository baru di GitHub
git init
git add .
git commit -m "Initial commit - RIZBOT IDX"
git branch -M main
git remote add origin https://github.com/USERNAME/rizbot-idx.git
git push -u origin main
```

### Step 3: Deploy di Vercel
1. Di Vercel Dashboard, klik "Add New" → "Project"
2. Import repository dari GitHub
3. Configure Project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables (Opsional - tidak wajib):
   - Name: `VITE_GEMINI_API_KEY`
   - Value: [RIZBOT AI Key Anda]
   - **Note**: User bisa input key sendiri via Settings > API Key Settings
5. Klik "Deploy"

### Step 4: Domain Gratis
- Vercel memberikan domain gratis: `namaproject.vercel.app`
- Anda bisa custom ke domain sendiri di Settings → Domains

## Cara Deploy ke Netlify (Alternatif)

1. Buat akun di [https://netlify.com](https://netlify.com)
2. Drag & drop folder `dist` setelah build
3. Atau connect GitHub repository

## Dapatkan Domain Custom

### Gratis:
- `*.vercel.app` (dari Vercel)
- `*.netlify.app` (dari Netlify)

### Domain Berbayar (~Rp 100.000/tahun):
- [Niagahoster](https://niagahoster.co.id)
- [Hostinger](https://hostinger.co.id)
- [Namecheap](https://namecheap.com)
- [GoDaddy](https://godaddy.com)

## Langkah Connect Custom Domain

1. Beli domain dari registrar (contoh: rizbot-idx.com)
2. Di Vercel → Settings → Domains
3. Add domain: rizbot-idx.com
4. Copy DNS records yang diberikan Vercel
5. Paste DNS records ke registrar domain Anda
6. Tunggu propagasi (5 menit - 24 jam)
