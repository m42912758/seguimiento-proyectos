import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { createClient } from "@/lib/supabase/server";
import { RUBROS, type ItemCotizacion } from "../../../datos";
import { FormularioItem } from "../formulario-item";
import { opcionesItem } from "../opciones";

async function EdicionItem({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const supabase = await createClient();
  const [{ data: cotizacion }, { data: item }] = await Promise.all([
    supabase.from("cotizaciones").select("id, estado").eq("id", Number(id)).maybeSingle(),
    supabase
      .from("cotizacion_items")
      .select("*")
      .eq("id", Number(itemId))
      .eq("cotizacion_id", Number(id))
      .returns<ItemCotizacion[]>()
      .maybeSingle(),
  ]);
  if (!cotizacion || !item) notFound();
  if (cotizacion.estado !== "borrador") redirect(`/cotizaciones/${cotizacion.id}`);

  const opciones = await opcionesItem(item.rubro);
  return (
    <>
      <Encabezado
        titulo={RUBROS[item.rubro].singular}
        volver={{ href: `/cotizaciones/${cotizacion.id}`, texto: "Cotización" }}
      />
      <FormularioItem
        cotizacionId={cotizacion.id}
        rubro={item.rubro}
        item={item}
        {...opciones}
      />
    </>
  );
}

export default function ItemPage({ params }: PageProps<"/cotizaciones/[id]/items/[itemId]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <EdicionItem params={params} />
      </Suspense>
    </div>
  );
}
