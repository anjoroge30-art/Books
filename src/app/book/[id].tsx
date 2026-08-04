import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { StatusChips } from '@/components/status-chips';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLibrary } from '@/hooks/useLibrary';
import { getBook } from '@/lib/openLibrary';
import type { Book, ReadingStatus } from '@/types/book';

function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function BookDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    authors?: string;
    coverUrl?: string;
    year?: string;
    description?: string;
  }>();
  const id = paramString(params.id);
  const { getBook: getLibraryBook, addBook, removeBook, setStatus } = useLibrary();
  const libraryBook = getLibraryBook(id);

  const initialBook = useMemo<Book | null>(() => {
    if (!id) return null;
    if (libraryBook) return libraryBook;

    const title = paramString(params.title);
    if (!title) return null;

    return {
      id,
      title,
      authors: paramString(params.authors)
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
      coverUrl: paramString(params.coverUrl) || null,
      year: paramString(params.year) ? Number(paramString(params.year)) : undefined,
      description: paramString(params.description) || undefined,
    };
  }, [id, libraryBook, params.authors, params.coverUrl, params.description, params.title, params.year]);

  const [book, setBook] = useState<Book | null>(initialBook);
  const [loading, setLoading] = useState(!initialBook?.description || !initialBook?.authors.length);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      if (!id) {
        setError('Missing book id');
        setLoading(false);
        return;
      }

      try {
        const remote = await getBook(id);
        if (!active) return;
        setBook((current) => ({
          ...remote,
          coverUrl: remote.coverUrl ?? current?.coverUrl ?? null,
          authors: remote.authors.length ? remote.authors : current?.authors ?? [],
          description: remote.description ?? current?.description,
          year: remote.year ?? current?.year,
        }));
        setError(null);
      } catch {
        if (!active) return;
        if (!initialBook) {
          setError('Could not load this book.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, initialBook]);

  const onAddOrUpdate = async (status: ReadingStatus) => {
    if (!book) return;
    setBusy(true);
    try {
      if (libraryBook) {
        await setStatus(book.id, status);
      } else {
        await addBook(book, status);
      }
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (!book) return;
    setBusy(true);
    try {
      await removeBook(book.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: book?.title ?? 'Book' }} />
      <ThemedView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          {loading && !book ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.text} />
            </View>
          ) : error && !book ? (
            <View style={styles.centered}>
              <ThemedText themeColor="textSecondary">{error}</ThemedText>
            </View>
          ) : book ? (
            <>
              <View style={styles.hero}>
                {book.coverUrl ? (
                  <Image source={{ uri: book.coverUrl }} style={styles.cover} contentFit="cover" />
                ) : (
                  <ThemedView type="backgroundElement" style={[styles.cover, styles.coverPlaceholder]}>
                    <ThemedText themeColor="textSecondary">No cover</ThemedText>
                  </ThemedView>
                )}
                <ThemedText type="subtitle" style={styles.bookTitle}>
                  {book.title}
                </ThemedText>
                <ThemedText themeColor="textSecondary">
                  {book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'}
                </ThemedText>
                {book.year ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    First published {book.year}
                  </ThemedText>
                ) : null}
              </View>

              {book.description ? (
                <ThemedView type="backgroundElement" style={styles.section}>
                  <ThemedText type="smallBold">About</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {book.description}
                  </ThemedText>
                </ThemedView>
              ) : loading ? (
                <ActivityIndicator color={theme.text} />
              ) : null}

              <ThemedView type="backgroundElement" style={styles.section}>
                <ThemedText type="smallBold">
                  {libraryBook ? 'Reading status' : 'Add to library'}
                </ThemedText>
                <StatusChips
                  value={libraryBook?.status ?? 'want'}
                  onChange={(status) => {
                    if (status === 'all') return;
                    if (busy) return;
                    void onAddOrUpdate(status);
                  }}
                />
                {busy ? (
                  <View style={styles.busyRow}>
                    <ActivityIndicator color={theme.text} />
                    <ThemedText type="small" themeColor="textSecondary">
                      Saving…
                    </ThemedText>
                  </View>
                ) : null}
                {libraryBook ? (
                  <Pressable
                    disabled={busy}
                    onPress={onRemove}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <ThemedText type="linkPrimary">Remove from library</ThemedText>
                  </Pressable>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    Tap a status to save this book on your device.
                  </ThemedText>
                )}
              </ThemedView>
            </>
          ) : null}
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  cover: {
    width: 160,
    height: 240,
    borderRadius: Spacing.three,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTitle: {
    textAlign: 'center',
  },
  section: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  centered: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
