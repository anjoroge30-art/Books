import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as libraryStorage from '@/lib/libraryStorage';
import { fetchSampleBooks, SEED_QUERIES } from '@/lib/sampleBooks';
import type { Book, LibraryBook, ReadingStatus } from '@/types/book';

type LibraryContextValue = {
  books: LibraryBook[];
  loading: boolean;
  getBook: (id: string) => LibraryBook | undefined;
  addBook: (book: Book, status?: ReadingStatus) => Promise<void>;
  addBooks: (books: Book[], status?: ReadingStatus) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  setStatus: (id: string, status: ReadingStatus) => Promise<void>;
  refresh: () => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await libraryStorage.loadLibrary();
    setBooks(next);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const next = await libraryStorage.loadLibrary();
        if (active) setBooks(next);

        // Seed / expand once with curated Open Library titles.
        const alreadySeeded = await libraryStorage.isLibrarySeeded();
        if (!alreadySeeded && active) {
          const existingIds = new Set(next.map((book) => book.id));
          const seeded = await fetchSampleBooks(SEED_QUERIES, existingIds);
          if (seeded.length > 0) {
            const updated = await libraryStorage.addBooks(seeded, 'want');
            if (active) setBooks(updated);
          }
          await libraryStorage.setLibrarySeeded(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const addBook = useCallback(async (book: Book, status: ReadingStatus = 'want') => {
    const next = await libraryStorage.addBook(book, status);
    setBooks(next);
  }, []);

  const addBooks = useCallback(async (incoming: Book[], status: ReadingStatus = 'want') => {
    const next = await libraryStorage.addBooks(incoming, status);
    setBooks(next);
  }, []);

  const removeBook = useCallback(async (id: string) => {
    const next = await libraryStorage.removeBook(id);
    setBooks(next);
  }, []);

  const setStatus = useCallback(async (id: string, status: ReadingStatus) => {
    const next = await libraryStorage.setStatus(id, status);
    setBooks(next);
  }, []);

  const getBook = useCallback((id: string) => books.find((book) => book.id === id), [books]);

  const value = useMemo(
    () => ({
      books,
      loading,
      getBook,
      addBook,
      addBooks,
      removeBook,
      setStatus,
      refresh,
    }),
    [books, loading, getBook, addBook, addBooks, removeBook, setStatus, refresh]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
