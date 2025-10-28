# 📖 Documentation Index

Welcome to the FIRE Finance App documentation! This index will help you find the information you need.

## 📋 Current Documentation

### 🚀 Getting Started
- **[README.md](../../README.md)** - Project overview, quick start, and features
- **[USER_GUIDE.md](../../USER_GUIDE.md)** - Comprehensive user guide for all features
- **[SCENARIOS_QUICK_START.md](../SCENARIOS_QUICK_START.md)** - Quick start guide for FIRE scenarios feature

### 🔮 Project Planning
- **[FUTURE_ROADMAP.md](../../FUTURE_ROADMAP.md)** - Upcoming features and long-term vision

### 🐛 Bug Fixes & Improvements
- **[UX_IMPROVEMENTS_OCT_28_2025.md](../UX_IMPROVEMENTS_OCT_28_2025.md)** - Latest UX improvements (liability accounts, custom date range, Quick Add enhancements)
- **[CRITICAL_BUG_FIXES_OCT_2025.md](../CRITICAL_BUG_FIXES_OCT_2025.md)** - Critical bug fixes (credit cards, profiles, auth)
- **[TRANSFER_FEATURE_COMPLETE.md](../TRANSFER_FEATURE_COMPLETE.md)** - Transfer feature implementation details
- **[TRANSACTION_SYSTEM_OVERHAUL.md](../TRANSACTION_SYSTEM_OVERHAUL.md)** - Transaction system redesign documentation
- **[BUG_FIX_WITHDRAWAL_STRATEGY.md](../BUG_FIX_WITHDRAWAL_STRATEGY.md)** - Withdrawal strategy bug fix

## 📁 Documentation Structure

```
docs/
├── current/
│   └── index.md                           # This file - documentation index
├── archive/                               # Historical documentation
│   ├── phases/                           # Completed phase development docs
│   │   ├── PHASE_A_PROGRESS.md
│   │   ├── PHASE_A_README.md
│   │   ├── PHASE_B_COMPLETE.md
│   │   ├── PHASE_B_IMPLEMENTATION_SUMMARY.md
│   │   ├── PHASE_B_MANUAL_TESTING.md
│   │   ├── PHASE_B_PROGRESS.md
│   │   ├── PHASE_B_TESTING_CHECKLIST.md
│   │   ├── PHASE_B_WITHDRAWAL_STRATEGY.md
│   │   ├── PHASE_C_PLAN.md
│   │   ├── PHASE_C_TASK_1_COMPLETE.md
│   │   ├── PHASE_C_TASK_1_TESTING.md
│   │   ├── SESSION_SUMMARY.md
│   │   ├── DELIVERY_SUMMARY.md
│   │   ├── FINAL_CHECKLIST.md
│   │   └── CLEANUP_SUMMARY.md
│   ├── migrations/                       # Database migration docs
│   │   ├── APPLY_MIGRATION.md
│   │   └── TRANSFER_FEATURE_MIGRATION.md
│   ├── README.md                         # Old README versions
│   ├── USER_GUIDE_OLD.md                # Previous user guide
│   └── FUTURE_ROADMAP_OLD.md            # Previous roadmap
├── BUG_FIX_WITHDRAWAL_STRATEGY.md       # Active bug fix documentation
├── CRITICAL_BUG_FIXES_OCT_2025.md       # Recent critical fixes
├── SCENARIOS_QUICK_START.md             # Scenarios feature guide
├── TRANSACTION_SYSTEM_OVERHAUL.md       # Transaction redesign
├── TRANSFER_FEATURE_COMPLETE.md         # Transfer feature docs
└── UX_IMPROVEMENTS_OCT_28_2025.md       # Latest UX improvements
```

## 🎯 Current Project Status

### ✅ Latest Updates (October 28, 2025)
**UX Improvements & Polish**
- **Liability Account Fixes** - Credit cards and mortgages display correctly (charges/payments inverted)
- **Custom Date Range Filter** - Filter transactions by any date range
- **Smart Notifications** - Dismissible notifications with localStorage persistence
- **Quick Add Modal** - Auto-focus date input, improved tab navigation, removed clutter
- **Category Selection** - Better visual separation, proper tab key behavior
- **Active Tab Persistence** - Stay on same page after browser refresh

See [UX_IMPROVEMENTS_OCT_28_2025.md](../UX_IMPROVEMENTS_OCT_28_2025.md) for full details.

### ✅ Phase D Complete (October 2025)
- **Smart Payee Suggestions** - Intelligent autocomplete with usage analytics
- **Investment Reminders** - Portfolio monitoring with 5 alert types
- **Enhanced Navigation** - Mobile-first design with breadcrumbs
- **Issues/Help System** - Comprehensive user support with contextual help
- **Database Optimization** - Dedicated age columns for better performance

### 🐛 Critical Bug Fixes (October 22, 2025)
- **Credit Card Accounting** - Fixed liabilities incorrectly treated as assets
- **Profile Creation** - Added automatic profile creation for new users  
- **Google OAuth Authentication** - Restored production authentication flow
- **Database Schema** - Added profiles table and improved account types

### 🔄 Next Up: Advanced Analytics & Insights
See [FUTURE_ROADMAP.md](../../FUTURE_ROADMAP.md) for detailed upcoming features.

## 📚 Key Resources

### For Users
- **Getting Started**: [README.md](../../README.md) → Quick Start section
- **Learning the App**: [USER_GUIDE.md](../../USER_GUIDE.md) → Comprehensive guide
- **Getting Help**: Press `Shift + ?` in the app or use the floating help button

### For Developers
- **Architecture**: [.github/copilot-instructions.md](../../.github/copilot-instructions.md)
- **Development Commands**: [README.md](../../README.md) → Development Commands section
- **Project Structure**: [README.md](../../README.md) → Project Structure section

### For Planning
- **Future Features**: [FUTURE_ROADMAP.md](../../FUTURE_ROADMAP.md)
- **Historical Progress**: [archive/phases/](../archive/phases/) folder

## 🗂️ Archive Contents

The `archive/` folder contains historical documentation that's no longer current but may be useful for reference:

### Phases Folder
- Complete documentation from Phases A, B, and C
- Development progress reports and summaries
- Testing checklists and implementation details

### Migrations Folder  
- Database migration scripts and instructions
- Historical SQL files and migration reports
- Manual database update procedures

### Root Archive Files
- Previous versions of README and USER_GUIDE
- Session summaries and development logs
- Deprecated decision documents

## 🔄 Documentation Maintenance

This documentation index is the authoritative reference for all current documentation. 

**When to archive:**
- Phase completion documents after phase is shipped
- Testing checklists after issues are resolved
- Migration guides after migrations are applied
- Session summaries after work is integrated

**What stays current:**
- README and USER_GUIDE (living documents)
- FUTURE_ROADMAP (updated regularly)
- Recent bug fixes and improvements (last 30 days)
- Active feature documentation

---

**Last Updated:** October 28, 2025  
**Maintained By:** Development Team  
**Questions?** Open an issue or check the [Issues Modal](../../src/components/IssuesModal.tsx) in the app.

This documentation is actively maintained. If you notice outdated information:

1. **Users**: Use the in-app help system (Shift + ?) to report documentation issues
2. **Developers**: Update the relevant files and maintain this index

---

*Last Updated: October 22, 2025*  
*Current Version: Phase D Complete + Critical Bug Fixes*