import type { Book } from '@/types/book';

const SEARCH_URL = 'https://openlibrary.org/search.json';
const WORKS_URL = 'https://openlibrary.org';

type OpenLibrarySearchDoc = {
  key: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  first_sentence?: string[] | string;
};

type OpenLibrarySearchResponse = {
  docs: OpenLibrarySearchDoc[];
};

type OpenLibraryWork = {
  title?: string;
  description?: string | { value?: string };
  covers?: number[];
  first_publish_date?: string;
  authors?: { author?: { key?: string } }[];
};

function coverUrlFromId(coverId: number | undefined | null): string | null {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

function workIdFromKey(key: string): string {
  return key.replace(/^\/works\//, '').replace(/^\//, '');
}

function extractDescription(description: OpenLibraryWork['description']): string | undefined {
  if (!description) return undefined;
  if (typeof description === 'string') return description;
  return description.value;
}

function mapSearchDoc(doc: OpenLibrarySearchDoc): Book | null {
  if (!doc.key || !doc.title) return null;
  const id = workIdFromKey(doc.key);
  if (!id) return null;

  let description: string | undefined;
  if (Array.isArray(doc.first_sentence)) {
    description = doc.first_sentence[0];
  } else if (typeof doc.first_sentence === 'string') {
    description = doc.first_sentence;
  }

  return {
    id,
    title: doc.title,
    authors: doc.author_name ?? [],
    coverUrl: coverUrlFromId(doc.cover_i),
    description,
    year: doc.first_publish_year,
  };
}

export async function searchBooks(query: string): Promise<Book[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${SEARCH_URL}?q=${encodeURIComponent(trimmed)}&limit=20&fields=key,title,author_name,cover_i,first_publish_year,first_sentence`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to search books');
  }

  const data = (await response.json()) as OpenLibrarySearchResponse;
  return (data.docs ?? [])
    .map(mapSearchDoc)
    .filter((book): book is Book => book !== null);
}

export async function getBook(id: string): Promise<Book> {
  const workId = workIdFromKey(id);
  const response = await fetch(`${WORKS_URL}/works/${workId}.json`);
  if (!response.ok) {
    throw new Error('Failed to load book');
  }

  const work = (await response.json()) as OpenLibraryWork;

  let authors: string[] = [];
  const authorKeys = (work.authors ?? [])
    .map((entry) => entry.author?.key)
    .filter((key): key is string => Boolean(key))
    .slice(0, 3);

  if (authorKeys.length > 0) {
    const names = await Promise.all(
      authorKeys.map(async (key) => {
        try {
          const authorResponse = await fetch(`${WORKS_URL}${key}.json`);
          if (!authorResponse.ok) return null;
          const author = (await authorResponse.json()) as { name?: string };
          return author.name ?? null;
        } catch {
          return null;
        }
      })
    );
    authors = names.filter((name): name is string => Boolean(name));
  }

  const yearMatch = work.first_publish_date?.match(/\d{4}/);

  return {
    id: workId,
    title: work.title ?? 'Untitled',
    authors,
    coverUrl: coverUrlFromId(work.covers?.[0]),
    description: extractDescription(work.description),
    year: yearMatch ? Number(yearMatch[0]) : undefined,
  };
}
