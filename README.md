# CodeHaunt

AI-assisted coding competition platform. Participants solve 6 questions (2 each of easy/medium/hard) with help from a deliberately stingy AI tutor, judged against public and private test cases, scored with decaying points per wrong attempt.

## Running it

```bash
cp .env.example .env   # fill in JWT_SECRET, GROK_API_KEYS, DATABASE_URL
docker-compose up -d
cd backend && python seed.py   # creates an organizer account + the 6 questions
```

Backend: FastAPI (`backend/`), runs submissions as sandboxed subprocesses in its own container (`backend/app/sandbox.py`) — no separate judge service.
Frontend: React + Vite (`frontend/`).

## Event-day lockdown (controlled machines)

The app enforces fullscreen for participants in the browser (blocks the UI with a re-enter prompt if they leave fullscreen), but **no webpage can truly prevent Escape, Alt+Tab, or closing the tab** — that's a browser security guarantee, not a bug. Real lockdown has to happen at the OS/browser-launch level, on machines you control.

Before the event, launch the browser on each contest machine in kiosk mode instead of opening it normally:

```bash
# Windows (Chrome)
chrome.exe --kiosk --app=https://your-codehaunt-url

# Windows (Edge)
msedge.exe --kiosk https://your-codehaunt-url --edge-kiosk-type=fullscreen

# macOS (Chrome)
open -a "Google Chrome" --args --kiosk --app=https://your-codehaunt-url
```

This removes the address bar, tab switching, and windowed-mode escape entirely, enforced by the OS process rather than page JavaScript. Test it on one machine before the event — kiosk behavior varies a bit by OS/browser version. If a machine isn't launched this way (e.g. a participant's own laptop), the in-app fullscreen nudge is the fallback.
