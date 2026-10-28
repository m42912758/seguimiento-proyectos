import Link from "next/link";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { ListaBuscable } from "@/components/lista-buscable";
import { buttonVariants } from "@/components/ui/button";
import { formatearFecha, formatearMoneda } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { COMBUSTIBLES, ultimosPrecios, type TipoCombustible, type Vehiculo } from "./datos";
import { preciosCombustible } from "./precios";

async function ListaVehiculos() {
  const supabase = await createClient();
  const [{ data }, precios] = await Promise.all([
    supabase
      .from("vehiculos")
      .select("*")
      .order("nombre")
      .returns<Vehiculo[]>(),
    preciosCombustible(),
  ]);
  const ultimos = ultimosPrecios(precios);

  const items = (data ?? []).map((v) => {
    const ultimo = ultimos[v.tipo_combustible];
    return {
      id: v.id,
      href: `/catalogo/vehiculos/${v.id}`,
      titulo: v.nombre,
      detalle: [v.patente, COMBUSTIBLES[v.tipo_combustible].nombre]
        .filter(Boolean)
        .join(" · "),
      valor: `${formatearMoneda(v.costo_por_km)}/km`,
      aviso:
        ultimo && ultimo.precio_litro !== v.precio_litro
          ? `Calculado con otro precio de ${COMBUSTIBLES[v.tipo_combustible].nombre.toLowerCase()}: revisalo`
          : undefined,
      activo: v.activo,
      busqueda: [v.nombre, v.patente].join(" "),
    };
  });

  return (
    <>
      <PreciosVigentes ultimos={ultimos} />
      <ListaBuscable items={items} vacio="Todavía no cargaste vehículos." />
    </>
  );
}

function PreciosVigentes({
  ultimos,
}: {
  ultimos: ReturnType<typeof ultimosPrecios>;
}) {
  const tipos = Object.keys(COMBUSTIBLES) as TipoCombustible[];
  const cargados = tipos.filter((t) => ultimos[t]);

  return (
    <div className="flex flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Precio del combustible</h2>
        <Link
          href="/catalogo/vehiculos/combustible"
          className={cn(buttonVariants({ variant: "outline" }), "h-10 px-3")}
        >
          Cargar precio
        </Link>
      </div>
      {cargados.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cargá el precio de cada combustible que usás; después, cuando suba,
          cargás el nuevo y se recalculan los vehículos.
        </p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {cargados.map((t) => (
            <li key={t} className="flex justify-between gap-3">
              <span>
                {COMBUSTIBLES[t].nombre}{" "}
                <span className="text-muted-foreground">
                  ({formatearFecha(ultimos[t]!.fecha)})
                </span>
              </span>
              <span className="tabular-nums">
                {formatearMoneda(ultimos[t]!.precio_litro)}/{COMBUSTIBLES[t].unidad}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function VehiculosPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Vehículos"
        boton={{ href: "/catalogo/vehiculos/nuevo", texto: "Nuevo" }}
      />
      <Suspense fallback={<Cargando />}>
        <ListaVehiculos />
      </Suspense>
    </div>
  );
}
