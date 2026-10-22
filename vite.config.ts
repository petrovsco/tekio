import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

// `npm run dev` serves /api as Vercel does, from the API's own source, so the
// app's writes reach the same routes locally (RFC 0094 step 4). Loaded through
// Vite on each call, so an edit to packages/api applies without a restart.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), 'VITE_')
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        try {
          const { createApi } = await server.ssrLoadModule('/packages/api/src/app.ts')
          const api = createApi({ supabaseUrl: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY, origin: 'dev' })
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const answer: Response = await api.fetch(new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          }))
          res.statusCode = answer.status
          answer.headers.forEach((value, name) => res.setHeader(name, value))
          res.end(Buffer.from(await answer.arrayBuffer()))
        } catch (e) {
          next(e)
        }
      })
    },
  }
}

export default defineConfig({
  // roadmap 049 — the running app says which version it is, so a release can be
  // verified by opening it. Baked in at build time; no network call.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    devApi(),
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
