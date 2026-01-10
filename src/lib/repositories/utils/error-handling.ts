import { PostgrestError } from '@supabase/supabase-js';

/**
 * Standardized error handling for repository operations
 * Wraps Supabase errors with descriptive messages
 */
export function handleRepositoryError(error: PostgrestError | null, operation: string): never {
  if (error) {
    throw new Error(`${operation} error: ${error.message}`);
  }
  throw new Error(`${operation} error: Unknown error occurred`);
}

/**
 * Check if error is a "not found" error (returns null for not found cases)
 * vs a real error (throws)
 */
export function isNotFoundError(error: PostgrestError | null): boolean {
  if (!error) return false;
  // Supabase returns specific error codes for not found
  return error.code === 'PGRST116' || error.message.includes('No rows returned');
}
