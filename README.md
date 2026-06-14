# V2V Road Safety System — PWA

## Deploy to GitHub Pages (free hosting)

### Step 1 — Create GitHub repo
1. Go to github.com → New repository
2. Name it: `v2v-app`
3. Set it to Public
4. Click Create repository

### Step 2 — Upload files
1. Click "uploading an existing file"
2. Drag and drop ALL files and folders from this project
3. Click Commit changes

### Step 3 — Enable GitHub Pages
1. Go to repo Settings → Pages
2. Source: Deploy from a branch
3. Branch: main → / (root)
4. Click Save
5. Wait 2 minutes → your app is live at:
   https://YOUR-USERNAME.github.io/v2v-app/

---

## Supabase Setup

### Create the events table
Go to Supabase → SQL Editor → Run this:

```sql
create table events (
  id uuid default gen_random_uuid() primary key,
  type text,
  message text,
  lat float,
  lng float,
  created_at timestamp with time zone default now()
);
```

---

## ESP32 Setup for App Communication

Add this to Car-1 code to make it respond to app commands.
Car-1 needs to run a tiny HTTP server on the same WiFi as your phone.

The app sends:
- GET /START  → start motors
- GET /STOP   → stop motors
- GET /gps    → returns { lat, lng }
- GET /status → returns { alert, accident, obstacleID, lat, lng }

---

## App Features

- Login / Register via Supabase Auth
- Simulated fingerprint authentication
- Destination input with Google Maps geocoding
- Live GPS dot on dark Google Map
- Alert 1 banner (warning)
- Alert 2 banner (danger + auto response)
- Accident full-screen overlay with Google Maps link
- Event log with timestamps
- PWA installable on phone home screen
