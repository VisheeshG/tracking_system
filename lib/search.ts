/** Case-insensitive substring match on title; empty query matches all. */
export function matchesTitleQuery(query: string, title: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return title.toLowerCase().includes(q);
}
