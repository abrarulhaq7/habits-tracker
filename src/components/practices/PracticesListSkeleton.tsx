import CardSkeleton from "@/components/practices/CardSkeleton";
import { tokens } from "@/lib/tokens";
import { FlashList } from "@shopify/flash-list";
import { StyleSheet, View } from "react-native";

interface PracticesListSkeletonProps {
  numColumns: number;
}

export default function PracticesListSkeleton({
  numColumns,
}: PracticesListSkeletonProps) {
  const skeletonItems = Array.from({ length: 6 }, (_, i) => i);
  return (
    <View style={styles.listContainer}>
      <FlashList
        data={skeletonItems}
        renderItem={() => <CardSkeleton />}
        keyExtractor={(item) => `skeleton-${item}`}
        contentContainerStyle={styles.listContent}
        numColumns={numColumns}
        key={`loading-grid-${numColumns}`}
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
