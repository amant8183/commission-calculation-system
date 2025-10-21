import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Agent } from '../AgentNode'; 

const API_URL = 'http://127.0.0.1:5000/api';

interface SalesFormProps {
  onSaleAdded: () => void; 
}

const SalesForm: React.FC<SalesFormProps> = ({ onSaleAdded }) => {
  // State for the list of agents
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // State for the form inputs
  const [policyNumber, setPolicyNumber] = useState('');
  const [policyValue, setPolicyValue] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  
  // State for loading and messages
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Fetch Level 1 agents when the component loads
  useEffect(() => {
    const fetchSellingAgents = async () => {
      try {
        const response = await axios.get(`${API_URL}/agents?level=1`);
        setAgents(response.data);
        // Set a default selected agent if list is not empty
        if (response.data.length > 0) {
          setSelectedAgentId(response.data[0].id.toString());
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      }
    };
    fetchSellingAgents();
  }, []);

  // 2. Handle the form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyNumber || !policyValue || !selectedAgentId) {
      setMessage('All fields are required.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const saleData = {
        policy_number: policyNumber,
        policy_value: parseFloat(policyValue),
        agent_id: parseInt(selectedAgentId),
      };

      const response = await axios.post(`${API_URL}/sales`, saleData);
      
      if (response.status === 201) {
        setMessage(`Sale ${response.data.sale_id} recorded successfully!`);
        // Reset form
        setPolicyNumber('');
        setPolicyValue('');

        onSaleAdded();
      }
    } catch (error) {
      console.error('Failed to record sale:', error);
      setMessage('Failed to record sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Record a New Sale</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Policy Number */}
          <div>
            <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700">
              Policy Number
            </label>
            <input
              type="text"
              id="policyNumber"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="POL-12345"
            />
          </div>
          
          {/* Policy Value */}
          <div>
            <label htmlFor="policyValue" className="block text-sm font-medium text-gray-700">
              Policy Value ($)
            </label>
            <input
              type="number"
              id="policyValue"
              value={policyValue}
              onChange={(e) => setPolicyValue(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="100000"
            />
          </div>
          
          {/* Agent Dropdown */}
          <div>
            <label htmlFor="agentId" className="block text-sm font-medium text-gray-700">
              Selling Agent
            </label>
            <select
              id="agentId"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              {agents.length === 0 ? (
                <option>Loading agents...</option>
              ) : (
                agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
        
        {/* Submit Button & Message */}
        <div className="flex items-center justify-between mt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
          >
            {loading ? 'Recording...' : 'Record Sale'}
          </button>
          
          {message && (
            <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default SalesForm;