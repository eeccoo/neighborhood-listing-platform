-- Restrict authenticated inquiry updates to the status column.
-- RLS controls eligible rows; column privileges control eligible fields.

revoke update on public.inquiries from authenticated;

grant update (status)
on public.inquiries
to authenticated;