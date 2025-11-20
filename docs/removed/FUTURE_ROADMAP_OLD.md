````markdown
# FIRE Finance App - Future Enhancement Roadmap

**Last Updated**: October 20, 2025  
**Current Phase**: Phase D (UX Enhancements) - 25% Complete

---

## 🎯 **Phase D: UX Enhancements** (In Progress)

### ✅ **Completed**
- **Edit Scenario Functionality** - Full CRUD operations for scenarios with form validation

### 🚧 **Remaining Phase D Tasks**
1. **Payee Prefill Logic** - Smart suggestions based on transaction history
2. **Investment Reminders** - Portfolio rebalancing alerts  
3. **Improved Navigation** - Better mobile experience and breadcrumbs
4. **Issues Modal** - Help/feedback system

**Estimated Effort**: 6-8 hours remaining

---

## 🔮 **Phase E: Database Schema Improvements** (Planned)

### **Priority: Medium | Effort: 2-3 hours**

#### **Database Migration: Add Age Columns to Scenarios**
**Background**: Currently storing ages as JSON in the `notes` field (temporary solution implemented during Phase D)

**Enhancement**: Add dedicated columns to scenarios table:
```sql
ALTER TABLE scenarios 
  ADD COLUMN current_age integer,
  ADD COLUMN retirement_age integer, 
  ADD COLUMN life_expectancy integer;
```

**Benefits**:
- ✅ Cleaner data model with proper typing
- ✅ Better query performance (no JSON parsing)
- ✅ Database-level validation and constraints
- ✅ Easier reporting and analytics
- ✅ Eliminates JSON parsing logic in client code

**Migration Steps**:
1. Create migration file: `08_add_age_columns_to_scenarios.sql`
2. Update database types: `npm run supabase:types:remote`
3. Update `formDataToScenarioInsert/Update` to use new columns
4. Update `scenarioToDisplayFormat` to read from new columns
5. Add migration to populate existing records from JSON notes
6. Remove JSON age storage logic

**Files to Update**:
- `supabase/migrations/08_add_age_columns_to_scenarios.sql` (new)
- `src/lib/database.types.ts` (regenerated)
- `src/features/scenarios/scenarios.types.ts` (simplified)

---

## 🚀 **Phase F: Advanced Features** (Future)

### **Advanced FIRE Planning**
- Tax-advantaged account optimization
- Social Security planning integration
- Healthcare cost planning
- Goal tracking with milestones

### **Analytics & Insights**
- Net worth trend charts (requires snapshot history)
- Year-over-year comparisons
- Spending pattern analysis
- Portfolio performance tracking

### **User Experience Enhancements**
- Dark mode support
- Mobile app (React Native)
- Offline capability
- Data export/import (CSV, Excel)

---

## 📊 **Technical Debt & Maintenance**

### **High Priority**
- ⚠️ **Age Storage in JSON** (Phase E priority)
- ⚠️ **Historical data in code** - Move to database or API
- ⚠️ **Account type field deprecation** - Complete migration to account groups

### **Medium Priority**
- **Component prop drilling** - Add more context providers
- **Error boundary coverage** - Add boundaries to all major features
- **Loading state consistency** - Standardize loading indicators

### **Low Priority**
- **Bundle size optimization** - Code splitting for charts
- **Performance monitoring** - Add metrics collection
- **SEO optimization** - Meta tags and structured data

---

## 🎯 **Immediate Next Steps**

### **Option 1: Complete Phase D** (Recommended)
Continue with remaining UX enhancements:
1. Payee Prefill Logic
2. Investment Reminders  
3. Improved Navigation
4. Issues Modal

### **Option 2: Technical Debt Focus**
Address the age storage issue immediately:
1. Create database migration for age columns
2. Update data transformation logic
3. Test with existing scenarios

### **Option 3: New Feature Development**
Move to Phase F advanced features:
1. Advanced FIRE planning enhancements
2. Advanced analytics implementation

---

## 📈 **Success Metrics**

### **Phase D Completion**
- [ ] All CRUD operations work smoothly
- [ ] Mobile experience is polished
- [ ] User feedback system in place
- [ ] Smart automation reduces manual entry

### **Phase E Completion**
- [ ] Clean database schema with proper types
- [ ] No JSON parsing in scenario operations
- [ ] Migration preserves all existing data
- [ ] Performance improvements measurable

### **Long-term Vision**
- [ ] Comprehensive FIRE planning platform
- [ ] Best-in-class user experience for manual financial tracking
- [ ] Advanced scenario modeling and analytics
- [ ] Polished personal finance management tool

---

## 🔄 **Review Schedule**

- **Weekly**: Progress on current phase
- **Monthly**: Roadmap priorities and user feedback
- **Quarterly**: Major version planning and architecture review

---

**Next Review Date**: November 1, 2025  
**Status**: Phase D in progress, Age columns improvement documented for Phase E
````
