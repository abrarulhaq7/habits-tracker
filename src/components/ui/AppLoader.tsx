import { tokens } from "@/lib/tokens";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function AppLoader() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={tokens.colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacing.xl,
  },
});
