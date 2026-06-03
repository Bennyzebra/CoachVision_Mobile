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

Local Vite `.env` files should only include browser-safe Supabase client values:

```sh
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

`VITE_SUPABASE_ANON_KEY` is still accepted for older local env files, but new setup should use
`VITE_SUPABASE_PUBLISHABLE_KEY`.

When running from Xcode, Capacitor loads the built web files from `ios/App/App/public`. After changing
`.env` or frontend code, refresh those files with:

```sh
npm run ios:copy
```

The Xcode project also runs this copy step before bundling resources so local Xcode launches do not use
stale Supabase configuration.

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
