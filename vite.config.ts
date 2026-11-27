import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig, loadEnv } from 'vite'
import analyzer from 'vite-bundle-analyzer'
import glsl from 'vite-plugin-glsl'
// import viteBasicSslPlugin from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    base:
      process.env.BASE_PATH ||
      (mode === 'production' ? '/Nothing-to-listen-to/' : '/'),
    plugins: [
      react({}),
      tailwindcss(),
      glsl({
        minify: Boolean(env.VITE_COMPRESS_GLSL),
      }),
      ...(env.VITE_ANALYZE_BUNDLE ? [analyzer()] : []),
      // viteBasicSslPlugin()
    ],
    build: {
      rollupOptions: {
        input: {
          app: resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('ogl')) return 'vendor-ogl'
              if (id.includes('@radix-ui') || id.includes('@floating-ui'))
                return 'vendor-radix'
              if (id.includes('lucide-react')) return 'vendor-icons'
              if (id.includes('detect-gpu') || id.includes('ua-parser-js'))
                return 'vendor-device'
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './app'),
        '√': resolve(__dirname, './voroforce'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      headers: {
        'Cross-Origin-Embedder-Policy': 'credentialless', // should be 'require-corp' but 'credentialless' allows for img hotlinking
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  }
})
