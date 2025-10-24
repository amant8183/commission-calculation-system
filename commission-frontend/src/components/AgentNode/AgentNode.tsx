// frontend/src/components/AgentNode.tsx
import React, { useState } from 'react';
import axios from 'axios';

export interface Agent {
  id: number;
  name: string;
  level: number;
  parent_id?: number | null;
  children?: Agent[];
}

interface AgentNodeProps {
  agent: Agent;
  onUpdate?: () => void;
}

const levelColors: { [key: number]: string } = {
  1: 'bg-sky-100 border-sky-400',
  2: 'bg-green-100 border-green-400',
  3: 'bg-amber-100 border-amber-400',
  4: 'bg-purple-100 border-purple-400',
};

const API_URL = 'http://127.0.0.1:5000/api';

const AgentNode: React.FC<AgentNodeProps> = ({ agent, onUpdate }) => {
  const color = levelColors[agent.level] || 'bg-gray-100 border-gray-400';
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(agent.name);
  const [editLevel, setEditLevel] = useState(agent.level);
  const [editParentId, setEditParentId] = useState<number | null>(agent.parent_id || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${agent.name}?`)) {
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await axios.delete(`${API_URL}/agents/${agent.id}`);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete agent';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.put(`${API_URL}/agents/${agent.id}`, {
        name: editName,
        level: editLevel,
        parent_id: editParentId
      });
      setShowEditModal(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update agent';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setEditName(agent.name);
    setEditLevel(agent.level);
    setEditParentId(agent.parent_id || null);
    setError('');
    setShowEditModal(true);
  };

  return (
    <div>
      <div className={`p-2 my-1 border-l-4 rounded ${color} flex justify-between items-center`}>
        <p className="font-bold">
          {agent.name}{' '}
          <span className="font-normal text-gray-600">
            (Level {agent.level})
          </span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={openEditModal}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
            disabled={loading}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
            disabled={loading}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Edit Agent</h3>
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={editLevel}
                  onChange={(e) => setEditLevel(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 - Agent</option>
                  <option value={2}>2 - Team Lead</option>
                  <option value={3}>3 - Manager</option>
                  <option value={4}>4 - Director</option>
                </select>
              </div>
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THIS IS THE RECURSIVE PART THAT CREATES THE INDENTATION */}
      {agent.children && agent.children.length > 0 && (
        <div className="pl-6 border-l-2 border-gray-300 ml-2">
          {agent.children.map((child) => (
            <AgentNode key={child.id} agent={child} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentNode;
