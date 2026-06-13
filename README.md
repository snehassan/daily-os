# Daily OS

Recovery-aware daily schedule system with Whoop integration.

Automatically detects your recovery score, wake time, and selects the right schedule for your day. Includes a schedule editor so you can customize blocks to fit your workflow.

## Features

- **Whoop Integration** — Fetches recovery score, HRV, resting heart rate, and wake time
- **Auto Day Selection** — Green (≥67%) → Standard, Yellow (34-66%) → Standard with warning, Red (<34%) → Low Energy
- **Dynamic Time Shifting** — All blocks shift based on your actual wake time
- **4 Day Types** — Standard, Interview, Heavy Work, Low Energy
- **Schedule Editor** — Add, edit, delete, and reorder blocks
- **PWA** — Installable on phone, tablet, desktop
- **Responsive** — Mobile, tablet, and desktop layouts

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Whoop Setup

On first load, you'll be prompted to connect your Whoop. For now this uses a personal access token:

1. Go to `app.whoop.com` and log in
2. Open DevTools → Network tab → refresh
3. Find any request to `api.prod.whoop.com`
4. Copy the `Authorization` header value (after "Bearer ")
5. Paste into the app

Token is stored in localStorage and only sent to Whoop's API.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- localStorage for schedule persistence

## Deploy

```bash
npm run build
```

Deploy to Vercel, Netlify, or any Node.js host.
