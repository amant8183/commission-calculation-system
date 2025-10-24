import React, { useState, useEffect } from 'react';

interface Commission {
  id: number;
  amount: number;
  commission_type: string;
  sale_id: number;
  agent_id: number;
  agent_name: string;
  policy_number: string;
  policy_value: number;
  payout_date: string;
}

interface CommissionReportsProps {
  sales: any[];
  bonuses: any[];
}

const CommissionReports: React.FC<CommissionReportsProps> = ({ sales, bonuses }) => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [agents, setAgents] = useState<{id: number; name: string}[]>([]);

  // Simulated commission data from sales
  useEffect(() => {
    const loadCommissions = () => {
      if (!sales || sales.length === 0) {
        setCommissions([]);
        setLoading(false);
        return;
      }

      // Convert sales to commission records
      const commissionData: Commission[] = [];
      
      sales.forEach(sale => {
        // FYC Commission (50%)
        commissionData.push({
          id: commissionData.length + 1,
          amount: sale.policy_value * 0.50,
          commission_type: 'FYC',
          sale_id: sale.id,
          agent_id: sale.agent_id,
          agent_name: sale.agent_name,
          policy_number: sale.policy_number,
          policy_value: sale.policy_value,
          payout_date: sale.sale_date
        });
      });

      setCommissions(commissionData);
      setLoading(false);
    };

    loadCommissions();
  }, [sales]);

  // Extract unique agents from commissions
  useEffect(() => {
    const uniqueAgents = Array.from(
      new Map(commissions.map(c => [c.agent_id, {id: c.agent_id, name: c.agent_name}])).values()
    );
    setAgents(uniqueAgents);
  }, [commissions]);

  // Filter commissions
  const filteredCommissions = commissions.filter(comm => {
    const agentMatch = !filterAgent || comm.agent_id.toString() === filterAgent;
    const typeMatch = filterType === 'all' || comm.commission_type === filterType;
    return agentMatch && typeMatch;
  });

  // Calculate totals
  const totalCommissions = filteredCommissions.reduce((sum, comm) => sum + comm.amount, 0);
  const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
  const grandTotal = totalCommissions + totalBonuses;

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Agent', 'Type', 'Policy', 'Policy Value', 'Commission Amount'];
    const rows = filteredCommissions.map(comm => [
      new Date(comm.payout_date).toLocaleDateString(),
      comm.agent_name,
      comm.commission_type,
      comm.policy_number,
      `$${comm.policy_value.toLocaleString()}`,
      `$${comm.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commission-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow-md">Loading commission reports...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Commission Reports</h2>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          disabled={filteredCommissions.length === 0}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <dt className="text-sm font-medium text-blue-600">Total Commissions</dt>
          <dd className="mt-1 text-2xl font-semibold text-blue-900">
            ${totalCommissions.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </dd>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <dt className="text-sm font-medium text-purple-600">Total Bonuses</dt>
          <dd className="mt-1 text-2xl font-semibold text-purple-900">
            ${totalBonuses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </dd>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <dt className="text-sm font-medium text-green-600">Grand Total</dt>
          <dd className="mt-1 text-2xl font-semibold text-green-900">
            ${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </dd>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label htmlFor="filterAgent" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Agent
          </label>
          <select
            id="filterAgent"
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Agents</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id.toString()}>{agent.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Type
          </label>
          <select
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">All Types</option>
            <option value="FYC">FYC Only</option>
            <option value="Override">Override Only</option>
          </select>
        </div>
      </div>

      {/* Commission Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Value</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCommissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No commissions found matching the filters.
                </td>
              </tr>
            ) : (
              filteredCommissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(comm.payout_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comm.agent_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      comm.commission_type === 'FYC' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {comm.commission_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comm.policy_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${comm.policy_value.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${comm.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredCommissions.length} of {commissions.length} commission records
      </div>
    </div>
  );
};

export default CommissionReports;
