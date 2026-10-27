-- Found by Supabase's security advisor on the first real run: the trigger function that keeps the audit log
-- append-only had no pinned search_path. Pin it like every other function.
alter function private.audit_log_is_append_only() set search_path = '';
