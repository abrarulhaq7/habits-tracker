import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useSummaryStats } from "@/hooks/useSummaryStats";
import { tokens } from "@/lib/tokens";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SummaryScreen() {
  const {
    completedCount,
    averageRating,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useSummaryStats();

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.colors.accent} />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Feather
            name="cloud-off"
            size={72}
            color={tokens.colors.textMuted}
            style={styles.stateIcon}
          />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>Could not load your summary</Text>
          <Button
            title="Try Again"
            onPress={() => refetch()}
            style={styles.retryButton}
            variant="primary"
          />
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={tokens.colors.accent}
            colors={[tokens.colors.accent]}
            progressBackgroundColor={tokens.colors.surface}
          />
        }
      >
        <View style={styles.statsRow}>
          <View style={styles.cardWrapper}>
            <Card style={styles.statCard}>
              <View style={styles.cardHeader}>
                <View style={styles.checkBadge}>
                  <Feather
                    name="check"
                    size={14}
                    color={tokens.colors.background}
                  />
                </View>
              </View>
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Completed Today</Text>
            </Card>
          </View>

          <View style={styles.cardWrapper}>
            <Card style={styles.statCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="star" size={22} color={tokens.colors.accent} />
              </View>
              <Text style={styles.statNumber}>
                {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
              </Text>
              <Text style={styles.statLabel}>Average Rating</Text>
            </Card>
          </View>
        </View>

        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationWrapper}>
            <MaterialCommunityIcons
              name="sprout"
              size={120}
              color={tokens.colors.accent}
              style={styles.sproutIcon}
            />
            <View style={styles.sproutBase} />
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Text style={styles.headerTitle}>{"Today's Summary"}</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: tokens.spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: tokens.spacing.md - tokens.spacing.xs,
    justifyContent: "space-between",
    marginTop: tokens.spacing.sm,
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: tokens.spacing.xs,
  },
  statCard: {
    height: 160,
    justifyContent: "space-between",
    padding: tokens.spacing.md,
    marginVertical: 0, // override Card default marginVertical
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    height: 24,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 54,
    fontWeight: tokens.font.weight.bold,
    color: tokens.colors.text,
    lineHeight: 58,
  },
  statLabel: {
    fontSize: tokens.font.size.body,
    fontWeight: tokens.font.weight.medium,
    color: tokens.colors.textMuted,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: tokens.spacing.xl,
    minHeight: 250,
  },
  illustrationWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  sproutIcon: {
    opacity: 0.9,
  },
  sproutBase: {
    width: 120,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.border,
    marginTop: -8,
    opacity: 0.6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.xl,
    marginBottom: 60,
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
});
