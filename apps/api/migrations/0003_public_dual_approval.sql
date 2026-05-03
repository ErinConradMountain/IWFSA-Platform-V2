alter table public_approval_record add column if not exists content_type text not null default 'profile';
alter table public_approval_record add column if not exists requires_dual_approval boolean not null default false;
alter table public_approval_record add column if not exists final_approved_by text;
alter table public_approval_record add column if not exists final_approved_at text;
