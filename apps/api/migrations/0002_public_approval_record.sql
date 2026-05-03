create table if not exists public_approval_record (
  id text primary key,
  profile_id text not null,
  member_id text not null,
  profile_version text not null,
  requested_at text not null,
  reviewed_by text,
  status text not null check (status in ('pending_review', 'approved', 'published', 'revoked')),
  review_notes_sanitized text not null default '',
  approved_at text,
  revoked_at text,
  correlation_id text not null
);

create index if not exists public_approval_record_status_idx on public_approval_record (status, requested_at);
create index if not exists public_approval_record_profile_idx on public_approval_record (profile_id);
