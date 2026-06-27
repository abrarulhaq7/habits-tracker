import { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { tokens } from '@/lib/tokens';
import Card from '../ui/Card';

export default function CardSkeleton() {
  const [fadeAnim] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <Card style={styles.card}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.leftContent}>
          {/* Category Tag skeleton */}
          <View style={styles.tagSkeleton} />
          
          {/* Title skeleton */}
          <View style={styles.titleSkeleton} />
          
          {/* Description skeleton lines */}
          <View style={styles.descriptionSkeletonLine1} />
          <View style={styles.descriptionSkeletonLine2} />
          
          {/* Duration skeleton */}
          <View style={styles.durationSkeleton} />
        </View>

        {/* Checkmark skeleton */}
        <View style={styles.checkmarkSkeleton} />
      </Animated.View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.spacing.md,
    marginVertical: tokens.spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    paddingRight: tokens.spacing.md,
  },
  tagSkeleton: {
    width: 70,
    height: 20,
    borderRadius: tokens.radius.badge,
    backgroundColor: tokens.colors.border,
    marginBottom: tokens.spacing.sm,
  },
  titleSkeleton: {
    width: '75%',
    height: 18,
    borderRadius: tokens.radius.control,
    backgroundColor: tokens.colors.border,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  descriptionSkeletonLine1: {
    width: '100%',
    height: 12,
    borderRadius: tokens.radius.control,
    backgroundColor: tokens.colors.border,
    marginBottom: tokens.spacing.xs,
  },
  descriptionSkeletonLine2: {
    width: '60%',
    height: 12,
    borderRadius: tokens.radius.control,
    backgroundColor: tokens.colors.border,
    marginBottom: tokens.spacing.md,
  },
  durationSkeleton: {
    width: 60,
    height: 12,
    borderRadius: tokens.radius.control,
    backgroundColor: tokens.colors.border,
  },
  checkmarkSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.border,
  },
});
