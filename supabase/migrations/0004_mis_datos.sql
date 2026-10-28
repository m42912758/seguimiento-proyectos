-- Fase 2: datos del dueño para el encabezado de los PDF.
-- Correr una sola vez en Supabase → SQL Editor, después de 0003.

-- Una sola fila por usuario. El logo se guarda achicado como imagen en
-- texto (data URL), así no hace falta configurar Storage para esto.
create table public.mis_datos (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  razon_social text not null,
  nombre_fantasia text,
  cuit text,
  telefono text,
  email text,
  direccion text,
  logo text check (length(logo) <= 400000),
  updated_at timestamptz not null default now()
);

alter table public.mis_datos enable row level security;

create policy "solo el dueño" on public.mis_datos for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
