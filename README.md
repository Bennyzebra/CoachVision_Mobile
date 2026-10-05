# CoachVision_Mobile

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/github-okwnwvy3-6m4dksvq)

## Workspace Path Guard

Run app commands from the repo root of this checkout.

```sh
pwd
```

`npm run dev`, `npm run build`, and `npm run preview` now run a workspace check first and fail fast if the command is launched from a different folder.

Quick verify:

```sh
cd /path/to/CoachVision_Mobile
pwd
npm run build
```

If you need to override the expected workspace path, set `COACHVISION_WORKSPACE`.

## Environment Setup

Use Node.js 22.18 or newer and install the locked dependencies with `npm ci`.

### Build speed and local files

Keep this checkout downloaded locally. On macOS, iCloud can offload files in
Documents/Desktop, including `node_modules`; builds then wait for downloads
instead of using the CPU. The workspace check detects offloaded dependencies
before starting the build, type checker, linter, or tests. If it reports one,
choose **Keep Downloaded** for the checkout in Finder, or keep the checkout
outside cloud-synced folders. Reinstall missing/offloaded dependencies with
`npm ci` once any running build has stopped.

### Tests

`npm test` discovers `.test.ts`, `.test.mjs`, `.test.js`, and `.test.cjs` files
under `src`, `scripts`, `supabase/functions`, and `ios/App/App`. Unsupported
test names (including numbered duplicate copies and TSX) fail discovery instead
of being silently skipped. The Node runner does not render JSX.

The suite contains executable unit tests and source-structure checks. The latter
do not establish browser interaction correctness; use behavioral tests for
logic regressions and browser/device testing for rendered interactions.
`npm run verify` runs type checking, lint, tests, and the production build.
When committing these changes, include the new `scripts/*.mjs` files along with
`package.json` and `package-lock.json` so a clean checkout has the same checks.

Local Vite `.env` files should only include browser-safe Supabase client values:

```sh
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Verify the app, then confirm the configured live database exposes every table
and column used by the current routes:

```sh
npm run verify
npm run verify:db
```

Gemini requests are handled by the `gemini` Supabase Edge Function so the API key is not exposed in the browser bundle. Configure Gemini as a Supabase secret instead of a `VITE_` variable:

```sh
set GEMINI_API_KEY=...
```

Optional: override the default model with `GEMINI_MODEL` if you need to try a different Gemini variant.
Use the actual model id, not the display name. Good examples are `gemini-2.5-flash-lite` and `gemini-3-flash-preview`.
Do not paste your API key into `GEMINI_MODEL`.

Deploy the function after setting the secret:

```sh
supabase functions deploy gemini
```
