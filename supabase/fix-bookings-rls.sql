-- Corrige/re-crea las políticas de la tabla bookings (seguro de correr varias veces)
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'bookings' loop
    execute format('drop policy %I on public.bookings', pol.policyname);
  end loop;
end $$;

create policy "bookings_insert_anon" on public.bookings for insert to anon, authenticated with check (true);
create policy "bookings_admin_select" on public.bookings for select to authenticated using (true);
create policy "bookings_admin_update" on public.bookings for update to authenticated using (true);
create policy "bookings_admin_delete" on public.bookings for delete to authenticated using (true);

grant insert on public.bookings to anon, authenticated;
grant select, update, delete on public.bookings to authenticated;

-- Esto debería mostrar 4 filas (una por política). Copia el resultado si algo sigue fallando.
select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'bookings';
