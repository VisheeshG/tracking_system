/**
 * Utility functions for generating random project slugs and short codes
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generate a random project slug with one random letter
 * @returns Random single letter
 */
export function generateRandomProjectSlug(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  return letters.charAt(Math.floor(Math.random() * letters.length));
}

/**
 * Generate a random short code with 3 letters + 2 numbers
 * @returns Random string in format: 3 letters + 2 numbers (e.g., "abc12")
 */
export function generateRandomShortCode(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";

  let result = "";

  // Generate 3 random letters
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate 2 random numbers
  for (let i = 0; i < 2; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return result;
}

/**
 * Check if a project slug is unique in the database
 * @param slug - The slug to check
 * @param supabase - Supabase client
 * @returns Promise<boolean> - true if unique, false if exists
 */
export async function isProjectSlugUnique(
  slug: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .single();

    // If error means no record found, which means it's unique
    return !!error;
  } catch {
    return true; // Assume unique if error occurs
  }
}

/**
 * Check if a short code is unique in the database
 * @param shortCode - The short code to check
 * @param supabase - Supabase client
 * @returns Promise<boolean> - true if unique, false if exists
 */
export async function isShortCodeUnique(
  shortCode: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("links")
      .select("id")
      .eq("short_code", shortCode)
      .single();

    // If error means no record found, which means it's unique
    return !!error;
  } catch {
    return true; // Assume unique if error occurs
  }
}

/**
 * Generate a unique project slug
 * @param supabase - Supabase client
 * @param maxAttempts - Maximum attempts to generate unique slug (default: 26 for single letters)
 * @returns Promise<string> - Unique project slug
 */
export async function generateUniqueProjectSlug(
  supabase: SupabaseClient,
  maxAttempts: number = 26
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = generateRandomProjectSlug();
    const isUnique = await isProjectSlugUnique(slug, supabase);

    if (isUnique) {
      return slug;
    }
  }

  // Fallback: add timestamp to make it unique if all single letters are taken
  return generateRandomProjectSlug() + Date.now().toString().slice(-4);
}

/**
 * Generate a unique short code
 * @param supabase - Supabase client
 * @param maxAttempts - Maximum attempts to generate unique short code (default: 10)
 * @returns Promise<string> - Unique short code
 */
export async function generateUniqueShortCode(
  supabase: SupabaseClient,
  maxAttempts: number = 10
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const shortCode = generateRandomShortCode();
    const isUnique = await isShortCodeUnique(shortCode, supabase);

    if (isUnique) {
      return shortCode;
    }
  }

  // Fallback: add timestamp to make it unique
  return generateRandomShortCode() + Date.now().toString().slice(-2);
}

/**
 * Generate a unique project-level short code that can be shared across all links in a project
 * @param supabase - Supabase client
 * @param projectId - The project ID to generate a short code for
 * @param maxAttempts - Maximum attempts to generate unique short code (default: 10)
 * @returns Promise<string> - Unique project-level short code
 */
export async function generateUniqueProjectShortCode(
  supabase: SupabaseClient,
  projectId: string,
  maxAttempts: number = 10
): Promise<string> {
  // First, check if this project already has a short code
  const { data: existingLinks, error } = await supabase
    .from("links")
    .select("short_code")
    .eq("project_id", projectId)
    .limit(1);

  if (error) {
    console.error("Error checking existing project short code:", error);
  }

  // If project already has links with a short code, return that short code
  if (existingLinks && existingLinks.length > 0) {
    return existingLinks[0].short_code;
  }

  // Generate a new unique short code for this project
  for (let i = 0; i < maxAttempts; i++) {
    const shortCode = generateRandomShortCode();
    const isUnique = await isShortCodeUnique(shortCode, supabase);

    if (isUnique) {
      return shortCode;
    }
  }

  // Fallback: add timestamp to make it unique
  return generateRandomShortCode() + Date.now().toString().slice(-2);
}
