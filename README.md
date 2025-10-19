# Runlytics — React Dashboard (Starter)

This repository is a ready-to-run starter for **Runlytics** — a responsive web dashboard that reads running leaderboard data from a Google Sheet and visualizes it with charts, sortable/filterable leaderboards, and mobile-friendly UI.

---

## Features

- Fetches Google Sheet data via the public CSV export URL (no OAuth required if the sheet is "Anyone with link can view").
- Parses CSV into structured JSON.
- Responsive leaderboard UI with sorting and filtering by distance category (e.g., 400m, 1km, 2km).
- Simple charts (bar chart, line chart) using `recharts`.
- Built with React + Vite + Tailwind CSS.

---

## How it works

1. Make your Google Sheet shareable as **Anyone with the link can view**.
2. Get the sheet ID from the URL (e.g. `1MXJw3BKQBbV3tIMMwi137FE7HQK8BSKhYmfZHUjk_ck`).
3. The app fetches the CSV export of the first sheet (gid=0) via:
   `https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv&gid=0`.
4. The CSV is parsed into rows, normalized, and the UI shows leaderboards + charts.

---

## Project structure (included files)

```
runlytics-starter/
├─ package.json
├─ vite.config.js
├─ tailwind.config.cjs
├─ postcss.config.cjs
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ index.css
│  ├─ components/
│  │  ├─ Leaderboard.jsx
│  │  ├─ Charts.jsx
│  │  └─ Header.jsx
│  └─ utils/
│     └─ fetchSheet.js
└─ README.md
```

---

## Important environment

- `VITE_SHEET_ID` — put your Google Sheet ID here (or edit `src/utils/fetchSheet.js` to hardcode the ID).

---

## Run locally

```bash
# install
npm install

# dev server
npm run dev
```

Open http://localhost:5173

---

## Files (full source)

## Next steps & customization ideas

- Add authentication (GitHub/Google) if you want private dashboards.
- Allow users to submit new runs via a form and write back to the Google Sheet (requires Google Sheets API with OAuth or an intermediary service).
- Improve data parsing if you have multiple sheets or different column names — add a small mapping UI.
- Add caching (localStorage) and pull-to-refresh for mobile.
- Add unit conversion settings (meters/km/miles) and pacing calculators.