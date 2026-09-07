/// <reference types="vite/client" />

/** roadmap 049 — package.json `version`, injected by Vite's `define` at build time. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_NOINDEX?: string
  /** roadmap 037 — 'staging' on Vercel Preview; unset in production. */
  readonly VITE_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
