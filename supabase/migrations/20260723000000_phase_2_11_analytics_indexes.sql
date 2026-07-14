-- Phase 2.11: bounded analytics filter/index support. No clinical content is materialized.
create index if not exists appointments_analytics_period_status_idx on public.appointments(starts_at,status);
create index if not exists appointments_analytics_source_service_idx on public.appointments(source,service_key,starts_at);
create index if not exists appointments_analytics_assignee_period_idx on public.appointments(assigned_user_id,starts_at) where assigned_user_id is not null;
create index if not exists examinations_analytics_created_status_idx on public.examinations(created_at,status);
create index if not exists generated_documents_analytics_generated_status_idx on public.generated_documents(generated_at,status);
create index if not exists reminders_analytics_created_status_idx on public.reminders(created_at,status);
create index if not exists vaccination_records_analytics_due_idx on public.vaccination_records(next_due_date,status) where archived_at is null;
create index if not exists parasite_records_analytics_due_idx on public.parasite_records(next_due_date,status) where archived_at is null;
