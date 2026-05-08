-- Migration: Legende-Einträge können jetzt mehrere Mindestwerte pro Zeile haben
-- (parallel zu tasks.target_pages/target_minutes).
-- Alte Spalten min_value + unit bleiben nullable bestehen für Backward-Compat.

alter table public.legend_entries add column if not exists min_pages numeric check (min_pages >= 0);
alter table public.legend_entries add column if not exists min_minutes numeric check (min_minutes >= 0);
alter table public.legend_entries add column if not exists min_count numeric check (min_count >= 0);

-- Bestandsdaten in die neuen Spalten übernehmen
update public.legend_entries
   set min_pages = min_value
 where unit = 'pages' and min_pages is null and min_value is not null;

update public.legend_entries
   set min_minutes = min_value
 where unit = 'minutes' and min_minutes is null and min_value is not null;

update public.legend_entries
   set min_count = min_value
 where unit = 'count' and min_count is null and min_value is not null;
