alter table outbox_message add column if not exists attempts integer not null default 0;
alter table outbox_message add column if not exists next_retry_at text;
alter table outbox_message add column if not exists correlation_id text;
alter table outbox_message add column if not exists parent_id text;
alter table outbox_message add column if not exists channel text;
update outbox_message set channel = 'email' where channel is null;
alter table outbox_message alter column channel set not null;
alter table outbox_message drop constraint if exists outbox_message_channel_check;
alter table outbox_message add constraint outbox_message_channel_check check (channel in ('email', 'in_app', 'sms'));

create table if not exists notification_preferences (
  member_id text primary key references member_account(id),
  consent_scope_year integer not null,
  preferences_json text not null,
  updated_at text not null
);
