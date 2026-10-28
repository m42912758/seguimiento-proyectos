import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { leerCotizacionCompleta, opcionesEncabezado } from "../../consultas";
import { FormularioEncabezado } from "../../formulario-encabezado";

async function Edicion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leida = await leerCotizacionCompleta(Number(id));
  if (!leida) notFound();
  const { cotizacion } = leida;
  if (cotizacion.estado !== "borrador") redirect(`/cotizaciones/${cotizacion.id}`);

  const { clientes, tipos } = await opcionesEncabezado(cotizacion.proyectos);
  return (
    <>
      <Encabezado
        titulo="Datos de la cotización"
        volver={{
          href: `/cotizaciones/${cotizacion.id}`,
          texto: `${cotizacion.proyectos.codigo} · ${cotizacion.proyectos.nombre}`,
        }}
      />
      <FormularioEncabezado
        cotizacion={cotizacion}
        proyecto={cotizacion.proyectos}
        clientes={clientes}
        tipos={tipos}
        inicial={{
          fecha: cotizacion.fecha,
          vencimiento: cotizacion.vencimiento ?? "",
          pctImprevistos: cotizacion.pct_imprevistos,
          pctMargen: cotizacion.pct_margen,
        }}
      />
    </>
  );
}

export default function EditarCotizacionPage({
  params,
}: PageProps<"/cotizaciones/[id]/editar">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <Edicion params={params} />
      </Suspense>
    </div>
  );
}
