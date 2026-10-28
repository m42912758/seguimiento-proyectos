import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { hoyISO } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_CON_CARGA, type EstadoProyecto, type Viaje } from "../../../datos";
import { FormularioViaje } from "../formulario-viaje";
import { vehiculosParaViaje } from "../vehiculos";

async function EdicionViaje({
  params,
}: {
  params: Promise<{ id: string; viajeId: string }>;
}) {
  const { id, viajeId } = await params;
  const supabase = await createClient();
  const [{ data: proyecto }, { data: viaje }] = await Promise.all([
    supabase
      .from("proyectos")
      .select("id, codigo, nombre, estado")
      .eq("id", Number(id))
      .maybeSingle<{ id: number; codigo: string; nombre: string; estado: EstadoProyecto }>(),
    supabase
      .from("viajes")
      .select("*")
      .eq("id", Number(viajeId))
      .eq("proyecto_id", Number(id))
      .maybeSingle<Viaje>(),
  ]);
  if (!proyecto || !viaje) notFound();
  if (!ESTADOS_CON_CARGA.includes(proyecto.estado)) redirect(`/proyectos/${proyecto.id}`);
  const vehiculos = await vehiculosParaViaje(viaje.vehiculo_id);

  return (
    <>
      <Encabezado
        titulo="Viaje"
        volver={{ href: `/proyectos/${proyecto.id}`, texto: `${proyecto.codigo} · ${proyecto.nombre}` }}
      />
      <FormularioViaje proyectoId={proyecto.id} hoy={hoyISO()} vehiculos={vehiculos} viaje={viaje} />
    </>
  );
}

export default function ViajePage({ params }: PageProps<"/proyectos/[id]/viajes/[viajeId]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <EdicionViaje params={params} />
      </Suspense>
    </div>
  );
}
