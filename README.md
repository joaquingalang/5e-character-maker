# 5e Character Maker

A guided D&D 5e character creation tool for beginners, with AI-powered background suggestions and a full character management dashboard.

## About

5e Character Maker walks players through building a Dungeons & Dragons 5th Edition character via a step-by-step wizard. It uses Google Gemini to suggest fitting backgrounds based on your character's backstory and goals, then saves the finished sheet to your account so you can revisit it anytime.

## Features

- **6-step creation wizard** — race, class, backstory, skills, ability scores, equipment, name & alignment
- **AI background suggestions** — Gemini 2.0 Flash analyzes your backstory and recommends the best-fit PHB backgrounds
- **Four ability score methods** — Standard Array, Point Buy, Dice Roll (4d6 drop lowest), or class-recommended
- **Draft saving** — each wizard step is persisted so you can resume at any time
- **Character dashboard** — see in-progress and completed characters at a glance
- **Full character sheet** — computed modifiers, skill bonuses, combat stats, equipment, and backstory
- **DM view** — admins can view all characters across users
- **Supabase auth** — email/password signup and login with session management

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, TypeScript, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Auth & DB | Supabase (PostgreSQL + Row-Level Security) |
| AI | Google Gemini 2.0 Flash |
| D&D Data | Bundled JSON (races, classes, backgrounds, skills, equipment) |

## Project Structure

```
app/
├── (auth)/           # Login & signup pages
├── (app)/            # Protected routes
│   ├── dashboard/    # Character list
│   ├── characters/
│   │   ├── [id]/     # Character sheet view
│   │   └── new/step/[step]/  # Wizard steps 1–6
│   └── dm/           # DM admin view
├── api/suggest-backgrounds/  # Gemini AI endpoint
└── actions/          # Server actions (auth, character CRUD)

components/
└── wizard/           # Step1–Step6 components + StepProgress

lib/
├── supabase/         # Browser & server Supabase clients
├── data/             # Bundled D&D JSON data files
├── constants/        # Backgrounds, class skills, ability priorities
└── types.ts          # Shared TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

### Install

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Database Setup

In the Supabase dashboard, open the SQL editor and run the contents of `supabase-setup.sql`. This creates the `characters` and `profiles` tables with the required RLS policies.

> **Tip:** In Supabase → Auth → Settings, you can disable email confirmation to skip verification emails during local development.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Wizard Flow

| Step | What happens |
|---|---|
| 1 | Choose race (+ subrace) and class (+ subclass) with level |
| 2 | Write your backstory and goal — Gemini suggests 3 backgrounds |
| 3 | Pick skill proficiencies from class and background options |
| 4 | Set ability scores via Standard Array, Point Buy, Dice Roll, or Recommended |
| 5 | Select starting equipment from class-based gear packages |
| 6 | Enter your character's name and alignment, then finalize |
