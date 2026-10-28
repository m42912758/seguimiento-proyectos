import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { ListaBuscable } from "@/components/lista-buscable";
import { diasDesde, formatearFecha, formatearMoneda } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { DIAS_PRECIO_VIEJO, type Material } from "./datos";
import { ImportarPlanilla } from "./importar-planilla";

async function ListaMateriales() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materiales")
    .select("*")
    .order("descripcion")
    .returns<Material[]>();

  const items = (data ?? []).map((m) => {
    const dias = diasDesde(m.fecha_precio);
    return {
      id: m.id,
      href: `/catalogo/materiales/${m.id}`,
      titulo: m.descripcion,
      detalle: [`por ${m.unidad}`, m.proveedor].filter(Boolean).join(" · "),
      valor: formatearMoneda(m.precio),
      aviso:
        dias > DIAS_PRECIO_VIEJO
          ? `Precio del ${formatearFecha(m.fecha_precio)} (hace ${dias} días)`
          : undefined,
      activo: m.activo,
      busqueda: [m.descripcion, m.proveedor].join(" "),
    };
  });

  return (
    <ListaBuscable items={items} vacio="Todavía no cargaste materiales." />
  );
}

export default function MaterialesPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Materiales"
        boton={{ href: "/catalogo/materiales/nuevo", texto: "Nuevo" }}
      />
      <p className="-mt-2 text-sm text-muted-foreground">Precios sin IVA.</p>
      <ImportarPlanilla />
      <Suspense fallback={<Cargando />}>
        <ListaMateriales />
      </Suspense>
    </div>
  );
}
