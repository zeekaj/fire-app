/**
 * DashboardTile Component
 * 
 * Reusable card component for dashboard metrics.
 */

import { ReactNode } from 'react';

interface DashboardTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'accent';
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  accent: 'bg-accent/10 text-accent',
};

export function DashboardTile({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
}: DashboardTileProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}

        {trend && (
          <div className="flex items-center gap-1 text-sm">
            <span className={trend.value >= 0 ? 'text-success' : 'text-danger'}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-gray-500">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
