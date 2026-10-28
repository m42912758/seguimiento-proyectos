import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { ListaBuscable } from "@/components/lista-buscable";
import { formatearMoneda } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import type { Empleado } from "./datos";

async function ListaEmpleados() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("empleados")
    .select("*")
    .order("nombre")
    .returns<Empleado[]>();

  const items = (data ?? []).map((e) => ({
    id: e.id,
    href: `/empleados/${e.id}`,
    titulo: e.nombre,
    detalle: e.categoria ?? undefined,
    valor:
      e.jornal_referencia > 0
        ? `${formatearMoneda(e.jornal_referencia)}/día`
        : undefined,
    activo: e.activo,
    busqueda: [e.nombre, e.categoria].join(" "),
  }));

  return <ListaBuscable items={items} vacio="Todavía no cargaste empleados." />;
}

export default function EmpleadosPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Empleados"
        boton={{ href: "/empleados/nuevo", texto: "Nuevo" }}
      />
      <Suspense fallback={<Cargando />}>
        <ListaEmpleados />
      </Suspense>
    </div>
  );
}
