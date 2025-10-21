import React from 'react';
import { render, screen } from '@testing-library/react';
import AgentNode, { Agent } from './AgentNode';

describe('AgentNode Component', () => {
  it('renders agent name and level correctly', () => {
    // 1. Create mock data for a single agent
    const mockAgent: Agent = {
      id: 1,
      name: 'Mike (Director)',
      level: 4,
    };

    // 2. Render the component with the mock data
    render(<AgentNode agent={mockAgent} />);

    // 3. Check if the name and level are on the screen
    // We use a regular expression (regex) to find the text
    const agentName = screen.getByText(/Mike \(Director\)/i);
    const agentLevel = screen.getByText(/Level 4/i);

    // 4. Assert that the elements were found
    expect(agentName).toBeInTheDocument();
    expect(agentLevel).toBeInTheDocument();
  });

  it('renders child agents recursively', () => {
    // 1. Create mock data with a parent and child
    const mockAgent: Agent = {
      id: 1,
      name: 'Mike (Director)',
      level: 4,
      children: [
        {
          id: 2,
          name: 'Lisa (Manager)',
          level: 3,
        },
      ],
    };

    // 2. Render the component
    render(<AgentNode agent={mockAgent} />);

    // 3. Check if both parent and child are on the screen
    const parentName = screen.getByText(/Mike \(Director\)/i);
    const childName = screen.getByText(/Lisa \(Manager\)/i);

    // 4. Assert that both were found
    expect(parentName).toBeInTheDocument();
    expect(childName).toBeInTheDocument();
  });
});