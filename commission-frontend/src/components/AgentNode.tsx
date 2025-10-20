// frontend/src/components/AgentNode.tsx
import React from 'react';

export interface Agent {
  id: number;
  name: string;
  level: number;
  parent_id?: number | null;
  children?: Agent[];
}

interface AgentNodeProps {
  agent: Agent;
}

const levelColors: { [key: number]: string } = {
  1: 'bg-sky-100 border-sky-400',
  2: 'bg-green-100 border-green-400',
  3: 'bg-amber-100 border-amber-400',
  4: 'bg-purple-100 border-purple-400',
};

const AgentNode: React.FC<AgentNodeProps> = ({ agent }) => {
  const color = levelColors[agent.level] || 'bg-gray-100 border-gray-400';

  return (
    // Note: The ml-6 on the top-level div in App.tsx will be missing, so we remove it here
    // to let the recursive indentation take full control.
    <div>
      <div className={`p-2 my-1 border-l-4 rounded ${color}`}>
        <p className="font-bold">
          {agent.name}{' '}
          <span className="font-normal text-gray-600">
            (Level {agent.level})
          </span>
        </p>
      </div>

      {/* THIS IS THE RECURSIVE PART THAT CREATES THE INDENTATION */}
      {agent.children && agent.children.length > 0 && (
        <div className="pl-6 border-l-2 border-gray-300 ml-2">
          {agent.children.map((child) => (
            <AgentNode key={child.id} agent={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentNode;
