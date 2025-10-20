/**
 * EditScenarioModal.tsx
 * 
 * Modal for editing an existing FIRE planning scenario.
 * Pre-populates form with current scenario values.
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useScenarioMutations } from '../hooks/useScenarioMutations';
import { formDataToScenarioUpdate } from '../scenarios.types';
import type { ScenarioDisplay } from '../scenarios.types';

interface EditScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: ScenarioDisplay;
}

export function EditScenarioModal({ isOpen, onClose, scenario }: EditScenarioModalProps) {
  const { updateScenario, isUpdating } = useScenarioMutations();

  // Form data - initialized from scenario props
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

  // Initialize form with scenario data when modal opens
  useEffect(() => {
    if (isOpen && scenario) {
      setFormData({
        name: scenario.name,
        current_age: scenario.current_age,
        retirement_age: scenario.retirement_age,
        life_expectancy: scenario.life_expectancy,
        current_savings: scenario.current_savings,
        annual_contribution: scenario.annual_contribution,
        annual_expenses: scenario.annual_expenses,
        portfolio_stock_pct: scenario.portfolio_stock_pct,
        expected_return_mean: scenario.expected_return_mean,
        expected_return_stdev: scenario.expected_return_stdev,
        inflation_rate: scenario.inflation_rate,
        withdrawal_strategy: scenario.withdrawal_strategy,
        notes: scenario.notes,
      });
    }
  }, [isOpen, scenario]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Scenario name is required';
    }

    if (formData.current_age < 18 || formData.current_age > 100) {
      newErrors.current_age = 'Current age must be between 18 and 100';
    }

    if (formData.retirement_age < 18 || formData.retirement_age > 100) {
      newErrors.retirement_age = 'Retirement age must be between 18 and 100';
    }

    if (formData.life_expectancy < 18 || formData.life_expectancy > 120) {
      newErrors.life_expectancy = 'Life expectancy must be between 18 and 120';
    }

    // Age relationship validation
    if (formData.retirement_age <= formData.current_age) {
      newErrors.retirement_age = 'Retirement age must be greater than current age';
    }

    if (formData.life_expectancy <= formData.retirement_age) {
      newErrors.life_expectancy = 'Life expectancy must be greater than retirement age';
    }

    // Financial validation
    if (formData.current_savings < 0) {
      newErrors.current_savings = 'Current savings cannot be negative';
    }

    if (formData.annual_contribution < 0) {
      newErrors.annual_contribution = 'Annual contribution cannot be negative';
    }

    if (formData.annual_expenses <= 0) {
      newErrors.annual_expenses = 'Annual expenses must be greater than 0';
    }

    if (formData.portfolio_stock_pct < 0 || formData.portfolio_stock_pct > 1) {
      newErrors.portfolio_stock_pct = 'Stock allocation must be between 0% and 100%';
    }

    if (formData.expected_return_mean < 0 || formData.expected_return_mean > 0.20) {
      newErrors.expected_return_mean = 'Expected return must be between 0% and 20%';
    }

    if (formData.expected_return_stdev < 0 || formData.expected_return_stdev > 0.50) {
      newErrors.expected_return_stdev = 'Standard deviation must be between 0% and 50%';
    }

    if (formData.inflation_rate < 0 || formData.inflation_rate > 0.10) {
      newErrors.inflation_rate = 'Inflation rate must be between 0% and 10%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Convert UI format to database update format before submitting
      const dbData = formDataToScenarioUpdate(formData);
      await updateScenario(scenario.id, dbData);
      onClose();
      // Clear any previous errors on successful update
      setErrors({});
    } catch (error) {
      console.error('Failed to update scenario:', error);
      setErrors({ submit: 'Failed to update scenario. Please try again.' });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const getFieldClassName = (fieldName: string, baseClassName: string = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500") => {
    return `${baseClassName} ${errors[fieldName] ? 'border-red-500' : 'border-gray-300'}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Edit Scenario</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isUpdating}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Conservative Plan, Early Retirement"
                required
                disabled={isUpdating}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
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
                  className={getFieldClassName('current_age')}
                  min="18"
                  max="100"
                  required
                  disabled={isUpdating}
                />
                {errors.current_age && (
                  <p className="mt-1 text-sm text-red-600">{errors.current_age}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retirement Age
                </label>
                <input
                  type="number"
                  value={formData.retirement_age}
                  onChange={(e) => setFormData({ ...formData, retirement_age: Number(e.target.value) })}
                  className={getFieldClassName('retirement_age')}
                  min="18"
                  max="100"
                  required
                  disabled={isUpdating}
                />
                {errors.retirement_age && (
                  <p className="mt-1 text-sm text-red-600">{errors.retirement_age}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Life Expectancy
                </label>
                <input
                  type="number"
                  value={formData.life_expectancy}
                  onChange={(e) => setFormData({ ...formData, life_expectancy: Number(e.target.value) })}
                  className={getFieldClassName('life_expectancy')}
                  min="18"
                  max="120"
                  required
                  disabled={isUpdating}
                />
                {errors.life_expectancy && (
                  <p className="mt-1 text-sm text-red-600">{errors.life_expectancy}</p>
                )}
              </div>
            </div>

            {/* Financial Data */}
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
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1000"
                    required
                    disabled={isUpdating}
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
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1000"
                    required
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Expenses
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.annual_expenses}
                    onChange={(e) => setFormData({ ...formData, annual_expenses: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1000"
                    required
                    disabled={isUpdating}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Allocation
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={(formData.portfolio_stock_pct * 100).toFixed(0)}
                    onChange={(e) => setFormData({ ...formData, portfolio_stock_pct: Number(e.target.value) / 100 })}
                    className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    step="5"
                    required
                    disabled={isUpdating}
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* Return Assumptions */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Return
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={(formData.expected_return_mean * 100).toFixed(1)}
                    onChange={(e) => setFormData({ ...formData, expected_return_mean: Number(e.target.value) / 100 })}
                    className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="20"
                    step="0.1"
                    required
                    disabled={isUpdating}
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standard Deviation
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={(formData.expected_return_stdev * 100).toFixed(1)}
                    onChange={(e) => setFormData({ ...formData, expected_return_stdev: Number(e.target.value) / 100 })}
                    className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="50"
                    step="0.1"
                    required
                    disabled={isUpdating}
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inflation Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={(formData.inflation_rate * 100).toFixed(1)}
                    onChange={(e) => setFormData({ ...formData, inflation_rate: Number(e.target.value) / 100 })}
                    className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="10"
                    step="0.1"
                    required
                    disabled={isUpdating}
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* Withdrawal Strategy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Strategy
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="guardrails"
                    checked={formData.withdrawal_strategy === 'guardrails'}
                    onChange={(e) => setFormData({ ...formData, withdrawal_strategy: e.target.value as any })}
                    className="mr-3"
                    disabled={isUpdating}
                  />
                  <div>
                    <div className="font-medium">Guardrails (Recommended)</div>
                    <div className="text-sm text-gray-500">Adjusts spending based on portfolio performance</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="fixed"
                    checked={formData.withdrawal_strategy === 'fixed'}
                    onChange={(e) => setFormData({ ...formData, withdrawal_strategy: e.target.value as any })}
                    className="mr-3"
                    disabled={isUpdating}
                  />
                  <div>
                    <div className="font-medium">Fixed Dollar Amount</div>
                    <div className="text-sm text-gray-500">Same spending amount every year (inflation-adjusted)</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="percentage"
                    checked={formData.withdrawal_strategy === 'percentage'}
                    onChange={(e) => setFormData({ ...formData, withdrawal_strategy: e.target.value as any })}
                    className="mr-3"
                    disabled={isUpdating}
                  />
                  <div>
                    <div className="font-medium">Fixed Percentage (4% Rule)</div>
                    <div className="text-sm text-gray-500">Withdraw fixed percentage of portfolio each year</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Additional notes about this scenario..."
                disabled={isUpdating}
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Scenario'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}