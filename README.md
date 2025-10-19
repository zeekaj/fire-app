# 🔥 FIRE Finance App

A personal finance web application for tracking your path to **Financial Independence / Retire Early (FIRE)**. Built with React + TypeScript + Supabase.

## 🎯 Features

- **Manual Financial Tracking**: Accounts, transactions, payees, and categories
- **Budgeting**: Monthly targets + optional envelope budgeting
- **Recurring Bills**: RRULE-based bill management with pending workflow
- **FIRE Projections**: Monte Carlo & historical simulations with Guardrails withdrawal
- **Learning Layer**: Contextual hints and auto-categorization recommendations
- **Dashboard**: Time-to-FI, probability curves, spending trends
- **Single User**: Google Auth only, private data with RLS

## 🧱 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State**: React Query (server cache) + Zustand (UI state)
- **Database**: Supabase (Postgres + Auth + RLS)
- **Charts**: Recharts
- **Styling**: Tailwind CSS (fixed light theme)
- **Testing**: Jest + Playwright

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (already configured)
- Git

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd fire-app

# Install dependencies
npm install
```

### 2. Environment Setup

Your environment variables are already configured in `.env.local`:

```bash
VITE_SUPABASE_URL=https://slgmjbbwqhcqtguudglc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Security Notes**:
- `.env.local` is gitignored - never commit credentials
- Only use `VITE_SUPABASE_ANON_KEY` in frontend code
- Never expose `service_role` key in client-side code
- If you ever accidentally expose the service_role key, **rotate it immediately** in Supabase dashboard

### 3. Database Migrations

Apply the initial schema migration to your Supabase project:

```bash
# Push migrations to remote Supabase project
npm run supabase:push
```

Or manually run the migration in Supabase SQL Editor:
1. Go to https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc/sql/new
2. Copy the contents of `supabase/migrations/01_init.sql`
3. Paste and run

### 4. Generate TypeScript Types

After running migrations, generate TypeScript types from your schema:

```bash
# Generate types from remote project
npm run supabase:types:remote
```

This updates `src/lib/database.types.ts` with your current schema.

### 5. Enable Google Auth

Your Google OAuth provider should already be enabled in Supabase. If not:

1. Go to **Authentication > Providers** in Supabase dashboard
2. Enable **Google** provider
3. Add authorized redirect URL: `http://localhost:3000`
4. For production, add your production URL

### 6. Run the App

```bash
# Start development server
npm run dev
```

Visit http://localhost:3000 and sign in with Google.

On **first login**, the app will automatically:
- Create your user record in `public.users`
- Seed 9 default accounts (Checking, Savings, Credit Card, etc.)
- Create FIRE-tuned category hierarchy (40+ categories)
- Create your settings record

## 📁 Project Structure

```
/src
  /app
    /providers        # AuthProvider, AuthGate, LoginPage
  /features           # Feature modules (accounts, transactions, etc.)
  /lib                # Supabase client, utilities, types
  /styles             # Global styles and theme tokens
  /ui                 # Reusable UI components
/supabase
  /migrations         # SQL migration files
```

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking

# Supabase
npm run supabase:push    # Push migrations to remote
npm run supabase:types:remote  # Generate types from remote schema

# Testing
npm run test             # Run Jest unit tests
npm run test:e2e         # Run Playwright E2E tests
```

## 🎨 Brand System (Fixed Light Theme)

### Colors
- **Background**: `#F9FAFB`
- **Card**: `#FFFFFF`
- **Text**: `#0F1115`
- **Muted**: `#4B5563`
- **Primary**: `#E4572E` (hover: `#CC4E29`)
- **Accent**: `#2E86AB`
- **Success**: `#2BB673`
- **Warning**: `#F2C14E`
- **Danger**: `#D64550`

### Design Tokens
- **Border Radius**: 14px
- **Transitions**: 150-200ms
- **Font**: Inter (with tabular figures)
- **Card Padding**: 20-24px

### Formatting
- **Currency**: USD with leading minus for negatives (e.g., `- $145.23` in red)
- **Dates**: `MM/DD/YYYY`

## ⌨️ Keyboard Shortcuts

- `N` - New transaction
- `/` - Search
- `T` - Jump to today
- `Cmd/Ctrl + Enter` - Save
- `Esc` - Cancel
- `J/K` - Navigate rows
- `?` - Show shortcuts cheat sheet

## 🗄️ Database Schema

All tables enforce **Row Level Security (RLS)** where `created_by = auth.uid()`.

### Core Tables
- `users` - User profiles (mirrors auth.users)
- `accounts` - Bank accounts, credit cards, investments
- `transactions` - Financial transactions
- `payees` - Transaction payees with defaults
- `categories` - Hierarchical categories (envelope support)
- `budgets` - Monthly targets or envelope budgets
- `bills` - Recurring bills with RRULE
- `scenarios` - FIRE projection assumptions
- `settings` - User preferences (singleton)
- `migrations_log` - Category rename/merge history
- `snapshots` - Net worth and budget snapshots

See `supabase/migrations/01_init.sql` for full DDL.

## 🔐 Security

- All data is owned by `created_by = auth.uid()`
- RLS policies enforce ownership on all tables
- Google OAuth only (no password auth)
- Anon key is safe for client-side use (RLS enforced)
- Never commit `.env.local` or expose service_role key

## 📦 Deployment

1. Build the app: `npm run build`
2. Deploy `dist/` folder to any static hosting (Vercel, Netlify, Cloudflare Pages)
3. Add production URL to Supabase Auth redirect URLs
4. Set environment variables in hosting provider

## 🧮 FIRE Simulation Defaults

- **Mean Real Return**: 5%
- **Std Dev**: 12%
- **Inflation**: 2%
- **Withdrawal Rule**: Guardrails (±10% adjust, ±20% annual cap)
- **Simulation Modes**: Monte Carlo + Historical bootstrap

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (Current)
- Database schema with RLS
- Auth with Google
- First-login setup (accounts, categories, settings)

### 📋 Next Steps (Micro-Features)
1. **Accounts/Payees CRUD** - Full CRUD with archived accounts
2. **Quick-Add Transaction** - Keyboard-first entry (no splits)
3. **Budgets (Monthly Targets)** - Default budget model
4. **Bills Pending Flow** - RRULE generation + inline confirm
5. **Dashboard Tiles + Charts** - Time-to-FI, spending trends
6. **Deterministic FI Sim v0** - Wire simulation to dashboard

### Future Phases
- Envelope budgeting
- Learning layer (recommendations)
- Month close audit trail
- Loan amortization
- Investment staleness alerts
- Scenario comparisons
- Trends & insights
- Export/backup automation

## 📝 Notes

- **Single user app** - No multi-tenancy
- **Online only** - No offline support
- **Manual entry** - No bank connections
- **Backup strategy** - Monthly CSV/JSON exports (6 months retention)

## 🐛 Troubleshooting

### TypeScript errors after install
Run `npm run type-check` to ensure types are generated correctly.

### Supabase connection issues
- Verify `.env.local` has correct URL and anon key
- Check Supabase project is not paused (free tier)
- Ensure RLS policies are enabled

### Google Auth not working
- Add `http://localhost:3000` to allowed redirect URLs in Supabase Auth settings
- Clear browser cache and try again

### Database types out of sync
```bash
npm run supabase:types:remote
```

---

**Built with ❤️ for the FIRE community**