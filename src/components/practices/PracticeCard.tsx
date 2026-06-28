import { tokens } from "@/lib/tokens";
import { Practice } from "@/lib/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Card from "../ui/Card";
import CategoryTag from "./CategoryTag";

interface PracticeCardProps {
  practice: Practice;
  onPress: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}

const PracticeCard = React.memo(function PracticeCard({
  practice,
  onPress,
  onToggleComplete,
}: PracticeCardProps) {
  const {
    id,
    title,
    description,
    category,
    duration_minutes,
    completed_today,
  } = practice;

  const handleCardPress = () => {
    onPress(id);
  };

  const handleCheckPress = () => {
    onToggleComplete(id, !completed_today);
  };

  return (
    <Card style={styles.cardContainer}>
      <Pressable onPress={handleCardPress} style={styles.pressableContent}>
        <View style={styles.leftContent}>
          <CategoryTag category={category} />

          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>

          <View style={styles.durationRow}>
            <Feather
              name="clock"
              size={12}
              color={tokens.colors.textMuted}
              style={styles.clockIcon}
            />
            <Text style={styles.durationText}>{duration_minutes} min</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCheckPress}
          activeOpacity={0.6}
          style={styles.checkmarkContainer}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completed_today }}
          accessibilityLabel={`Mark ${title} as ${completed_today ? "incomplete" : "complete"}`}
        >
          {completed_today ? (
            <View style={styles.checkmarkChecked}>
              <Feather
                name="check"
                size={14}
                color={tokens.colors.background}
              />
            </View>
          ) : (
            <View style={styles.checkmarkUnchecked} />
          )}
        </TouchableOpacity>
      </Pressable>
    </Card>
  );
});

export default PracticeCard;

const styles = StyleSheet.create({
  cardContainer: {
    padding: 0,
    overflow: "hidden",
  },
  pressableContent: {
    padding: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  leftContent: {
    flex: 1,
    paddingRight: tokens.spacing.md,
  },
  title: {
    color: tokens.colors.text,
    fontSize: tokens.font.size.title,
    fontWeight: tokens.font.weight.bold,
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  description: {
    color: tokens.colors.textMuted,
    fontSize: tokens.font.size.body,
    lineHeight: tokens.font.size.body * 1.4,
    marginBottom: tokens.spacing.sm,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clockIcon: {
    marginRight: tokens.spacing.xs,
  },
  durationText: {
    color: tokens.colors.textMuted,
    fontSize: tokens.font.size.caption,
    fontWeight: tokens.font.weight.medium,
  },
  checkmarkContainer: {
    width: 44, // Generous touch target
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkChecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    backgroundColor: "transparent",
  },
});
