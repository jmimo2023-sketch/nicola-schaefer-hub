import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';
import fs from 'fs';

// Plugin to remove WASM files from dist (they're loaded from CDN at runtime)
function removeWasmFiles(): Plugin {
  return {
    name: 'remove-wasm-files',
    closeBundle() {
      const distAssets = path.resolve(__dirname, 'dist/assets');
      if (fs.existsSync(distAssets)) {
        const wasmFiles = fs.readdirSync(distAssets).filter(f => f.endsWith('.wasm'));
        for (const f of wasmFiles) {
          const filePath = path.join(distAssets, f);
          const size = fs.statSync(filePath).size;
          fs.unlinkSync(filePath);
          console.log(`Removed WASM: ${f} (${(size / 1024 / 1024).toFixed(1)} MB) — loaded from CDN instead`);
        }
        // Also remove the ORT JS bundle that loads WASM locally
        const ortFiles = fs.readdirSync(distAssets).filter(f => f.startsWith('ort.') || f.startsWith('ort-'));
        for (const f of ortFiles) {
          const filePath = path.join(distAssets, f);
          fs.unlinkSync(filePath);
          console.log(`Removed ORT JS: ${f}`);
        }
      }
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), removeWasmFiles()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) return 'vendor-recharts';
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('motion')) return 'vendor-motion';
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
              if (id.includes('onnxruntime') || id.includes('ort.') || id.includes('ort-')) return 'vendor-ort';
              if (id.includes('@imgly/background-removal')) return 'vendor-bg-removal';
              if (id.includes('ffmpeg')) return 'vendor-ffmpeg';
              if (id.includes('sonner')) return 'vendor-sonner';
              if (id.includes('lucide')) return 'vendor-lucide';
              if (id.includes('tldraw')) return 'vendor-tldraw';
              if (id.includes('@google')) return 'vendor-google';
              if (id.includes('date-fns')) return 'vendor-date';
              if (id.includes('html-to-image') || id.includes('html2canvas')) return 'vendor-image';
              if (id.includes('zustand')) return 'vendor-zustand';
              if (id.includes('tailwindcss')) return 'vendor-tailwind';
              return 'vendor-misc';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
      minify: 'esbuild',
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/video': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});