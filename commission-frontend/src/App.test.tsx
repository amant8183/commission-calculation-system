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
    const mockData = [
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

    // 3. Tell the mock to return our fake data when 'get' is called
    mockedAxios.get.mockResolvedValue({ data: mockData });

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
    // Tell the mock to reject the request with an error
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    render(<App />);

    // Wait for the error to be handled
    await waitFor(() => {
      // You might want to add a real error message to your App.tsx
      // For now, we'll just check that the loading is gone and no data is present
      expect(screen.queryByText(/Loading hierarchy.../i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Mike \(Director\)/i)).not.toBeInTheDocument();
    });
  });
});