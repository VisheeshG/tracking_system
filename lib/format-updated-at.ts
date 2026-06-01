/** Ignore null/invalid DB values that parse as Unix epoch (1970). */
const MIN_VALID_MS = Date.UTC(2000, 0, 1);

function parseTimestamp(iso: string | null | undefined): Date | null {
  if (iso == null || iso === "") return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getTime() < MIN_VALID_MS) {
    return null;
  }
  return date;
}

/** Prefer `updatedAt`; fall back to `createdAt` when missing or invalid. */
export function resolveLastEditedTimestamp(
  updatedAt: string | null | undefined,
  createdAt?: string | null
): Date | null {
  return parseTimestamp(updatedAt) ?? parseTimestamp(createdAt);
}

/** Human-readable "last edited" timestamp. */
export function formatLastEdited(
  updatedAt: string | null | undefined,
  createdAt?: string | null
): string | null {
  const date = resolveLastEditedTimestamp(updatedAt, createdAt);
  if (!date) return null;

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
