-- Fase 2: proyectos, cotizaciones y sus ítems.
-- Correr una sola vez en Supabase → SQL Editor, después de 0002.

-- proyectos -----------------------------------------------------------------
-- Cada trabajo nace como proyecto en estado "cotizando" con su primera
-- cotización; al aceptarse una versión pasa a "aceptado".
create table public.proyectos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  codigo text not null, -- P-0001, P-0002…
  nombre text not null,
  cliente_id bigint not null references public.clientes (id),
  tipo_trabajo_id bigint references public.tipos_trabajo (id),
  estado text not null default 'cotizando'
    check (estado in ('cotizando', 'aceptado', 'rechazado', 'en_ejecucion', 'finalizado', 'cerrado')),
  direccion text,
  fecha_inicio_plan date,
  fecha_fin_plan date,
  fecha_inicio_real date,
  fecha_fin_real date,
  created_at timestamptz not null default now(),
  unique (user_id, codigo)
);

-- cotizaciones --------------------------------------------------------------
-- Los totales se guardan para listar rápido; se recalculan con cada cambio
-- mientras la cotización es borrador y después quedan fijos.
create table public.cotizaciones (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  proyecto_id bigint not null references public.proyectos (id) on delete cascade,
  version integer not null default 1 check (version > 0),
  fecha date not null default current_date,
  vencimiento date,
  pct_imprevistos numeric(5,2) not null default 0 check (pct_imprevistos >= 0),
  pct_margen numeric(5,2) not null default 0 check (pct_margen >= 0),
  total_costo numeric(14,2) not null default 0,
  total_neto numeric(14,2) not null default 0,
  total_iva numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  dolar_dia numeric(14,2), -- se completa en la Fase 5
  estado text not null default 'borrador'
    check (estado in ('borrador', 'enviada', 'aceptada', 'rechazada', 'reemplazada')),
  notas text, -- condiciones para el cliente: plazo, forma de pago…
  created_at timestamptz not null default now(),
  unique (proyecto_id, version)
);

-- Solo una versión aceptada por proyecto: es la línea base para el cierre.
create unique index cotizaciones_una_aceptada
  on public.cotizaciones (proyecto_id) where estado = 'aceptada';

-- cotizacion_items ----------------------------------------------------------
-- El precio de venta no se guarda: sale de costo_unitario × (1 + imprevistos)
-- × (1 + margen), con los % de la cotización.
create table public.cotizacion_items (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cotizacion_id bigint not null references public.cotizaciones (id) on delete cascade,
  rubro text not null check (rubro in ('material', 'mano_obra', 'viaje', 'otro')),
  descripcion text not null,
  cantidad numeric(14,3) not null check (cantidad > 0), -- en mano de obra, horas
  unidad text not null default 'u',
  costo_unitario numeric(14,2) not null check (costo_unitario >= 0), -- sin IVA
  alicuota_iva numeric(4,1) not null default 21 check (alicuota_iva in (21, 10.5)),
  material_id bigint references public.materiales (id),
  -- Viajes: cantidad = cantidad de viajes; costo_unitario = km × costo por km + peajes.
  vehiculo_id bigint references public.vehiculos (id),
  km_por_viaje numeric(10,1) check (km_por_viaje >= 0),
  costo_por_km numeric(14,2) check (costo_por_km >= 0),
  peajes_por_viaje numeric(14,2) check (peajes_por_viaje >= 0),
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index cotizacion_items_cotizacion on public.cotizacion_items (cotizacion_id, orden);
create index cotizaciones_proyecto on public.cotizaciones (proyecto_id);

-- Seguridad: cada fila solo la ve y la modifica su dueño --------------------
do $$
declare
  t text;
begin
  foreach t in array array['proyectos', 'cotizaciones', 'cotizacion_items']
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
