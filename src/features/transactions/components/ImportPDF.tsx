import { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useCreateTransaction } from '../hooks/useTransactions';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { usePayees, useCreatePayee } from '../hooks/usePayees';
import { useCategories } from '../hooks/useCategories';
import type { Database } from '../../../lib/database.types';

// Configure PDF.js worker - use the bundled worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

interface ImportPDFProps {
  onClose: () => void;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance?: number;
  selected: boolean;
}

export function ImportPDF({ onClose }: ImportPDFProps) {
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [defaultCategory, setDefaultCategory] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [rawText, setRawText] = useState('');
  const [statementType, setStatementType] = useState<'checking' | 'credit'>('checking');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedFileRef = useRef<File | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { data: payees = [] } = usePayees();
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();
  const createPayee = useCreatePayee();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    uploadedFileRef.current = file;
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw error;
    }
  };

  const handleExtractFromPDF = async () => {
    if (!uploadedFileRef.current) return;
    
    setIsExtracting(true);
    try {
      const text = await extractTextFromPDF(uploadedFileRef.current);
      
      if (!text.trim()) {
        setShowInstructions(true);
        setUploadedFileName('');
        uploadedFileRef.current = null;
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setRawText(text);
      const transactions = parseStatementText(text, statementType);
      
      if (transactions.length === 0) {
        // Show the extracted text in the textarea so user can see what was extracted
        console.log('Extracted PDF text:', text);
        setShowInstructions(true);
        // Keep the text so user can manually edit if needed
      } else {
        setParsedTransactions(transactions.map(t => ({ ...t, selected: true })));
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      setShowInstructions(true);
    } finally {
      setIsExtracting(false);
    }
  };

  const parseStatementText = (text: string, type: 'checking' | 'credit'): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log(`Parsing ${lines.length} lines from ${type} statement`);
    console.log('First 20 lines:', lines.slice(0, 20));

    // For credit card statements, look for simpler pattern: MM/DD description amount
    // Pattern for date at start of line: MM/DD with optional /YYYY
    const datePattern = /^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+)/;
    
    // Pattern to match amounts at end of line or standalone
    const amountPattern = /-?([\d,]+\.\d{2})$/;
    const amountAnywherePattern = /\$?([\d,]+\.\d{2})/g;

    let inPaymentsSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track if we're in the payments/credits section
      if (line.includes('PAYMENTS') || line.includes('CREDITS')) {
        inPaymentsSection = true;
      }
      if (line.includes('PURCHASE') || line.includes('FEES') || line.includes('INTEREST')) {
        inPaymentsSection = false;
      }

      // Check if line starts with a date
      const dateMatch = line.match(datePattern);
      if (!dateMatch) continue;

      const dateStr = dateMatch[1];
      const restOfLine = dateMatch[2].trim();

      // Try to extract amount from end of line first
      let amount = 0;
      let description = restOfLine;
      
      const endAmountMatch = restOfLine.match(amountPattern);
      if (endAmountMatch) {
        amount = parseFloat(endAmountMatch[1].replace(/,/g, ''));
        // Remove amount from description
        description = restOfLine.replace(amountPattern, '').trim();
      } else {
        // Try to find any amount in the line
        const amounts: number[] = [];
        let match;
        const regex = new RegExp(amountAnywherePattern);
        
        while ((match = regex.exec(restOfLine)) !== null) {
          amounts.push(parseFloat(match[1].replace(/,/g, '')));
        }

        if (amounts.length > 0) {
          // Use the last amount found (typically the transaction amount)
          amount = amounts[amounts.length - 1];
          
          // Extract description - everything before the last amount
          const lastAmountStr = match ? match[0] : '';
          const lastAmountIndex = restOfLine.lastIndexOf(lastAmountStr);
          if (lastAmountIndex > 0) {
            description = restOfLine.substring(0, lastAmountIndex).trim();
          }
        }
      }

      if (amount === 0) continue;

      // Clean up description - remove "Order Number" lines and extra info
      if (description.toLowerCase().includes('order number')) {
        // Skip order number lines, or merge with previous transaction
        continue;
      }

      // Remove common artifacts
      description = description
        .replace(/\s+/g, ' ')
        .replace(/\$\d+\.\d{2}/g, '') // Remove any remaining amounts
        .trim();

      if (!description || description.length < 2) continue;

      // Determine transaction type
      let transactionType: 'debit' | 'credit';
      
      if (type === 'credit') {
        // Credit card statement:
        // - Purchases/charges are debits (money you owe)
        // - Payments/credits are credits (reduce balance)
        if (inPaymentsSection || description.toLowerCase().includes('payment')) {
          transactionType = 'credit';
          // Payment amounts shown as negative in statement become positive credits
          amount = Math.abs(amount);
        } else {
          transactionType = 'debit';
        }
      } else {
        // Checking account:
        // - Withdrawals/purchases are debits
        // - Deposits are credits
        if (description.toLowerCase().includes('deposit') || description.toLowerCase().includes('credit')) {
          transactionType = 'credit';
        } else {
          transactionType = 'debit';
        }
      }

      transactions.push({
        date: normalizeDate(dateStr),
        description: description.substring(0, 100),
        amount: Math.abs(amount),
        type: transactionType,
        selected: true
      });
    }

    console.log(`Parsed ${transactions.length} transactions`);
    if (transactions.length > 0) {
      console.log('First 3 transactions:', transactions.slice(0, 3));
    }
    return transactions;
  };

  const normalizeDate = (dateStr: string): string => {
    try {
      // Handle MM/DD or MM/DD/YY or MM/DD/YYYY formats
      const parts = dateStr.split('/');
      
      let year: number, month: number, day: number;
      
      month = parseInt(parts[0]) - 1; // 0-indexed for Date constructor
      day = parseInt(parts[1]);
      
      if (parts.length === 3) {
        year = parseInt(parts[2]);
        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
      } else {
        // No year provided, use current year
        year = new Date().getFullYear();
      }
      
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  const handleManualPaste = (text: string) => {
    setRawText(text);
    const transactions = parseStatementText(text, statementType);
    setParsedTransactions(transactions.map(t => ({ ...t, selected: true })));
  };

  const toggleTransaction = (index: number) => {
    setParsedTransactions(prev => prev.map((t, i) => 
      i === index ? { ...t, selected: !t.selected } : t
    ));
  };

  const handleImport = async () => {
    if (!selectedAccount) {
      alert('Please select an account');
      return;
    }

    const selectedTransactions = parsedTransactions.filter(t => t.selected);
    if (selectedTransactions.length === 0) {
      alert('Please select at least one transaction to import');
      return;
    }

    setImporting(true);
    setProgress({ current: 0, total: selectedTransactions.length });

    let successCount = 0;
    let errorCount = 0;

    // Create payee map for lookups
    const payeeMap = new Map(payees.map(p => [p.name.toLowerCase(), p.id]));

    for (let i = 0; i < selectedTransactions.length; i++) {
      const tx = selectedTransactions[i];
      setProgress({ current: i + 1, total: selectedTransactions.length });

      try {
        // Get or create payee
        let payeeId: string | null = null;
        const payeeName = tx.description.trim();
        const existingPayeeId = payeeMap.get(payeeName.toLowerCase());
        
        if (existingPayeeId) {
          payeeId = existingPayeeId;
        } else {
          // Create new payee
          const newPayees = await createPayee.mutateAsync({ 
            name: payeeName,
            default_category_id: defaultCategory || null,
            default_account_id: selectedAccount
          });
          payeeId = newPayees[0].id;
          payeeMap.set(payeeName.toLowerCase(), newPayees[0].id);
        }

        // Determine amount sign based on transaction type
        const finalAmount = tx.type === 'debit' ? -Math.abs(tx.amount) : Math.abs(tx.amount);

        // Create transaction
        const transaction: Omit<TransactionInsert, 'created_by'> = {
          date: tx.date,
          amount: finalAmount,
          account_id: selectedAccount,
          payee_id: payeeId,
          category_id: defaultCategory || null,
          notes: null,
          is_pending: false
        };

        await createTransaction.mutateAsync(transaction);
        successCount++;
      } catch (error) {
        console.error('Error importing transaction:', tx, error);
        errorCount++;
      }
    }

    setImporting(false);
    alert(`Import complete!\nSuccess: ${successCount}\nErrors: ${errorCount}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Import from PDF Statement</h2>
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
          {/* Statement Type Selection */}
          {!parsedTransactions.length && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statement Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setStatementType('checking')}
                  className={`px-4 py-2 rounded-md border-2 transition-colors ${
                    statementType === 'checking'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Checking/Savings
                </button>
                <button
                  onClick={() => setStatementType('credit')}
                  className={`px-4 py-2 rounded-md border-2 transition-colors ${
                    statementType === 'credit'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Credit Card
                </button>
              </div>
            </div>
          )}

          {/* File Upload or Manual Entry */}
          {!parsedTransactions.length && !importing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PDF Statement or Paste Text
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90
                    cursor-pointer mb-4"
                />
                {uploadedFileName && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">📄 {uploadedFileName}</span>
                      <button
                        onClick={handleExtractFromPDF}
                        disabled={isExtracting}
                        className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isExtracting ? 'Extracting...' : 'Extract Text'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Click "Extract Text" to automatically parse transactions from the PDF.
                    </p>
                  </div>
                )}
                <div className="text-center text-sm text-gray-500 my-3">- OR -</div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste your statement text here...&#10;&#10;Example format:&#10;01/15/2024  GROCERY STORE  $45.67&#10;01/16/2024  GAS STATION    $32.50&#10;01/17/2024  RESTAURANT     $78.90"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono h-48 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {rawText.trim() && (
                  <button
                    onClick={() => handleManualPaste(rawText)}
                    className="mt-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
                  >
                    Parse Text
                  </button>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for Best Results</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Copy transaction lines from your PDF statement</li>
                  <li>• Each line should contain: Date, Description, and Amount</li>
                  <li>• Supported date formats: MM/DD/YYYY, YYYY-MM-DD</li>
                  <li>• Amounts should include decimals (e.g., $45.67)</li>
                  <li>• Remove any header/footer text that isn't transaction data</li>
                </ul>
              </div>
            </>
          )}

          {/* Account and Category Selection */}
          {parsedTransactions.length > 0 && !importing && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Import to Account *
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select account...</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Category (Optional)
                  </label>
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">None (categorize later)</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.path || category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parsed Transactions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Parsed Transactions ({parsedTransactions.filter(t => t.selected).length} selected)
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setParsedTransactions(prev => prev.map(t => ({ ...t, selected: true })))}
                      className="text-sm text-primary hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setParsedTransactions(prev => prev.map(t => ({ ...t, selected: false })))}
                      className="text-sm text-primary hover:underline"
                    >
                      Deselect All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setParsedTransactions([])}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Clear & Start Over
                    </button>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="w-10 px-4 py-2"></th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedTransactions.map((tx, idx) => (
                        <tr 
                          key={idx} 
                          className={`${!tx.selected ? 'opacity-40' : ''} hover:bg-gray-50 cursor-pointer`}
                          onClick={() => toggleTransaction(idx)}
                        >
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={tx.selected}
                              onChange={() => toggleTransaction(idx)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {tx.description}
                          </td>
                          <td className={`px-4 py-2 text-sm text-right whitespace-nowrap font-medium ${
                            tx.type === 'debit' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ${tx.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              tx.type === 'debit' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {tx.type === 'debit' ? 'Expense' : 'Income'}
                            </span>
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
          {parsedTransactions.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing || !selectedAccount}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {parsedTransactions.filter(t => t.selected).length} Transactions
            </button>
          )}
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              No Transactions Found
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                The PDF couldn't be parsed automatically. This can happen if the PDF is scanned/image-based or has an unusual format.
              </p>
              <p className="font-medium">
                Please copy the transactions from your PDF and paste them in the text area below.
              </p>
              <p className="text-xs text-gray-600">
                Tip: Open your PDF, select and copy the transaction lines, then paste them into the text box.
              </p>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="mt-6 w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
