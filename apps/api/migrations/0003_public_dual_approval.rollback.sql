alter table public_approval_record drop column if exists final_approved_at;
alter table public_approval_record drop column if exists final_approved_by;
alter table public_approval_record drop column if exists requires_dual_approval;
alter table public_approval_record drop column if exists content_type;
