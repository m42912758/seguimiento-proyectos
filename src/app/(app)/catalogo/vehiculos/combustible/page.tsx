import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { formatearFecha, formatearMoneda, hoyISO } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { COMBUSTIBLES, type TipoCombustible } from "../datos";
import { preciosCombustible } from "../precios";
import { FormularioPrecio } from "./formulario-precio";

async function CargaPrecio() {
  const supabase = await createClient();
  const [{ data: vehiculos }, precios] = await Promise.all([
    supabase
      .from("vehiculos")
      .select("tipo_combustible")
      .eq("activo", true)
      .returns<{ tipo_combustible: TipoCombustible }[]>(),
    preciosCombustible(30),
  ]);

  const vehiculosPorTipo: Partial<Record<TipoCombustible, number>> = {};
  for (const v of vehiculos ?? []) {
    vehiculosPorTipo[v.tipo_combustible] = (vehiculosPorTipo[v.tipo_combustible] ?? 0) + 1;
  }

  return (
    <>
      <FormularioPrecio hoy={hoyISO()} vehiculosPorTipo={vehiculosPorTipo} />

      {precios.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="mt-2 font-semibold">Últimos precios cargados</h2>
          <ul className="flex flex-col divide-y rounded-xl text-sm ring-1 ring-foreground/10">
            {precios.map((p) => (
              <li key={p.id} className="flex justify-between gap-3 px-4 py-2">
                <span>
                  {formatearFecha(p.fecha)} · {COMBUSTIBLES[p.tipo].nombre}
                </span>
                <span className="tabular-nums">
                  {formatearMoneda(p.precio_litro)}/{COMBUSTIBLES[p.tipo].unidad}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default function CombustiblePage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Precio del combustible"
        volver={{ href: "/catalogo/vehiculos", texto: "Vehículos" }}
      />
      <Suspense fallback={<Cargando />}>
        <CargaPrecio />
      </Suspense>
    </div>
  );
}
