/**
 * AddScenarioModal.tsx
 * 
 * Modal for creating a new FIRE planning scenario.
 */

import { useState } from 'react';
import { useScenarioMutations } from '../hooks/useScenarioMutations';
import { formDataToScenarioInsert } from '../scenarios.types';

interface AddScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddScenarioModal({ isOpen, onClose }: AddScenarioModalProps) {
  const { createScenario, isCreating } = useScenarioMutations();

  // Form data matching our UI needs (will convert to database format on submit)
  const [formData, setFormData] = useState({
    name: '',
    current_age: 35,
    retirement_age: 65,
    life_expectancy: 95,
    current_savings: 100000,
    annual_contribution: 20000,
    annual_expenses: 40000,
    portfolio_stock_pct: 0.60,
    expected_return_mean: 0.05,
    expected_return_stdev: 0.12,
    inflation_rate: 0.02,
    withdrawal_strategy: 'guardrails' as 'fixed' | 'percentage' | 'guardrails',
    notes: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert UI format to database format before submitting
      const dbData = formDataToScenarioInsert(formData);
      await createScenario(dbData);
      onClose();
    } catch (error) {
      console.error('Failed to create scenario:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Scenario</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Scenario Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scenario Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Conservative Plan, Early Retirement"
                required
              />
            </div>

            {/* Ages */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Age
                </label>
                <input
                  type="number"
                  value={formData.current_age}
                  onChange={(e) => setFormData({ ...formData, current_age: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="18"
                  max="100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retirement Age
                </label>
                <input
                  type="number"
                  value={formData.retirement_age}
                  onChange={(e) => setFormData({ ...formData, retirement_age: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="18"
                  max="100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Life Expectancy
                </label>
                <input
                  type="number"
                  value={formData.life_expectancy}
                  onChange={(e) => setFormData({ ...formData, life_expectancy: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="18"
                  max="120"
                  required
                />
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Savings
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.current_savings}
                    onChange={(e) => setFormData({ ...formData, current_savings: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Contribution
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.annual_contribution}
                    onChange={(e) => setFormData({ ...formData, annual_contribution: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Expenses (in retirement)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.annual_expenses}
                  onChange={(e) => setFormData({ ...formData, annual_expenses: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1000"
                  required
                />
              </div>
            </div>

            {/* Portfolio & Returns */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Allocation (%)
                </label>
                <input
                  type="number"
                  value={(formData.portfolio_stock_pct || 0.60) * 100}
                  onChange={(e) => setFormData({ ...formData, portfolio_stock_pct: Number(e.target.value) / 100 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Return (%)
                </label>
                <input
                  type="number"
                  value={(formData.expected_return_mean || 0.05) * 100}
                  onChange={(e) => setFormData({ ...formData, expected_return_mean: Number(e.target.value) / 100 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="20"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Std Dev (%)
                </label>
                <input
                  type="number"
                  value={(formData.expected_return_stdev || 0.12) * 100}
                  onChange={(e) => setFormData({ ...formData, expected_return_stdev: Number(e.target.value) / 100 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="50"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inflation Rate (%)
                </label>
                <input
                  type="number"
                  value={(formData.inflation_rate || 0.02) * 100}
                  onChange={(e) => setFormData({ ...formData, inflation_rate: Number(e.target.value) / 100 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="10"
                  step="0.1"
                  required
                />
              </div>
            </div>

            {/* Withdrawal Strategy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Strategy
              </label>
              <select
                value={formData.withdrawal_strategy}
                onChange={(e) => setFormData({ ...formData, withdrawal_strategy: e.target.value as 'fixed' | 'percentage' | 'guardrails' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="guardrails">Guardrails (Recommended)</option>
                <option value="fixed">Fixed Dollar Amount</option>
                <option value="percentage">Percentage of Portfolio</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Guardrails adjusts spending based on portfolio performance (±10% bands)
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any notes about this scenario..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Scenario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
