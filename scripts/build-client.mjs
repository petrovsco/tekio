// Writes the API's OpenAPI description and the typed client's types from it
// (RFC 0094): packages/client/openapi.json and packages/client/src/schema.ts.
// Both are committed, so a caller needs no build step, and a test fails when
// they no longer match the routes — run `npm run api:client` after changing a
// route and commit what it writes.
//
// The API is TypeScript source with extensionless imports, which Node cannot
// load as it is; esbuild bundles it into memory first, as build-api.mjs does
// for the Vercel function.
import { build } from 'esbuild'
import { writeFile } from 'node:fs/promises'
import openapiTS, { astToString } from 'openapi-typescript'

const { outputFiles } = await build({
  entryPoints: ['packages/api/src/app.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'warning',
})
const url = `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
const { createApi } = await import(url)

const api = createApi({ supabaseUrl: 'http://unused', anonKey: 'unused', origin: null })
const doc = await (await api.request('/api/openapi.json')).json()
await writeFile('packages/client/openapi.json', JSON.stringify(doc, null, 2) + '\n')

const header = '// Generated from packages/client/openapi.json by `npm run api:client`. Do not edit.\n\n'
await writeFile('packages/client/src/schema.ts', header + astToString(await openapiTS(doc)))
