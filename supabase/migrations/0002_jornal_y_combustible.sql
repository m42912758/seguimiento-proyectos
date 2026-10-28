-- Fase 1: ajustes a los catálogos.
-- Correr una sola vez en Supabase → SQL Editor, después de 0001.

-- empleados: la mano de obra se paga por jornada de 8 h y el valor se define
-- en cada proyecto. Acá queda solo un jornal de referencia para sugerirlo.
alter table public.empleados
  drop column costo_hora,
  drop column tarifa_hora,
  add column jornal_referencia numeric(14,2) not null default 0
    check (jornal_referencia >= 0);

-- vehiculos y precios_combustible: el tipo de combustible permite saber qué
-- vehículos recalcular cuando se carga un precio nuevo.
alter table public.vehiculos
  add column tipo_combustible text not null default 'nafta'
    check (tipo_combustible in ('nafta', 'gasoil', 'gnc'));

alter table public.precios_combustible
  add constraint precios_combustible_tipo_check
    check (tipo in ('nafta', 'gasoil', 'gnc'));
