do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_available_extensions
    where name = 'pg_cron'
  ) then
    execute 'create extension if not exists pg_cron';
    perform cron.schedule(
      'versus-expire-overdue-orders',
      '* * * * *',
      'select public.expire_overdue_orders();'
    );
  else
    raise notice 'pg_cron unavailable; orders will expire lazily on access.';
  end if;
end;
$$;
