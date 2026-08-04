import type { Book } from '@/types/book';
import { searchBooks } from '@/lib/openLibrary';

/** Curated Open Library search queries verified against the live API. */
export const SAMPLE_BOOK_QUERIES = [
  '1984',
  'Pride and Prejudice',
  'The Hobbit',
  'Dune',
  'To Kill a Mockingbird',
  'The Great Gatsby',
  'War and Peace',
  'The Catcher in the Rye',
  'The Name of the Wind',
  'Brave New World',
  'Frankenstein',
  'Moby Dick',
  'Jane Eyre',
  'Wuthering Heights',
  'Crime and Punishment',
  'Hamlet',
  'Dracula',
  'The Picture of Dorian Gray',
  'Little Women',
  'Les Miserables',
  'Fahrenheit 451',
  'Animal Farm',
  'Lord of the Flies',
  'Of Mice and Men',
  'The Alchemist',
  "Harry Potter and the Philosopher's Stone",
  'Don Quixote',
  'The Brothers Karamazov',
  'Anna Karenina',
  'The Odyssey',
] as const;

export const BOOKSTORE_SUGGESTIONS = [
  'Pride and Prejudice',
  '1984',
  'The Hobbit',
  'Dune',
  'Frankenstein',
  'Dracula',
  'Fahrenheit 451',
  'The Alchemist',
] as const;

/** First batch used for empty-library seeding. */
export const SEED_QUERIES = SAMPLE_BOOK_QUERIES.slice(0, 12);

/**
 * Fetch the best Open Library match for each query, skipping failures
 * and titles already present in `existingIds`.
 */
export async function fetchSampleBooks(
  queries: readonly string[],
  existingIds: Set<string> = new Set()
): Promise<Book[]> {
  const books: Book[] = [];

  for (const query of queries) {
    try {
      const found = await searchBooks(query);
      const book = found[0];
      if (book && !existingIds.has(book.id)) {
        books.push(book);
        existingIds.add(book.id);
      }
    } catch {
      // Ignore individual query failures.
    }
  }

  return books;
}
