import Button from "@/components/ui/Button";
import { tokens } from "@/lib/tokens";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface StateDisplayProps {
  iconName: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export default function StateDisplay({
  iconName,
  title,
  subtitle,
  actionTitle,
  onActionPress,
  style,
}: StateDisplayProps) {
  return (
    <View style={[styles.centerContainer, style]} testID="state-display">
      <Feather
        name={iconName}
        size={72}
        color={tokens.colors.textMuted}
        style={styles.stateIcon}
      />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionTitle && onActionPress ? (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          style={styles.actionButton}
          variant="primary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    color: tokens.colors.text,
    fontSize: tokens.font.size.title,
    fontWeight: tokens.font.weight.bold,
    textAlign: "center",
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    color: tokens.colors.textMuted,
    fontSize: tokens.font.size.body,
    textAlign: "center",
    marginBottom: tokens.spacing.lg,
  },
  actionButton: {
    width: 140,
    backgroundColor: tokens.colors.accent,
  },
});
