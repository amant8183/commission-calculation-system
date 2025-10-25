import React from 'react';
import AgentForm from '../components/AgentForm';
import AgentNode, { Agent } from '../components/AgentNode';

interface AgentManagementProps {
  hierarchy: Agent[];
  onAgentAdded: () => void;
}

const AgentManagement: React.FC<AgentManagementProps> = ({ hierarchy, onAgentAdded }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your sales team hierarchy and agent information
        </p>
      </div>

      {/* Reuse existing AgentForm component */}
      <AgentForm onAgentAdded={onAgentAdded} />

      {/* Agent Hierarchy Visualization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Agent Hierarchy</h2>
        {hierarchy.length > 0 ? (
          <div className="space-y-2">
            {hierarchy.map((agent) => (
              <AgentNode key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No agents yet. Add your first agent above.
          </p>
        )}
      </div>
    </div>
  );
};

export default AgentManagement;
