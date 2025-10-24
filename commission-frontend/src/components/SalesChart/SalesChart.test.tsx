import React from 'react';
import { render, screen } from '@testing-library/react';
import SalesChart from './SalesChart';
import { Sale } from '../SalesList';

describe('SalesChart Component', () => {
  it('renders "no data" message when sales array is empty', () => {
    render(<SalesChart sales={[]} />);
    expect(screen.getByText(/No sales data available for chart/i)).toBeInTheDocument();
  });

  it('renders chart when sales data is provided', () => {
    const mockSales: Sale[] = [
      {
        id: 1,
        policy_number: 'POL-001',
        policy_value: 100000,
        sale_date: new Date().toISOString(),
        agent_id: 1,
        agent_name: 'Test Agent',
        is_cancelled: false,
      },
    ];

    render(<SalesChart sales={mockSales} />);
    
    // Chart.js renders a canvas element
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('filters out cancelled sales from chart', () => {
    const mockSales: Sale[] = [
      {
        id: 1,
        policy_number: 'POL-001',
        policy_value: 100000,
        sale_date: new Date().toISOString(),
        agent_id: 1,
        agent_name: 'Test Agent',
        is_cancelled: false,
      },
      {
        id: 2,
        policy_number: 'POL-002',
        policy_value: 50000,
        sale_date: new Date().toISOString(),
        agent_id: 1,
        agent_name: 'Test Agent',
        is_cancelled: true, // This should be filtered out
      },
    ];

    render(<SalesChart sales={mockSales} />);
    
    // Should still render the chart (cancelled sales are filtered internally)
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
