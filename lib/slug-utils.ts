/**
 * URL-safe slugs for brands and display paths.
 */

export function slugifyName(name: string, maxLength = 48): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);

  return slug.length >= 2 ? slug : "brand";
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && slug.length >= 2 && slug.length <= 48;
}

export const SUBMISSION_PATTERN = /^sub\d+$/;

export function isValidSubmissionSegment(value: string): boolean {
  return SUBMISSION_PATTERN.test(value);
}
