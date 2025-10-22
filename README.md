# 🔥 FIRE Finance App

A comprehensive **Financial Independence, Retire Early (FIRE)** tracking application with advanced portfolio modeling, smart transaction management, and comprehensive help system.

[![Built with React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue)](https://tailwindcss.com)

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables are pre-configured:**
   ```env
   VITE_SUPABASE_URL=https://slgmjbbwqhcqtguudglc.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## ✨ Features

### 🏠 **Dashboard & Analytics**
- Real-time FIRE progress tracking with advanced charts
- Monte Carlo simulation with probability curves
- Investment reminders and portfolio rebalancing alerts
- Comprehensive scenario comparison tools

### 💰 **FIRE Scenarios**
- Multiple retirement strategy modeling
- Historical backtesting and Monte Carlo analysis
- Age-based allocation recommendations
- Withdrawal strategy optimization (4% rule, guardrails, dynamic)

### 🏦 **Account Management**
- All account types: checking, savings, investment, retirement, HSA
- Automated net worth tracking
- Account grouping and organization
- Real-time balance updates

### 📝 **Smart Transactions**
- Quick-add with keyboard shortcut (press 'N')
- Intelligent payee suggestions with usage analytics
- Smart categorization and tagging
- Bulk import capabilities

### 📅 **Bills & Budgets**
- Recurring bill management with RRULE support
- Monthly budget planning and tracking
- Envelope budgeting system
- Spending analysis and insights

### ❓ **Help & Support System**
- Comprehensive contextual help throughout the app
- Issues modal for bug reports and feature requests
- Quick help access (Shift + ? keyboard shortcut)
- Floating help button for instant assistance

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript 5, Tailwind CSS, Vite
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Real-time)
- **State Management:** TanStack Query (React Query) + Zustand
- **Charts & Visualization:** Recharts, Custom D3 components
- **Testing:** Jest (unit), Playwright (e2e)
- **Development:** ESLint, Prettier, TypeScript strict mode

## 📁 Project Structure

```
src/
├── app/                 # App-level providers and auth
├── features/           # Feature-based modules
│   ├── accounts/      # Account management
│   ├── bills/         # Recurring bills
│   ├── budgets/       # Budget planning
│   ├── dashboard/     # Main dashboard
│   ├── scenarios/     # FIRE scenarios
│   └── transactions/  # Transaction tracking
├── components/        # Shared UI components
├── hooks/            # Global hooks
├── lib/              # Utilities and configurations
└── styles/           # Global styles
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run type-check      # Run TypeScript checks
npm run lint            # Lint code
npm run format          # Format with Prettier

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run e2e tests

# Database
npm run supabase:types:remote  # Generate TypeScript types
npm run supabase:push          # Push migrations (if configured)
```

## 🗄️ Database Architecture

The app uses **Supabase** with:
- **Row Level Security (RLS)** - All data automatically filtered by user
- **Real-time subscriptions** - Live updates across the app
- **Type-safe queries** - Generated TypeScript types
- **Migration system** - Version-controlled schema changes

### Key Tables:
- `users` - User profiles and preferences
- `accounts` - Financial accounts and balances
- `transactions` - Income and expense records
- `scenarios` - FIRE modeling assumptions
- `categories` - Expense categorization
- `bills` - Recurring payment schedules
- `budgets` - Monthly spending targets

## 🎯 FIRE Methodology

The app implements proven FIRE strategies:

1. **4% Rule** - Classic safe withdrawal rate
2. **Guardrails Strategy** - Dynamic withdrawal adjustments
3. **Monte Carlo Simulation** - Statistical outcome modeling
4. **Historical Backtesting** - Real market data validation
5. **Age-Appropriate Allocation** - Risk adjustment over time

## 🔐 Security & Privacy

- ✅ **Authentication required** - Google OAuth integration
- ✅ **Row Level Security** - Users can only access their own data
- ✅ **Type-safe queries** - Protection against SQL injection
- ✅ **Environment variables** - Secure configuration management
- ✅ **HTTPS enforced** - Secure data transmission

## 📱 Mobile Support

- ✅ **Responsive design** - Works on all screen sizes
- ✅ **Mobile-first navigation** - Touch-optimized interface
- ✅ **Progressive Web App** - Install on mobile devices
- ✅ **Keyboard shortcuts** - Quick actions for power users

## 🚀 Recent Updates (Phase D - Complete)

### Smart UX Enhancements
- **Smart Payee Suggestions** - Intelligent autocomplete with usage analytics
- **Investment Reminders** - Portfolio monitoring with rebalancing alerts
- **Enhanced Navigation** - Mobile-first design with breadcrumbs
- **Issues/Help System** - Comprehensive user support with contextual help
- **Database Optimization** - Dedicated age columns for better performance

### Critical Bug Fixes (October 2025)
- **Credit Card Accounting** - Fixed liabilities being treated as assets, ensuring accurate net worth
- **Profile Creation** - Added automatic profile creation for new users
- **Google OAuth Authentication** - Restored production authentication flow
- **Database Migrations** - Added profiles table and improved account type handling

## 🤝 Support

- **Documentation:** See `/docs` folder for detailed guides
- **Bug Reports:** Use the in-app help system (Shift + ?)
- **Feature Requests:** Submit via the issues modal
- **Development:** Check copilot instructions in `.github/`

## 📈 Roadmap

See [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md) for planned features and enhancements.

## 📄 License

MIT License - feel free to use this for your own FIRE journey!