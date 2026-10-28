import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BotonActivo } from "@/components/boton-activo";
import { Cargando, Encabezado } from "@/components/encabezado";
import { createClient } from "@/lib/supabase/server";
import type { Empleado } from "../datos";
import { FormularioEmpleado } from "../formulario-empleado";

async function FichaEmpleado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: empleado } = await supabase
    .from("empleados")
    .select("*")
    .eq("id", Number(id))
    .returns<Empleado[]>()
    .maybeSingle();
  if (!empleado) notFound();

  return (
    <>
      <Encabezado
        titulo={
          empleado.activo ? empleado.nombre : `${empleado.nombre} (de baja)`
        }
        volver={{ href: "/empleados", texto: "Empleados" }}
      />
      <FormularioEmpleado empleado={empleado} />
      <BotonActivo tabla="empleados" id={empleado.id} activo={empleado.activo} />
    </>
  );
}

export default function EmpleadoPage({ params }: PageProps<"/empleados/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <FichaEmpleado params={params} />
      </Suspense>
    </div>
  );
}
