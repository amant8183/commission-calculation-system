import React from 'react';
import DashboardSummary from '../components/DashboardSummary';
import SalesChart from '../components/SalesChart';
import { Sale } from '../components/SalesList';

interface DashboardProps {
  summaryData: any;
  loading: boolean;
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ summaryData, loading, sales }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overview of your commission system performance
        </p>
      </div>

      {/* Reuse existing DashboardSummary component */}
      <DashboardSummary summary={summaryData} loading={loading} />

      {/* Reuse existing SalesChart component */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sales Volume Trend
        </h2>
        <SalesChart sales={sales} />
      </div>
    </div>
  );
};

export default Dashboard;
