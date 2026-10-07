<div align="center">

<img src="public/favicon.svg" alt="Harry The Blaze" width="64" height="64" />

# Harry The Blaze

**Practice the real placement rounds. Then talk to someone who just got placed.**

Cognitive games and communication rounds modelled on company assessments (Accenture is the current campaign), plus paid 20-minute 1:1 calls with recently placed seniors.

[Live site](https://www.harrytheblaze.site) · [Report an issue](https://github.com/harikrishna-au/gbar_made_easy/issues)

</div>

---

## What it is

Harry The Blaze is a placement-prep web app for final-year engineering students in India. It has two offers:

| Offer | What the student gets | How it's paid |
| --- | --- | --- |
| **Practice** | Company-style cognitive games and communication rounds, with extra levels and the full communication rounds behind Premium | One-time Premium purchase via Razorpay |
| **Connect 1:1** | A 20-minute live call with a recently placed senior | Paid per booking. The team confirms the slot and sends one meeting link to both sides. |

Connect is operated manually on purpose. Student-facing copy should keep saying so. See [`PRODUCT.md`](PRODUCT.md) for users, positioning and brand rules, and [`docs/connect-admin-v1.md`](docs/connect-admin-v1.md) for the operator workflow.

## Features

- **Cognitive games.** Matrix Flow, Balloon Math, Hidden Maze for Accenture. Geo-Sudo, Grid, Motion, Switch, Digit, BART, Mapping, Dual Task and Inductive challenges for Cognizant. Best scores and attempts are saved per game.
- **Communication rounds.** Two company patterns (Accenture, Cognizant) covering conversation, listening, reading aloud, repeat, fill-in-the-blank, error correction, speaking topic and written email. Speech is scored with Azure Speech and AI feedback.
- **Connect 1:1.** Browse seniors, pick a slot, pay, and get a confirmation. Includes an expert onboarding flow (`/placed-guru`) and a super-admin queue at `/admin?tab=connect`.
- **AI interview**, **Forge** (resume builder), **Radar** (job match) and a **coding-questions checklist** are available to Premium users.
- **Blog** with write, my-posts and admin views.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 3, shadcn/ui (Radix), Framer Motion, GSAP, React Router 6, TanStack Query |
| Auth | [Clerk](https://clerk.com) |
| Database and functions | [Supabase](https://supabase.com) (Postgres, row-level security, Deno edge functions) |
| Payments | Razorpay (PayU webhook also present) |
| Email | Resend |
| AI backend | FastAPI on AWS Lambda (via Mangum), DynamoDB, S3, Bedrock/OpenAI, Azure Speech |
| Hosting | Vercel (frontend), AWS SAM (backend) |

## Repository layout

```
.
├── src/                      # React app
│   ├── pages/                # Routes: landing, dashboard, games, connect, forge, radar, blog…
│   │   ├── connect/          # Connect 1:1 booking flow
│   │   ├── communication-rounds/      # Accenture pattern
│   │   └── communication-rounds-p2/   # Cognizant pattern
│   ├── components/           # Shared UI; ui/ holds shadcn primitives
│   ├── hooks/ lib/ utils/    # Premium status, Razorpay, activity results, helpers
│   └── integrations/         # Supabase client
├── supabase/
│   ├── migrations/           # Schema and RLS
│   └── functions/            # Edge functions (payments, bookings, admin, resume/job parsing…)
├── backend/                  # FastAPI app packaged for Lambda (interview, resume, games)
├── communication-backend/    # Standalone FastAPI service for communication grading
├── docs/                     # Operator documentation
├── template.yaml             # AWS SAM template
├── deploy.sh                 # SAM build and deploy helper
└── PRODUCT.md                # Product and brand context
```

## Getting started

### Prerequisites

- Node.js 18+ and npm (a `bun.lockb` is also present if you prefer Bun)
- A Clerk application, a Supabase project and a Razorpay account (test mode is fine)
- Optional, for the AI backend: Python 3.11+, and AWS and Azure Speech credentials

### 1. Run the frontend

```bash
git clone https://github.com/harikrishna-au/gbar_made_easy.git
cd gbar_made_easy
npm install
# create .env with the variables listed below
npm run dev
```

The app starts on the Vite dev server (default `http://localhost:5173`). Most screens sit behind Clerk sign-in, so the Clerk key is required.

### 2. Environment variables

Create a `.env` in the repo root. `.env*` files are git-ignored.

| Variable | Purpose |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key id (public) |
| `VITE_BACKEND_URL` | Base URL of the FastAPI backend |
| `VITE_AZURE_SPEECH_KEY`, `VITE_AZURE_SPEECH_REGION` | Azure Speech, used by the speaking rounds |

Never put secret keys in a `VITE_` variable. Everything with that prefix is shipped to the browser.

### 3. Supabase

```bash
supabase link --project-ref <your-project-ref>
supabase db push                    # apply migrations
supabase functions deploy           # deploy edge functions
```

Set the secrets the functions read:

```bash
supabase secrets set \
  CLERK_SECRET_KEY=... \
  RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=... \
  RESEND_API_KEY=... FROM_EMAIL=... \
  CONNECT_ADMIN_SECRET=... CONNECT_ADMIN_EMAIL=... \
  OPENAI_API_KEY=... \
  GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
```

Other functions also read `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `RAZORPAY_MONTHLY_PLAN_ID` and `COUPON_CODES_JSON`. `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase. `FROM_EMAIL` must be a sender verified in Resend. The Connect operator setup is in [`docs/connect-admin-v1.md`](docs/connect-admin-v1.md).

### 4. Backend (optional for local work)

The AI interview, resume parsing and game APIs live in `backend/`.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ..
uvicorn backend.main:app --reload --port 8000
```

Then set `VITE_BACKEND_URL=http://localhost:8000`. Environment variables read by the backend:

`OPENAI_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `INTERVIEW_TABLE`, `RESUME_BUCKET_NAME`, `ALLOWED_ORIGINS` (comma-separated, for CORS).

The communication grading service is separate:

```bash
cd communication-backend
pip install -r requirements.txt
python main.py        # serves on :8000
```

It needs NLTK data; run `python download_nltk.py` once.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Deployment

- **Frontend:** Vercel. `vercel.json` rewrites every path to `index.html` so client-side routes work. Set the `VITE_*` variables in the Vercel project.
- **Backend:** AWS SAM. `deploy.sh` reads credentials from `backend/.env`, builds the container image (Docker required, so dependencies compile for Linux) and deploys `template.yaml`. Read the script before running it, because it expects specific keys in `backend/.env`.
- **Supabase:** `supabase db push` and `supabase functions deploy`, as above.

## Design principles

The UI follows a calm, near-monochrome stone-and-ink look, with Merriweather for display headings and Inter for interface text. A few rules apply when changing it:

- No generic "AI colours": purple gradients, amber glow or neon accents.
- Both offers (practice and Connect 1:1) must be visible on any selling surface.
- Never invent placement rates, company partnerships or testimonials.
- Keep money and the next action obvious. Keep the voice direct and campus-plain.

Full context is in [`PRODUCT.md`](PRODUCT.md).

## Contributing

1. Branch from the default branch.
2. Run `npm run lint` and `npm run build` before opening a pull request.
3. Keep changes focused and describe what a reviewer should look at.

## License

No license file is included yet. All rights are reserved by the author until one is added.
