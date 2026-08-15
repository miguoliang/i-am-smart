-- Anonymous sign-ins use the authenticated role. The previous operator_logs
-- policy was USING true for public, which would leak logs to any anon session.

drop policy if exists "Service role full access" on public.operator_logs;

drop policy if exists "operator_logs_operators_only" on public.operator_logs;
create policy "operator_logs_operators_only"
  on public.operator_logs
  for all
  to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
  )
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
  );
