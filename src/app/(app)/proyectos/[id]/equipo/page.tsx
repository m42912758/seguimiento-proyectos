import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { HORAS_JORNADA, type Empleado } from "@/app/(app)/empleados/datos";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_CON_CARGA, type EstadoProyecto, type ProyectoEmpleado } from "../../datos";
import { FormularioEquipo, type FilaEquipo } from "./formulario-equipo";

async function Equipo({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ inicio?: string | string[] }>;
}) {
  const [{ id }, { inicio }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: proyecto }, { data: empleados }, { data: equipo }] = await Promise.all([
    supabase
      .from("proyectos")
      .select("id, codigo, nombre, estado")
      .eq("id", Number(id))
      .maybeSingle<{ id: number; codigo: string; nombre: string; estado: EstadoProyecto }>(),
    supabase.from("empleados").select("*").order("nombre").returns<Empleado[]>(),
    supabase
      .from("proyecto_empleados")
      .select("*")
      .eq("proyecto_id", Number(id))
      .returns<ProyectoEmpleado[]>(),
  ]);
  if (!proyecto) notFound();
  if (!ESTADOS_CON_CARGA.includes(proyecto.estado)) redirect(`/proyectos/${proyecto.id}`);

  // Activos, más los dados de baja que ya estaban en la obra.
  const enObra = new Map((equipo ?? []).map((m) => [m.empleado_id, m.jornal]));
  const filas: FilaEquipo[] = (empleados ?? [])
    .filter((e) => e.activo || enObra.has(e.id))
    .map((e) => ({
      empleadoId: e.id,
      nombre: e.nombre,
      categoria: e.categoria,
      enEquipo: enObra.has(e.id),
      jornal: enObra.get(e.id) ?? e.jornal_referencia,
    }));

  return (
    <>
      <Encabezado
        titulo={inicio ? "¿Quiénes trabajan en esta obra?" : "Equipo de la obra"}
        volver={{ href: `/proyectos/${proyecto.id}`, texto: `${proyecto.codigo} · ${proyecto.nombre}` }}
      />
      {filas.length === 0 ? (
        <p className="text-muted-foreground">
          Primero cargá a tus empleados en{" "}
          <Link href="/empleados/nuevo" className="underline">
            Empleados
          </Link>
          . Si vos también trabajás en la obra, cargate como uno más para contar tus horas.
        </p>
      ) : (
        <>
          <p className="-mt-2 text-sm text-muted-foreground">
            Tildá a cada uno y revisá cuánto vale su jornada de {HORAS_JORNADA} h en esta obra.
          </p>
          <FormularioEquipo proyectoId={proyecto.id} filas={filas} />
        </>
      )}
    </>
  );
}

export default function EquipoPage({
  params,
  searchParams,
}: PageProps<"/proyectos/[id]/equipo">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <Equipo params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
