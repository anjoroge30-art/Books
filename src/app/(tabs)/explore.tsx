import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { StatusChips } from '@/components/status-chips';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLibrary } from '@/hooks/useLibrary';
import { fetchSampleBooks, SAMPLE_BOOK_QUERIES, SEED_QUERIES } from '@/lib/sampleBooks';
import { READING_STATUS_LABELS, type ReadingStatus } from '@/types/book';

const MORE_BATCH_SIZE = 8;

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { books, loading, addBooks } = useLibrary();
  const [filter, setFilter] = useState<ReadingStatus | 'all'>('all');
  const [seeding, setSeeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return books;
    return books.filter((book) => book.status === filter);
  }, [books, filter]);

  const addBooksByQueries = async (queries: readonly string[], label: string) => {
    if (seeding) return;
    setSeeding(true);
    setStatusMessage(null);
    try {
      const existingIds = new Set(books.map((book) => book.id));
      const fetched = await fetchSampleBooks(queries, existingIds);
      if (fetched.length === 0) {
        setStatusMessage('No new books to add from the catalog.');
        return;
      }
      await addBooks(fetched, 'want');
      setStatusMessage(`Added ${fetched.length} ${label}.`);
    } catch {
      setStatusMessage('Could not add books. Check your connection and try again.');
    } finally {
      setSeeding(false);
    }
  };

  const addSampleBooks = () => addBooksByQueries(SEED_QUERIES, 'sample books');

  const addMoreBooks = () => {
    // Prefer titles not already present by exact title match as a first pass.
    const remaining = SAMPLE_BOOK_QUERIES.filter((query) => {
      const alreadyHaveTitle = books.some(
        (book) => book.title.toLowerCase() === query.toLowerCase()
      );
      return !alreadyHaveTitle;
    }).slice(0, MORE_BATCH_SIZE);

    if (remaining.length === 0) {
      // Fall back to searching the full catalog — fetchSampleBooks skips existing IDs.
      return addBooksByQueries(SAMPLE_BOOK_QUERIES, 'books');
    }

    return addBooksByQueries(remaining, 'books');
  };

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
        <ThemedText type="subtitle">Library</ThemedText>
        <ThemedText themeColor="textSecondary">
          Your personal shelf, saved on this device.
        </ThemedText>

        <StatusChips value={filter} onChange={setFilter} includeAll />

        {books.length > 0 ? (
          <Pressable
            onPress={() => void addMoreBooks()}
            disabled={seeding}
            style={({ pressed }) => [pressed && !seeding && styles.pressed]}>
            <ThemedView
              type="backgroundElement"
              style={[styles.actionButton, { borderColor: theme.textSecondary }]}>
              {seeding ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <ThemedText type="linkPrimary">Add more books</ThemedText>
              )}
            </ThemedView>
          </Pressable>
        ) : null}

        {statusMessage ? (
          <ThemedText type="small" themeColor="textSecondary">
            {statusMessage}
          </ThemedText>
        ) : null}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.text} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.centered}>
                {books.length === 0 ? (
                  <>
                    <ThemedText themeColor="textSecondary">
                      Your library is empty. Add curated books from Open Library to get started.
                    </ThemedText>

                    {filter === 'all' ? (
                      <Pressable
                        onPress={() => void addSampleBooks()}
                        disabled={seeding}
                        style={({ pressed }) => [pressed && !seeding && styles.pressed]}>
                        <ThemedView
                          type="backgroundElement"
                          style={[styles.seedButton, { borderColor: theme.textSecondary }]}>
                          {seeding ? (
                            <ActivityIndicator color={theme.text} />
                          ) : (
                            <ThemedText type="linkPrimary">Add sample books</ThemedText>
                          )}
                        </ThemedView>
                      </Pressable>
                    ) : (
                      <ThemedText
                        type="linkPrimary"
                        onPress={() => setFilter('all')}
                        style={styles.retry}>
                        Show all
                      </ThemedText>
                    )}
                  </>
                ) : (
                  <>
                    <ThemedText themeColor="textSecondary">
                      No books with this status yet.
                    </ThemedText>
                    <ThemedText
                      type="linkPrimary"
                      onPress={() => setFilter('all')}
                      style={styles.retry}>
                      Show all
                    </ThemedText>
                  </>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <BookCard
                book={item}
                subtitle={READING_STATUS_LABELS[item.status]}
                onPress={() =>
                  router.push({
                    pathname: '/book/[id]',
                    params: { id: item.id },
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
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
    flexGrow: 1,
  },
  centered: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  seedButton: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  retry: {
    marginTop: Spacing.one,
  },
});
