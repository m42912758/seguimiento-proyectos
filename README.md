# Seguimiento de proyectos

App web personal para cotizar, registrar la ejecución y cerrar cada trabajo con un reporte de cotizado vs. real. El plan completo y el estado de cada fase están en [`PLAN.md`](PLAN.md); el esquema de la base, en [`supabase/ESQUEMA.md`](supabase/ESQUEMA.md).

La app publicada se actualiza sola en Vercel con cada cambio que se sube a GitHub.

## Seguir el proyecto desde otra computadora

Se hace una sola vez en cada computadora nueva.

1. Instalar [Node.js](https://nodejs.org) (versión LTS), [Git](https://git-scm.com) y Claude Code.
2. Bajar el proyecto, en la carpeta donde lo quieras tener:
   ```bash
   git clone https://github.com/m42912758/seguimiento-proyectos.git
   cd seguimiento-proyectos
   npm install
   ```
3. Crear las claves: copiar `.env.example` como `.env.local` y completar los dos valores. Están en Supabase → Project Settings → API Keys, o en Vercel → el proyecto → Settings → Environment Variables.
4. Abrir Claude Code en la carpeta `seguimiento-proyectos` y pedirle: "Leé PLAN.md y decime dónde nos quedamos".

Antes de empezar a trabajar, si ya lo tenías bajado, traer lo último con `git pull`.

## Comandos

- `npm run dev`: servidor local en http://localhost:3000
- `npm run build`: compilar
- `npm run lint`: revisar el código

## Base de datos

Las migraciones de `supabase/migrations/` se corren a mano, una sola vez y en orden, en Supabase → SQL Editor. La base es la misma desde cualquier computadora, así que no hace falta volver a correrlas.
