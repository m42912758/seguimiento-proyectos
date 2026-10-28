import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { createClient } from "@/lib/supabase/server";
import { RUBROS, leerRubro } from "../../../datos";
import { FormularioItem } from "../formulario-item";
import { opcionesItem } from "../opciones";

async function NuevoItem({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rubro?: string | string[] }>;
}) {
  const [{ id }, { rubro: textoRubro }] = await Promise.all([params, searchParams]);
  const rubro = leerRubro(textoRubro);
  if (!rubro) notFound();

  const supabase = await createClient();
  const [{ data: cotizacion }, opciones] = await Promise.all([
    supabase.from("cotizaciones").select("id, estado").eq("id", Number(id)).maybeSingle(),
    opcionesItem(rubro),
  ]);
  if (!cotizacion) notFound();
  if (cotizacion.estado !== "borrador") redirect(`/cotizaciones/${cotizacion.id}`);

  return (
    <>
      <Encabezado
        titulo={`Agregar ${RUBROS[rubro].singular.toLowerCase()}`}
        volver={{ href: `/cotizaciones/${cotizacion.id}`, texto: "Cotización" }}
      />
      <FormularioItem cotizacionId={cotizacion.id} rubro={rubro} {...opciones} />
    </>
  );
}

export default function NuevoItemPage({
  params,
  searchParams,
}: PageProps<"/cotizaciones/[id]/items/nuevo">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <NuevoItem params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
