create table if not exists member_account (
  id text primary key,
  email_hash text not null unique,
  auth_state text not null check (auth_state in ('pending_activation', 'active', 'locked')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists member_profile (
  member_id text primary key references member_account(id),
  display_name text not null,
  biography text not null default '',
  visibility text not null check (visibility in ('hidden', 'member_only', 'public')),
  consent text not null check (consent in ('granted', 'missing', 'revoked', 'not_required')),
  approved_for_public boolean not null default false,
  updated_at timestamptz not null
);

create table if not exists membership_status (
  id bigserial primary key,
  member_id text not null references member_account(id),
  standing text not null check (standing in ('active', 'good', 'review', 'grace', 'outstanding', 'blocked')),
  effective_at timestamptz not null,
  issuer text not null
);

create index if not exists membership_status_member_effective_idx on membership_status(member_id, effective_at desc);

create table if not exists activation_token (
  token_hash text primary key,
  member_id text not null references member_account(id),
  purpose text not null check (purpose in ('activation', 'reset')),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists import_batch (
  id text primary key,
  source_checksum text not null,
  state text not null check (state in ('preview', 'committed', 'failed')),
  row_count integer not null check (row_count >= 0),
  created_at timestamptz not null,
  committed_at timestamptz
);

create table if not exists import_batch_row (
  batch_id text not null references import_batch(id),
  row_number integer not null,
  source_key text not null,
  verified_email_hash text,
  display_name text not null,
  action text not null check (action in ('create', 'update', 'skip', 'fail')),
  issues jsonb not null,
  raw_snapshot_hash text not null,
  primary key (batch_id, row_number)
);

create table if not exists outbox_message (
  id text primary key,
  event_type text not null,
  payload_ref text not null,
  state text not null check (state in ('pending', 'sent', 'failed')),
  created_at timestamptz not null
);

create table if not exists event (
  id text primary key,
  title text not null,
  status text not null check (status in ('draft', 'published', 'closed', 'archived')),
  max_capacity integer not null check (max_capacity >= 0),
  registered_count integer not null default 0 check (registered_count >= 0),
  waitlist_count integer not null default 0 check (waitlist_count >= 0),
  audience_rules jsonb not null,
  version integer not null default 0
);

create table if not exists rsvp_record (
  event_id text not null references event(id),
  member_id text not null references member_account(id),
  state text not null check (state in ('registered', 'waitlisted', 'cancelled')),
  waitlist_position integer,
  created_at timestamptz not null,
  primary key (event_id, member_id)
);

create index if not exists rsvp_record_waitlist_idx on rsvp_record(event_id, waitlist_position) where state = 'waitlisted';

create table if not exists document_access (
  token_hash text primary key,
  event_id text not null references event(id),
  member_id text not null references member_account(id),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists membership_year (
  id text primary key,
  label text not null,
  start_date date not null,
  end_date date not null,
  grace_period_days integer not null check (grace_period_days >= 0),
  status text not null check (status in ('open', 'closed')),
  exclude using gist (daterange(start_date, end_date, '[]') with &&) where (status = 'open')
);

create table if not exists fee_record (
  id text primary key,
  member_id text not null references member_account(id),
  membership_year_id text not null references membership_year(id),
  type text not null check (type in ('dues', 'waiver', 'event_fee')),
  amount_cents integer not null check (amount_cents >= 0),
  amount_paid_cents integer not null default 0 check (amount_paid_cents >= 0),
  status text not null check (status in ('pending', 'partial', 'paid', 'waived')),
  transaction_ref text,
  waiver_reason text,
  recorded_at timestamptz not null
);

create table if not exists standing_history (
  id bigserial primary key,
  member_id text not null references member_account(id),
  standing text not null check (standing in ('active', 'good', 'review', 'grace', 'outstanding', 'blocked')),
  reason text not null,
  effective_from timestamptz not null,
  actor_id text not null
);

create table if not exists app_session (
  token text primary key,
  role text,
  subject text not null,
  standing text not null,
  consent text not null,
  created_at timestamptz not null,
  created_at_ms bigint not null,
  rotated_at timestamptz,
  expires_at_ms bigint not null,
  csrf_token_hash text
);

create table if not exists audit_event (
  id bigserial primary key,
  action text not null,
  actor text not null,
  target_type text not null,
  target_id text not null,
  timestamp timestamptz not null,
  correlation_id text not null,
  redacted_metadata jsonb not null,
  metadata_hash text not null
);

create index if not exists audit_event_correlation_idx on audit_event(correlation_id);

create or replace rule audit_event_no_update as on update to audit_event do instead nothing;
create or replace rule audit_event_no_delete as on delete to audit_event do instead nothing;
