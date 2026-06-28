import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import PracticesListScreen from './PracticesListScreen';
import { PracticesProvider } from '@/context/PracticesContext';
import { fetchPractices } from '@/lib/api/practices';

// Mock the API layer
jest.mock('@/lib/api/practices', () => ({
  fetchPractices: jest.fn(),
  updatePracticeCompletion: jest.fn(),
  updatePracticeRating: jest.fn(),
  updatePracticeTitle: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

const mockPractices = [
  {
    id: '1',
    title: 'Morning Yoga',
    description: 'Energizing flow to start the day.',
    duration_minutes: 15,
    category: 'movement' as const,
    completed_today: false,
    rating: null,
  },
  {
    id: '2',
    title: 'Deep Breathing',
    description: 'Calm your mind and refocus.',
    duration_minutes: 5,
    category: 'breath' as const,
    completed_today: true,
    rating: 5,
  },
];

describe('PracticesListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading state correctly when isLoading is true', async () => {
    // Keep fetchPractices pending so it remains in loading state
    (fetchPractices as jest.Mock).mockReturnValue(new Promise(() => {}));

    await act(async () => {
      await render(
        <PracticesProvider>
          <PracticesListScreen />
        </PracticesProvider>
      );
    });

    // Verify asynchronously that the mocked FlashList contains 6 CardSkeleton items
    const flashList = await screen.findByTestId('mock-flash-list');
    expect(flashList.children.length).toBe(6);
  });

  it('renders the list of practice cards when data loads successfully', async () => {
    (fetchPractices as jest.Mock).mockResolvedValue(mockPractices);

    await act(async () => {
      await render(
        <PracticesProvider>
          <PracticesListScreen />
        </PracticesProvider>
      );
    });

    // Wait for the data to load and render
    expect(await screen.findByText('Morning Yoga')).toBeDefined();
    expect(await screen.findByText('Deep Breathing')).toBeDefined();

    // Check specific durations are rendered
    expect(await screen.findByText('15 min')).toBeDefined();
    expect(await screen.findByText('5 min')).toBeDefined();
  });

  it('renders the empty state when the practices array is empty', async () => {
    (fetchPractices as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      await render(
        <PracticesProvider>
          <PracticesListScreen />
        </PracticesProvider>
      );
    });

    expect(await screen.findByText('No practices yet')).toBeDefined();
    expect(await screen.findByText('Your daily practices will appear here')).toBeDefined();
  });

  it('renders the error state when isError is true', async () => {
    (fetchPractices as jest.Mock).mockRejectedValue(new Error('API failure'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      await render(
        <PracticesProvider>
          <PracticesListScreen />
        </PracticesProvider>
      );
    });

    expect(await screen.findByText('Something went wrong')).toBeDefined();
    expect(await screen.findByText('Could not load your practices')).toBeDefined();

    consoleErrorSpy.mockRestore();
  });

  it('tapping a practice card calls the navigation function with the correct practice id', async () => {
    (fetchPractices as jest.Mock).mockResolvedValue(mockPractices);

    await act(async () => {
      await render(
        <PracticesProvider>
          <PracticesListScreen />
        </PracticesProvider>
      );
    });

    // Wait for cards to appear
    const cardTitle = await screen.findByText('Morning Yoga');

    // Tap the card to trigger navigation
    fireEvent.press(cardTitle);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/practices/[id]',
      params: { id: '1' },
    });
  });
});
