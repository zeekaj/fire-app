import { useEffect, useMemo, useRef, useState } from 'react';
import { format as formatDateFn, subDays, startOfMonth, startOfYear } from 'date-fns';
import { useAccounts } from '../hooks/useAccounts';
import { AccountRegister } from './AccountRegister';
import { formatCurrency } from '@/lib/format';
// import { QuickAddTransaction } from '@/features/transactions/components/QuickAddTransaction';
import { AccountAddTransactionModal } from '@/features/transactions/components/AccountAddTransactionModal';

/**
 * AccountsWorkspace
 * 
 * Two-pane layout with a left sidebar of accounts and a main register view.
 * Keeps schema/hooks unchanged and avoids modals for a register experience.
 */
export function AccountsWorkspace() {
  const { data: accounts = [], isLoading, error } = useAccounts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'expense'|'income'|'transfer'|'payment'|undefined>(undefined);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const startDateRef = useRef<HTMLInputElement | null>(null);

  const classify = (type: string, balance: number | null | undefined) => {
    const liabilityTypes = ['credit', 'mortgage'];
    return liabilityTypes.includes(type) || (balance ?? 0) < 0;
  };

  const { assets, liabilities, totals } = useMemo(() => {
    const assets = accounts.filter(a => !classify(a.type, a.current_balance));
    const liabilities = accounts.filter(a => classify(a.type, a.current_balance));
    const totalAssets = assets.reduce((s, a) => s + (a.current_balance ?? 0), 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + Math.abs(a.current_balance ?? 0), 0);
    return {
      assets,
      liabilities,
      totals: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        net: totalAssets - totalLiabilities,
      },
    };
  }, [accounts]);

  const selected = useMemo(() => accounts.find(a => a.id === selectedId) ?? accounts[0] ?? null, [accounts, selectedId]);

  // Persist and restore last selected account
  useEffect(() => {
    if (!selectedId && accounts.length) {
      const saved = localStorage.getItem('lastSelectedAccountId');
      if (saved && accounts.some(a => a.id === saved)) {
        setSelectedId(saved);
      } else {
        setSelectedId(accounts[0].id);
      }
    }
  }, [accounts, selectedId]);

  // Open the account-scoped add modal when global shortcut/button requests it
  useEffect(() => {
    const handler = () => {
      setQuickAddType(undefined);
      setIsQuickAddOpen(true);
    };
    window.addEventListener('open-account-add-modal' as any, handler as any);
    return () => {
      window.removeEventListener('open-account-add-modal' as any, handler as any);
    };
  }, []);

  useEffect(() => {
    if (selectedId) localStorage.setItem('lastSelectedAccountId', selectedId);
  }, [selectedId]);

  // Restore saved date filters per account
  useEffect(() => {
    if (!selectedId) return;
    const raw = localStorage.getItem(`register-dates:${selectedId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { start?: string; end?: string };
        setStartDate(parsed.start);
        setEndDate(parsed.end);
      } catch {
        // ignore parse errors
      }
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [selectedId]);

  // Persist date filters per account
  useEffect(() => {
    if (!selectedId) return;
    localStorage.setItem(`register-dates:${selectedId}` , JSON.stringify({ start: startDate, end: endDate }));
  }, [selectedId, startDate, endDate]);

  // Filtered lists and navigation list (used by keyboard handlers)
  const filteredAssets = useMemo(
    () => assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase())),
    [assets, search]
  );
  const filteredLiabilities = useMemo(
    () => liabilities.filter(a => a.name.toLowerCase().includes(search.toLowerCase())),
    [liabilities, search]
  );
  const navList = useMemo(() => [...filteredAssets, ...filteredLiabilities], [filteredAssets, filteredLiabilities]);

  // Keyboard shortcuts: A=Add, T=Transfer, F or /=Search, D toggle 30d, Shift+D This Month, ↑/↓ navigate, Esc closes modal
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as any).isContentEditable ||
        target.tagName === 'SELECT'
      );
      if (isTyping) return;

      const key = e.key.toLowerCase();

      // If Quick Add is open: allow Esc to close, otherwise ignore
      if (isQuickAddOpen) {
        if (key === 'escape') {
          e.preventDefault();
          setIsQuickAddOpen(false);
        }
        return;
      }

      if (key === 'a') {
        setQuickAddType(undefined);
        setIsQuickAddOpen(true);
      } else if (key === 't') {
        setQuickAddType('transfer');
        setIsQuickAddOpen(true);
      } else if (key === 'f' || key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (key === 'd' && !e.shiftKey) {
        const now = new Date();
        if (!startDate && !endDate) {
          setStartDate(formatDateFn(subDays(now, 30), 'yyyy-MM-dd'));
          setEndDate(formatDateFn(now, 'yyyy-MM-dd'));
        } else {
          setStartDate(undefined);
          setEndDate(undefined);
        }
      } else if (key === 'd' && e.shiftKey) {
        const now = new Date();
        setStartDate(formatDateFn(startOfMonth(now), 'yyyy-MM-dd'));
        setEndDate(formatDateFn(now, 'yyyy-MM-dd'));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const list = navList;
        if (!list.length) return;
        const idx = list.findIndex(a => a.id === selectedId);
        const nextIdx = Math.min(idx + 1, list.length - 1);
        const next = list[nextIdx] || list[0];
        if (next && next.id !== selectedId) setSelectedId(next.id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const list = navList;
        if (!list.length) return;
        const idx = list.findIndex(a => a.id === selectedId);
        const prevIdx = Math.max(idx - 1, 0);
        const prev = list[prevIdx] || list[0];
        if (prev && prev.id !== selectedId) setSelectedId(prev.id);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isQuickAddOpen, startDate, endDate, navList, selectedId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-500">Loading accounts…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">Failed to load accounts.</div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">No accounts yet.</div>
    );
  }


  // Keyboard shortcuts: A=Add, T=Transfer, F or /=Search, D=Date toggle, Shift+D=This Month, ↑/↓ navigate, Esc closes modal
  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      {sidebarOpen && (
      <aside className="w-72 shrink-0">
        <div className="sticky top-4 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="text-sm font-semibold text-gray-900">Accounts</div>
              <div className="text-xs text-gray-500">Net Worth: {formatCurrency(totals.net)}</div>
            </div>
            {/* Search */}
            <div className="px-3 py-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts…"
                ref={searchRef}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            {/* Assets */}
            <div className="px-2 py-2">
              <div className="px-2 py-1 text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between">
                <span>Assets</span>
              </div>
              <ul className="mt-1">
                {filteredAssets.map(a => (
                  <li key={a.id}>
                    <button
                      onClick={() => setSelectedId(a.id)}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-gray-50 ${selected?.id === a.id ? 'bg-blue-50 border border-blue-200' : ''}`}
                    >
                      <span className="text-sm text-gray-900">{a.name}</span>
                      <span className="text-sm font-medium text-gray-700">{formatCurrency(a.current_balance ?? 0)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {/* Liabilities */}
            <div className="px-2 py-2 border-t border-gray-100">
              <div className="px-2 py-1 text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between">
                <span>Liabilities</span>
                <span className="font-medium text-red-700">{formatCurrency(totals.liabilities)}</span>
              </div>
              <ul className="mt-1">
                {filteredLiabilities.map(a => (
                  <li key={a.id}>
                    <button
                      onClick={() => setSelectedId(a.id)}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-gray-50 ${selected?.id === a.id ? 'bg-blue-50 border border-blue-200' : ''}`}
                    >
                      <span className="text-sm text-gray-900">{a.name}</span>
                      <span className="text-sm font-medium text-gray-700">{formatCurrency(Math.abs(a.current_balance ?? 0))}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </aside>
      )}

      {/* Main panel */}
      <section className="flex-1 min-w-0">
        {/* Header actions */}
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(s => !s)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
            </button>
            <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
              <span>Shortcuts:</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">A</kbd>
              <span>Add</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">T</kbd>
              <span>Transfer</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">F</kbd>
              <span>Search</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">D</kbd>
              <span>Dates</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">Shift+D</kbd>
              <span>This Month</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">↑/↓</kbd>
              <span>Navigate</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick ranges */}
            <div className="hidden md:flex items-center gap-1 mr-1">
              <button
                onClick={() => {
                  const today = formatDateFn(new Date(), 'yyyy-MM-dd');
                  setStartDate(today);
                  setEndDate(today);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                title="Today"
              >Today</button>
              <button
                onClick={() => {
                  const now = new Date();
                  const start = formatDateFn(startOfMonth(now), 'yyyy-MM-dd');
                  const end = formatDateFn(now, 'yyyy-MM-dd');
                  setStartDate(start);
                  setEndDate(end);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                title="This Month"
              >This Month</button>
              <button
                onClick={() => {
                  const now = new Date();
                  const start = formatDateFn(subDays(now, 30), 'yyyy-MM-dd');
                  const end = formatDateFn(now, 'yyyy-MM-dd');
                  setStartDate(start);
                  setEndDate(end);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                title="Last 30 days"
              >Last 30d</button>
              <button
                onClick={() => {
                  const now = new Date();
                  const start = formatDateFn(startOfYear(now), 'yyyy-MM-dd');
                  const end = formatDateFn(now, 'yyyy-MM-dd');
                  setStartDate(start);
                  setEndDate(end);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                title="Year to date"
              >YTD</button>
            </div>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => setStartDate(e.target.value || undefined)}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              placeholder="Start"
              ref={startDateRef}
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value || undefined)}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              placeholder="End"
            />
            <button
              onClick={() => { setStartDate(undefined); setEndDate(undefined); }}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
            >Clear</button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              onClick={() => { setQuickAddType(undefined); setIsQuickAddOpen(true);} }
              className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
            >Add</button>
            <button
              onClick={() => { setQuickAddType('transfer'); setIsQuickAddOpen(true);} }
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >Transfer</button>
          </div>
        </div>

        {selected ? (
          <AccountRegister account={selected as any} variant="inline" startDate={startDate} endDate={endDate} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">Select an account to view its register.</div>
        )}

        {/* Account-scoped Add Transaction Modal */}
        {selected && (
          <AccountAddTransactionModal
            isOpen={isQuickAddOpen}
            onClose={() => setIsQuickAddOpen(false)}
            accountId={selected.id}
            defaultType={quickAddType}
          />
        )}
      </section>
    </div>
  );
}
