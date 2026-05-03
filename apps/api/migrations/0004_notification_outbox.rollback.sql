drop table if exists notification_preferences;
alter table outbox_message drop column if exists correlation_id;
alter table outbox_message drop column if exists next_retry_at;
alter table outbox_message drop column if exists attempts;
