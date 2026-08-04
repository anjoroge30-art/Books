import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchBooks } from '@/lib/openLibrary';
import { BOOKSTORE_SUGGESTIONS } from '@/lib/sampleBooks';
import type { Book } from '@/types/book';

export default function BookstoreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const suggestions = BOOKSTORE_SUGGESTIONS;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setQuery(trimmed);

    try {
      const books = await searchBooks(trimmed);
      setResults(books);
    } catch {
      setError('Could not search books. Check your connection and try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ThemedView style={styles.screen}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? Spacing.six : insets.top + Spacing.three,
            paddingBottom: BottomTabInset + Spacing.three,
          },
        ]}>
        <ThemedText type="subtitle" style={styles.title}>
          Bookstore
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Search Open Library for books to add to your shelf.
        </ThemedText>

        <View style={styles.suggestionsRow}>
          {suggestions.map((s) => (
            <Pressable key={s} onPress={() => void runSearch(s)} style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={[styles.suggestionChip, { borderColor: theme.textSecondary }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  {s}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </View>

        <ThemedView
          type="backgroundElement"
          style={[styles.searchBox, { borderColor: theme.textSecondary }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by title or author"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            returnKeyType="search"
            onSubmitEditing={() => void runSearch(query)}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <ThemedText type="linkPrimary" onPress={() => void runSearch(query)}>
            Search
          </ThemedText>
        </ThemedView>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.text} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <ThemedText themeColor="textSecondary">{error}</ThemedText>
            <ThemedText type="linkPrimary" onPress={() => void runSearch(query)} style={styles.retry}>
              Retry
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.centered}>
                <ThemedText themeColor="textSecondary">
                  {searched
                    ? 'No books found. Try another search.'
                    : 'Try searching for a title you love.'}
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <BookCard
                book={item}
                onPress={() =>
                  router.push({
                    pathname: '/book/[id]',
                    params: {
                      id: item.id,
                      title: item.title,
                      authors: item.authors.join(', '),
                      coverUrl: item.coverUrl ?? '',
                      year: item.year ? String(item.year) : '',
                      description: item.description ?? '',
                    },
                  })
                }
              />
            )}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'left',
  },
  subtitle: {
    marginBottom: Spacing.one,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  suggestionChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  retry: {
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
    flexGrow: 1,
  },
  centered: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
});
