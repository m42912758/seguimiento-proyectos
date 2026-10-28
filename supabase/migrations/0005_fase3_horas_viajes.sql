-- Fase 3 (primera tanda): equipo de cada proyecto, partes de horas y viajes.
-- Correr una sola vez en Supabase → SQL Editor, después de 0004.

-- proyecto_empleados ----------------------------------------------------------
-- Quiénes trabajan en cada obra y cuánto vale su jornada de 8 h ahí.
create table public.proyecto_empleados (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  proyecto_id bigint not null references public.proyectos (id) on delete cascade,
  empleado_id bigint not null references public.empleados (id),
  jornal numeric(14,2) not null check (jornal >= 0),
  created_at timestamptz not null default now(),
  unique (proyecto_id, empleado_id)
);

-- partes_horas ----------------------------------------------------------------
-- El costo por hora se copia al cargar: si después cambia el jornal, las
-- horas ya cargadas no cambian.
create table public.partes_horas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  proyecto_id bigint not null references public.proyectos (id) on delete cascade,
  empleado_id bigint not null references public.empleados (id),
  fecha date not null default current_date,
  horas_normales numeric(5,2) not null default 0 check (horas_normales >= 0),
  horas_extra numeric(5,2) not null default 0 check (horas_extra >= 0),
  costo_hora_aplicado numeric(14,2) not null check (costo_hora_aplicado >= 0),
  costo_hora_extra_aplicado numeric(14,2) not null check (costo_hora_extra_aplicado >= 0),
  cotizacion_item_id bigint references public.cotizacion_items (id) on delete set null,
  nota text,
  created_at timestamptz not null default now(),
  check (horas_normales + horas_extra > 0)
);

-- viajes ----------------------------------------------------------------------
-- costo = km × costo_por_km_aplicado + peajes. El costo por km se copia del
-- vehículo al cargar.
create table public.viajes (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  proyecto_id bigint not null references public.proyectos (id) on delete cascade,
  vehiculo_id bigint references public.vehiculos (id),
  fecha date not null default current_date,
  km numeric(10,1) not null check (km > 0),
  costo_por_km_aplicado numeric(14,2) not null check (costo_por_km_aplicado >= 0),
  peajes numeric(14,2) not null default 0 check (peajes >= 0),
  destino text,
  quienes text,
  nota text,
  created_at timestamptz not null default now()
);

create index partes_horas_proyecto on public.partes_horas (proyecto_id, fecha desc);
create index viajes_proyecto on public.viajes (proyecto_id, fecha desc);

-- Seguridad: cada fila solo la ve y la modifica su dueño --------------------
do $$
declare
  t text;
begin
  foreach t in array array['proyecto_empleados', 'partes_horas', 'viajes']
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
