import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { ListaBuscable } from "@/components/lista-buscable";
import { diasDesde, formatearFecha, formatearMoneda } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { estadoVisible, type Cotizacion } from "./datos";

type Fila = Cotizacion & {
  proyectos: { codigo: string; nombre: string; clientes: { nombre: string } };
};

// Aviso cuando a una cotización enviada le quedan estos días o menos.
const DIAS_AVISO_VENCIMIENTO = 3;

async function ListaCotizaciones() {
  const supabase = await createClient();
  // Las reemplazadas son versiones viejas: se ven desde la cotización vigente.
  const { data } = await supabase
    .from("cotizaciones")
    .select("*, proyectos(codigo, nombre, clientes(nombre))")
    .neq("estado", "reemplazada")
    .order("id", { ascending: false })
    .returns<Fila[]>();

  const items = (data ?? []).map((c) => {
    const estado = estadoVisible(c);
    const faltan = c.vencimiento ? -diasDesde(c.vencimiento) : null;
    let aviso;
    if (estado === "Vencida") aviso = `Venció el ${formatearFecha(c.vencimiento!)}`;
    else if (c.estado === "enviada" && faltan != null && faltan <= DIAS_AVISO_VENCIMIENTO) {
      aviso = `Vence el ${formatearFecha(c.vencimiento!)}`;
    }

    return {
      id: c.id,
      href: `/cotizaciones/${c.id}`,
      titulo: `${c.proyectos.codigo} · ${c.proyectos.nombre}`,
      detalle: [c.proyectos.clientes.nombre, c.version > 1 ? `v${c.version}` : null, estado]
        .filter(Boolean)
        .join(" · "),
      valor: c.total > 0 ? formatearMoneda(c.total) : undefined,
      aviso,
      activo: true,
      busqueda: [c.proyectos.codigo, c.proyectos.nombre, c.proyectos.clientes.nombre].join(" "),
    };
  });

  return <ListaBuscable items={items} vacio="Todavía no hiciste cotizaciones." />;
}

export default function CotizacionesPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Cotizaciones"
        boton={{ href: "/cotizaciones/nueva", texto: "Nueva" }}
      />
      <p className="-mt-2 text-sm text-muted-foreground">Totales con IVA.</p>
      <Suspense fallback={<Cargando />}>
        <ListaCotizaciones />
      </Suspense>
    </div>
  );
}
