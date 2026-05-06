# Akazek — Developer Guide

> Rwanda domestic work marketplace connecting employers with household workers and agencies.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Prerequisites](#3-prerequisites)
4. [First-Time Setup](#4-first-time-setup)
5. [Running the App (Without Docker)](#5-running-the-app-without-docker)
6. [Running the App (With Docker)](#6-running-the-app-with-docker)
7. [Environment Variables](#7-environment-variables)
8. [Running Tests](#8-running-tests)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Pre-commit Hooks](#10-pre-commit-hooks)
11. [Windows-Specific Notes](#11-windows-specific-notes)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project Overview

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS | 3000 |
| Backend | NestJS 11, Fastify, TypeScript | 3001 |
| Database | PostgreSQL 16 | 5432 |
| ORM | Prisma | — |
| Auth | JWT + SMS OTP (IntouchSMS) | — |
| Images | Cloudinary | — |
| Real-time | Socket.io (WebSockets) | — |

**Test login (development only):**
- Phone: `111111111`
- OTP: `111111`

---

## 2. Repository Structure

```
akazek/
├── HWA_Backend/          # NestJS API server
│   ├── src/
│   │   ├── modules/      # Feature modules (auth, bookings, services, ...)
│   │   ├── common/       # Guards, interceptors, decorators
│   │   ├── database/     # Prisma service
│   │   └── mail/         # Email templates (Handlebars)
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   ├── migrations/   # SQL migration history
│   │   └── seed.ts       # Seed script
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json      # Uses pnpm
│
├── HWA_Frontend/         # Next.js app
│   ├── app/              # Routes (App Router)
│   ├── components/       # UI components
│   ├── store/            # Redux (auth state)
│   ├── context/          # React contexts
│   ├── services/         # API service functions
│   ├── lib/              # axios, utils, socket
│   ├── __tests__/        # Vitest smoke tests
│   ├── Dockerfile
│   ├── .env.local.example
│   └── package.json      # Uses npm
│
├── docker-compose.yml    # Local dev: postgres + backend + frontend
└── DEVELOPER_GUIDE.md    # This file
```

---

## 3. Prerequisites

Install these on your machine before anything else.

### Required on All Platforms

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20 LTS | https://nodejs.org |
| pnpm | 10+ | `npm install -g pnpm@10` |
| Git | any | https://git-scm.com |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop |

> **Why two package managers?**
> The backend uses `pnpm` (faster, strict). The frontend uses `npm`. Always use the correct one in each folder — mixing them breaks installs.

### Verify Your Installation

Open a terminal and run:

```bash
node --version    # should print v20.x.x
pnpm --version    # should print 10.x.x
npm --version     # should print 10.x.x or higher
git --version     # any version
docker --version  # any version
```

### Windows Extra Step

On Windows, install **Git Bash** or use **WSL 2** (recommended). All commands in this guide use Unix-style paths and will not work in plain PowerShell or CMD.

→ See [Section 11 — Windows-Specific Notes](#11-windows-specific-notes) for full details.

---

## 4. First-Time Setup

Follow these steps exactly when setting up on a new machine.

### Step 1 — Clone the repository

```bash
git clone <your-repo-url> akazek
cd akazek
```

### Step 2 — Set up the Backend

```bash
cd HWA_Backend

# Copy environment file and fill in your values
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, Cloudinary keys, etc.
# (see Section 7 for details on each variable)

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# (Optional) Seed the database with sample data
pnpm ts-node prisma/seed.ts
```

### Step 3 — Set up the Frontend

```bash
cd ../HWA_Frontend

# Copy environment file and fill in your values
cp .env.local.example .env.local
# Edit .env.local — usually just NEXT_PUBLIC_API_URL=http://localhost:3001

# Install dependencies
npm install
```

### Step 4 — Verify Setup

```bash
# In HWA_Backend:
pnpm test          # should show all tests passing

# In HWA_Frontend:
npm test           # should show all tests passing
```

---

## 5. Running the App (Without Docker)

You need **two terminals** open at the same time.

### Terminal 1 — Backend

```bash
cd HWA_Backend
pnpm start:dev
```

You should see:
```
[Nest] Application is running on: http://[::1]:3001
```

### Terminal 2 — Frontend

```bash
cd HWA_Frontend
npm run dev
```

You should see:
```
✓ Ready in 2.1s
○ Local: http://localhost:3000
```

Open **http://localhost:3000** in your browser.

### Stopping

Press `Ctrl + C` in each terminal.

### If a Port is Already in Use

```bash
# Kill whatever is using port 3001 (backend)
npx kill-port 3001

# Kill whatever is using port 3000 (frontend)
npx kill-port 3000
```

On Mac/Linux you can also use:
```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

---

## 6. Running the App (With Docker)

Docker lets you run everything — postgres, backend, and frontend — with one command and no manual setup. Best for switching between machines.

### Prerequisites

- Docker Desktop must be running (open the app first)

### Start Everything

From the **root** of the repository (not inside HWA_Backend or HWA_Frontend):

```bash
docker compose up
```

This will:
1. Pull and start PostgreSQL 16
2. Build and start the NestJS backend (with hot-reload)
3. Build and start the Next.js frontend (with hot-reload)

Wait for these log lines before opening the browser:
```
backend   | [Nest] Application is running on: http://[::1]:3001
frontend  | ✓ Ready in ...
```

Open **http://localhost:3000**.

### Stop Everything

```bash
# Stop containers but keep your database data
docker compose down

# Stop containers AND delete the database (fresh start)
docker compose down -v
```

### Rebuild After Dependency Changes

If you add or remove npm/pnpm packages, rebuild the affected service:

```bash
# Rebuild only the backend
docker compose build backend

# Rebuild only the frontend
docker compose build frontend

# Rebuild all and restart
docker compose up --build
```

### View Logs

```bash
# All services
docker compose logs -f

# Just the backend
docker compose logs -f backend

# Just the frontend
docker compose logs -f frontend
```

### Run Prisma Commands Inside Docker

```bash
# Run migrations inside the running backend container
docker compose exec backend pnpm prisma migrate dev

# Open Prisma Studio (database GUI) on port 5555
docker compose exec backend pnpm prisma studio
```

---

## 7. Environment Variables

### Backend — `HWA_Backend/.env`

Copy from `.env.example`. Here is what each variable does:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. Format: `postgresql://user:password@host:5432/dbname` |
| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens. Use a long random string in production. |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Your Cloudinary cloud name (from cloudinary.com dashboard) |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `INTOUCH_SMS_USERNAME` | ✅ | IntouchSMS account username (for OTP delivery in Rwanda) |
| `INTOUCH_SMS_PASSWORD` | ✅ | IntouchSMS account password |
| `INTOUCH_SMS_SENDER` | ✅ | Sender name shown on SMS (e.g. `HWA`) |
| `MAIL_FROM_NAME` | optional | Display name for emails |
| `MAIL_FROM_ADDRESS` | optional | From email address |
| `FRONTEND_URL` | optional | Used in email links. Set to `http://localhost:3000` in dev |

**Development shortcut:** For local dev without SMS, the test phone `111111111` uses hardcoded OTP `111111` — no SMS credentials needed.

### Frontend — `HWA_Frontend/.env.local`

Copy from `.env.local.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend URL. Use `http://localhost:3001` for local dev. |

> **Note:** Variables prefixed with `NEXT_PUBLIC_` are bundled into the browser at build time. Never put secrets here.

---

## 8. Running Tests

### Backend Tests (Jest)

```bash
cd HWA_Backend

# Run all tests once
pnpm test

# Run tests in watch mode (re-runs on file change)
pnpm test:watch

# Run a specific test file
pnpm test --testPathPattern="bookings"

# Run with coverage report
pnpm test:cov
```

Current test coverage:
- `auth.service` — OTP flow, user creation
- `bookings.service` — create, findOne, updateStatus (11 tests)
- `notifications.service` — notification creation
- `admin.service` — admin operations
- `mail.service` — email sending

### Frontend Tests (Vitest)

```bash
cd HWA_Frontend

# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

Current test coverage:
- `middleware.test.ts` — auth redirect logic (4 tests)
- `not-found.test.tsx` — 404 page renders correctly (2 tests)
- `service-card.test.tsx` — ServiceCard component renders (4 tests)

---

## 9. CI/CD Pipeline

Both repos have GitHub Actions workflows that run automatically on push.

### What Runs on Every Push/PR

**Backend** (`.github/workflows/ci.yml`):
1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Generate Prisma client
3. Run ESLint (fails on any warning)
4. Run Jest tests
5. Build (`pnpm build`)
6. Upload coverage report as artifact

**Frontend** (`.github/workflows/ci.yml`):
1. Install dependencies (`npm ci`)
2. Run ESLint
3. TypeScript type-check (`tsc --noEmit`)
4. Run Vitest tests
5. Build (`npm run build`)

### Branches That Trigger CI

- `main` — production branch
- `develop` — integration branch

CI must pass before merging. If CI fails, check the **Actions** tab on GitHub for logs.

---

## 10. Pre-commit Hooks

Husky + lint-staged runs ESLint and Prettier automatically every time you commit. This prevents broken or unformatted code from entering the repo.

### How It Works

When you run `git commit`:
1. Husky triggers the pre-commit hook
2. lint-staged finds files you staged (`git add`-ed)
3. ESLint fixes auto-fixable issues
4. Prettier formats the code
5. If ESLint finds errors it cannot fix, the commit is blocked with an error message

### What Gets Checked

**Backend** — any `.ts` file in `src/`:
- ESLint (strict, `--max-warnings 0`)
- Prettier formatting

**Frontend** — any `.ts` / `.tsx` file, plus `.json`, `.css`, `.md`:
- ESLint
- Prettier formatting

### Skipping the Hook (Emergency Only)

```bash
git commit --no-verify -m "emergency fix"
```

Use this only when absolutely necessary. Lint errors should be fixed, not skipped.

---

## 11. Windows-Specific Notes

### Recommended Setup: WSL 2 (Best Option)

WSL 2 (Windows Subsystem for Linux) gives you a real Linux environment inside Windows. This is the most reliable way to run the project on Windows.

**Install WSL 2:**

1. Open PowerShell as Administrator and run:
   ```powershell
   wsl --install
   ```
2. Restart your computer when prompted
3. Set up your Linux username and password
4. Open the **Ubuntu** app from the Start menu
5. Inside Ubuntu, install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install -g pnpm@10
   ```
6. Install Docker Desktop for Windows, then in Docker settings → **Resources → WSL Integration** → enable Ubuntu
7. Clone the repo inside WSL (not on the Windows filesystem):
   ```bash
   cd ~
   git clone <your-repo-url> akazek
   ```
8. All commands from this guide work as-is inside WSL

> **Important:** Clone the repo inside WSL (`~/akazek`), not on your Windows drive (`/mnt/c/...`). File system performance on `/mnt/c` is very slow.

### Alternative: Git Bash (Simpler, Slower)

If WSL feels complex, Git Bash works for basic use but is slower:

1. Install Git for Windows from https://git-scm.com — choose "Git Bash" option
2. Install Node.js LTS from https://nodejs.org
3. Open **Git Bash** (not PowerShell or CMD)
4. All commands in this guide work in Git Bash

**Limitations of Git Bash:**
- Docker commands may need adjustments
- Hot-reload in the frontend can be slower
- Some shell scripts may behave differently

### Windows Line Endings (CRLF vs LF)

Windows uses `\r\n` line endings; Linux uses `\n`. This can cause issues with scripts and Husky hooks.

Configure Git globally to avoid problems:

```bash
git config --global core.autocrlf input
```

This tells Git to convert line endings to LF on commit. Run this before cloning.

### Path Differences

Windows paths use backslashes (`\`) but the project uses forward slashes (`/`). Inside Git Bash and WSL, forward slashes work correctly. In plain PowerShell they do not — another reason to use WSL or Git Bash.

### Docker on Windows

Docker Desktop on Windows requires either WSL 2 or Hyper-V. WSL 2 is strongly recommended:

1. In Docker Desktop → Settings → General → enable **"Use the WSL 2 based engine"**
2. In Docker Desktop → Settings → Resources → WSL Integration → enable your Ubuntu distro

---

## 12. Troubleshooting

### "Port 3000 / 3001 already in use"

```bash
# Mac / Linux / WSL
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Prisma errors after pulling new code

New migrations may have been added. Run:

```bash
cd HWA_Backend
pnpm prisma migrate dev
pnpm prisma generate
```

### "Cannot find module" errors in backend

The Prisma client needs to be regenerated:

```bash
cd HWA_Backend
pnpm prisma generate
```

### Docker containers not starting

1. Make sure Docker Desktop is running (check the system tray icon)
2. Try a clean restart:
   ```bash
   docker compose down -v
   docker compose up --build
   ```

### Frontend shows blank page / auth errors

Clear your browser's localStorage and cookies for `localhost:3000`, then reload. Stale JWT tokens cause this after a backend restart with a new `JWT_SECRET`.

### Husky hook not running on Windows

If using Git Bash, the `.husky/pre-commit` file needs Unix line endings. Run:

```bash
cd HWA_Backend
git config core.autocrlf false
# Then re-install husky
pnpm exec husky init
```

Same for HWA_Frontend with `npx husky init`.

### Tests failing after pulling new code

Install new dependencies first:

```bash
# Backend
cd HWA_Backend && pnpm install

# Frontend
cd HWA_Frontend && npm install
```

Then run tests again.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY COMMANDS                            │
├──────────────────────┬──────────────────────────────────────┤
│ Start (no Docker)    │ cd HWA_Backend && pnpm start:dev     │
│                      │ cd HWA_Frontend && npm run dev        │
├──────────────────────┼──────────────────────────────────────┤
│ Start (Docker)       │ docker compose up                     │
│ Stop (Docker)        │ docker compose down                   │
│ Wipe DB (Docker)     │ docker compose down -v                │
├──────────────────────┼──────────────────────────────────────┤
│ Backend tests        │ cd HWA_Backend && pnpm test           │
│ Frontend tests       │ cd HWA_Frontend && npm test           │
├──────────────────────┼──────────────────────────────────────┤
│ New migration        │ cd HWA_Backend                        │
│                      │ pnpm prisma migrate dev               │
│ After pulling code   │ pnpm prisma generate                  │
├──────────────────────┼──────────────────────────────────────┤
│ Dev login            │ Phone: 111111111  OTP: 111111         │
│ Backend URL          │ http://localhost:3001                 │
│ Frontend URL         │ http://localhost:3000                 │
└──────────────────────┴──────────────────────────────────────┘
```
