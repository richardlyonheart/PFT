# Workout Program Tracker Web App

This app turns your 60-day performance plan into a day-by-day tracker for:

- Row
- Push-ups
- Plank

It includes:

- Baseline test day (Day 0)
- Phase 1 and Phase 2 templates with progression notes
- Taper days and final retest
- Daily logging for row, push-ups, plank, RPE, and notes
- Local persistence in browser storage
- Optional Firebase cloud sync so you can use it anywhere

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Access on Your Phone (Same Wi-Fi)

1. Start the app in LAN mode:

```bash
npm run dev:phone
```

2. In PowerShell, find your computer IP:

```powershell
ipconfig
```

3. On your phone browser, open:

```text
http://YOUR_PC_IP:5173
```

Example:

```text
http://192.168.1.25:5173
```

Notes:

- Phone and computer must be on the same network.
- If it does not load, allow Node.js through Windows Firewall when prompted.
- Browser local storage is per device, so phone logs are separate from desktop logs.

## Build

```bash
npm run build
npm run preview
```

To preview the production build on phone:

```bash
npm run preview:phone
```

## Firebase Backend (Cloud Sync)

This project supports Firebase Google Sign-In + Firestore sync.

1. Create a Firebase project in the Firebase console.
2. Enable Authentication -> Sign-in method -> Google.
3. Create a Firestore database.
4. Copy `.env.example` to `.env` and fill in your Firebase values:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

5. Restart dev server after adding env vars.

Suggested Firestore rules for user-isolated sync:

```text
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /users/{userId}/appData/{docId} {
			allow read, write: if request.auth != null && request.auth.uid == userId;
		}
	}
}
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, import the repository.
3. Framework preset: Vite (auto-detected).
4. Add all `VITE_FIREBASE_*` variables in Vercel Project Settings -> Environment Variables.
5. Deploy.

After deploy, open the Vercel URL on your phone from anywhere.

## How to Use

1. Start on Day 0 and enter baseline results.
2. Select each day from the calendar list.
3. Log workout results and mark completion.
4. Repeat until Day 60 and compare retest metrics to baseline.
