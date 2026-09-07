import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

export default defineConfig({
  // roadmap 049 — the running app says which version it is, so a release can be
  // verified by opening it. Baked in at build time; no network call.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    // Inject <meta name="robots" content="noindex"> at build time when VITE_NOINDEX=true
    {
      name: 'inject-noindex',
      transformIndexHtml(html: string) {
        if (process.env.VITE_NOINDEX === 'true') {
          return html.replace(
            '</head>',
            '  <meta name="robots" content="noindex,nofollow">\n  </head>'
          )
        }
        return html
      },
    },
  ],
})
