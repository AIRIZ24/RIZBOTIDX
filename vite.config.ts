import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env from project root directory
    const env = loadEnv(mode, process.cwd(), '');
    
    // Support both VITE_GEMINI_API_KEY and GEMINI_API_KEY
    const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Security: Prevent exposing sensitive files
        fs: {
          strict: true,
          deny: ['.env', '.env.local', '.env.production', '.git'],
        },
      },
      plugins: [react()],
      define: {
        // Only expose necessary env vars to client
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Security: Don't generate sourcemaps in production (hides source code)
        sourcemap: mode === 'development',
        // Optimize for security
        rollupOptions: {
          output: {
            // Don't expose internal module paths
            sanitizeFileName: true,
          },
        },
      },
    };
});
