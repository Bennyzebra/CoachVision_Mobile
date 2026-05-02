# CoachVision_Mobile

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/github-okwnwvy3-6m4dksvq)

## Environment Setup

Local Vite `.env` files should only include browser-safe Supabase client values:

```sh
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Gemini requests are handled by the `gemini` Supabase Edge Function so the API key is not exposed in the browser bundle. Configure Gemini as a Supabase secret instead of a `VITE_` variable:

```sh
supabase secrets set GEMINI_API_KEY=...
```

Deploy the function after setting the secret:

```sh
supabase functions deploy gemini
```
