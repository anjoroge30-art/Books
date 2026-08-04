import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, Platform } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Book } from '@/types/book';

type BookCardProps = {
  book: Book;
  subtitle?: string;
  onPress: () => void;
};

export function BookCard({ book, subtitle, onPress }: BookCardProps) {
  const theme = useTheme();
  const authors = book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.textSecondary }]}>
        {book.coverUrl ? (
          <Image source={{ uri: book.coverUrl }} style={styles.cover} contentFit="cover" />
        ) : (
          <ThemedView type="backgroundSelected" style={[styles.cover, styles.coverPlaceholder]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              No cover
            </ThemedText>
          </ThemedView>
        )}
        <View style={styles.meta}>
          <ThemedText type="smallBold" numberOfLines={2}>
            {book.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {authors}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          ) : null}
          {book.year ? (
            <ThemedText type="small" themeColor="textSecondary">
              {book.year}
            </ThemedText>
          ) : null}
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.five,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }
      : {}),
    ...(Platform.OS === 'android' ? { elevation: 1 } : {}),
  },
  cover: {
    width: 64,
    height: 96,
    borderRadius: Spacing.five,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  meta: {
    flex: 1,
    gap: Spacing.one,
  },
});
