# Naming Conventions

This document defines the naming conventions used throughout the codebase to ensure consistency and clarity.

## Function Naming Patterns

### Data Retrieval Functions

#### `get*` - May Return Null/Undefined
Functions prefixed with `get*` may return `null` or `undefined` if the requested resource doesn't exist.

**Examples:**
- `getContentBySlug()` - Returns `ContentPage | null`
- `getCardById()` - Returns `Card | null`
- `getLocale()` - Returns `Locale` (always returns a value, but follows convention)

**Pattern:**
```typescript
function getResource(id: string): Resource | null {
  // May return null if not found
}
```

#### `fetch*` - Always Returns Data or Throws
Functions prefixed with `fetch*` make HTTP requests and always return data or throw an error. They never return `null` or `undefined`.

**Examples:**
- `fetchDueCards()` - Returns `DueCardsResponse` or throws
- `fetchKnowledges()` - Returns `PaginatedKnowledgeResult` or throws
- `fetchFeedbacks()` - Returns `FeedbacksResponse` or throws
- `fetchAccounts()` - Returns `AccountsResponse` or throws

**Pattern:**
```typescript
async function fetchResource(params: Params): Promise<Resource> {
  // Always returns data or throws error
}
```

#### `getAll*` - Returns Array (May Be Empty)
Functions prefixed with `getAll*` return arrays. The array may be empty but never `null`.

**Examples:**
- `getAllContent()` - Returns `ContentPage[]` (empty array if none found)
- `getDueCards()` - Returns `Card[]` (empty array if none due)

**Pattern:**
```typescript
async function getAllResources(): Promise<Resource[]> {
  // Returns array, may be empty
}
```

### Factory Functions

#### `create*` - Factory Functions
Functions prefixed with `create*` are factory functions that create and return service instances or clients.

**Examples:**
- `createCardService()` - Creates and returns `CardService`
- `createAccountService()` - Creates and returns `AccountService`
- `createRouteHandlerClient()` - Creates and returns Supabase client
- `createClient()` - Creates and returns Supabase client

**Pattern:**
```typescript
// Async factory (when initialization requires async operations)
async function createService(): Promise<Service> {
  const dependency = await getDependency();
  return new Service(dependency);
}

// Sync factory (when initialization is synchronous)
function createService(): Service {
  return new Service();
}
```

**Note:** Factory functions may be async or sync depending on their dependencies. This is acceptable and documented in the function signature.

### Utility Functions

#### `get*` - Get Configuration/State
Functions prefixed with `get*` that retrieve configuration, state, or computed values.

**Examples:**
- `getTodayDateRange()` - Returns date range for today
- `getLocale()` - Returns current locale
- `getTranslations()` - Returns translations for locale
- `getErrorMessage()` - Extracts error message from error object

**Pattern:**
```typescript
function getConfigValue(): ConfigValue {
  // Returns configuration or computed value
}
```

### Action Functions

#### `*Card` - Card Operations
Functions that perform actions on cards.

**Examples:**
- `reviewCard()` - Reviews a card (mutation)
- `distributeCards()` - Distributes cards (mutation)

**Pattern:**
```typescript
async function actionResource(params: Params): Promise<Result> {
  // Performs an action/mutation
}
```

## Variable Naming

### Boolean Variables
Use auxiliary verbs: `is*`, `has*`, `should*`, `can*`, `will*`

**Examples:**
- `isLoading`
- `hasError`
- `shouldRetry`
- `canSubmit`
- `willRefresh`

### Array Variables
Use plural nouns

**Examples:**
- `cards`
- `users`
- `items`

### Object Variables
Use singular nouns

**Examples:**
- `user`
- `card`
- `config`

## Type/Interface Naming

### Interfaces
Use PascalCase with descriptive nouns

**Examples:**
- `Card`
- `UserStats`
- `ApiResponse`
- `FeedbackContent`

### Type Aliases
Use PascalCase, prefer interfaces over types when possible

**Examples:**
- `Locale`
- `Translations`

## File Naming

### Components
- React components: `PascalCase.tsx`
- Examples: `ErrorBoundary.tsx`, `Navigation.tsx`

### Utilities
- Utility functions: `camelCase.ts`
- Examples: `dateUtils.ts`, `apiError.ts`

### Services
- Services: `camelCase.ts` with `Service` suffix
- Examples: `cardService.ts`, `accountService.ts`

### Repositories
- Repositories: `kebab-case.repository.ts` or `camelCase.repository.ts`
- Examples: `supabase-card.repository.ts`, `card.repository.ts`

## Constants

### Constants File
- File: `constants.ts`
- Exported constants: `UPPER_SNAKE_CASE`
- Examples: `MAX_PAGE_SIZE`, `DAILY_REVIEW_LIMIT`

## Summary

| Prefix | Meaning | Returns | Throws |
|--------|---------|---------|--------|
| `get*` | May return null | `T \| null` | No |
| `fetch*` | HTTP request | `T` | Yes |
| `getAll*` | Returns array | `T[]` | No |
| `create*` | Factory function | `T` | Maybe |
| `*Card` | Action/mutation | `Promise<Result>` | Yes |

## Migration Notes

When adding new functions, follow these conventions:
1. Use `fetch*` for API client functions that make HTTP requests
2. Use `get*` for functions that may return null
3. Use `getAll*` for functions that return arrays
4. Use `create*` for factory functions
5. Use descriptive action verbs for mutations (`review`, `distribute`, `submit`, etc.)
