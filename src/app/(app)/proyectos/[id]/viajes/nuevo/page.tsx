import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { hoyISO } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_CON_CARGA, type EstadoProyecto, type Viaje } from "../../../datos";
import { FormularioViaje } from "../formulario-viaje";
import { vehiculosParaViaje } from "../vehiculos";

async function NuevoViaje({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: proyecto }, { data: ultimo }, vehiculos] = await Promise.all([
    supabase
      .from("proyectos")
      .select("id, codigo, nombre, estado")
      .eq("id", Number(id))
      .maybeSingle<{ id: number; codigo: string; nombre: string; estado: EstadoProyecto }>(),
    supabase
      .from("viajes")
      .select("*")
      .eq("proyecto_id", Number(id))
      .order("fecha", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle<Viaje>(),
    vehiculosParaViaje(),
  ]);
  if (!proyecto) notFound();
  if (!ESTADOS_CON_CARGA.includes(proyecto.estado)) redirect(`/proyectos/${proyecto.id}`);

  return (
    <>
      <Encabezado
        titulo="Cargar viaje"
        volver={{ href: `/proyectos/${proyecto.id}`, texto: `${proyecto.codigo} · ${proyecto.nombre}` }}
      />
      <FormularioViaje
        proyectoId={proyecto.id}
        hoy={hoyISO()}
        vehiculos={vehiculos}
        ultimo={ultimo ?? undefined}
      />
    </>
  );
}

export default function NuevoViajePage({ params }: PageProps<"/proyectos/[id]/viajes/nuevo">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <NuevoViaje params={params} />
      </Suspense>
    </div>
  );
}
