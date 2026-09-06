# Setu — SIH26044 Prototype

**Problem Statement SIH26044:** Portal for Academia–Industry collaboration for
Skill Mapping, Internships and Placement.

Setu (Hindi for "bridge") connects four groups on one platform: **students**
map real, levelled skills; **industry** posts internships/jobs with required
skill levels; **colleges** get a live placement and skill-gap view of their
own students; and an **admin** gets a national rollup across every college
and company on the platform. The centerpiece is a transparent, explainable
**skill-matching engine** — every match score can be broken down into exactly
which skills matched, which fell short, and by how much.

## Quick start (two terminals)

**Requirements:** Node.js 18+ installed. No database server, no API keys, no
internet connection needed at runtime (only for the one-time `npm install`).

### 1. Backend

```bash
cd backend
npm install
npm start
```
Runs at `http://localhost:4000`. On first run it automatically creates and
seeds `backend/data/db.json` with demo accounts — no manual setup step.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints (typically `http://localhost:5173`).

### Demo logins (password for all: `password123`)

| Role | Email |
|---|---|
| Student | student@nit.edu.in |
| Industry | hr@technova.com |
| College TPO | college@nit.edu.in |
| Admin | admin@sih26044.gov.in |

These are also shown as one-tap buttons on the login screen itself, so a
judge can switch roles mid-demo without you typing credentials.

To reset all demo data, stop the backend, delete `backend/data/db.json`,
and restart it.

## A five-minute demo script

1. **Login screen** — point out the four-role model and the live skill-match
   promise in the hero copy.
2. **Student → My Skill Profile** — add/adjust a skill and level, save.
3. **Student → Browse Opportunities** — show the ranked list with match %
   and open "See gap analysis" on a partial match to show exactly which
   skills and levels are missing.
4. **Student → Apply** to one opportunity.
5. **Switch to Industry → Review Applicants** — show the ranked applicant
   table for that same posting, expand a row to show the same breakdown
   from the recruiter's side, then Shortlist/Select/Reject.
6. **Switch to Student** — show the notification and status update landed
   automatically.
7. **Switch to College TPO → Skill Heatmap / Demand vs Supply** — this is
   the "policy" payoff: show the college where its students are strong and
   where a training push is needed.
8. **Switch to Admin → Platform Overview / Applications Funnel** — the
   national rollup, useful for a nodal body overseeing many colleges.

## What makes the matching "AI-style" but explainable

`backend/utils/matching.js` scores a candidate against a posting skill by
skill: full credit if their level meets the requirement, partial credit
proportional to how close they are if not, zero (and a reported gap) if the
skill is missing entirely. The overall score is the average across all
required skills. It's deliberately transparent rather than a black box —
a judge can ask "why 82%?" and you can point to the exact breakdown shown
in the UI.

## Architecture

- **Backend:** Node.js + Express. Data is stored in a single JSON file
  (`backend/data/db.json`) via a tiny persistence layer (`backend/db.js`) —
  no database server to install for a hackathon demo. Every route module
  only calls that layer, so swapping in Postgres/Mongo later doesn't touch
  route logic.
- **Auth:** JWT-based, roles enforced with middleware (`requireAuth`,
  `requireRole`) on every sensitive route.
- **Frontend:** React (Vite) with `react-router-dom` and `recharts` for the
  analytics charts. No CSS framework — a hand-written design system
  (`frontend/src/index.css`) using a navy/gold palette and a
  Fraunces + Inter type pairing, so it doesn't look like a generic template.

## Known scope limits (be upfront with judges about these)

- Data persistence is a JSON file, not a production database — intentional
  for a zero-setup hackathon demo; swapping in Postgres is a backend-only
  change.
- No file upload for resumes/certificates yet — skill levels are
  self-reported. A natural next step is resume parsing to suggest skills
  automatically, or lightweight verification (e.g. a college TPO endorsing
  a student's claimed skill level).
- No email/SMS notifications — in-app notifications only.
- Single JWT secret via environment variable; rotate it in
  `backend/middleware/auth.js` (`JWT_SECRET`) for anything beyond a demo.
