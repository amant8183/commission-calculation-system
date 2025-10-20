// frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AgentNode, { Agent } from './components/AgentNode';

const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [hierarchy, setHierarchy] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // This function fetches the top-level agents when the app loads
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/agents`);
      setHierarchy(response.data);
    } catch (error) {
      console.error("Failed to fetch agent hierarchy:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Agent Hierarchy Management</h1>
        
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Hierarchy View</h2>
          {loading ? (
            <p>Loading...</p>
          ) : hierarchy.length > 0 ? (
            // CRITICAL: We only map the top-level agents here.
            // The AgentNode component will handle rendering its own children.
            hierarchy.map(agent => (
              <AgentNode key={agent.id} agent={agent} />
            ))
          ) : (
            <p className="text-gray-500">No agents found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;