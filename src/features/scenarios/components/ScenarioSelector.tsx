/**
 * ScenarioSelector.tsx
 * 
 * Dropdown component to select active FIRE planning scenario.
 */

import { useScenarios } from '../hooks/useScenarios';
import type { ScenarioDisplay } from '../scenarios.types';

interface ScenarioSelectorProps {
  selectedScenarioId: string | null;
  onSelect: (scenario: ScenarioDisplay | null) => void;
}

export function ScenarioSelector({ selectedScenarioId, onSelect }: ScenarioSelectorProps) {
  const { data: scenarios, isLoading, error } = useScenarios();

  if (isLoading) {
    return (
      <div className="inline-block px-4 py-2 bg-gray-100 rounded-md text-gray-500">
        Loading scenarios...
      </div>
    );
  }

  if (error) {
    return (
      <div className="inline-block px-4 py-2 bg-red-50 rounded-md text-red-600 text-sm">
        Error loading scenarios
      </div>
    );
  }

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="inline-block px-4 py-2 bg-yellow-50 rounded-md text-yellow-700 text-sm">
        No scenarios created yet
      </div>
    );
  }

  return (
    <select
      value={selectedScenarioId || ''}
      onChange={(e) => {
        const scenarioId = e.target.value;
        const scenario = scenarios.find((s) => s.id === scenarioId) || null;
        onSelect(scenario);
      }}
      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      <option value="">Select a scenario...</option>
      {scenarios.map((scenario) => (
        <option key={scenario.id} value={scenario.id}>
          {scenario.name}
        </option>
      ))}
    </select>
  );
}
