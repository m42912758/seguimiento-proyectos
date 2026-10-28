import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { hoyISO } from "@/lib/formato";
import { ESTADOS_CON_CARGA } from "../../../datos";
import { leerProyecto } from "../../../consultas";
import { FormularioHoras } from "../formulario-horas";

async function NuevasHoras({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leido = await leerProyecto(Number(id));
  if (!leido) notFound();
  const { proyecto, equipo } = leido;
  if (!ESTADOS_CON_CARGA.includes(proyecto.estado)) redirect(`/proyectos/${proyecto.id}`);

  return (
    <>
      <Encabezado
        titulo="Cargar horas"
        volver={{ href: `/proyectos/${proyecto.id}`, texto: `${proyecto.codigo} · ${proyecto.nombre}` }}
      />
      {equipo.length === 0 ? (
        <p className="text-muted-foreground">
          Primero elegí{" "}
          <Link href={`/proyectos/${proyecto.id}/equipo`} className="underline">
            quiénes trabajan en esta obra
          </Link>
          .
        </p>
      ) : (
        <FormularioHoras
          proyectoId={proyecto.id}
          hoy={hoyISO()}
          equipo={equipo.map((m) => ({ empleadoId: m.empleado_id, nombre: m.empleados.nombre }))}
        />
      )}
    </>
  );
}

export default function NuevasHorasPage({ params }: PageProps<"/proyectos/[id]/horas/nuevo">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <NuevasHoras params={params} />
      </Suspense>
    </div>
  );
}
