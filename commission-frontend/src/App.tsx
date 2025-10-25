import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import AgentManagement from './pages/AgentManagement';
import SalesManagement from './pages/SalesManagement';
import CommissionReportsPage from './pages/CommissionReports';
import ClawbackManagementPage from './pages/ClawbackManagement';
import { Agent } from './components/AgentNode';
import { Sale } from './components/SalesList';
import { Bonus } from './components/BonusList';
import { SummaryData } from './components/DashboardSummary';
  
const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [hierarchy, setHierarchy] = useState<Agent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
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
      const response = await axios.get<SummaryData>(`${API_URL}/dashboard/summary`);
      setSummaryData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard summary:", error);
      setSummaryData(null);
    }
  }, []);

  // Load all data on initial render
  useEffect(() => {
    setLoading(true);
    // Fetch all data including summary
    Promise.all([fetchHierarchy(), fetchSales(), fetchBonuses(), fetchSummary()]).finally(() => {
      setLoading(false);
    });
  }, [fetchHierarchy, fetchSales, fetchBonuses, fetchSummary]);

  // 4. Function to trigger bonus calculation (generic for all types)
  const handleCalculateBonuses = useCallback(async (bonusType: 'Monthly' | 'Quarterly' | 'Annual', period: string) => {
    setCalcMessage('Calculating...');

    try {
      const response = await axios.post(`${API_URL}/bonuses/calculate`, {
        period: period,
        type: bonusType
      });
      setCalcMessage(response.data.message || 'Calculation complete!');
      await fetchBonuses(); 
      await fetchSummary(); 
    } catch (error) {
      console.error("Failed to calculate bonuses:", error);
      setCalcMessage('Calculation failed.');
    }
  }, [fetchBonuses, fetchSummary]);

  // Helper functions for each bonus type
  const handleMonthlyBonus = () => {
    const now = new Date();
    const periodStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    handleCalculateBonuses('Monthly', periodStr);
  };

  const handleQuarterlyBonus = (quarter: number) => {
    const now = new Date();
    const periodStr = `${now.getFullYear()}-Q${quarter}`;
    handleCalculateBonuses('Quarterly', periodStr);
  };

  const handleAnnualBonus = () => {
    const now = new Date();
    const periodStr = `${now.getFullYear()}`;
    handleCalculateBonuses('Annual', periodStr);
  };

  // Callback for when a sale is added
  const onSaleAdded = () => {
    fetchSales(); // Refresh sales list
    fetchSummary();
  };

  // Callback for when an agent is added
  const onAgentAdded = () => {
    fetchHierarchy(); // Refresh hierarchy
    fetchSummary(); // Refresh summary (agent count)
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
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={<Dashboard summaryData={summaryData} loading={loading} sales={sales} />}
          />
          <Route
            path="/agents"
            element={
              <AgentManagement hierarchy={hierarchy} onAgentAdded={onAgentAdded} />
            }
          />
          <Route
            path="/sales"
            element={<SalesManagement sales={sales} onSaleAdded={onSaleAdded} onCancelSale={handleCancelSale} />}
          />
          <Route
            path="/reports"
            element={
              <CommissionReportsPage
                sales={sales}
                bonuses={bonuses}
                calcMessage={calcMessage}
                handleMonthlyBonus={handleMonthlyBonus}
                handleQuarterlyBonus={handleQuarterlyBonus}
                handleAnnualBonus={handleAnnualBonus}
              />
            }
          />
          <Route
            path="/clawbacks"
            element={
              <ClawbackManagementPage sales={sales} handleCancelSale={handleCancelSale} />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;