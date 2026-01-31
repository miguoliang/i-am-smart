---
name: error-handling
description: Explicit errors, types, messages, fail-safe, React error boundaries. Use when adding or changing error handling, logging, or recovery.
---

# Error Handling Principles

Follow these principles for robust error handling.

## Explicit Error Handling

- Handle errors explicitly, don't ignore them.
- Use appropriate error types.
- Provide meaningful error messages.
- Log errors appropriately.
- Fail gracefully with user-friendly messages.

## Error Types

- Use specific error types for different error scenarios.
- Create custom error classes when needed.
- Distinguish between recoverable and non-recoverable errors.
- Use TypeScript's type system to enforce error handling.

## Error Messages

- Provide clear, actionable error messages.
- Include context that helps debug the issue.
- Avoid exposing sensitive information in error messages.
- Use user-friendly messages for end users.
- Include technical details in logs, not user-facing messages.

## Fail Safe

- Design systems to fail in a safe state.
- Implement proper error recovery mechanisms.
- Use transactions for data integrity.
- Validate before processing.
- Implement retry logic for transient failures.

## Error Boundaries

- Use React Error Boundaries for component-level errors.
- Implement proper error boundaries at appropriate levels.
- Provide fallback UI for error states.
- Log errors to monitoring services.
- Don't let one component's error crash the entire application.
