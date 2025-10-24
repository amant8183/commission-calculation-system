import React, { useState } from 'react';

interface ClawbackManagementProps {
  sales: any[];
  onCancelSale: (saleId: number) => void;
}

const ClawbackManagement: React.FC<ClawbackManagementProps> = ({ sales, onCancelSale }) => {
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Filter active (non-cancelled) sales
  const activeSales = sales.filter(sale => !sale.is_cancelled);

  // Search filter
  const filteredSales = activeSales.filter(sale => 
    sale.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.agent_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate clawback impact
  const calculateImpact = (sale: any) => {
    const fycCommission = sale.policy_value * 0.50;
    // In real system, would also calculate override commissions
    return {
      directClawback: fycCommission,
      totalImpact: fycCommission,
      affectedAgents: [sale.agent_name]
    };
  };

  const handleSelectSale = (sale: any) => {
    setSelectedSale(sale);
  };

  const handleInitiateClawback = () => {
    if (selectedSale) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmClawback = () => {
    if (selectedSale) {
      onCancelSale(selectedSale.id);
      setSelectedSale(null);
      setShowConfirmModal(false);
    }
  };

  const handleCancelClawback = () => {
    setShowConfirmModal(false);
  };

  const impact = selectedSale ? calculateImpact(selectedSale) : null;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Clawback Management</h2>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          Manage policy cancellations and commission clawbacks. Select a policy to analyze the impact before proceeding.
        </p>

        {/* Search */}
        <div className="mb-4">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search by Policy or Agent
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter policy number or agent name..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Policies List */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3">Active Policies</h3>
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {filteredSales.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No policies match your search.' : 'No active policies found.'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => handleSelectSale(sale)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                      selectedSale?.id === sale.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{sale.policy_number}</p>
                        <p className="text-sm text-gray-600">Agent: {sale.agent_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ${sale.policy_value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Showing {filteredSales.length} of {activeSales.length} active policies
          </div>
        </div>

        {/* Impact Analysis */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3">Clawback Impact Analysis</h3>
          {!selectedSale ? (
            <div className="border rounded-lg p-8 text-center text-gray-500 bg-gray-50">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-2">Select a policy to view clawback impact</p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50">
              {/* Selected Policy Details */}
              <div className="mb-4 p-3 bg-white rounded border">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Policy Details</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Policy Number:</dt>
                    <dd className="font-medium">{selectedSale.policy_number}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Agent:</dt>
                    <dd className="font-medium">{selectedSale.agent_name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Policy Value:</dt>
                    <dd className="font-medium">${selectedSale.policy_value.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Sale Date:</dt>
                    <dd className="font-medium">{new Date(selectedSale.sale_date).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </div>

              {/* Impact Breakdown */}
              <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
                <h4 className="text-sm font-semibold text-red-800 mb-2">⚠️ Impact Breakdown</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-red-700">Direct FYC Clawback:</dt>
                    <dd className="font-semibold text-red-900">
                      -${impact?.directClawback.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-red-300 pt-2">
                    <dt className="font-medium text-red-700">Total Estimated Impact:</dt>
                    <dd className="font-bold text-red-900 text-base">
                      -${impact?.totalImpact.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Affected Agents */}
              <div className="mb-4 p-3 bg-white rounded border">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Affected Agents</h4>
                <ul className="space-y-1">
                  {impact?.affectedAgents.map((agent, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center">
                      <svg className="h-4 w-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {agent}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleInitiateClawback}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Cancel Policy & Initiate Clawback
                </button>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedSale && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Confirm Clawback</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to cancel policy <strong>{selectedSale.policy_number}</strong>?
                </p>
                <p className="text-sm text-red-600 font-semibold mt-2">
                  This will clawback ${impact?.totalImpact.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} in commissions.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 px-4 py-3">
                <button
                  onClick={handleCancelClawback}
                  className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClawback}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Confirm Clawback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClawbackManagement;
