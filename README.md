# Golf League Scorer

A mobile-first Progressive Web App for 2-player team best-shot (scramble) golf leagues. Supports manual score entry or AI-powered scorecard scanning via Google Gemini Vision.

**Live URL:** https://itwasduke.github.io/scorecard/

---

## Features

- **3 play modes:** Full (2v2), Solo vs Full (1v2, solo hits 2 balls), Solo vs Solo (1v1)
- **9-point match play scoring** with live per-hole indicators
- **AI scorecard scan** — photograph a paper scorecard and Gemini extracts all scores automatically
- **Match history** saved to Firebase Firestore (anonymous auth)
- **Full PWA** — installable on iOS/Android, works offline for score entry
- **Optional team handicap** applied to stroke totals

---

## Setup

### 1. Add Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project (or use an existing one).
2. In your project, go to **Project Settings → General → Your apps → Web app**. If you don't have a web app, click **Add app → Web**.
3. Copy the config values shown.
4. Open `index.html` and find the `CONFIGURATION` block near the top of the `<head>`:

```js
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",        // ← replace this
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

Replace each placeholder with your actual values.

5. In the Firebase Console, enable **Authentication → Sign-in method → Anonymous**.
6. Enable **Firestore Database** (start in production mode, then apply the security rules below).

---

### 2. Add Firestore Security Rules

In the Firebase Console, go to **Firestore Database → Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /matches/{matchId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Click **Publish**.

> **Note:** The first time you open the History tab, Firestore may log a console message asking you to create a composite index (for the `userId` + `matchDate` query). Click the link in the console — it takes about a minute to build.

---

### 3. Add Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create an API key.
2. In `index.html`, find the config block and replace:

```js
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";  // ← replace this
```

The AI Scan tab will not function until this key is set.

---

## Deploy to GitHub Pages

### Step 1 — Create the GitHub repository

Create a new **public** repository at https://github.com/new named `scorecard`.

### Step 2 — Push the files

```bash
cd scorecard
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/itwasduke/scorecard.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages

1. In your repository, go to **Settings → Pages**.
2. Under **Source**, select **Deploy from a branch**.
3. Choose branch **main** and folder **/ (root)**.
4. Click **Save**.

GitHub will build and publish the site. After ~60 seconds it will be live at:
**https://itwasduke.github.io/scorecard/**

---

## Scoring Rules

| Situation | Points |
|-----------|--------|
| Team A wins the hole (lower score) | Team A gets 1 pt |
| Team B wins the hole (lower score) | Team B gets 1 pt |
| Tied hole | Each team gets 0.5 pt |
| **Total per match** | **9 points** |

The team with the most points wins the match. Total strokes are tracked as a secondary statistic.

### Play Mode Rules

- **Full Match (2v2):** Both players hit from each position; best ball is selected; repeat until holed.
- **Solo vs Full (1v2):** The solo player hits 2 balls per shot from the same spot — except on the green where only 1 putt is allowed.
- **Solo vs Solo (1v1):** Each player hits 1 ball only.

---

## File Structure

```
scorecard/
├── index.html      ← complete app (all JS/CSS inline, no build step)
├── manifest.json   ← PWA manifest
├── sw.js           ← service worker (cache-first offline support)
├── icon-192.png    ← app icon (SVG, 192×192)
├── icon-512.png    ← app icon (SVG, 512×512)
└── README.md
```

> **Icon note:** The icon files contain SVG markup. To use proper PNG icons, replace them with real PNG files of the same names.

---

## Tech Stack

- **Vanilla HTML/CSS/JS** — no build tools, no npm, no framework
- **Firebase (compat v9)** via CDN — anonymous auth + Firestore
- **Google Gemini 2.0 Flash** — vision API for AI scorecard scanning
- **Google Fonts** — Playfair Display + DM Sans
- **PWA** — service worker with cache-first strategy, installable on iOS/Android
