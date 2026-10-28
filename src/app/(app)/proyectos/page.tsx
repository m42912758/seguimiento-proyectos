import Link from "next/link";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { formatearFecha } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_PROYECTO, type EstadoProyecto } from "./datos";

type Fila = {
  id: number;
  codigo: string;
  nombre: string;
  estado: EstadoProyecto;
  fecha_inicio_real: string | null;
  clientes: { nombre: string };
  cotizaciones: { id: number; estado: string }[];
};

// Grupos que se muestran, en este orden. Los que están cotizándose o fueron
// rechazados se ven en Cotizaciones.
const GRUPOS: { estado: EstadoProyecto; titulo: string }[] = [
  { estado: "en_ejecucion", titulo: "En ejecución" },
  { estado: "aceptado", titulo: "Aceptados, sin empezar" },
  { estado: "finalizado", titulo: "Finalizados" },
  { estado: "cerrado", titulo: "Cerrados" },
];

async function ListaProyectos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proyectos")
    .select("id, codigo, nombre, estado, fecha_inicio_real, clientes(nombre), cotizaciones(id, estado)")
    .in("estado", GRUPOS.map((g) => g.estado))
    .order("id", { ascending: false })
    .returns<Fila[]>();
  const proyectos = data ?? [];

  if (proyectos.length === 0) {
    return (
      <p className="py-6 text-center text-muted-foreground">
        Todavía no hay obras. Cuando un cliente acepte una cotización, tocá
        &quot;Empezar obra&quot; en esa cotización.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {GRUPOS.map(({ estado, titulo }) => {
        const grupo = proyectos.filter((p) => p.estado === estado);
        if (grupo.length === 0) return null;
        return (
          <section key={estado} className="flex flex-col gap-2">
            <h2 className="font-semibold">{titulo}</h2>
            <ul className="flex flex-col divide-y rounded-xl ring-1 ring-foreground/10">
              {grupo.map((p) => {
                // Los aceptados sin empezar se abren en su cotización, donde
                // está el botón "Empezar obra".
                const aceptada = p.cotizaciones.find((c) => c.estado === "aceptada");
                const href =
                  estado === "aceptado" && aceptada
                    ? `/cotizaciones/${aceptada.id}`
                    : `/proyectos/${p.id}`;
                return (
                  <li key={p.id}>
                    <Link href={href} className="flex flex-col px-4 py-3 hover:bg-muted">
                      <span className="font-medium">
                        {p.codigo} · {p.nombre}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {p.clientes.nombre}
                        {p.fecha_inicio_real &&
                          ` · desde el ${formatearFecha(p.fecha_inicio_real)}`}
                        {estado === "aceptado" && ` · ${ESTADOS_PROYECTO[estado]}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function ProyectosPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado titulo="Proyectos" />
      <Suspense fallback={<Cargando />}>
        <ListaProyectos />
      </Suspense>
    </div>
  );
}
