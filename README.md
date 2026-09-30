# Hollow Foundation

A local-first personal operating system and command dashboard for the **Command Arc 2026** (1 Oct – 31 Dec). Dark, fast, mobile-friendly, and private by design — all data lives in your browser/device storage, never a server.

Built with **Vite + React 18 + TypeScript + Tailwind**, shipped to Android via **Capacitor**, with APK builds automated by **GitHub Actions**.

## Features

- **Dashboard** — today's tasks, arc progress, streaks, quick actions, transparent progress math
- **Tasks** — priorities, due dates, categories, estimates, filters
- **Projects** — status, milestones, next actions, progress
- **Command Arc** — the 7-phase roadmap (Foundation → Nix → Rafael → Hollow Tech → Money → Physical → Ship) with day tracking and a momentum grid
- **Money** — JMD-first, integer-cents math, income/expenses, savings goal
- **Fitness & Learning** — workouts, weight chart, study sessions
- **Habits & Save Seed** — month consistency grid and a one-tap daily discipline tracker with streaks
- **Reviews** — daily and weekly reviews with auto-prefilled numbers
- **Calendar, Notes, Global search** (Ctrl+K)
- **JARVIS** — built-in AI assistant (Ctrl+J). A real conversational partner that reads your live data for status reports, plans, and "what am I behind on". Speaks replies aloud (native Android TTS → network voice → Web Speech fallback). Free keyless model by default; optional Groq / Gemini / OpenRouter keys in Settings.

## Data & privacy

Everything is stored locally (`localStorage`). No accounts, no backend, no telemetry. Export/import your full state as JSON in Settings.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build to dist/
npm run cap:sync     # build + copy web assets into android/
```

### Build the APK locally (requires Android SDK)

```bash
npm run cap:sync
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

### APK via CI (no local tooling needed)

Every push to `main` runs [.github/workflows/android.yml](.github/workflows/android.yml), which builds a debug APK and uploads it as a workflow artifact. Pushing a tag (`v*`) additionally attaches the APK to a GitHub Release:

```bash
git tag v0.1.7 && git push origin v0.1.7
```

## License

Private, personal project.
