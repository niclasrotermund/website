-- Website niclasrotermund.com: Tabelle, Zugriffsregeln und Foto-Speicher.
-- Einmal im Supabase SQL Editor des Tourbuch-Projekts ausführen. Kann gefahrlos mehrfach laufen.
-- Ändert nichts an den Tourbuch-Tabellen.

-- Wer darf die Website bearbeiten? Der Hauptadmin des Tourbuchs (das erste Konto).
-- Fällt auf "Besitzer" zurück, falls 004_hauptadmin.sql nie gelaufen ist.
create or replace function public.site_admin() returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  begin
    return public.is_main_admin();
  exception when undefined_function then
    return coalesce((select user_id = auth.uid() from public.members where role = 'owner' order by created_at, user_id limit 1), false);
  end;
end $$;
grant execute on function public.site_admin() to anon, authenticated;

-- Alle Inhalte der Website als Dokumente (Shows, Venues, Artists, Videos, Fotos, Einstellungen).
-- Alles unter private/ (Gagen, Verträge, Kontakte) sieht nur der Admin.
create table if not exists public.site_docs (
  path text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_docs enable row level security;

drop policy if exists site_docs_read on public.site_docs;
create policy site_docs_read on public.site_docs for select
  using (path not like 'private/%' or public.site_admin());
drop policy if exists site_docs_insert on public.site_docs;
create policy site_docs_insert on public.site_docs for insert with check (public.site_admin());
drop policy if exists site_docs_update on public.site_docs;
create policy site_docs_update on public.site_docs for update using (public.site_admin()) with check (public.site_admin());
drop policy if exists site_docs_delete on public.site_docs;
create policy site_docs_delete on public.site_docs for delete using (public.site_admin());

grant select on public.site_docs to anon, authenticated;
grant insert, update, delete on public.site_docs to authenticated;

-- Live-Updates im internen Bereich
do $$ begin
  alter publication supabase_realtime add table public.site_docs;
exception when duplicate_object then null; when undefined_object then null;
end $$;

-- Foto-Speicher: öffentlich lesbar, hochladen und löschen nur der Admin
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('website', 'website', true, 15728640, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists website_files_admin on storage.objects;
create policy website_files_admin on storage.objects for all to authenticated
  using (bucket_id = 'website' and public.site_admin())
  with check (bucket_id = 'website' and public.site_admin());
