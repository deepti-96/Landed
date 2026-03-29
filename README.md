# Landed - Your Immigration Roadmap

Your personal roadmap through US immigration bureaucracy. Built for international students.

---

## Step-by-Step Setup in VS Code

### Step 1 — Prerequisites

Make sure you have these installed:
- **Node.js** (v18 or higher) — check with `node --version`
- **npm** — check with `npm --version`
- **VS Code** — download at code.visualstudio.com

If you don't have Node.js, download it from nodejs.org (LTS version).

---

### Step 2 — Get your free Groq API key

1. Go to **https://console.groq.com**
2. Sign up with your Google or GitHub account (free)
3. Click **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Copy the key — you'll need it in Step 4

---

### Step 3 — Open the project in VS Code

1. Unzip the `landed.zip` file you downloaded
2. Open VS Code
3. Go to **File → Open Folder**
4. Select the `landed` folder
5. Open the integrated terminal: **Terminal → New Terminal**

---

### Step 4 — Create your environment file

In the VS Code terminal, run:

```bash
cp .env.example .env.local
```

Then open `.env.local` and replace `your_groq_api_key_here` with your actual Groq API key:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
```

Save the file. **Never share this file or commit it to GitHub.**

---

### Step 5 — Install dependencies

In the terminal, run:

```bash
npm install
```

This installs all required packages. Takes about 1-2 minutes.

---

### Step 6 — Start the development server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.2.5
- Local: http://localhost:3000
```

---

### Step 7 — Open the app

Go to **http://localhost:3000** in your browser.

You should see the Landed intake form. Fill in your details and click "Build my roadmap."

---

## How it works

1. **Intake form** — you answer 6 questions about your visa situation
2. **Groq AI** — reasons over your answers and maps your dependency graph
3. **Dashboard** — shows your personalized action plan with:
   - Deadline countdown timers (turns red when urgent)
   - Steps you can do right now (blue)
   - Steps that are blocked (gray, with reason)
4. **Step drawer** — click any step to get a plain-English explanation
5. **Draft helper** — generates ready-to-send emails for DSOs, landlords, banks

---

## Project structure

```
landed/
├── app/
│   ├── page.tsx              # intake form
│   ├── dashboard/page.tsx    # main dashboard
│   └── api/
│       ├── generate-plan/    # Claude call: intake → plan
│       ├── explain-step/     # Claude call: step explanation (streaming)
│       └── draft-message/    # Claude call: email drafts (streaming)
├── components/
│   ├── DeadlineCard.tsx      # countdown timer cards
│   ├── StepCard.tsx          # individual step cards
│   └── StepDrawer.tsx        # side drawer with explanation + drafts
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   └── deadlines.ts          # deadline calculator (pure JS)
└── data/
    └── f1-steps.json         # F-1 visa knowledge base
```

---

## Adding more visa types

1. Create a new file: `data/h1b-steps.json` (same structure as f1-steps.json)
2. In `app/api/generate-plan/route.ts`, import it and add logic:

```typescript
import h1bSteps from '@/data/h1b-steps.json'
const steps = profile.visa_type === 'H-1B' ? h1bSteps : f1Steps
```

---

## Deploying to Vercel (free)

```bash
npm install -g vercel
vercel
```

Follow the prompts. When asked about environment variables, add your `GROQ_API_KEY`.

Your app will be live at a `vercel.app` URL in under 2 minutes.

---

## Common issues

**"Module not found" error**
→ Run `npm install` again

**"Invalid API key" error**
→ Check your `.env.local` file — make sure there are no spaces around the `=`

**Blank dashboard / no steps**
→ Open browser DevTools → Console and check for errors. Usually a JSON parse issue.

**Groq rate limit**
→ Free tier allows 30 requests/minute. More than enough for development.

---

## Tech stack

- **Next.js 14** — React framework with App Router
- **Tailwind CSS** — styling
- **Groq SDK** — AI API (llama-3.3-70b-versatile model, free tier)
- **TypeScript** — type safety
- **Lucide React** — icons
- **Vercel** — deployment (optional)


## Supabase Setup

1. Create a Supabase project.
2. In Supabase Auth, enable Email and Google providers.
3. Add your local site URL (`http://localhost:3000`) to the allowed redirect URLs.
4. Copy `.env.example` values into `.env.local` and fill in your Supabase keys.
5. Run the SQL in `supabase-schema.sql` inside the Supabase SQL editor.

Once configured, users can sign in with a magic link or Google and save their roadmap across devices.
