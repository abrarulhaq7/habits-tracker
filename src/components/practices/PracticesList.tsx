import PracticeCard from "@/components/practices/PracticeCard";
import { tokens } from "@/lib/tokens";
import { Practice } from "@/lib/types";
import { FlashList } from "@shopify/flash-list";
import { useCallback } from "react";
import { RefreshControl, StyleSheet, View, ViewStyle } from "react-native";

interface PracticesListProps {
  practices: Practice[];
  numColumns: number;
  onPracticePress: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  isRefetching: boolean;
  onRefresh: () => void;
}

export default function PracticesList({
  practices,
  numColumns,
  onPracticePress,
  onToggleComplete,
  isRefetching,
  onRefresh,
}: PracticesListProps) {
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
            onPress={onPracticePress}
            onToggleComplete={onToggleComplete}
          />
        </View>
      );
    },
    [onPracticePress, onToggleComplete, numColumns],
  );

  return (
    <View style={styles.listContainer}>
      <FlashList
        data={practices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={numColumns}
        key={`practices-grid-${numColumns}`}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={tokens.colors.accent}
            colors={[tokens.colors.accent]}
            progressBackgroundColor={tokens.colors.surface}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingHorizontal: tokens.spacing.md - tokens.spacing.xs,
    paddingBottom: tokens.spacing.xl,
  },
});
