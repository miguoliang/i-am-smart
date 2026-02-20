# Operator Dashboard P0 Plan

## Overview
Enhance the operator dashboard (`/operator`) with three P0 features: Dashboard metrics, Order management, and Account management improvements.

## Current Architecture
- **Auth**: `useOperatorAuth()` hook checks `app_metadata.role === 'operator'` client-side; `requireOperator()` middleware for API routes
- **Services**: Repository pattern — `lib/repositories/` (interfaces) → `lib/repositories/implementations/` (Supabase) → `lib/services/` → `lib/services/factory.ts`
- **API**: Route handlers in `app/api/`, use `requireAuth()` or `requireOperator()`
- **Admin client**: `createSupabaseAdmin()` for service-role operations
- **UI**: Existing components in `app/operator/components/`, uses `DataTable` from `components/table/DataTable`, `@tanstack/react-query`, `@tanstack/react-table`, `lucide-react`, `sonner` for toasts
- **Existing tables**: `pay_orders` (has `out_trade_no`, `status`, `amount_total`, `description`, `paid_at`, `account_id`, `channel`), `account_cards`, `knowledges`, `card_types`

## Branch
Create branch `feat/operator-p0` from `main`.

## Task 1: Dashboard (仪表盘)

### 1.1 Backend — API Route
Create `app/api/operator/dashboard/route.ts`:
- Use `requireOperator(req)` for auth
- Use `createSupabaseAdmin()` for queries
- Return JSON:
```ts
{
  todayRegistrations: number,    // auth.admin.listUsers filtered by created_at today
  totalUsers: number,            // count from auth
  todayReviews: number,          // count from account_cards where updated_at is today and repetitions > 0
  todayRevenue: number,          // sum(amount_total) from pay_orders where status='paid' and paid_at is today
  trends: {
    registrations: { date: string, count: number }[],  // last 30 days
    reviews: { date: string, count: number }[],         // last 30 days
    revenue: { date: string, amount: number }[],        // last 30 days
  }
}
```

**Implementation notes:**
- For `todayRegistrations` and `totalUsers`: use `adminClient.auth.admin.listUsers()` — paginate to count, or use a Supabase RPC if available. Alternatively, query the `auth.users` table via RPC for efficiency.
- For `todayReviews`: query `account_cards` table — count rows where `updated_at >= today_start` and `repetitions > 0`
- For `todayRevenue`: query `pay_orders` — sum `amount_total` where `status = 'paid'` and `paid_at >= today_start`
- For trends: group by date for last 30 days. Use Supabase RPC functions if raw SQL grouping is needed.
- Timezone: accept `?offset=` query param (minutes, same pattern as existing stats API)

**RPC functions needed** (create migration or document for Frank):
- `get_dashboard_stats(p_tz_offset int)` — returns today's metrics + 30-day trends in one call for efficiency

### 1.2 Frontend — Dashboard Page
Replace empty `app/operator/page.tsx`:
- Fetch from `/api/operator/dashboard` using `useQuery`
- **Metric cards** (top row, 4 cards): 今日注册, 总用户数, 今日复习量, 今日收入(¥)
- **Trend charts** (below): Use a lightweight chart — either raw SVG/CSS bar charts or add `recharts` (already common in Next.js projects). Show 30-day bar/line charts for registrations, reviews, revenue.
- Loading skeleton while fetching

### 1.3 Client API helper
Create `lib/api/operator.ts`:
```ts
export async function fetchDashboard(offset: number) { ... }
export async function fetchOrders(params: OrderQueryParams) { ... }
```

## Task 2: Order Management (订单管理)

### 2.1 Backend — API Route
Create `app/api/operator/orders/route.ts`:
- `GET` — list orders with filters
- Use `requireOperator(req)`
- Use `createSupabaseAdmin()` to query `pay_orders`
- Query params: `page`, `perPage`, `status` (pending/paid/failed/all), `channel` (wechat/alipay/all), `startDate`, `endDate`
- Return: `{ orders: Order[], total: number, summary: { totalAmount: number, count: number } }`
- Order fields: `out_trade_no`, `status`, `amount_total`, `description`, `channel`, `account_id`, `created_at`, `paid_at`
- Join with user info (username) if possible, or return account_id for client-side resolution

### 2.2 Frontend — Orders Page
Create `app/operator/orders/page.tsx`:
- Filter bar: status dropdown, channel dropdown, date range
- DataTable with columns: 订单号, 用户, 金额, 支付方式, 状态, 创建时间, 支付时间
- Status badges: pending=yellow, paid=green, failed=red
- Summary row at top: total revenue + order count for current filter
- Pagination via `Paginator` component

### 2.3 Sidebar Update
Add orders entry to `Sidebar.tsx`:
```ts
{ href: "/operator/orders", label: "订单管理", icon: "💰" },
```

## Task 3: Account Management Enhancement (账户管理增强)

### 3.1 Backend — API Routes
Enhance `app/api/accounts/route.ts` or create new operator-specific routes:

**a) Search** — Add `?search=` param to existing accounts list API (search by username/email)

**b) User detail** — Create `app/api/operator/accounts/[id]/route.ts`:
- `GET` — return user profile + stats (total cards, mastered, learning, due today, total reviews) + recent orders
- Use `requireOperator(req)`

**c) Ban/unban** — Create `app/api/operator/accounts/[id]/ban/route.ts`:
- `POST` — ban user: `adminClient.auth.admin.updateUserById(id, { ban_duration: 'none' | '876000h' })`
- Use `requireOperator(req)`
- Body: `{ banned: boolean }`

### 3.2 Frontend — Accounts Page Enhancement
Modify `app/operator/accounts/page.tsx`:
- Add search input (debounced, 300ms)
- Add "查看详情" button per row → opens detail dialog or navigates to detail page
- Add "封禁/解封" button per row (with confirmation dialog)
- User detail dialog/page: show profile info, learning stats, recent orders

### 3.3 User Detail Page (optional — dialog may suffice)
Create `app/operator/accounts/[id]/page.tsx` if a full page is preferred over dialog.

## File Structure (new files)
```
apps/pwa/src/
├── app/
│   ├── api/
│   │   └── operator/
│   │       ├── dashboard/route.ts
│   │       ├── orders/route.ts
│   │       └── accounts/
│   │           └── [id]/
│   │               ├── route.ts        (user detail)
│   │               └── ban/route.ts    (ban/unban)
│   └── operator/
│       ├── page.tsx                     (replace empty dashboard)
│       └── orders/
│           └── page.tsx                 (new)
├── lib/
│   └── api/
│       └── operator.ts                 (client-side fetch helpers)
```

## Dependencies
- Consider adding `recharts` for dashboard charts: `pnpm --filter @i-am-smart/pwa add recharts`
- Everything else uses existing deps (`@tanstack/react-query`, `@tanstack/react-table`, `lucide-react`, `sonner`)

## Database Considerations
- `pay_orders` table already exists with needed fields
- May need a Supabase RPC `get_dashboard_stats` for efficient aggregation — if not feasible, do multiple queries
- For user search: Supabase auth admin API doesn't support search natively — may need to iterate or use a custom `auth.users` view/RPC
- Ban uses Supabase built-in `ban_duration` field on auth.users

## Testing
- API routes: ensure `requireOperator` rejects non-operator users
- Dashboard: verify metrics match manual DB queries
- Orders: verify pagination, filtering, amount calculations

## Execution Order
1. Task 2 (Orders) — most self-contained, new pages/routes only
2. Task 3 (Accounts enhancement) — modifies existing page
3. Task 1 (Dashboard) — depends on understanding data shape, may need RPC

Start with Task 2, then Task 3, then Task 1.
