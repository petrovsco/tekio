// Bundles the API into one file for its Vercel function (RFC 0094 step 2c).
//
// Vercel compiles a function's TypeScript file by file and leaves the imports
// as written, and Node's ES-module loader cannot follow the workspace
// packages' extensionless imports of TypeScript source. One bundled file has
// no imports left to follow. `npm run build` runs this after the app's build,
// before Vercel packs the function that imports it. It is minified because a
// cold start parses the whole file before the first request is answered.
import { build } from 'esbuild'

await build({
  entryPoints: ['packages/api/src/index.ts'],
  outfile: 'api/_bundle.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  minify: true,
  legalComments: 'none',
  logLevel: 'warning',
})
