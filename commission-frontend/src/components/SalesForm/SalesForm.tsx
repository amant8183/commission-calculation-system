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
  const [isError, setIsError] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
        setMessage('Failed to load agents. Please refresh the page.');
        setIsError(true);
      }
    };
    fetchSellingAgents();
  }, []);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // Policy Number validation
    if (!policyNumber.trim()) {
      newErrors.policyNumber = 'Policy number is required';
    } else if (policyNumber.trim().length < 3) {
      newErrors.policyNumber = 'Policy number must be at least 3 characters';
    }
    
    // Policy Value validation
    if (!policyValue) {
      newErrors.policyValue = 'Policy value is required';
    } else {
      const value = parseFloat(policyValue);
      if (isNaN(value)) {
        newErrors.policyValue = 'Policy value must be a valid number';
      } else if (value <= 0) {
        newErrors.policyValue = 'Policy value must be greater than zero';
      } else if (value > 10000000) {
        newErrors.policyValue = 'Policy value cannot exceed $10,000,000';
      }
    }
    
    // Agent selection validation
    if (!selectedAgentId) {
      newErrors.selectedAgentId = 'Please select a selling agent';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 2. Handle the form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage('');
    setIsError(false);
    
    // Validate form
    if (!validateForm()) {
      setMessage('Please fix the errors below.');
      setIsError(true);
      return;
    }

    setLoading(true);

    try {
      const saleData = {
        policy_number: policyNumber.trim(),
        policy_value: parseFloat(policyValue),
        agent_id: parseInt(selectedAgentId),
      };

      const response = await axios.post(`${API_URL}/sales`, saleData);
      
      if (response.status === 201) {
        setMessage(`✓ Sale #${response.data.sale_id} recorded successfully!`);
        setIsError(false);
        setErrors({});
        
        // Reset form
        setPolicyNumber('');
        setPolicyValue('');

        onSaleAdded();
        
        // Clear success message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error: any) {
      console.error('Failed to record sale:', error);
      
      // Extract error message from API response
      let errorMessage = 'Failed to record sale. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage(errorMessage);
      setIsError(true);
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
              Policy Number *
            </label>
            <input
              type="text"
              id="policyNumber"
              value={policyNumber}
              onChange={(e) => {
                setPolicyNumber(e.target.value);
                if (errors.policyNumber) {
                  setErrors({...errors, policyNumber: ''});
                }
              }}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm ${
                errors.policyNumber 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              placeholder="POL-12345"
              required
            />
            {errors.policyNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.policyNumber}</p>
            )}
          </div>
          
          {/* Policy Value */}
          <div>
            <label htmlFor="policyValue" className="block text-sm font-medium text-gray-700">
              Policy Value ($) *
            </label>
            <input
              type="number"
              id="policyValue"
              value={policyValue}
              onChange={(e) => {
                setPolicyValue(e.target.value);
                if (errors.policyValue) {
                  setErrors({...errors, policyValue: ''});
                }
              }}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm ${
                errors.policyValue 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              placeholder="100000"
              min="0"
              step="0.01"
              required
            />
            {errors.policyValue && (
              <p className="mt-1 text-sm text-red-600">{errors.policyValue}</p>
            )}
          </div>
          
          {/* Agent Dropdown */}
          <div>
            <label htmlFor="agentId" className="block text-sm font-medium text-gray-700">
              Selling Agent *
            </label>
            <select
              id="agentId"
              value={selectedAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                if (errors.selectedAgentId) {
                  setErrors({...errors, selectedAgentId: ''});
                }
              }}
              className={`mt-1 block w-full rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                errors.selectedAgentId 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              required
            >
              {agents.length === 0 ? (
                <option value="">Loading agents...</option>
              ) : (
                agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))
              )}
            </select>
            {errors.selectedAgentId && (
              <p className="mt-1 text-sm text-red-600">{errors.selectedAgentId}</p>
            )}
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
            <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-md ${
              isError 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}>
              {isError ? '✗' : '✓'}
              <span>{message}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default SalesForm;