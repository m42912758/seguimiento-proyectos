-- Fase 1: catálogos (tipos de trabajo, clientes, materiales, empleados, vehículos, combustible).
-- Correr una sola vez en Supabase → SQL Editor.

-- tipos_trabajo -------------------------------------------------------------
create table public.tipos_trabajo (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, nombre)
);

-- clientes ------------------------------------------------------------------
create table public.clientes (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  cuit text,
  condicion_iva text not null default 'responsable_inscripto'
    check (condicion_iva in ('responsable_inscripto', 'monotributo', 'exento', 'consumidor_final')),
  telefono text,
  email text,
  direccion text,
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- materiales ----------------------------------------------------------------
create table public.materiales (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descripcion text not null,
  unidad text not null default 'u',
  precio numeric(14,2) not null default 0 check (precio >= 0), -- sin IVA
  alicuota_iva numeric(4,2) not null default 21 check (alicuota_iva in (21, 10.5)),
  proveedor text,
  fecha_precio date not null default current_date,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- empleados -----------------------------------------------------------------
create table public.empleados (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  categoria text,
  costo_hora numeric(14,2) not null default 0 check (costo_hora >= 0),   -- sueldo + cargas
  tarifa_hora numeric(14,2) not null default 0 check (tarifa_hora >= 0), -- lo que se cobra
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- vehiculos -----------------------------------------------------------------
create table public.vehiculos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  patente text,
  consumo_l_100km numeric(6,2) check (consumo_l_100km >= 0),
  precio_litro numeric(14,2) check (precio_litro >= 0),
  mantenimiento_anual numeric(14,2) check (mantenimiento_anual >= 0),
  km_por_anio integer check (km_por_anio > 0),
  valor_compra numeric(14,2) check (valor_compra >= 0),
  valor_reventa numeric(14,2) check (valor_reventa >= 0),
  km_vida_util integer check (km_vida_util > 0),
  costo_por_km numeric(14,2) not null default 0 check (costo_por_km >= 0), -- resultado guardado de la calculadora
  fecha_costo date not null default current_date,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- precios_combustible -------------------------------------------------------
create table public.precios_combustible (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null default current_date,
  tipo text not null, -- ej. nafta súper, gasoil
  precio_litro numeric(14,2) not null check (precio_litro > 0),
  created_at timestamptz not null default now()
);

-- Seguridad: cada fila solo la ve y la modifica su dueño --------------------
do $$
declare
  t text;
begin
  foreach t in array array['tipos_trabajo', 'clientes', 'materiales', 'empleados', 'vehiculos', 'precios_combustible']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "solo el dueño" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)',
      t
    );
  end loop;
end $$;

-- Tipos de trabajo iniciales para el único usuario --------------------------
insert into public.tipos_trabajo (user_id, nombre)
select u.id, n.nombre
from (select id from auth.users order by created_at limit 1) u
cross join (values ('Tableros'), ('Iluminación'), ('Mantenimiento'), ('Instalaciones')) as n (nombre);
