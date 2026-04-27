-- ============================================
-- Mentoren-Plattform: Supabase Datenbankschema
-- ============================================
-- Dieses SQL im Supabase SQL-Editor ausführen

-- 1. Profiles-Tabelle (erweitert auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'mentee')),
  created_at timestamptz default now()
);

-- Automatisch Profil anlegen wenn User registriert wird
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'mentee')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Aufgaben-Tabelle
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null check (type in ('pages', 'minutes')),
  target_value numeric not null check (target_value > 0),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);


-- 3. Ausgeblendete Aufgaben pro Mentee
create table public.task_hidden (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  mentee_id uuid references public.profiles(id) on delete cascade not null,
  unique(task_id, mentee_id)
);


-- 4. Tägliche Einträge
create table public.task_logs (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  mentee_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  value numeric not null check (value >= 0),
  created_at timestamptz default now(),
  unique(task_id, mentee_id, date)
);


-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_hidden enable row level security;
alter table public.task_logs enable row level security;

-- Hilfsfunktion: Rolle des aktuellen Users
create or replace function public.current_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer stable;


-- profiles: jeder sieht sich selbst; Admin sieht alle
create policy "profiles: eigenes Profil lesen" on public.profiles
  for select using (auth.uid() = id or public.current_role() = 'admin');

create policy "profiles: eigenes Profil updaten" on public.profiles
  for update using (auth.uid() = id);


-- tasks: alle eingeloggten User lesen; nur Admin schreibt
create policy "tasks: alle lesen" on public.tasks
  for select using (auth.uid() is not null);

create policy "tasks: admin schreibt" on public.tasks
  for all using (public.current_role() = 'admin');


-- task_hidden: Admin verwaltet; Mentee liest eigene
create policy "task_hidden: admin verwaltet" on public.task_hidden
  for all using (public.current_role() = 'admin');

create policy "task_hidden: mentee liest eigene" on public.task_hidden
  for select using (mentee_id = auth.uid());


-- task_logs: Mentee schreibt eigene; Admin liest alle
create policy "task_logs: mentee eigene logs" on public.task_logs
  for all using (mentee_id = auth.uid());

create policy "task_logs: admin liest alle" on public.task_logs
  for select using (public.current_role() = 'admin');
