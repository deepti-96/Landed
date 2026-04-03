# Landed

Landed is a Next.js app for international students getting set up in the United States. It turns profile answers into a personalized roadmap with milestones, deadlines, tax guidance, and an in-app assistant.

## What the app does

- Signs users in with Supabase email OTP
- Saves profile answers and roadmap data to Supabase and local storage
- Builds a personalized roadmap for U.S. setup and F-1 style milestones
- Shows a chapter-style roadmap with completed, open, and locked steps
- Surfaces deadline cards and tax guidance when relevant
- Lets users open a step drawer for explanations, official links, and draft help
- Includes an in-app assistant for roadmap questions and next-step guidance
- Supports light mode and dark mode

## Current scope

Landed is currently focused on users getting set up in the United States.

It is built around:
- roadmap guidance
- profile-based milestone tracking
- deadline awareness
- tax reminders and guidance
- contextual assistant help

It does not currently handle filing or submitting forms.

## Tech stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase Auth and storage
- Groq SDK for explanation and draft-generation APIs
- Lucide React icons

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your values:

```env
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key_here
```

Notes:
- Use your Supabase project URL
- Use the client-safe Supabase publishable key
- Do not put a Supabase secret key in `.env.local`

### 3. Set up Supabase

In Supabase:

1. Create a project
2. Enable email sign-in / OTP
3. Set `Site URL` to `http://localhost:3000`
4. Add `http://localhost:3000` to redirect URLs
5. Run the SQL in [supabase-schema.sql](/Users/deepti.r.kumar/Desktop/Documents/Projects/landed/supabase-schema.sql) in the SQL Editor

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a production-like local test:

```bash
npm run build
npm run start
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## User flow

1. Sign in with an emailed 6-digit code
2. Fill in or edit your saved profile
3. Build your roadmap
4. Move through milestone chapters on the dashboard
5. Open any step for more detail and official links
6. Ask the assistant for help understanding what to do next

## Main app structure

```text
landed/
├── app/
│   ├── page.tsx
│   ├── dashboard/page.tsx
│   └── api/
│       ├── chat-assistant/
│       ├── generate-plan/
│       ├── explain-step/
│       └── draft-message/
├── components/
│   ├── ChatAssistant.tsx
│   ├── DeadlineCard.tsx
│   ├── ProfileEditorDialog.tsx
│   ├── RoadmapNode.tsx
│   ├── RoadmapSection.tsx
│   ├── StepDrawer.tsx
│   ├── ThemeScript.tsx
│   └── ThemeToggle.tsx
├── data/
│   └── f1-steps.json
├── lib/
│   ├── deadlines.ts
│   ├── roadmap-storage.ts
│   ├── supabase.ts
│   ├── tax.ts
│   └── types.ts
└── supabase-schema.sql
```

## Notes about roadmap logic

- Roadmap generation is deterministic in the API route
- Saved profile answers affect which steps are done, open now, or blocked
- OPT timing uses graduation date
- ITIN should not appear when the user already has an SSN
- Tax suggestions depend on whether the user was in the U.S. during the last tax year and whether they had U.S. income

## Deployment

This app deploys well on Vercel.

Typical deployment flow:

1. Push to GitHub
2. Import the repo into Vercel
3. Add the same environment variables in Vercel project settings
4. Add your Vercel URL to Supabase Auth redirect URLs
5. Push to `main` for automatic production redeploys

## Common issues

### Supabase email rate limit exceeded

Wait before requesting another OTP code. Repeated local testing can hit Supabase auth email rate limits quickly.

### Next.js missing chunk or CSS 404 errors in local dev

Clear the local Next build cache and restart:

```bash
rm -rf .next
npm run dev
```

### App feels slower in dev than in production

`next dev` is slower because it recompiles and does extra development checks. Use `npm run build && npm run start` to test production-like performance.

## Environment example

See [.env.example](/Users/deepti.r.kumar/Desktop/Documents/Projects/landed/.env.example).
