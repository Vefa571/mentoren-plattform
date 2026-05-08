-- Migration: Legende — vom Admin gepflegte Mindestziel-Liste, unabhängig von tasks.
-- Mentees sehen die Legende read-only, Admin kann CRUD ausführen.

create table if not exists public.legend_entries (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  min_value numeric check (min_value >= 0),
  unit text check (unit in ('pages', 'minutes', 'count')),
  sort_order int not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.legend_entries enable row level security;

create policy "legend: alle eingeloggten lesen" on public.legend_entries
  for select using (auth.uid() is not null);

create policy "legend: admin schreibt" on public.legend_entries
  for all using (public.current_role() = 'admin');
