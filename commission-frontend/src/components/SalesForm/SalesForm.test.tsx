import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import SalesForm from './SalesForm';
import { Agent } from '../AgentNode'; // Import Agent type

// --- Mock Axios ---
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// --- Mock Data ---
const mockAgents: Agent[] = [
  { id: 4, name: 'Sarah (Agent)', level: 1 },
  { id: 5, name: 'John (Agent)', level: 1 },
];

describe('SalesForm Component', () => {
  // Mock function for the onSaleAdded prop
  const mockOnSaleAdded = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
    mockOnSaleAdded.mockClear();

    // Default mock response for fetching agents
    mockedAxios.get.mockResolvedValue({ data: mockAgents });
  });

  it('renders correctly and fetches agents', async () => {
    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);

    // Check if form elements are present
    expect(screen.getByLabelText(/Policy Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Policy Value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Selling Agent/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Record Sale/i })).toBeInTheDocument();

    // Check if axios.get was called for agents
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/api/agents?level=1'));

    // Wait for agents to load and check dropdown options
    // Use findByRole for async elements
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Sarah \(Agent\)/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('option', { name: /John \(Agent\)/i })).toBeInTheDocument();
  });

  it('submits the form data correctly and calls onSaleAdded', async () => {
    // Mock the POST response
    mockedAxios.post.mockResolvedValue({ status: 201, data: { sale_id: 101, message: 'Success' } });

    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup(); // For simulating user typing

    // Wait for agents to load before interacting
    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    // Fill the form
    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-TEST-101');
    await user.type(screen.getByLabelText(/Policy Value/i), '75000');
    await user.selectOptions(screen.getByLabelText(/Selling Agent/i), screen.getByRole('option', { name: /John \(Agent\)/i }));

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    // Check if axios.post was called with the correct data
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/sales'),
        {
          policy_number: 'POL-TEST-101',
          policy_value: 75000,
          agent_id: 5, // John's ID
        }
      );
    });

    // Check if success message is shown
    expect(await screen.findByText(/Sale 101 recorded successfully!/i)).toBeInTheDocument();

    // Check if onSaleAdded prop was called
    expect(mockOnSaleAdded).toHaveBeenCalledTimes(1);

    // Check if form fields were reset
    expect(screen.getByLabelText(/Policy Number/i)).toHaveValue('');
    expect(screen.getByLabelText(/Policy Value/i)).toHaveValue(null); // Number input resets to null
  });

  it('shows an error message if submission fails', async () => {
    // Mock a failed POST response
    mockedAxios.post.mockRejectedValue(new Error('Network Error'));

    render(<SalesForm onSaleAdded={mockOnSaleAdded} />);
    const user = userEvent.setup();

    await screen.findByRole('option', { name: /Sarah \(Agent\)/i });

    // Fill and submit
    await user.type(screen.getByLabelText(/Policy Number/i), 'POL-FAIL');
    await user.type(screen.getByLabelText(/Policy Value/i), '1000');
    fireEvent.click(screen.getByRole('button', { name: /Record Sale/i }));

    // Check if error message appears
    expect(await screen.findByText(/Failed to record sale. Please try again./i)).toBeInTheDocument();

    // Check that onSaleAdded was NOT called
    expect(mockOnSaleAdded).not.toHaveBeenCalled();
  });
});