import React from 'react';

export interface Bonus {
  id: number;
  amount: number;
  bonus_type: string;
  period: string;
  agent_id: number;
  agent_name: string;
}

interface BonusListProps {
  bonuses: Bonus[];
}

const BonusList: React.FC<BonusListProps> = ({ bonuses }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Calculated Bonuses</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bonuses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No bonuses calculated yet.</td>
              </tr>
            ) : (
              bonuses.map((bonus) => (
                <tr key={bonus.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bonus.period}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bonus.bonus_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bonus.agent_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${bonus.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BonusList;