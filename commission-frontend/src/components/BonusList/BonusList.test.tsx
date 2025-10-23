import React from 'react';
import { render, screen } from '@testing-library/react';
import BonusList, { Bonus } from './BonusList';

// --- Mock Data ---
const mockBonuses: Bonus[] = [
  { id: 1, period: '2025-10', bonus_type: 'Monthly', agent_id: 4, agent_name: 'Sarah', amount: 5500.00 },
  { id: 2, period: '2025-10', bonus_type: 'Monthly', agent_id: 3, agent_name: 'Bob', amount: 3300.00 },
];

describe('BonusList Component', () => {
  it('renders headers and "no bonuses" message when empty', () => {
    render(<BonusList bonuses={[]} />);
    expect(screen.getByRole('columnheader', { name: /Period/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Type/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Agent/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Amount/i })).toBeInTheDocument();
    expect(screen.getByText(/No bonuses calculated yet./i)).toBeInTheDocument();
  });

it('renders bonus data correctly', () => {
  render(<BonusList bonuses={mockBonuses} />);

  // Option A: Check for both instances (better)
  expect(screen.getAllByText('2025-10')).toHaveLength(2); 

  // Check other unique data points
  expect(screen.getByText('Sarah')).toBeInTheDocument();
  expect(screen.getByText('$5,500.00')).toBeInTheDocument(); 
  expect(screen.getByText('Bob')).toBeInTheDocument();
  expect(screen.getByText('$3,300.00')).toBeInTheDocument();
});
});