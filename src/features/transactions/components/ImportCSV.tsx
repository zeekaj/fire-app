import { useState, useRef } from 'react';
import { useCreateTransaction } from '../hooks/useTransactions';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { usePayees, useCreatePayee } from '../hooks/usePayees';
import { useCategories } from '../hooks/useCategories';
import type { Database } from '../../../lib/database.types';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

interface ImportCSVProps {
  onClose: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  date?: string;
  amount?: string;
  payee?: string;
  category?: string;
  notes?: string;
  account?: string;
}

export function ImportCSV({ onClose }: ImportCSVProps) {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [defaultAccount, setDefaultAccount] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: accounts = [] } = useAccounts();
  const { data: payees = [] } = usePayees();
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();
  const createPayee = useCreatePayee();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        alert('CSV file is empty');
        return;
      }

      // Parse headers
      const headerLine = lines[0];
      const parsedHeaders = parseCSVLine(headerLine);
      setHeaders(parsedHeaders);

      // Parse data rows
      const rows: CSVRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: CSVRow = {};
        parsedHeaders.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }
      
      setCsvData(rows);

      // Auto-detect column mapping
      autoDetectColumns(parsedHeaders);
    };

    reader.readAsText(selectedFile);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const autoDetectColumns = (headers: string[]) => {
    const mapping: ColumnMapping = {};
    
    headers.forEach(header => {
      const lower = header.toLowerCase();
      if (lower.includes('date')) mapping.date = header;
      else if (lower.includes('amount') || lower.includes('value')) mapping.amount = header;
      else if (lower.includes('payee') || lower.includes('vendor') || lower.includes('merchant')) mapping.payee = header;
      else if (lower.includes('category')) mapping.category = header;
      else if (lower.includes('note') || lower.includes('memo') || lower.includes('description')) mapping.notes = header;
      else if (lower.includes('account')) mapping.account = header;
    });

    setColumnMapping(mapping);
  };

  const handleImport = async () => {
    if (!columnMapping.date || !columnMapping.amount) {
      alert('Date and Amount columns are required');
      return;
    }

    if (!defaultAccount && !columnMapping.account) {
      alert('Please select a default account or map an account column');
      return;
    }

    setImporting(true);
    setProgress({ current: 0, total: csvData.length });

    let successCount = 0;
    let errorCount = 0;

    // Create payee map for lookups
    const payeeMap = new Map(payees.map(p => [p.name.toLowerCase(), p.id]));
    const categoryMap = new Map(categories.map(c => [
      (c.path || c.name).toLowerCase(), 
      c.id
    ]));
    const accountMap = new Map(accounts.map(a => [a.name.toLowerCase(), a.id]));

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      setProgress({ current: i + 1, total: csvData.length });

      try {
        // Parse date
        const dateStr = row[columnMapping.date!];
        if (!dateStr) {
          errorCount++;
          continue;
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          errorCount++;
          continue;
        }
        const formattedDate = date.toISOString().split('T')[0];

        // Parse amount
        const amountStr = row[columnMapping.amount!].replace(/[^0-9.-]/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) {
          errorCount++;
          continue;
        }

        // Get or create payee
        let payeeId: string | null = null;
        if (columnMapping.payee && row[columnMapping.payee]) {
          const payeeName = row[columnMapping.payee].trim();
          const existingPayeeId = payeeMap.get(payeeName.toLowerCase());
          
          if (existingPayeeId) {
            payeeId = existingPayeeId;
          } else {
            // Create new payee
            const newPayees = await createPayee.mutateAsync({ name: payeeName });
            payeeId = newPayees[0].id;
            payeeMap.set(payeeName.toLowerCase(), newPayees[0].id);
          }
        }

        // Get category
        let categoryId: string | null = null;
        if (columnMapping.category && row[columnMapping.category]) {
          const categoryName = row[columnMapping.category].trim();
          categoryId = categoryMap.get(categoryName.toLowerCase()) || null;
        }

        // Get account
        let accountId = defaultAccount;
        if (columnMapping.account && row[columnMapping.account]) {
          const accountName = row[columnMapping.account].trim();
          accountId = accountMap.get(accountName.toLowerCase()) || defaultAccount;
        }

        // Get notes
        const notes = columnMapping.notes ? row[columnMapping.notes] : null;

        // Create transaction
        const transaction: Omit<TransactionInsert, 'created_by'> = {
          date: formattedDate,
          amount,
          account_id: accountId,
          payee_id: payeeId,
          category_id: categoryId,
          notes: notes || null,
          is_pending: false
        };

        await createTransaction.mutateAsync(transaction);
        successCount++;
      } catch (error) {
        console.error('Error importing row:', row, error);
        errorCount++;
      }
    }

    setImporting(false);
    alert(`Import complete!\nSuccess: ${successCount}\nErrors: ${errorCount}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Import Transactions from CSV</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              disabled={importing}
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          {!csvData.length && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90
                  cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-500">
                CSV file should have headers. Supported formats: Date, Amount, Payee, Category, Notes, Account
              </p>
            </div>
          )}

          {/* Column Mapping */}
          {csvData.length > 0 && !importing && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Map Columns ({csvData.length} rows found)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Column *
                    </label>
                    <select
                      value={columnMapping.date || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Column *
                    </label>
                    <select
                      value={columnMapping.amount || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payee Column
                    </label>
                    <select
                      value={columnMapping.payee || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, payee: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Column
                    </label>
                    <select
                      value={columnMapping.category || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes Column
                    </label>
                    <select
                      value={columnMapping.notes || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Column
                    </label>
                    <select
                      value={columnMapping.account || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, account: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Default Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Account {!columnMapping.account && '*'}
                </label>
                <select
                  value={defaultAccount}
                  onChange={(e) => setDefaultAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select account...</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Used when no account column is mapped or value is not found
                </p>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview (First 5 Rows)</h3>
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Payee</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {csvData.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {columnMapping.date ? row[columnMapping.date] : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {columnMapping.amount ? row[columnMapping.amount] : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {columnMapping.payee ? row[columnMapping.payee] : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {columnMapping.category ? row[columnMapping.category] : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Progress */}
          {importing && (
            <div className="text-center py-8">
              <div className="text-lg font-medium text-gray-900 mb-2">
                Importing Transactions...
              </div>
              <div className="text-sm text-gray-600 mb-4">
                {progress.current} of {progress.total}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          {csvData.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {csvData.length} Transactions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
