import React from 'react';
import CommissionReports from '../components/CommissionReports/CommissionReports';
import BonusList, { Bonus } from '../components/BonusList';
import { Sale } from '../components/SalesList';

interface CommissionReportsPageProps {
  sales: Sale[];
  bonuses: Bonus[];
  calcMessage: string;
  handleMonthlyBonus: () => void;
  handleQuarterlyBonus: (quarter: number) => void;
  handleAnnualBonus: () => void;
}

const CommissionReportsPage: React.FC<CommissionReportsPageProps> = ({
  sales,
  bonuses,
  calcMessage,
  handleMonthlyBonus,
  handleQuarterlyBonus,
  handleAnnualBonus,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Commission Reports</h1>
        <p className="mt-2 text-sm text-gray-600">
          Calculate bonuses and view commission reports
        </p>
      </div>

      {/* Bonus Calculation Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Calculate Bonuses</h2>
        
        {/* Monthly Bonuses */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Monthly Bonuses</h3>
          <button
            onClick={handleMonthlyBonus}
            className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400"
            disabled={calcMessage === 'Calculating...'}
          >
            Calculate Current Month
          </button>
        </div>

        {/* Quarterly Bonuses */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Quarterly Bonuses</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((quarter) => (
              <button
                key={quarter}
                onClick={() => handleQuarterlyBonus(quarter)}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
                disabled={calcMessage === 'Calculating...'}
              >
                Q{quarter}
              </button>
            ))}
          </div>
        </div>

        {/* Annual Bonuses */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Annual Bonuses</h3>
          <button
            onClick={handleAnnualBonus}
            className="inline-flex justify-center rounded-md border border-transparent bg-purple-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400"
            disabled={calcMessage === 'Calculating...'}
          >
            Calculate Current Year
          </button>
        </div>

        {calcMessage && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">{calcMessage}</p>
          </div>
        )}
      </div>

      {/* Reuse existing BonusList component */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Bonus History</h2>
        <BonusList bonuses={bonuses} />
      </div>

      {/* Reuse existing CommissionReports component */}
      <CommissionReports sales={sales} bonuses={bonuses} />
    </div>
  );
};

export default CommissionReportsPage;
