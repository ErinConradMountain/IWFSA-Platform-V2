alter table outbox_message add column if not exists attempts integer not null default 0;
alter table outbox_message add column if not exists next_retry_at text;
alter table outbox_message add column if not exists correlation_id text;

create table if not exists notification_preferences (
  member_id text primary key references member_account(id),
  consent_scope_year integer not null,
  preferences_json text not null,
  updated_at text not null
);
