import { useWindowDimensions } from 'react-native';

export function useResponsiveColumns() {
  const { width } = useWindowDimensions();
  // Standard tablet/desktop width breakpoint
  const isTablet = width >= 768;
  return isTablet ? 2 : 1;
}
