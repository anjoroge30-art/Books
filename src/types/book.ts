export type ReadingStatus = 'want' | 'reading' | 'finished';

export type Book = {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  description?: string;
  year?: number;
};

export type LibraryBook = Book & {
  status: ReadingStatus;
  addedAt: string;
};

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  want: 'Want to read',
  reading: 'Reading',
  finished: 'Finished',
};

export const READING_STATUSES: ReadingStatus[] = ['want', 'reading', 'finished'];
