import CardSkeleton from "@/components/practices/CardSkeleton";
import PracticeCard from "@/components/practices/PracticeCard";
import Button from "@/components/ui/Button";
import { useMutatePractice, usePractices } from "@/hooks/usePractices";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import { tokens } from "@/lib/tokens";
import { Practice } from "@/lib/types";
import { Feather } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PracticesListScreen() {
  const router = useRouter();
  const numColumns = useResponsiveColumns();

  const {
    data: practices,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = usePractices();
  const { mutate: toggleComplete } = useMutatePractice();

  // Navigation to detail screen
  const handlePracticePress = useCallback(
    (id: string) => {
      router.push({
        pathname: "/(tabs)/practices/[id]",
        params: { id },
      });
    },
    [router],
  );

  // Handle completion checkmark toggle
  const handleToggleComplete = useCallback(
    (id: string, completed: boolean) => {
      toggleComplete({ id, completed });
    },
    [toggleComplete],
  );

  // stable renderItem for FlashList view recycling
  const renderItem = useCallback(
    ({ item }: { item: Practice }) => {
      const itemStyle: ViewStyle =
        numColumns > 1
          ? { flex: 1, marginHorizontal: tokens.spacing.xs }
          : { width: "100%" };

      return (
        <View style={itemStyle}>
          <PracticeCard
            practice={item}
            onPress={handlePracticePress}
            onToggleComplete={handleToggleComplete}
          />
        </View>
      );
    },
    [handlePracticePress, handleToggleComplete, numColumns],
  );

  // loading state: renders 6 skeleton items matching responsive column layout
  const renderLoadingState = () => {
    const skeletonItems = Array.from({ length: 6 }, (_, i) => i);
    return (
      <View style={styles.listContainer}>
        <FlashList
          data={skeletonItems}
          renderItem={() => <CardSkeleton />}
          keyExtractor={(item) => `skeleton-${item}`}
          contentContainerStyle={styles.listContent}
          numColumns={numColumns}
          key={`loading-grid-${numColumns}`} // Force layout refresh on width change
        />
      </View>
    );
  };

  // error state: matches design specs with Feather cloud-off icon and custom Button
  const renderErrorState = () => {
    return (
      <View style={styles.centerContainer}>
        <Feather
          name="cloud-off"
          size={72}
          color={tokens.colors.textMuted}
          style={styles.stateIcon}
        />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSubtitle}>Could not load your practices</Text>
        <Button
          title="Try Again"
          onPress={() => refetch()}
          style={styles.retryButton}
          variant="primary"
        />
      </View>
    );
  };

  // empty state: matches design specs with book-open sprout indicator
  const renderEmptyState = () => {
    return (
      <View style={styles.centerContainer}>
        <Feather
          name="book-open"
          size={72}
          color={tokens.colors.textMuted}
          style={styles.stateIcon}
        />
        <Text style={styles.emptyTitle}>No practices yet</Text>
        <Text style={styles.emptySubtitle}>
          Your daily practices will appear here
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }
    if (isError) {
      return renderErrorState();
    }
    if (!practices || practices.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={styles.listContainer}>
        <FlashList
          data={practices}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={numColumns}
          key={`practices-grid-${numColumns}`} // Force layout refresh on column count change
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={tokens.colors.accent}
              colors={[tokens.colors.accent]}
              progressBackgroundColor={tokens.colors.surface}
            />
          }
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Text style={styles.headerTitle}>Practices</Text>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  headerTitle: {
    color: tokens.colors.text,
    fontSize: tokens.font.size.display,
    fontWeight: tokens.font.weight.bold,
    paddingHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  listContainer: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingHorizontal: tokens.spacing.md - tokens.spacing.xs,
    paddingBottom: tokens.spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.xl,
    marginBottom: 60, // Visually offset the center slightly upwards
  },
  stateIcon: {
    marginBottom: tokens.spacing.md,
    opacity: 0.8,
  },
  errorTitle: {
    color: tokens.colors.text,
    fontSize: tokens.font.size.title,
    fontWeight: tokens.font.weight.bold,
    textAlign: "center",
    marginBottom: tokens.spacing.xs,
  },
  errorSubtitle: {
    color: tokens.colors.textMuted,
    fontSize: tokens.font.size.body,
    textAlign: "center",
    marginBottom: tokens.spacing.lg,
  },
  retryButton: {
    width: 140,
    backgroundColor: tokens.colors.accent,
  },
  emptyTitle: {
    color: tokens.colors.text,
    fontSize: tokens.font.size.title,
    fontWeight: tokens.font.weight.bold,
    textAlign: "center",
    marginBottom: tokens.spacing.xs,
  },
  emptySubtitle: {
    color: tokens.colors.textMuted,
    fontSize: tokens.font.size.body,
    textAlign: "center",
  },
});
