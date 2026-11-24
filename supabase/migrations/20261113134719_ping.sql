create function public.ping()
returns boolean
language sql
stable
set search_path = ''
as $$
  select true;
$$;

revoke all on function public.ping() from public, anon, authenticated;
grant execute on function public.ping() to anon;