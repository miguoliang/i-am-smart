---
name: logging
description: Uses project logger utility; no console.log. Use when adding logs, log levels, or debugging.
---

# Logging Standards

Follow these standards for logging in the application.

## Use Logger Utility

- **Never use `console.log`, `console.error`, `console.warn`, or `console.info` directly.**
- Always use the logger utility from `@/lib/utils/logger`.
- The logger provides consistent formatting and can be extended to send logs to external services.

## Logger Usage

```typescript
import { logger } from '@/lib/utils/logger';

// Debug logs (only in development)
logger.debug('Debug message', { context: 'value' });

// Info logs
logger.info('Information message', { userId: '123' });

// Warning logs
logger.warn('Warning message', { issue: 'description' });

// Error logs
logger.error('Error message', { error, stack: error.stack });
```

## Log Levels

- **debug**: Detailed information for debugging (only shown in development)
- **info**: General informational messages
- **warn**: Warning messages for potentially problematic situations
- **error**: Error messages for error conditions

## Best Practices

- Include relevant context in log messages.
- Use structured logging with context objects.
- Don't log sensitive information (passwords, tokens, etc.).
- Use appropriate log levels.
- Keep log messages clear and actionable.

## Context Objects

Always provide context objects for better debugging:

```typescript
// Good
logger.error('Failed to authenticate user', { 
  userId: user.id, 
  error: error.message,
  endpoint: '/api/auth'
});

// Bad
logger.error('Failed to authenticate user');
```
