-- Public bucket for the Vite SPA (JS/CSS/images). HTML is served by Edge Function `app`.

insert into storage.buckets (id, name, public)
values ('site', 'site', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "site_select_public" on storage.objects;
create policy "site_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'site');
