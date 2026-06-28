import { tokens } from "@/lib/tokens";
import { StyleSheet, View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export default function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    marginVertical: tokens.spacing.xs,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
});
