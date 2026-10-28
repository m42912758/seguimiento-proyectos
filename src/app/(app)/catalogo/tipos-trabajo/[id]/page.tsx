import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BotonActivo } from "@/components/boton-activo";
import { Cargando, Encabezado } from "@/components/encabezado";
import { createClient } from "@/lib/supabase/server";
import { FormularioTipo, type TipoTrabajo } from "../formulario-tipo";

async function FichaTipo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: tipo } = await supabase
    .from("tipos_trabajo")
    .select("id, nombre, activo")
    .eq("id", Number(id))
    .returns<TipoTrabajo[]>()
    .maybeSingle();
  if (!tipo) notFound();

  return (
    <>
      <Encabezado
        titulo={tipo.activo ? tipo.nombre : `${tipo.nombre} (de baja)`}
        volver={{ href: "/catalogo/tipos-trabajo", texto: "Tipos de trabajo" }}
      />
      <FormularioTipo tipo={tipo} />
      <BotonActivo tabla="tipos_trabajo" id={tipo.id} activo={tipo.activo} />
    </>
  );
}

export default function TipoTrabajoPage({
  params,
}: PageProps<"/catalogo/tipos-trabajo/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <FichaTipo params={params} />
      </Suspense>
    </div>
  );
}
