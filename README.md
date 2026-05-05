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
VITE_SUPABASE_ANON_KEY=...
```

Gemini requests are handled by the `gemini` Supabase Edge Function so the API key is not exposed in the browser bundle. Configure Gemini as a Supabase secret instead of a `VITE_` variable:

```sh
set GEMINI_API_KEY=...
```

Optional: override the default model with `GEMINI_MODEL` if you need to try a different Gemini variant.

Deploy the function after setting the secret:

```sh
supabase functions deploy gemini
```
