-- ============================================================================
-- Mashita Barber — esquema completo de Supabase
-- Pega este script completo en Supabase → SQL Editor → New query → Run
-- Es seguro volver a ejecutarlo (usa IF NOT EXISTS / ON CONFLICT donde aplica).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- SETTINGS: fila única con horario de atención y perfil del barbero
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  id int primary key default 1,
  start_hour int not null default 10,
  end_hour int not null default 19,
  closed_days int[] not null default '{0,1}', -- 0=Domingo, 1=Lunes ... 6=Sábado
  barber_name text not null default 'Mashita',
  barber_bio text not null default 'Especialista en fades de piel, diseños freestyle y estilos urbanos. Más de 8 años perfeccionando el oficio.',
  barber_tags text[] not null default '{#SkinFade,#DiseñoFreestyle,#BarbaPerfilada,#EstiloUrbano}',
  barber_photo_url text default 'https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?w=900&q=80&auto=format&fit=crop',
  bank_info jsonb not null default '{"bank":"Banco Estado","accountType":"Cuenta Corriente","accountNumber":"123-4567-8900","holder":"Mashita Barber SpA","rut":"77.111.222-3","email":"pagos@mashitabarber.cl"}'::jsonb,
  constraint settings_single_row check (id = 1)
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- BLOCKED_DATES: días puntuales cerrados (feriados, vacaciones) además del horario semanal
-- ----------------------------------------------------------------------------
create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text
);

-- ----------------------------------------------------------------------------
-- SERVICES
-- ----------------------------------------------------------------------------
create table if not exists public.services (
  id text primary key,
  name text not null,
  description text not null,
  price int not null,
  duration int not null,
  icon text,
  photo_url text,
  sort_order int not null default 0
);

insert into public.services (id,name,description,price,duration,icon,sort_order) values
  ('clasico','Corte Clásico','Corte tradicional con tijera y máquina, acabado prolijo.',12000,30,'✂️',1),
  ('fade','Fade / Degradado','Degradado preciso en piel o media piel, estilo urbano.',15000,45,'🌀',2),
  ('diseno','Diseño Freestyle','Líneas y diseños personalizados sobre fade.',18000,60,'⚡',3),
  ('barba','Barba + Perfilado','Perfilado de barba con navaja y toalla caliente.',9000,30,'🪒',4),
  ('combo','Combo Corte + Barba','El paquete completo: corte moderno + barba perfilada.',20000,75,'🔥',5),
  ('color','Color / Mechas','Coloración, mechas o platinado para un look único.',25000,90,'🎨',6)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- GALLERY
-- ----------------------------------------------------------------------------
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  photo_url text not null,
  sort_order int not null default 0
);

insert into public.gallery (label, photo_url, sort_order)
select * from (values
  ('Skin Fade','https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=600&q=80&auto=format&fit=crop',1),
  ('Diseño Freestyle','https://images.unsplash.com/photo-1568339434343-2a640a1a9946?w=600&q=80&auto=format&fit=crop',2),
  ('Corte + Barba','https://images.unsplash.com/photo-1599011176306-4a96f1516d4d?w=600&q=80&auto=format&fit=crop',3),
  ('Degradado Bajo','https://images.unsplash.com/photo-1599834562135-b6fc90e642ca?w=600&q=80&auto=format&fit=crop',4),
  ('Textura Natural','https://images.unsplash.com/photo-1635273051937-a0ddef9573b6?w=600&q=80&auto=format&fit=crop',5),
  ('Línea Definida','https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80&auto=format&fit=crop',6),
  ('Fade Alto','https://images.unsplash.com/photo-1657105052497-f996284ffff8?w=600&q=80&auto=format&fit=crop',7),
  ('Estilo Urbano','https://images.unsplash.com/photo-1647140655214-e4a2d914971f?w=600&q=80&auto=format&fit=crop',8)
) as v(label, photo_url, sort_order)
where not exists (select 1 from public.gallery);

-- ----------------------------------------------------------------------------
-- BOOKINGS
-- ----------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  service_id text references public.services(id),
  service_name text not null,
  duration int not null,
  price int not null,
  amount_paid int not null default 0,
  date date not null,
  time text not null,
  customer_name text not null,
  phone text not null,
  email text not null,
  notes text,
  reminder boolean not null default true,
  pay_mode text,
  pay_method text,
  payment_status text not null default 'Pendiente',
  status text not null default 'confirmada',
  created_at timestamptz not null default now()
);

-- Vista pública SIN datos personales (para calcular horas disponibles sin exponer clientes)
create or replace view public.bookings_public as
  select date, time, duration from public.bookings where status <> 'cancelada';

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.services enable row level security;
alter table public.gallery enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "settings_read_all" on public.settings;
create policy "settings_read_all" on public.settings for select using (true);
drop policy if exists "settings_write_admin" on public.settings;
create policy "settings_write_admin" on public.settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "blocked_dates_read_all" on public.blocked_dates;
create policy "blocked_dates_read_all" on public.blocked_dates for select using (true);
drop policy if exists "blocked_dates_write_admin" on public.blocked_dates;
create policy "blocked_dates_write_admin" on public.blocked_dates for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "services_read_all" on public.services;
create policy "services_read_all" on public.services for select using (true);
drop policy if exists "services_write_admin" on public.services;
create policy "services_write_admin" on public.services for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "gallery_read_all" on public.gallery;
create policy "gallery_read_all" on public.gallery for select using (true);
drop policy if exists "gallery_write_admin" on public.gallery;
create policy "gallery_write_admin" on public.gallery for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "bookings_insert_anon" on public.bookings;
create policy "bookings_insert_anon" on public.bookings for insert with check (true);
drop policy if exists "bookings_admin_select" on public.bookings;
create policy "bookings_admin_select" on public.bookings for select using (auth.role() = 'authenticated');
drop policy if exists "bookings_admin_update" on public.bookings;
create policy "bookings_admin_update" on public.bookings for update using (auth.role() = 'authenticated');
drop policy if exists "bookings_admin_delete" on public.bookings;
create policy "bookings_admin_delete" on public.bookings for delete using (auth.role() = 'authenticated');

grant select on public.settings, public.blocked_dates, public.services, public.gallery, public.bookings_public to anon, authenticated;
grant insert on public.bookings to anon, authenticated;
grant select, update, delete on public.bookings to authenticated;
grant all on public.settings, public.blocked_dates, public.services, public.gallery to authenticated;

-- ----------------------------------------------------------------------------
-- STORAGE: bucket público "photos" para fotos de servicios, barbero y galería
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "photos_admin_insert" on storage.objects;
create policy "photos_admin_insert" on storage.objects for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');
drop policy if exists "photos_admin_update" on storage.objects;
create policy "photos_admin_update" on storage.objects for update using (bucket_id = 'photos' and auth.role() = 'authenticated');
drop policy if exists "photos_admin_delete" on storage.objects;
create policy "photos_admin_delete" on storage.objects for delete using (bucket_id = 'photos' and auth.role() = 'authenticated');

-- ============================================================================
-- Listo. Después de correr esto:
-- 1. Ve a Authentication → Users → Add user, crea tu usuario admin
--    (marca "Auto Confirm User" para no necesitar verificar email).
-- 2. Ve a Settings → API y copia "Project URL" y "anon public" key.
-- 3. Pégalos en js/config.js del proyecto.
-- ============================================================================
