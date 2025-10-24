// frontend/src/components/DashboardSummary/DashboardSummary.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardSummary, { SummaryData } from './DashboardSummary';

describe('DashboardSummary Component', () => {
  it('renders loading state', () => {
    render(<DashboardSummary summary={null} loading={true} />);
    expect(screen.getByText(/Loading summary data.../i)).toBeInTheDocument();
  });

  it('renders error state when summary is null and not loading', () => {
    render(<DashboardSummary summary={null} loading={false} />);
    expect(screen.getByText(/Could not load summary data./i)).toBeInTheDocument();
  });

  it('renders summary data correctly', () => {
    const mockSummary: SummaryData = {
      agent_count: 15,
      total_sales_value: 1234567.89,
      total_commissions_paid: 123456.78,
      total_bonuses_paid: 12345.67,
      total_clawbacks_value: -1234.56, // Negative value
    };
    render(<DashboardSummary summary={mockSummary} loading={false} />);

    // Check titles and values
    expect(screen.getByText(/Total Agents/i)).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText(/Total Sales Value/i)).toBeInTheDocument();
    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument(); // Check formatting

    expect(screen.getByText(/Commissions Paid/i)).toBeInTheDocument();
    expect(screen.getByText('$123,456.78')).toBeInTheDocument();

    expect(screen.getByText(/Bonuses Paid/i)).toBeInTheDocument();
    expect(screen.getByText('$12,345.67')).toBeInTheDocument();

    expect(screen.getByText(/Total Clawbacks/i)).toBeInTheDocument();
    // Check that it displays the absolute value with formatting
    expect(screen.getByText('$1,234.56')).toBeInTheDocument(); 
  });

   it('renders zero clawbacks correctly', () => {
    const mockSummary: SummaryData = {
      agent_count: 10,
      total_sales_value: 100000,
      total_commissions_paid: 10000,
      total_bonuses_paid: 1000,
      total_clawbacks_value: 0, // Zero value
    };
    render(<DashboardSummary summary={mockSummary} loading={false} />);

    expect(screen.getByText(/Total Clawbacks/i)).toBeInTheDocument();
    // Check that it displays zero correctly formatted
    expect(screen.getByText('$0.00')).toBeInTheDocument(); 
  });
});