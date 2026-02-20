/**
 * Runtime validation utilities for repository data
 * Ensures type safety at runtime, not just compile time
 */

/**
 * Validates that a value is a non-null object
 */
export function assertIsObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid data: ${fieldName} must be an object`);
  }
  return value as Record<string, unknown>;
}

/**
 * Validates that a value is a string
 */
export function assertIsString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid data: ${fieldName} must be a string`);
  }
  return value;
}

/**
 * Validates that a value is a number
 */
export function assertIsNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid data: ${fieldName} must be a number`);
  }
  return value;
}

/**
 * Validates that a value is an array
 */
export function assertIsArray<T>(value: unknown, fieldName: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid data: ${fieldName} must be an array`);
  }
  return value as T[];
}

/**
 * Validates UserStats structure
 */
export interface UserStats {
  total: number;
  mastered: number;
  learning: number;
  dueToday: number;
}

export function validateUserStats(data: unknown): UserStats {
  const obj = assertIsObject(data, 'UserStats');
  
  return {
    total: assertIsNumber(obj.total, 'UserStats.total'),
    mastered: assertIsNumber(obj.mastered, 'UserStats.mastered'),
    learning: assertIsNumber(obj.learning, 'UserStats.learning'),
    dueToday: assertIsNumber(obj.dueToday, 'UserStats.dueToday'),
  };
}
