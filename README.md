# PEM Avoidance Toolkit

A progressive web app for tracking post-exertional malaise, based on the [Open Medicine Foundation](https://omf.ngo/pem-avoidance-toolkit) framework.

**All data stays on the user's device.** Nothing is ever sent to a server.

## Features

- **Track** daily activity levels (physical, mental, emotional) on the OMF 0-10 scale
- **Log symptoms** (fatigue, pain, nausea/GI, brain fog) three times daily (AM, midday, PM)
- **Mark crashes** and add comments about what happened
- **Pattern analysis** comparing crash vs non-crash days, pre-crash activity levels (1-5 day lookback), and sleep quality correlations
- **Crash Avoidance Plan** builder using the full OMF causes, barriers, and strategies checklists
- **Export** tracking data and your plan to share with doctors or support team
- **Dark/Light theme** toggle
- **Works offline** after first load via service worker
- **Add to Home Screen** for a native app experience on iOS and Android

## Deploy to GitHub Pages

### Option 1: Upload built files (no command line needed)

1. On your computer, install [Node.js](https://nodejs.org/) (version 18+)
2. Unzip this project, open a terminal in the folder, and run:
   ```
   npm install
   npm run build
   ```
3. Create a new GitHub repository (public)
4. Upload everything inside the `dist/` folder to the repository
5. Go to **Settings > Pages > Source: Deploy from a branch** (main, root)
6. Your app will be live at `https://yourusername.github.io/repo-name/`

### Option 2: Deploy with gh-pages (command line)

1. Create a new GitHub repository and clone it
2. Copy these project files into the repo folder
3. Run:
   ```
   npm install
   npm run build
   npm run deploy
   ```
4. Go to **Settings > Pages > Source: Deploy from a branch** (gh-pages, root)

## Development

```
npm install
npm run dev
```

Opens a local dev server at http://localhost:5173

## Project Structure

```
src/
  App.jsx          - Main app with state, navigation, onboarding, export
  TrackView.jsx    - Daily tracking, weekly calendar, recent entries
  PatternsView.jsx - Crash correlations, trends, pre-crash analysis
  PlanView.jsx     - OMF crash avoidance plan builder
  LearnView.jsx    - Educational reference material
  DayEditor.jsx    - Modal form for logging a day
  components.jsx   - Shared UI components
  omfData.js       - OMF causes, barriers, strategies data
  db.js            - IndexedDB storage layer
  utils.js         - Helper functions and export generator
  index.css        - CSS variables and base styles
  main.jsx         - Entry point and service worker registration
public/
  manifest.json    - PWA manifest
  sw.js            - Service worker for offline support
  icon.svg         - App icon
```

## Based on

The Open Medicine Foundation PEM Avoidance Toolkit, developed by Jeff Hewitt, Sarah Hewitt, Dana Beltramo Hewitt, Dr. Bonilla, and Dr. Montoya with input from ME/CFS patients.

Full toolkit: [omf.ngo/pem-avoidance-toolkit](https://omf.ngo/pem-avoidance-toolkit)
