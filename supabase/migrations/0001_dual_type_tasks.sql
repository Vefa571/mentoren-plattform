-- Migration: tasks können jetzt sowohl Seiten- als auch Minutenziel haben.
-- Mentee wählt pro Tag, in welcher Einheit geloggt wird; task_logs.type speichert die Wahl.

alter table public.tasks add column if not exists target_pages numeric check (target_pages > 0);
alter table public.tasks add column if not exists target_minutes numeric check (target_minutes > 0);

update public.tasks set target_pages   = target_value where type = 'pages'   and target_pages   is null;
update public.tasks set target_minutes = target_value where type = 'minutes' and target_minutes is null;

alter table public.tasks alter column type drop not null;
alter table public.tasks alter column target_value drop not null;

alter table public.tasks
  add constraint tasks_at_least_one_target check (
    target_pages is not null or target_minutes is not null or target_value is not null
  );

alter table public.task_logs add column if not exists type text check (type in ('pages', 'minutes'));

update public.task_logs
   set type = (select type from public.tasks where id = task_logs.task_id)
 where type is null;
