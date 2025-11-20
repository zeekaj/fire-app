````markdown
# Decision: Deprecated 'type' Field Strategy

## Context

After migrating to the Account Groups system, the `accounts` table has both:
- `type` field (deprecated, hardcoded values)
- `account_group_id` field (new, flexible grouping)

We need to decide: **Keep `type` or remove it?**

---

## Current State

### Database Schema
```sql
create table public.accounts (
  id uuid primary key,
  ...
  type text not null check (type in ('checking','savings','credit',...)),
  account_group_id uuid references public.account_groups(id),
  ...
);
```

### Code Usage
- `first-login-setup.ts`: Sets `type` during account creation (for backward compatibility)
- `database.types.ts`: Marked as "Deprecated: kept for backward compatibility"
- No other code actively uses the `type` field

---

## Option A: Keep `type` Field (RECOMMENDED ✅)

### Pros
- ✅ **Zero breaking changes** - existing data remains valid
- ✅ **Rollback capability** - can revert migration if needed
- ✅ **Migration safety** - data integrity preserved
- ✅ **Gradual transition** - gives time to fully validate new system
- ✅ **Audit trail** - historical context preserved
- ✅ **External integrations** - third-party tools may rely on `type`

### Cons
- ❌ Storage overhead (~10-20 bytes per account)
- ❌ Schema complexity (two fields serving similar purpose)
- ❌ Potential confusion for new developers
- ❌ Need to maintain deprecated field documentation

### Implementation
- Mark as deprecated in types/docs
- Continue populating during creation
- Plan removal in future major version

---

## Option B: Remove `type` Field

### Pros
- ✅ Cleaner schema
- ✅ Single source of truth (`account_group_id`)
- ✅ Less storage overhead
- ✅ Simplified mental model

### Cons
- ❌ **Breaking change** - requires new migration
- ❌ **No rollback** - can't easily revert to old system
- ❌ **Risk** - potential data issues if problems discovered later
- ❌ **Testing burden** - need extensive validation
- ❌ **External dependencies** - may break integrations

### Implementation Steps (if chosen)
1. Audit all code for `type` field usage
2. Update all queries to use `account_group_id`
3. Create migration to drop `type` column
4. Update TypeScript types
5. Extensive testing across all features
6. Deploy with careful monitoring

---

## Recommendation: **Option A - Keep `type` Field**

### Rationale
Given that:
1. The app is in active development
2. Account Groups feature is newly implemented
3. Storage cost is negligible (<1KB per 100 accounts)
4. No active performance issues
5. Benefits of backward compatibility outweigh costs

**We should keep the `type` field as deprecated for now.**

### Action Plan

**Immediate (Phase 2):**
- ✅ Mark as deprecated in documentation
- ✅ Add code comments explaining deprecation
- ✅ Keep current behavior (populate on create)

**Short-term (Next 3-6 months):**
- Monitor usage patterns
- Validate Account Groups system stability
- Collect user feedback
- Verify no external dependencies on `type`

**Long-term (Future v2.0):**
- If Account Groups proves stable and widely adopted
- If no issues discovered with new system
- Plan `type` field removal in major version update
- Create migration guide for any affected code

---

## Implementation Details

### 1. Update Code Comments

**File: `src/lib/database.types.ts`**
```typescript
accounts: {
  Row: {
    ...
    type: string // DEPRECATED: Use account_group_id instead. Kept for backward compatibility. Will be removed in v2.0
    account_group_id: string | null
    ...
  }
}
```

**File: `src/lib/first-login-setup.ts`**
```typescript
// Keep type field populated for backward compatibility
// TODO(v2.0): Remove type field when account_group_id is fully validated
type: group.name.toLowerCase().replace(/\s+/g, '_'),
```

### 2. Add Schema Documentation

**File: `supabase/migrations/02_account_groups.sql`**
```sql
-- NOTE: The 'type' column is deprecated but kept for backward compatibility
-- All new code should use 'account_group_id' for grouping accounts
-- Planned for removal in v2.0 migration
```

### 3. Update README

Add deprecation notice:
```markdown
## Database Schema Notes

### Deprecated Fields
- `accounts.type`: Replaced by `account_group_id`. Kept for backward compatibility.
```

---

## Review Criteria

Before removing `type` in future version, verify:
- [ ] 6+ months of stable Account Groups operation
- [ ] Zero reported issues with Account Groups
- [ ] No active code using `type` field
- [ ] No external tools/integrations depend on `type`
- [ ] Migration path documented for any edge cases
- [ ] Full test coverage for accounts without `type`

---

## Decision Log

**Date:** October 19, 2025  
**Decision:** Keep `type` field as deprecated  
**Rationale:** Prioritize stability and backward compatibility during initial rollout  
**Review Date:** April 2026 (6 months)  
**Stakeholders:** Development team  

---

## Related Documents
- [ACCOUNT_GROUPS.md](./ACCOUNT_GROUPS.md) - Complete Account Groups guide
- [PHASE1_CLEANUP_REPORT.md](./PHASE1_CLEANUP_REPORT.md) - Phase 1 cleanup summary
- Migration: `supabase/migrations/02_account_groups.sql`

````
