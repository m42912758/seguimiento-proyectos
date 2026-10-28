import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { formatearMoneda, hoyISO } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_CON_CARGA, type EstadoProyecto, type ParteHoras } from "../../../datos";
import { FormularioHoras } from "../formulario-horas";

async function EdicionHoras({
  params,
}: {
  params: Promise<{ id: string; parteId: string }>;
}) {
  const { id, parteId } = await params;
  const supabase = await createClient();
  const [{ data: proyecto }, { data: parte }] = await Promise.all([
    supabase
      .from("proyectos")
      .select("id, codigo, nombre, estado")
      .eq("id", Number(id))
      .maybeSingle<{ id: number; codigo: string; nombre: string; estado: EstadoProyecto }>(),
    supabase
      .from("partes_horas")
      .select("*, empleados(nombre)")
      .eq("id", Number(parteId))
      .eq("proyecto_id", Number(id))
      .maybeSingle<ParteHoras & { empleados: { nombre: string } }>(),
  ]);
  if (!proyecto || !parte) notFound();
  if (!ESTADOS_CON_CARGA.includes(proyecto.estado)) redirect(`/proyectos/${proyecto.id}`);

  return (
    <>
      <Encabezado
        titulo="Horas"
        volver={{ href: `/proyectos/${proyecto.id}`, texto: `${proyecto.codigo} · ${proyecto.nombre}` }}
      />
      <FormularioHoras
        proyectoId={proyecto.id}
        hoy={hoyISO()}
        parte={parte}
        nombre={parte.empleados.nombre}
      />
      <p className="text-sm text-muted-foreground">
        Costo aplicado: {formatearMoneda(parte.costo_hora_aplicado)}/h y{" "}
        {formatearMoneda(parte.costo_hora_extra_aplicado)}/h extra, según la jornada
        que tenía en la obra cuando se cargó.
      </p>
    </>
  );
}

export default function HorasPage({ params }: PageProps<"/proyectos/[id]/horas/[parteId]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <EdicionHoras params={params} />
      </Suspense>
    </div>
  );
}
