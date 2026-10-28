@AGENTS.md

# Seguimiento de proyectos

App web personal para seguir trabajos (instalaciones eléctricas) en tres etapas: cotización, ejecución y cierre con reporte cotizado vs. real. El plan completo y las fases están en `PLAN.md`; trabajar una fase por vez y actualizar `PLAN.md` al terminar cada una.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
- Supabase (PostgreSQL, auth, storage para fotos de comprobantes)
- Publicación en Vercel; la app se instala como PWA en el celular

Next.js 16 tiene cambios grandes respecto de versiones anteriores: leer la guía en `node_modules/next/dist/docs/` antes de usar una API que no sea obvia.

## Convenciones

- **Un solo usuario (el dueño).** Hay un único login, sin roles ni permisos. Igual, todas las tablas tienen RLS activado con políticas para el usuario autenticado.
- **Interfaz en español (Argentina):** textos, mensajes de error, fechas `dd/mm/aaaa`, números con coma decimal y punto de miles (`Intl` con locale `es-AR`). El código (variables, funciones, tablas) puede estar en español o inglés, pero sin mezclar dentro de un mismo módulo.
- **Montos:** siempre en pesos, guardados como `numeric(14,2)` en la base (nunca `float`), y cada monto lleva su fecha para convertirlo después al dólar Banco Nación.
- **IVA discriminado:** el dueño es responsable inscripto. Cada ítem lleva su alícuota (21% o 10,5%); los totales muestran neto, IVA y total por separado.
- **Pensado primero para el celular:** formularios cortos, inputs grandes, teclado numérico en montos y cantidades (`inputMode="decimal"`), fecha de hoy por defecto. Cargar un gasto debe tomar menos de 30 segundos.
- **Mano de obra en horas:** un jornal se carga como sus horas equivalentes.
- **Viajes:** costo = km × costo por km del vehículo + peajes.

## Flujo de trabajo

- **Subir todo a GitHub:** el dueño trabaja desde más de una computadora. Al terminar cada tanda de cambios (y después de que `npm run build` pase), hacer commit y `git push` sin esperar a que lo pida, incluidos `PLAN.md`, migraciones y documentación. Vercel publica solo con cada push.
- Al empezar una sesión, correr `git pull` por si hubo cambios desde otra computadora.
- Las migraciones nuevas van en `supabase/migrations/` numeradas; el dueño las corre a mano en el SQL Editor de Supabase, así que hay que avisarle y explicarle el paso.
- `.env.local` no se sube; `.env.example` muestra qué variables lleva.

## Comandos

- `npm run dev` — servidor local en http://localhost:3000
- `npm run build` — compilar (correr antes de dar algo por terminado)
- `npm run lint` — revisar el código
