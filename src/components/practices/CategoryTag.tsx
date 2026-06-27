import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '@/lib/tokens';

interface CategoryTagProps {
  category: 'movement' | 'breath' | 'reflection' | 'rest';
}

export default function CategoryTag({ category }: CategoryTagProps) {
  const categoryConfig = tokens.colors.category[category] || tokens.colors.category.movement;
  
  const tagStyles = [
    styles.tag,
    { backgroundColor: categoryConfig.bg }
  ];

  const textStyles = [
    styles.text,
    { color: categoryConfig.text }
  ];

  const displayName = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <View style={tagStyles}>
      <Text style={textStyles}>{displayName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.badge,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: tokens.font.size.caption,
    fontWeight: tokens.font.weight.bold,
  },
});
