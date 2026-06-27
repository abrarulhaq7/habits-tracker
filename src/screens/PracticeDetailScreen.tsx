import CategoryTag from "@/components/practices/CategoryTag";
import Button from "@/components/ui/Button";
import {
  useMutatePractice,
  useMutatePracticeRating,
  useMutatePracticeTitle,
  usePractices,
} from "@/hooks/usePractices";
import { tokens } from "@/lib/tokens";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PracticeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { data: practices, isLoading, isError } = usePractices();
  const { mutate: toggleComplete, isPending: isTogglePending } =
    useMutatePractice();
  const { mutate: mutateRating } = useMutatePracticeRating();
  const { mutate: mutateTitle } = useMutatePracticeTitle();

  // Inline title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleInputRef = useRef<TextInput>(null);

  // Find current practice from context state
  const practice = practices?.find((p) => p.id === id);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleToggleComplete = useCallback(() => {
    if (practice) {
      toggleComplete({ id: practice.id, completed: !practice.completed_today });
    }
  }, [practice, toggleComplete]);

  const handleRatingPress = useCallback(
    (rating: number) => {
      if (practice) {
        // Toggle rating off if clicking the same rating
        const newRating = practice.rating === rating ? null : rating;
        mutateRating({ id: practice.id, rating: newRating });
      }
    },
    [practice, mutateRating],
  );

  /** Enter title edit mode — pre-fill the draft with current title. */
  const handleTitlePress = useCallback(() => {
    if (practice) {
      setTitleDraft(practice.title);
      setIsEditingTitle(true);
    }
  }, [practice]);

  /** Commit the title mutation when the input loses focus. */
  const handleTitleBlur = useCallback(() => {
    if (practice && titleDraft.trim() && titleDraft.trim() !== practice.title) {
      mutateTitle({ id: practice.id, title: titleDraft.trim() });
    }
    setIsEditingTitle(false);
  }, [practice, titleDraft, mutateTitle]);

  // Renders the 5-star rating input
  const renderStars = () => {
    const rating = practice?.rating ?? 0;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingPress(star)}
            activeOpacity={0.7}
            style={styles.starTouchTarget}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={isLandscape ? 36 : 40}
              color={
                star <= rating ? tokens.colors.accent : tokens.colors.textMuted
              }
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.colors.accent} />
        </View>
      );
    }

    if (isError || !practice) {
      return (
        <View style={styles.centerContainer}>
          <Feather
            name="alert-circle"
            size={48}
            color={tokens.colors.error}
            style={styles.errorIcon}
          />
          <Text style={styles.errorText}>Practice not found</Text>
          <Button
            title="Go Back"
            onPress={handleBack}
            style={styles.errorButton}
          />
        </View>
      );
    }

    const { title, description, category, duration_minutes, completed_today } =
      practice;

    if (isLandscape) {
      // Landscape: Split-pane design
      return (
        <View style={styles.landscapeContainer}>
          {/* Left Pane: Practice Details */}
          <View style={styles.leftPane}>
            <CategoryTag category={category} />
            <TouchableOpacity onPress={handleTitlePress} activeOpacity={0.7}>
              {isEditingTitle ? (
                <TextInput
                  ref={titleInputRef}
                  style={[styles.title, styles.titleInput]}
                  value={titleDraft}
                  onChangeText={setTitleDraft}
                  onBlur={handleTitleBlur}
                  multiline
                  returnKeyType="done"
                  blurOnSubmit
                />
              ) : (
                <Text style={styles.title} numberOfLines={2}>
                  {title}
                </Text>
              )}
            </TouchableOpacity>
            <View style={styles.durationRow}>
              <Feather
                name="clock"
                size={14}
                color={tokens.colors.textMuted}
                style={styles.clockIcon}
              />
              <Text style={styles.durationText}>{duration_minutes} min</Text>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.descriptionScroll}
            >
              <Text style={styles.description}>
                {description} Lorem ipsum dolor sit amet, consectetur adipiscing
                elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
                aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </Text>
            </ScrollView>
          </View>

          {/* Vertical Divider */}
          <View style={styles.divider} />

          {/* Right Pane: Rating and Completion Button */}
          <View style={styles.rightPane}>
            <View style={styles.ratingBlockLandscape}>
              <Text style={styles.ratingLabelLandscape}>YOUR RATING</Text>
              {renderStars()}
            </View>
            <View style={styles.buttonBlockLandscape}>
              <Button
                title={completed_today ? "Completed" : "Mark Complete"}
                onPress={handleToggleComplete}
                loading={isTogglePending}
                style={[
                  styles.completeButton,
                  completed_today && styles.completeButtonActive,
                ]}
                textStyle={styles.completeButtonText}
              >
                <Feather
                  name={completed_today ? "check-circle" : "check"}
                  size={18}
                  color={completed_today ? "#FFFFFF" : tokens.colors.background}
                  style={styles.buttonIcon}
                />
                <Text
                  style={[
                    styles.buttonLabel,
                    completed_today && styles.buttonLabelActive,
                  ]}
                >
                  {completed_today ? "Completed" : "Mark Complete"}
                </Text>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={completed_today ? "#FFFFFF" : tokens.colors.background}
                  style={styles.buttonSparkle}
                />
              </Button>
            </View>
          </View>
        </View>
      );
    }

    // Portrait Layout: Single scrolling column
    return (
      <View style={styles.portraitContainer}>
        <ScrollView
          contentContainerStyle={styles.portraitScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <CategoryTag category={category} />

          <TouchableOpacity onPress={handleTitlePress} activeOpacity={0.7}>
            {isEditingTitle ? (
              <TextInput
                ref={titleInputRef}
                style={[styles.title, styles.titleInput]}
                value={titleDraft}
                onChangeText={setTitleDraft}
                onBlur={handleTitleBlur}
                multiline
                returnKeyType="done"
              />
            ) : (
              <Text style={styles.title}>{title}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.durationRow}>
            <Feather
              name="clock"
              size={14}
              color={tokens.colors.textMuted}
              style={styles.clockIcon}
            />
            <Text style={styles.durationText}>{duration_minutes} min</Text>
          </View>

          <Text style={styles.description}>
            {description} A gentle sequence of yoga poses combined with
            deliberate breathing to improve mobility and mental clarity. This
            sequence is perfect for grounding yourself at the beginning of the
            day. Consistent practice helps build body awareness and flexibility.
          </Text>

          <View style={styles.ratingBlockPortrait}>
            {renderStars()}
            <Text style={styles.ratingLabelPortrait}>YOUR RATING</Text>
          </View>
        </ScrollView>

        {/* Floating Complete Action Button */}
        <View style={styles.portraitFooter}>
          <TouchableOpacity
            onPress={handleToggleComplete}
            activeOpacity={0.8}
            disabled={isTogglePending}
            style={[
              styles.portraitButton,
              completed_today && styles.portraitButtonActive,
            ]}
          >
            {isTogglePending ? (
              <ActivityIndicator
                size="small"
                color={completed_today ? "#FFFFFF" : tokens.colors.background}
              />
            ) : (
              <View style={styles.buttonInner}>
                <Feather
                  name={completed_today ? "check-circle" : "check"}
                  size={18}
                  color={completed_today ? "#FFFFFF" : tokens.colors.background}
                  style={styles.buttonIcon}
                />
                <Text
                  style={[
                    styles.portraitButtonLabel,
                    completed_today && styles.portraitButtonLabelActive,
                  ]}
                >
                  {completed_today ? "Completed" : "Mark Complete"}
                </Text>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={completed_today ? "#FFFFFF" : tokens.colors.background}
                  style={styles.buttonSparkle}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["top", "left", "right", "bottom"]}
    >
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={24} color={tokens.colors.text} />
        </TouchableOpacity>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    height: 48,
    paddingHorizontal: tokens.spacing.md,
    justifyContent: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacing.xl,
  },
  errorIcon: {
    marginBottom: tokens.spacing.md,
  },
  errorText: {
    color: tokens.colors.text,
    fontSize: tokens.font.size.title,
    fontWeight: tokens.font.weight.bold,
    marginBottom: tokens.spacing.md,
  },
  errorButton: {
    width: 120,
  },

  // Portrait Styles
  portraitContainer: {
    flex: 1,
  },
  portraitScrollContent: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: 100, // Leave room for fixed button
  },
  title: {
    color: tokens.colors.text,
    fontSize: tokens.font.size.display * 0.9,
    fontWeight: tokens.font.weight.bold,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    lineHeight: tokens.font.size.display * 1.05,
  },
  titleInput: {
    // Inherits title styles, adds an edit indicator
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.accent,
    paddingBottom: 2,
    // Reset TextInput defaults that would clash
    padding: 0,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: tokens.spacing.lg,
  },
  clockIcon: {
    marginRight: tokens.spacing.xs,
  },
  durationText: {
    color: tokens.colors.textMuted,
    fontSize: tokens.font.size.body,
    fontWeight: tokens.font.weight.medium,
  },
  description: {
    color: tokens.colors.textMuted,
    fontSize: tokens.font.size.body + 2,
    lineHeight: (tokens.font.size.body + 2) * 1.5,
    marginBottom: tokens.spacing.xl,
  },
  ratingBlockPortrait: {
    alignItems: "center",
    marginTop: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  starTouchTarget: {
    padding: tokens.spacing.xs,
  },
  ratingLabelPortrait: {
    color: tokens.colors.textMuted,
    fontSize: tokens.font.size.caption,
    fontWeight: tokens.font.weight.bold,
    letterSpacing: 1.5,
    marginTop: tokens.spacing.sm,
  },
  portraitFooter: {
    position: "absolute",
    bottom: tokens.spacing.lg,
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    backgroundColor: "transparent",
  },
  portraitButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: tokens.colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  portraitButtonActive: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.success,
    borderWidth: 1,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing.xl,
    width: "100%",
  },
  portraitButtonLabel: {
    color: tokens.colors.background,
    fontSize: tokens.font.size.body + 2,
    fontWeight: tokens.font.weight.bold,
    textAlign: "center",
    flex: 1,
  },
  portraitButtonLabelActive: {
    color: "#FFFFFF",
  },
  buttonIcon: {
    width: 20,
  },
  buttonSparkle: {
    width: 20,
  },

  // Landscape Styles
  landscapeContainer: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
  },
  leftPane: {
    flex: 1.2,
    paddingRight: tokens.spacing.md,
  },
  descriptionScroll: {
    flex: 1,
    marginTop: tokens.spacing.sm,
  },
  divider: {
    width: 1,
    height: "95%",
    backgroundColor: tokens.colors.border,
    alignSelf: "center",
    marginHorizontal: tokens.spacing.md,
  },
  rightPane: {
    flex: 1,
    paddingLeft: tokens.spacing.md,
    justifyContent: "space-between",
    paddingVertical: tokens.spacing.sm,
  },
  ratingBlockLandscape: {
    alignItems: "flex-start",
    marginTop: tokens.spacing.md,
  },
  ratingLabelLandscape: {
    color: tokens.colors.textMuted,
    fontSize: tokens.font.size.caption,
    fontWeight: tokens.font.weight.bold,
    letterSpacing: 1.5,
    marginBottom: tokens.spacing.md,
  },
  buttonBlockLandscape: {
    justifyContent: "flex-end",
    width: "100%",
    paddingBottom: tokens.spacing.sm,
  },
  completeButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: tokens.colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing.lg,
    width: "100%",
  },
  completeButtonActive: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.success,
    borderWidth: 1,
  },
  completeButtonText: {
    display: "none", // Hide standard Button text since we custom-compose children
  },
  buttonLabel: {
    color: tokens.colors.background,
    fontSize: tokens.font.size.body + 1,
    fontWeight: tokens.font.weight.bold,
    textAlign: "center",
    flex: 1,
  },
  buttonLabelActive: {
    color: "#FFFFFF",
  },
});
