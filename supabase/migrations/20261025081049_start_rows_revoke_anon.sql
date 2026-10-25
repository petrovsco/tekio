-- Supabase grants execute on new public functions to anon by default, which
-- the revoke from public in start_rows did not reach. Nobody signed out opens
-- the app, so only authenticated callers keep it.

revoke execute on function public.start_rows() from anon;
