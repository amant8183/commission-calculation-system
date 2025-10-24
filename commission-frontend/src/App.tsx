import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AgentNode, { Agent } from './components/AgentNode';
import SalesForm from './components/SalesForm';
import SalesList, { Sale } from './components/SalesList';
import BonusList, { Bonus } from './components/BonusList';
import { SummaryData } from './components/DashboardSummary';
  
const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [hierarchy, setHierarchy] = useState<Agent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [calcMessage, setCalcMessage] = useState(''); // Message for bonus calculation
  // Fetch Hierarchy
  const fetchHierarchy = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/agents`);
      setHierarchy(response.data);
    } catch (error) {
      console.error("Failed to fetch agent hierarchy:", error);
    }
  }, []);

  // Fetch Sales
  const fetchSales = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/sales`);
      setSales(response.data);
    } catch (error) {
      console.error("Failed to fetch sales:", error);
    }
  }, []);

  // 3. Fetch Bonuses function
  const fetchBonuses = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/bonuses`);
      setBonuses(response.data);
    } catch (error) {
      console.error("Failed to fetch bonuses:", error);
    }
  }, []);
  
  // 4. Fetch Summary
  
  const fetchSummary = useCallback(async () => {
    try {
      await axios.get<SummaryData>(`${API_URL}/dashboard/summary`);
    } catch (error) {
      console.error("Failed to fetch dashboard summary:", error);
    }
  }, []);

  // Load all data on initial render
  useEffect(() => {
    setLoading(true);
    // Fetch all three sets of data
    Promise.all([fetchHierarchy(), fetchSales(), fetchBonuses()]).finally(() => {
      setLoading(false);
    });
  }, [fetchHierarchy, fetchSales, fetchBonuses]); // Add fetchBonuses dependency

  // 4. Function to trigger bonus calculation
  const handleCalculateBonuses = useCallback(async () => {
  setCalcMessage('Calculating...');
  const now = new Date();
  const periodStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`; 

  try {
    const response = await axios.post(`${API_URL}/bonuses/calculate`, {
      period: periodStr,
      type: 'Monthly'
    });
    setCalcMessage(response.data.message || 'Calculation complete!');
    await fetchBonuses(); 
    await fetchSummary(); 
  } catch (error) {
    console.error("Failed to calculate bonuses:", error);
    setCalcMessage('Calculation failed.');
  }
}, [fetchBonuses, fetchSummary]);

  // Callback for when a sale is added
  const onSaleAdded = () => {
    fetchSales(); // Refresh sales list
    fetchSummary();
  };
  
  // --- 2. ADD CANCELLATION HANDLER ---
  const handleCancelSale = useCallback(async (saleId: number) => {
    try {
      await axios.put(`${API_URL}/sales/${saleId}/cancel`);
      // Refresh both sales (to show cancelled status) and bonuses (potential clawbacks)
      await fetchSales();
      await fetchBonuses();
      await fetchSummary();
    } catch (error) {
      console.error(`Failed to cancel sale ${saleId}:`, error);
    }
  }, [fetchSales, fetchBonuses, fetchSummary]); // Add dependencies

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Agent Hierarchy Management</h1>

        <SalesForm onSaleAdded={onSaleAdded} />

        {/* 5. Add Bonus Calculation Button */}
        <div className="my-6 p-4 bg-white rounded-lg shadow-md flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">Calculate Monthly Bonuses</h2>
            <div>
              <button
                onClick={handleCalculateBonuses}
                className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400"
                disabled={calcMessage === 'Calculating...'}
              >
                Calculate for Current Month
              </button>
              {calcMessage && <p className="text-sm text-gray-600 ml-4 inline">{calcMessage}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Hierarchy View */}
          <div className="p-4 bg-white rounded-lg shadow-md lg:col-span-1">
             <h2 className="text-xl font-semibold mb-4 text-gray-700">Hierarchy View</h2>
             {loading ? (<p>Loading hierarchy...</p>) 
             : hierarchy.length > 0 ? (hierarchy.map(agent => (<AgentNode key={agent.id} agent={agent} />))) 
             : (<p className="text-gray-500">No agents found.</p>)}
          </div>

          {/* Sales List */}
          <div className="lg:col-span-2">
             {loading ? (<div className="p-4 bg-white rounded-lg shadow-md"><p>Loading sales...</p></div>) : (<SalesList sales={sales} onCancelSale={handleCancelSale} />)}
          </div>
          
          {/* 6. Bonus List */}
          <div className="lg:col-span-3">
            {loading ? (<div className="p-4 bg-white rounded-lg shadow-md"><p>Loading bonuses...</p></div>) : (<BonusList bonuses={bonuses} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;