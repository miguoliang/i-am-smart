# System Architecture

## 1\. System Overview

### High-Level Design

The system is a full-stack web application built with **Next.js**, utilizing **Supabase** for the backend-as-a-service (BaaS) layer. It leverages Server-Side Rendering (SSR) and React Server Components (RSC) for performance, with a client-side Single Page Application (SPA) experience for interactive learning features.

### Key Components

*   **Framework**: Next.js 15+ (App Router).
*   **Database & Auth**: Supabase (PostgreSQL + GoTrue).
*   **Frontend**: React-based UI with Tailwind CSS and Radix UI.
*   **State Management**: TanStack Query for server state synchronization.

---

## 2\. Domain & Data Design

### 2.1 Database Schema

The database relies on PostgreSQL hosted by Supabase.

#### Core Tables

*   `knowledge`: The central content entity.
    *   `code` (PK): Immutable identifier (e.g., `ST-0000001`) generated via **Database Triggers**.
    *   `metadata` (JSONB): Flexible attributes.
*   `card_types`: Definitions of learning patterns.
*   `accounts`: User identities (managed by Supabase Auth).
*   `account_cards`: Intersection of Account + Knowledge + CardType. Tracks SM-2 state.
*   `review_history`: Immutable log of all reviews for analytics.

#### ER Diagram (Conceptual)

```mermaid
erDiagram
    Account ||--o{ AccountCard : "tracks progress for"
    Knowledge ||--o{ AccountCard : "is subject of"
    CardType ||--o{ AccountCard : "defines format of"
    AccountCard ||--o{ ReviewHistory : "logs history"
```

### 2.2 Data Types & Standards

*   **Codes**:
    *   `ST`: Standard (default).
    *   `CS`: Case Study (Reserved for future).
    *   *Implementation*: Handled by PostgreSQL `BEFORE INSERT` triggers.
*   **Timestamps**: All stored in UTC (`TIMESTAMPTZ`).

---

## 3\. Application Architecture

### 3.1 Backend Layers (Layered Architecture)

The backend follows a strict layered architecture to separate concerns and ensure testability (Dependency Inversion Principle).

1.  **Route Handlers (**`src/app/api/`):
    *   **Role**: API Gateway & Controller.
    *   **Responsibility**: Auth checks, request parsing, response formatting.
    *   **Dependency**: Calls **Services** (injected via Factory).
2.  **Service Layer (**`src/lib/services/`):
    *   **Role**: Business Logic.
    *   **Responsibility**: Implements core domain logic (e.g., SM-2 algorithm, account management).
    *   **Dependency**: Depends on **Repository Interfaces** (Domain Layer), not concrete implementations.
3.  **Repository Layer (**`src/lib/repositories/`):
    *   **Role**: Data Access.
    *   **Responsibility**: Abstraction over the database (Supabase).
    *   **Implementation**: `SupabaseCardRepository`, `SupabaseAccountRepository`, etc.
4.  **Supabase Client (**`src/lib/supabaseServer.ts`):
    *   **Role**: Database Driver.
    *   **Responsibility**: Used only within Repository implementations for SQL/RPC execution.

### 3.2 Frontend Architecture

*   **Framework**: React + Vite (via Next.js) + TypeScript.
*   **State Management**: TanStack Query (React Query).
*   **UI Components**: Radix UI + Tailwind CSS (Shadcn-like structure).
    *   **Accessibility**: WCAG 2.1 AA Compliant (Keyboard navigation, ARIA labels, Focus management).
*   **Auth**: Supabase Auth helpers for Next.js.

### 3.3 Learner Workflows

1.  **Daily Review**:
    *   **Endpoint**: `GET /api/accounts/me/cards/due`
    *   **Logic**: Service calls Repository to query `account_cards` where `next_review_date <= NOW()`.
2.  **Card Review**:
    *   **Endpoint**: `POST /api/cards/{id}/review`
    *   **Logic**:
        *   Service calculates new SM-2 state.
        *   Repository executes **Transactional RPC** (`review_card`) to atomically update card state and insert review history.

### 3.4 Operator Workflows

1.  **Knowledge Management**:
    *   **Direct Access**: Operators have write access to the `knowledge` table.
    *   **Import**: Bulk creation via CSV upload.
    *   **Endpoint**: `POST /api/knowledge` (Bulk/Single create).
    *   **Logic**:
        *   Accepts JSON payload of words.
        *   Performs `UPSERT` on the `knowledge` table.
        *   DB Triggers assign `code` for new entries.

---

## 4\. Key Design Patterns

### 4.1 Immutable Code Generation

*   **Mechanism**: Database Triggers.
*   **Logic**: On `INSERT`, if `code` is null, generate from a sequence (e.g., `ST-` prefix + sequence number).

### 4.2 Spaced Repetition (SM-2)

*   **Logic**: Implemented in Service Layer (`cardService.ts`).
*   **State**: Persisted in `account_cards`.

---

## 5\. Security & Access Control

### 5.1 Authentication

*   **Provider**: Supabase Auth.
*   **Mechanism**: JWT + Cookie Session.
*   **Roles**: Managed via `user_metadata` or separate `profiles` table logic (currently `user_metadata.role`).

### 5.2 Authorization

*   **RBAC**:
    *   `client`: Read-only access to content, Write access to own `account_cards`.
    *   `operator`: Write access to `knowledge` table.

### 5.3 Defense in Depth

*   **Input Sanitization**:
    *   **Mechanism**: Server-side HTML sanitization using `dompurify` (`src/lib/utils/sanitize.ts`).
    *   **Scope**: All user-generated content (e.g., feedback) is sanitized before storage to prevent XSS.
*   **Platform Security**:
    *   **CORS**: Configured per deployment environment.
    *   **Rate Limiting**: Configured per deployment environment.

---

## 6\. Deployment & Operations

*   **Platform**: GitHub Actions → SSH/SCP + PM2 on own server. See [deploy.md](deploy.md).
*   **Database**: Supabase Cloud.
*   **Configuration**: Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, etc.).