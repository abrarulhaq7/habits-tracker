import PracticesList from "@/components/practices/PracticesList";
import PracticesListSkeleton from "@/components/practices/PracticesListSkeleton";
import StateDisplay from "@/components/ui/StateDisplay";
import { useMutatePractice, usePractices } from "@/hooks/usePractices";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import { tokens } from "@/lib/tokens";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, Text } from "react-native";
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

  const renderContent = () => {
    if (isLoading) {
      return <PracticesListSkeleton numColumns={numColumns} />;
    }
    if (isError) {
      return (
        <StateDisplay
          iconName="cloud-off"
          title="Something went wrong"
          subtitle="Could not load your practices"
          actionTitle="Try Again"
          onActionPress={refetch}
        />
      );
    }
    if (!practices || practices.length === 0) {
      return (
        <StateDisplay
          iconName="book-open"
          title="No practices yet"
          subtitle="Your daily practices will appear here"
        />
      );
    }

    return (
      <PracticesList
        practices={practices}
        numColumns={numColumns}
        onPracticePress={handlePracticePress}
        onToggleComplete={handleToggleComplete}
        isRefetching={isRefetching}
        onRefresh={refetch}
      />
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
});
