import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import PracticeDetailScreen from './PracticeDetailScreen';
import { PracticesProvider } from '@/context/PracticesContext';
import { fetchPractices, updatePracticeCompletion, updatePracticeRating } from '@/lib/api/practices';
import { useLocalSearchParams } from 'expo-router';

// Mock the API layer
jest.mock('@/lib/api/practices', () => ({
  fetchPractices: jest.fn(),
  updatePracticeCompletion: jest.fn(),
  updatePracticeRating: jest.fn(),
  updatePracticeTitle: jest.fn(),
}));

// Mock expo-router search params
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: jest.fn(),
}));

const mockPractice = {
  id: '1',
  title: 'Morning Breathwork',
  description: 'A 10-minute breathwork routine to start your day clear-headed.',
  duration_minutes: 10,
  category: 'breath' as const,
  completed_today: false,
  rating: null,
};

describe('PracticeDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: '1' });
  });

  it("renders the practice's title, description, and duration correctly", async () => {
    (fetchPractices as jest.Mock).mockResolvedValue([mockPractice]);

    await act(async () => {
      await render(
        <PracticesProvider>
          <PracticeDetailScreen />
        </PracticesProvider>
      );
    });

    // Wait for content to render using findBy queries
    expect(await screen.findByText('Morning Breathwork')).toBeDefined();
    expect(await screen.findByText('A 10-minute breathwork routine to start your day clear-headed.')).toBeDefined();
    expect(await screen.findByText('10 min')).toBeDefined();
  });

  it('tapping "Mark Complete" calls the completion mutation with correct practice id', async () => {
    (fetchPractices as jest.Mock).mockResolvedValue([mockPractice]);
    (updatePracticeCompletion as jest.Mock).mockResolvedValue({
      ...mockPractice,
      completed_today: true,
    });

    await act(async () => {
      await render(
        <PracticesProvider>
          <PracticeDetailScreen />
        </PracticesProvider>
      );
    });

    // Wait for the complete button to appear
    const completeButton = await screen.findByText('Mark Complete');

    // Tap complete button inside act to resolve async updates
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Verify API called with correct parameters
    expect(updatePracticeCompletion).toHaveBeenCalledWith('1', true);
  });

  it('after marking complete, the UI reflects the completed state', async () => {
    (fetchPractices as jest.Mock).mockResolvedValue([mockPractice]);
    (updatePracticeCompletion as jest.Mock).mockResolvedValue({
      ...mockPractice,
      completed_today: true,
    });

    await act(async () => {
      await render(
        <PracticesProvider>
          <PracticeDetailScreen />
        </PracticesProvider>
      );
    });

    // Verify initial state is "Mark Complete"
    const completeButton = await screen.findByText('Mark Complete');
    
    // Tap to complete inside act to resolve async updates
    await act(async () => {
      fireEvent.press(completeButton);
    });

    // Wait for the button text to transition to "Completed"
    const completedText = await screen.findByText('Completed');
    expect(completedText).toBeDefined();
  });

  it('selecting a star rating calls the rating mutation with correct id and rating value', async () => {
    (fetchPractices as jest.Mock).mockResolvedValue([mockPractice]);
    (updatePracticeRating as jest.Mock).mockResolvedValue({
      ...mockPractice,
      rating: 4,
    });

    await act(async () => {
      await render(
        <PracticesProvider>
          <PracticeDetailScreen />
        </PracticesProvider>
      );
    });

    // Wait for detail to render by checking for the title
    await screen.findByText('Morning Breathwork');

    // Get all initial star outline icons
    const stars = await waitFor(() => screen.getAllByTestId('icon-ionicons-star-outline'));
    expect(stars.length).toBe(5);

    // Tap the 4th star (index 3) inside act to resolve async updates
    await act(async () => {
      fireEvent.press(stars[3]);
    });

    // Verify rating mutation called with rating = 4
    expect(updatePracticeRating).toHaveBeenCalledWith('1', 4);
  });
});
