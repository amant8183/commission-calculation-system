import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AgentNode, { Agent } from './components/AgentNode';
import SalesForm from './components/SalesForm';
import SalesList, { Sale } from './components/SalesList'; // 1. Import new components

const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [hierarchy, setHierarchy] = useState<Agent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]); // 2. Add state for sales
  const [loading, setLoading] = useState(true);

  // 3. Create a function to fetch hierarchy
  const fetchHierarchy = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/agents`);
      setHierarchy(response.data);
    } catch (error) {
      console.error("Failed to fetch agent hierarchy:", error);
    }
  }, []);

  // 4. Create a function to fetch sales
  const fetchSales = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/sales`);
      setSales(response.data);
    } catch (error) {
      console.error("Failed to fetch sales:", error);
    }
  }, []);

  // 5. Load all data on initial render
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchHierarchy(), fetchSales()]).finally(() => {
      setLoading(false);
    });
  }, [fetchHierarchy, fetchSales]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Agent Hierarchy Management</h1>
        
        {/* 6. Pass the fetchSales function as the onSaleAdded prop */}
        <SalesForm onSaleAdded={fetchSales} />

        {/* 7. Create a grid to show Hierarchy and Sales list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Hierarchy View</h2>
            {loading ? (
              <p>Loading hierarchy...</p>
            ) : hierarchy.length > 0 ? (
              hierarchy.map(agent => (
                <AgentNode key={agent.id} agent={agent} />
              ))
            ) : (
              <p className="text-gray-500">No agents found.</p>
            )}
          </div>
          
          {/* 8. Add the new SalesList component */}
          {loading ? (
            <div className="p-4 bg-white rounded-lg shadow-md"><p>Loading sales...</p></div>
          ) : (
            <SalesList sales={sales} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;