import Link from "next/link";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { hoyISO, sumarDias } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { opcionesEncabezado } from "../consultas";
import { DIAS_VALIDEZ } from "../datos";
import { FormularioEncabezado } from "../formulario-encabezado";

async function FormularioNueva({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string | string[] }>;
}) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const [{ clientes, tipos }, { data: ultima }] = await Promise.all([
    opcionesEncabezado(),
    // Se proponen los % de la última cotización.
    supabase
      .from("cotizaciones")
      .select("pct_imprevistos, pct_margen")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (clientes.length === 0) {
    return (
      <p className="text-muted-foreground">
        Primero cargá un cliente en{" "}
        <Link href="/clientes/nuevo" className="underline">
          Clientes
        </Link>
        .
      </p>
    );
  }

  const hoy = hoyISO();
  return (
    <FormularioEncabezado
      clientes={clientes}
      tipos={tipos}
      inicial={{
        fecha: hoy,
        vencimiento: sumarDias(hoy, DIAS_VALIDEZ),
        clienteId: Number(cliente) || undefined,
        pctImprevistos: ultima?.pct_imprevistos ?? 10,
        pctMargen: ultima?.pct_margen ?? 30,
      }}
    />
  );
}

export default function NuevaCotizacionPage({
  searchParams,
}: PageProps<"/cotizaciones/nueva">) {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Nueva cotización"
        volver={{ href: "/cotizaciones", texto: "Cotizaciones" }}
      />
      <Suspense fallback={<Cargando />}>
        <FormularioNueva searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
