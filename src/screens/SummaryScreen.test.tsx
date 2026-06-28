import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import SummaryScreen from './SummaryScreen';
import { PracticesProvider } from '@/context/PracticesContext';
import { fetchPractices } from '@/lib/api/practices';

// Mock the API layer
jest.mock('@/lib/api/practices', () => ({
  fetchPractices: jest.fn(),
  updatePracticeCompletion: jest.fn(),
  updatePracticeRating: jest.fn(),
  updatePracticeTitle: jest.fn(),
}));

const mockPractices = [
  {
    id: '1',
    title: 'Yoga',
    description: 'Movement practice',
    duration_minutes: 20,
    category: 'movement' as const,
    completed_today: true,
    rating: 4,
  },
  {
    id: '2',
    title: 'Deep Breath',
    description: 'Breath practice',
    duration_minutes: 10,
    category: 'breath' as const,
    completed_today: false,
    rating: 5,
  },
  {
    id: '3',
    title: 'Mindfulness',
    description: 'Reflection practice',
    duration_minutes: 15,
    category: 'reflection' as const,
    completed_today: true,
    rating: null,
  },
];

describe('SummaryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mathematically correct stats for a mix of practices', async () => {
    (fetchPractices as jest.Mock).mockResolvedValue(mockPractices);

    await act(async () => {
      await render(
        <PracticesProvider>
          <SummaryScreen />
        </PracticesProvider>
      );
    });

    // Verify stats render
    expect(await screen.findByText('2')).toBeDefined();
    expect(await screen.findByText('4.5')).toBeDefined();
  });

  it('renders correct fallback average rating of 0.0 when zero practices are completed or rated', async () => {
    (fetchPractices as jest.Mock).mockResolvedValue([
      {
        id: '1',
        title: 'Meditation',
        description: 'Silent meditation',
        duration_minutes: 15,
        category: 'reflection' as const,
        completed_today: false,
        rating: null,
      }
    ]);

    await act(async () => {
      await render(
        <PracticesProvider>
          <SummaryScreen />
        </PracticesProvider>
      );
    });

    expect(await screen.findByText('0')).toBeDefined();
    expect(await screen.findByText('0.0')).toBeDefined();
  });

  it('re-renders with updated stats when the underlying practices data changes', async () => {
    // Initial fetch returns mockPractices
    (fetchPractices as jest.Mock).mockResolvedValueOnce(mockPractices);

    // Second fetch returns updated list
    (fetchPractices as jest.Mock).mockResolvedValueOnce([
      ...mockPractices,
      {
        id: '4',
        title: 'Resting',
        description: 'Sleep',
        duration_minutes: 30,
        category: 'rest' as const,
        completed_today: true,
        rating: 3,
      }
    ]);

    await act(async () => {
      await render(
        <PracticesProvider>
          <SummaryScreen />
        </PracticesProvider>
      );
    });

    expect(await screen.findByText('2')).toBeDefined();
    expect(await screen.findByText('4.5')).toBeDefined();

    // Find the RefreshControl and trigger refresh to pull new data
    const refreshControl = await screen.findByTestId('refresh-control');
    
    await act(async () => {
      fireEvent(refreshControl, 'refresh');
    });

    // Wait for the updated stats to render
    expect(await screen.findByText('3')).toBeDefined();
    expect(await screen.findByText('4.0')).toBeDefined();
  });
});
