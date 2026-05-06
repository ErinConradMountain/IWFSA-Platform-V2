drop table if exists notification_preferences;
alter table outbox_message drop constraint if exists outbox_message_channel_check;
alter table outbox_message drop column if exists channel;
alter table outbox_message drop column if exists correlation_id;
alter table outbox_message drop column if exists parent_id;
alter table outbox_message drop column if exists next_retry_at;
alter table outbox_message drop column if exists attempts;
