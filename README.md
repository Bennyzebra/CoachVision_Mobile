<p align="center">
  <img src="public/CoachVision_LogoMark.png" alt="CoachVision logo" width="160">
</p>

# CoachVision Mobile

A mobile-focused basketball coaching app for planning practices, finding drills, and tracking team progress.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.18-339933?style=flat-square)](package.json)

CoachVision uses team profiles, a drill library, AI-assisted practice planning, and a planning engine that learns overtime to create better practices faster. This repository contains the React web application, its Capacitor iOS project, and Supabase database migrations and Edge Function code.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Development](#development)
- [Project Structure](#project-structure)
- [API](#api)
- [Security](#security)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Background

CoachVision helps basketball coaches prepare and run practices with their team's needs in mind.

- **Team setup:** Manage team information, player rosters, and team profiles.
- **Drill library:** Browse, search, and filter drills for a practice.
- **Practice planning:** Generate and edit plans using goals, duration, focus, and intensity preferences.
- **Practice sessions:** Run a plan and record drill outcomes and feedback.
- **Progress tracking:** Review practice history and use feedback to inform future sessions.

The app uses React, TypeScript, Vite, Tailwind CSS, and shadcn/ui. Supabase provides authentication, data, and storage; a Supabase Edge Function handles Gemini requests. Capacitor packages the web app for iOS.

## Install

### Prerequisites

- Node.js **22.18 or newer** and npm.
- Git.
- A Supabase project configured with the database schema and policies needed by this app.
- For AI features: access to the project's deployed `gemini` Edge Function and its server-side Gemini key.
- For iOS development: macOS and Xcode.

### Local setup

```sh
git clone https://github.com/Bennyzebra/CoachVision_Mobile.git
cd CoachVision_Mobile
npm ci
```

Create a `.env` file in the repository root with your Supabase project's browser-safe client values:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

The app requires these values for authentication and data features. Restart the development server after changing them. The `.env` file is ignored by Git.

Database migrations are stored in [`supabase/migrations`](supabase/migrations). Confirm the target project's migration history before applying them, particularly to an existing database. With `.env` configured, check the tables and columns used by the app:

```sh
npm run verify:db
```

This checks schema availability; it does not provision a database or verify every access policy.

### AI configuration

Gemini requests run through the `gemini` Supabase Edge Function so the API key stays out of the browser bundle. Maintainers deploying this function need the Supabase CLI authenticated and linked to the intended project.

Set the server-side secret, then deploy the function:

```sh
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
supabase functions deploy gemini
```

The function accepts `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY` for its Supabase client. Optionally set `GEMINI_MODEL` as a Supabase secret to override the model selected in [`supabase/functions/gemini/index.ts`](supabase/functions/gemini/index.ts). Use a supported model ID, never an API key or display label.

## Usage

Start the app:

```sh
npm run dev
```

Open [http://localhost:8080](http://localhost:8080), or the address printed by Vite if that port is occupied.

1. Sign up or sign in.
2. Complete team onboarding and add your team information.
3. Browse the drill library or generate a practice plan.
4. Review and edit the plan, then run the practice.
5. Record feedback and review practice progress.

### Production preview

```sh
npm run build
npm run preview
```

Open the preview URL printed in the terminal. The production web output is written to `dist/`.

### iOS development

Build the web app, synchronize it into the existing Capacitor iOS project, and open Xcode:

```sh
npm run build
npx cap sync ios
npx cap open ios
```

Configure signing and select a simulator or device in Xcode before running. The native app configuration lives in [`capacitor.config.ts`](capacitor.config.ts).

## Development

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run typecheck` | Check application TypeScript types. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run the repository's Node test suite. |
| `npm run build` | Build the production web app. |
| `npm run preview` | Preview the production build locally. |
| `npm run verify` | Run type checking, lint, tests, and the production build. |
| `npm run verify:db` | Check the configured live Supabase schema using `.env`. |

### Workspace and local files

Run app commands from the root of your checkout. Development, build, preview, type checking, and lint commands check the workspace first. The expected path defaults to this checkout's root; `COACHVISION_WORKSPACE` can override it when needed.

Keep the checkout and dependencies downloaded locally. On macOS, iCloud can offload files in Documents or Desktop, including `node_modules`, causing builds to wait for downloads. If the workspace check reports offloaded files, choose **Keep Downloaded** in Finder or move the checkout outside cloud-synced folders. Reinstall missing dependencies with `npm ci` after stopping any running build.

### Verification

```sh
npm run verify
```

`npm test` discovers `.test.ts`, `.test.mjs`, `.test.js`, and `.test.cjs` files under `src`, `scripts`, `supabase/functions`, and `ios/App/App`. Unsupported test names, including numbered duplicate copies and TSX, fail discovery instead of being silently skipped. The Node runner does not render JSX.

The suite includes unit tests and source-structure checks. Source checks do not establish browser interaction correctness; validate rendered interactions in a browser and native behavior on an iOS simulator or device.

Database seeding scripts read client settings from `.env` or the environment, using `VITE_SUPABASE_URL` / `SUPABASE_URL` and a publishable or anon key. Review the target database and each script before running a seed operation.

## Project Structure

```text
src/
  components/             Shared UI and mobile layout
  contexts/               Authentication and team state
  integrations/supabase/  Supabase client and generated types
  lib/                    Planning logic and utilities
  pages/                  Application screens
  services/               Data and AI service calls
public/                   Static assets and branding
scripts/                  Workspace, test, and database checks
supabase/
  functions/gemini/       Server-side Gemini integration
  migrations/             Database schema and policy migrations
ios/                      Capacitor iOS project
```

## API

The application accesses Supabase through [`src/integrations/supabase/client.ts`](src/integrations/supabase/client.ts) and the service modules in [`src/services`](src/services).

The internal `gemini` Edge Function accepts requests shaped as `{ action, payload }`. Its supported actions are:

- `generatePracticePlan`
- `generateDrillExplainWhys`
- `summarizeIntentForPlanning`
- `parseSearchIntent`

See [`src/services/geminiFunctionClient.ts`](src/services/geminiFunctionClient.ts) for the caller and [`supabase/functions/gemini/index.ts`](supabase/functions/gemini/index.ts) for payload definitions and implementation. This is an internal application interface; this repository does not define a versioned public API.

## Security

Only browser-safe Supabase client values belong in `VITE_` variables. Keep Gemini keys, Supabase service-role keys, and other private credentials out of frontend code, screenshots, commits, and issue reports. Store server-side credentials in Supabase secrets.

Before reporting an issue, remove credentials and identifying team or player data. For a vulnerability report, contact the maintainer through a private channel if available; avoid disclosing sensitive exploit details in a public issue.

## Maintainers

Repository owner: [@Bennyzebra](https://github.com/Bennyzebra).

## Contributing

Use [GitHub issues](https://github.com/Bennyzebra/CoachVision_Mobile/issues) for reproducible bugs and feature proposals. Include the affected screen, steps to reproduce, expected behavior, and relevant browser or device details.

For proposed code changes:

1. Keep the change focused and explain its purpose.
2. Run `npm run verify` and report the result.
3. Check affected interactions in a browser and, when applicable, on iOS.
4. Include screenshots for UI changes with private information removed.

Keep documentation consistent with the actual commands and configuration. This README's organization is inspired by [Standard Readme](https://github.com/RichardLitt/standard-readme).

## License

No project license file is currently included in this repository. An open-source license has not been specified; contact the repository owner about permission to reuse or redistribute the project. Add an owner-approved `LICENSE` file before advertising it as open source or displaying a license badge.
