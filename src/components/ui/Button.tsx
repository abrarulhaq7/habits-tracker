import { tokens } from "@/lib/tokens";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const isButtonDisabled = disabled || loading;

  const buttonStyles = [
    styles.button,
    variant === "primary" && styles.primaryButton,
    variant === "secondary" && styles.secondaryButton,
    variant === "outline" && styles.outlineButton,
    isButtonDisabled && styles.disabledButton,
    style,
  ];

  const finalTextStyles = [
    styles.text,
    variant === "primary" && styles.primaryText,
    variant === "secondary" && styles.secondaryText,
    variant === "outline" && styles.outlineText,
    isButtonDisabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isButtonDisabled}
      style={buttonStyles}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary"
              ? tokens.colors.background
              : tokens.colors.accent
          }
        />
      ) : (
        <Text style={finalTextStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: tokens.radius.control,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButton: {
    backgroundColor: tokens.colors.accent,
  },
  secondaryButton: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.border,
    borderWidth: 1,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderColor: tokens.colors.accent,
    borderWidth: 1,
  },
  disabledButton: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    opacity: 0.5,
  },
  text: {
    fontSize: tokens.font.size.body,
    fontWeight: tokens.font.weight.bold,
  },
  primaryText: {
    color: tokens.colors.background,
  },
  secondaryText: {
    color: tokens.colors.text,
  },
  outlineText: {
    color: tokens.colors.accent,
  },
  disabledText: {
    color: tokens.colors.textMuted,
  },
});
