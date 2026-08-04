import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Book, LibraryBook, ReadingStatus } from '@/types/book';

const LIBRARY_KEY = 'books.library.v1';
const SEED_KEY = 'books.library.seeded.v2';

export async function loadLibrary(): Promise<LibraryBook[]> {
  const raw = await AsyncStorage.getItem(LIBRARY_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as LibraryBook[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveLibrary(books: LibraryBook[]): Promise<void> {
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
}

export async function addBook(
  book: Book,
  status: ReadingStatus = 'want'
): Promise<LibraryBook[]> {
  const library = await loadLibrary();
  const existingIndex = library.findIndex((item) => item.id === book.id);

  if (existingIndex >= 0) {
    library[existingIndex] = {
      ...library[existingIndex],
      ...book,
      status,
    };
  } else {
    library.unshift({
      ...book,
      status,
      addedAt: new Date().toISOString(),
    });
  }

  await saveLibrary(library);
  return library;
}

export async function addBooks(
  books: Book[],
  status: ReadingStatus = 'want'
): Promise<LibraryBook[]> {
  let library = await loadLibrary();

  for (const book of books) {
    const existingIndex = library.findIndex((item) => item.id === book.id);
    if (existingIndex >= 0) {
      library[existingIndex] = {
        ...library[existingIndex],
        ...book,
        status: library[existingIndex].status,
      };
    } else {
      library = [
        {
          ...book,
          status,
          addedAt: new Date().toISOString(),
        },
        ...library,
      ];
    }
  }

  await saveLibrary(library);
  return library;
}

export async function removeBook(id: string): Promise<LibraryBook[]> {
  const library = await loadLibrary();
  const next = library.filter((book) => book.id !== id);
  await saveLibrary(next);
  return next;
}

export async function setStatus(id: string, status: ReadingStatus): Promise<LibraryBook[]> {
  const library = await loadLibrary();
  const next = library.map((book) => (book.id === id ? { ...book, status } : book));
  await saveLibrary(next);
  return next;
}

export async function isLibrarySeeded(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SEED_KEY);
  return raw === '1';
}

export async function setLibrarySeeded(seeded: boolean): Promise<void> {
  await AsyncStorage.setItem(SEED_KEY, seeded ? '1' : '0');
}
