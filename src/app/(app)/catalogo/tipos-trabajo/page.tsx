import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { ListaBuscable } from "@/components/lista-buscable";
import { createClient } from "@/lib/supabase/server";
import type { TipoTrabajo } from "./formulario-tipo";

async function ListaTipos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tipos_trabajo")
    .select("id, nombre, activo")
    .order("nombre")
    .returns<TipoTrabajo[]>();

  const items = (data ?? []).map((t) => ({
    id: t.id,
    href: `/catalogo/tipos-trabajo/${t.id}`,
    titulo: t.nombre,
    activo: t.activo,
    busqueda: t.nombre,
  }));

  return <ListaBuscable items={items} vacio="No hay tipos de trabajo." />;
}

export default function TiposTrabajoPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Tipos de trabajo"
        boton={{ href: "/catalogo/tipos-trabajo/nuevo", texto: "Nuevo" }}
      />
      <Suspense fallback={<Cargando />}>
        <ListaTipos />
      </Suspense>
    </div>
  );
}
