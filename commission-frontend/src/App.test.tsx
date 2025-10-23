import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';

// 1. Tell Jest to automatically mock the 'axios' library
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('App Component', () => {
  beforeEach(() => {
    // Clear all previous mock calls before each test
    mockedAxios.get.mockClear();
  });

  it('shows a loading message and then renders the hierarchy', async () => {
    // 2. Define the fake data we want axios to return
    const mockAgentsData = [
      {
        id: 1,
        name: 'Mike (Director)',
        level: 4,
        parent_id: null,
        children: [
          {
            id: 2,
            name: 'Lisa (Manager)',
            level: 3,
            parent_id: 1,
            children: [],
          },
        ],
      },
    ];

    const mockSalesData: any[] = [];
    const mockBonusesData: any[] = [];
    const mockLevel1AgentsData: any[] = []; // For SalesForm dropdown

    // 3. Mock all API endpoints that App.tsx and SalesForm call
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/agents?level=1')) {
        // SalesForm fetches level 1 agents for dropdown
        return Promise.resolve({ data: mockLevel1AgentsData });
      } else if (url.includes('/agents')) {
        // App.tsx fetches full hierarchy
        return Promise.resolve({ data: mockAgentsData });
      } else if (url.includes('/sales')) {
        return Promise.resolve({ data: mockSalesData });
      } else if (url.includes('/bonuses')) {
        return Promise.resolve({ data: mockBonusesData });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    // 4. Render the App component
    render(<App />);

    // 5. Check that the "Loading..." message appears first
    expect(screen.getByText(/Loading hierarchy.../i)).toBeInTheDocument();

    // 6. Wait for the component to update after the fake fetch
    // We look for the child's name, which only appears after data is loaded
    await waitFor(() => {
      expect(screen.getByText(/Lisa \(Manager\)/i)).toBeInTheDocument();
    });

    // 7. Check that the parent is also there and loading is gone
    expect(screen.getByText(/Mike \(Director\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Loading hierarchy.../i)).not.toBeInTheDocument();
  });

  it('shows an error message if the fetch fails', async () => {
    // Tell the mock to reject all requests with an error
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    render(<App />);

    // Wait for the error to be handled and loading to complete
    await waitFor(() => {
      // Check that the loading is gone and no data is present
      expect(screen.queryByText(/Loading hierarchy.../i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Mike \(Director\)/i)).not.toBeInTheDocument();
    });
  });
});
