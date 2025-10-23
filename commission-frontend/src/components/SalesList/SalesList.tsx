import React from 'react';

// Define the shape of a Sale object
export interface Sale {
  id: number;
  policy_number: string;
  policy_value: number;
  sale_date: string;
  agent_id: number;
  agent_name: string;
  is_cancelled: boolean;
}

interface SalesListProps {
  sales: Sale[];
  onCancelSale: (saleId: number) => void;
}

const SalesList: React.FC<SalesListProps> = ({ sales, onCancelSale }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Sales</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy #</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length === 0 ? (
              <tr>
    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No sales recorded yet.</td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.policy_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${sale.policy_value.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.agent_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.sale_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {sale.is_cancelled ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Cancelled
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onCancelSale(sale.id)}
                      disabled={sale.is_cancelled}
                      className={`text-red-600 hover:text-red-900 ${sale.is_cancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={sale.is_cancelled ? "Already Cancelled" : "Cancel Policy"}
                    >
                      Cancel
                    </button>
                  </td>
                 </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesList;