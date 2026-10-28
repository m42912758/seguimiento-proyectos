import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BotonActivo } from "@/components/boton-activo";
import { Cargando, Encabezado } from "@/components/encabezado";
import { createClient } from "@/lib/supabase/server";
import type { Material } from "../datos";
import { FormularioMaterial } from "../formulario-material";
import { proveedoresUsados } from "../proveedores";

async function FichaMaterial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: material }, proveedores] = await Promise.all([
    supabase
      .from("materiales")
      .select("*")
      .eq("id", Number(id))
      .returns<Material[]>()
      .maybeSingle(),
    proveedoresUsados(),
  ]);
  if (!material) notFound();

  return (
    <>
      <Encabezado
        titulo={
          material.activo
            ? material.descripcion
            : `${material.descripcion} (de baja)`
        }
        volver={{ href: "/catalogo/materiales", texto: "Materiales" }}
      />
      <FormularioMaterial material={material} proveedores={proveedores} />
      <BotonActivo tabla="materiales" id={material.id} activo={material.activo} />
    </>
  );
}

export default function MaterialPage({
  params,
}: PageProps<"/catalogo/materiales/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <FichaMaterial params={params} />
      </Suspense>
    </div>
  );
}
