import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { buttonVariants } from "@/components/ui/button";
import { formatearFecha, formatearMoneda, formatearNumero } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { leerCotizacionCompleta } from "../consultas";
import {
  RUBROS,
  calcularTotales,
  estadoVisible,
  factorVenta,
  formatearAlicuota,
  precioUnitario,
  type Cotizacion,
  type ItemCotizacion,
  type Rubro,
  type Totales,
} from "../datos";
import { AccionesCotizacion } from "./acciones-cotizacion";

async function FichaCotizacion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leida = await leerCotizacionCompleta(Number(id));
  if (!leida) notFound();
  const { cotizacion, items } = leida;
  const proyecto = cotizacion.proyectos;

  const supabase = await createClient();
  const [{ data: versiones }, { count: filasMisDatos }] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("id, version, fecha, estado, vencimiento, total")
      .eq("proyecto_id", proyecto.id)
      .order("version", { ascending: false })
      .returns<Cotizacion[]>(),
    supabase.from("mis_datos").select("user_id", { count: "exact", head: true }),
  ]);
  const tieneMisDatos = Boolean(filasMisDatos);

  const editable = cotizacion.estado === "borrador";
  const totales = calcularTotales(items, cotizacion.pct_imprevistos, cotizacion.pct_margen);
  const factor = factorVenta(cotizacion.pct_imprevistos, cotizacion.pct_margen);

  return (
    <>
      <Encabezado
        titulo={`${proyecto.codigo} · ${proyecto.nombre}`}
        volver={{ href: "/cotizaciones", texto: "Cotizaciones" }}
      />

      <div className="-mt-2 flex flex-col gap-1 text-sm">
        <p>
          <EtiquetaEstado texto={estadoVisible(cotizacion)} /> · Versión{" "}
          {cotizacion.version} · {formatearFecha(cotizacion.fecha)}
          {cotizacion.vencimiento &&
            ` · válida hasta el ${formatearFecha(cotizacion.vencimiento)}`}
        </p>
        <p className="text-muted-foreground">
          <Link href={`/clientes/${proyecto.cliente_id}`} className="hover:underline">
            {proyecto.clientes.nombre}
          </Link>
          {proyecto.tipos_trabajo && ` · ${proyecto.tipos_trabajo.nombre}`}
          {proyecto.direccion && ` · ${proyecto.direccion}`}
        </p>
        {editable && (
          <Link
            href={`/cotizaciones/${cotizacion.id}/editar`}
            className="self-start text-sm underline-offset-4 hover:underline"
          >
            Editar datos, % y vencimiento
          </Link>
        )}
      </div>

      {!editable && cotizacion.estado !== "reemplazada" && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Esta versión ya no se puede modificar. Para cambiarla, creá una versión nueva.
        </p>
      )}

      {(Object.keys(RUBROS) as Rubro[]).map((rubro) => (
        <SeccionRubro
          key={rubro}
          rubro={rubro}
          items={items.filter((i) => i.rubro === rubro)}
          cotizacionId={cotizacion.id}
          editable={editable}
          factor={factor}
        />
      ))}

      <ResumenTotales
        totales={totales}
        pctImprevistos={cotizacion.pct_imprevistos}
        pctMargen={cotizacion.pct_margen}
      />

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`/cotizaciones/${cotizacion.id}/pdf`}
              target="_blank"
              rel="noopener"
              className={cn(buttonVariants({ variant: "outline" }), "h-11")}
            >
              PDF detallado
            </a>
            <a
              href={`/cotizaciones/${cotizacion.id}/pdf?modo=rubros`}
              target="_blank"
              rel="noopener"
              className={cn(buttonVariants({ variant: "outline" }), "h-11")}
            >
              PDF por rubro
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            El cliente ve los precios con imprevistos y margen incluidos; no ve
            tus costos.
            {!tieneMisDatos && (
              <>
                {" "}
                <Link href="/mis-datos" className="underline">
                  Cargá tus datos
                </Link>{" "}
                para el encabezado.
              </>
            )}
          </p>
        </div>
      )}

      {cotizacion.notas && (
        <div className="flex flex-col gap-1 text-sm">
          <h2 className="font-semibold">Condiciones</h2>
          <p className="whitespace-pre-line text-muted-foreground">{cotizacion.notas}</p>
        </div>
      )}

      <AccionesCotizacion
        id={cotizacion.id}
        estado={cotizacion.estado}
        version={cotizacion.version}
        bloqueada={!["cotizando", "aceptado", "rechazado"].includes(proyecto.estado)}
      />

      {versiones && versiones.length > 1 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Versiones</h2>
          <ul className="flex flex-col divide-y rounded-xl text-sm ring-1 ring-foreground/10">
            {versiones.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/cotizaciones/${v.id}`}
                  className={cn(
                    "flex justify-between gap-3 px-4 py-2 hover:bg-muted",
                    v.id === cotizacion.id && "font-semibold",
                  )}
                >
                  <span>
                    v{v.version} · {formatearFecha(v.fecha)} · {estadoVisible(v)}
                  </span>
                  <span className="tabular-nums">{formatearMoneda(v.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function EtiquetaEstado({ texto }: { texto: string }) {
  const color =
    texto === "Aceptada"
      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
      : texto === "Rechazada" || texto === "Vencida"
        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
        : texto === "Enviada"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
          : "bg-muted text-muted-foreground";
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", color)}>{texto}</span>
  );
}

function SeccionRubro({
  rubro,
  items,
  cotizacionId,
  editable,
  factor,
}: {
  rubro: Rubro;
  items: ItemCotizacion[];
  cotizacionId: number;
  editable: boolean;
  factor: number;
}) {
  if (!editable && items.length === 0) return null;
  const costo = items.reduce((suma, i) => suma + i.cantidad * i.costo_unitario, 0);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">{RUBROS[rubro].nombre}</h2>
        {items.length > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            costo {formatearMoneda(costo)}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col divide-y rounded-xl ring-1 ring-foreground/10">
          {items.map((item) => {
            const contenido = <RenglonItem item={item} factor={factor} />;
            return (
              <li key={item.id}>
                {editable ? (
                  <Link
                    href={`/cotizaciones/${cotizacionId}/items/${item.id}`}
                    className="block px-4 py-3 hover:bg-muted"
                  >
                    {contenido}
                  </Link>
                ) : (
                  <div className="px-4 py-3">{contenido}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editable && (
        <Link
          href={`/cotizaciones/${cotizacionId}/items/nuevo?rubro=${rubro}`}
          className="self-start rounded-lg px-1 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          + Agregar {RUBROS[rubro].singular.toLowerCase()}
        </Link>
      )}
    </section>
  );
}

function RenglonItem({ item, factor }: { item: ItemCotizacion; factor: number }) {
  const precio = precioUnitario(item.costo_unitario, factor);
  const detalle =
    item.rubro === "viaje" && item.km_por_viaje != null
      ? `${formatearNumero(item.cantidad)} × ${formatearNumero(item.km_por_viaje)} km` +
        (item.peajes_por_viaje ? ` + ${formatearMoneda(item.peajes_por_viaje)} peajes` : "")
      : `${formatearNumero(item.cantidad)} ${item.unidad} × ${formatearMoneda(item.costo_unitario)}`;

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <span className="font-medium">{item.descripcion}</span>
        <span className="text-sm text-muted-foreground">
          {detalle} · IVA {formatearAlicuota(item.alicuota_iva)}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end tabular-nums">
        <span className="font-medium">{formatearMoneda(item.cantidad * precio)}</span>
        <span className="text-xs text-muted-foreground">
          costo {formatearMoneda(item.cantidad * item.costo_unitario)}
        </span>
      </div>
    </div>
  );
}

function ResumenTotales({
  totales: t,
  pctImprevistos,
  pctMargen,
}: {
  totales: Totales;
  pctImprevistos: number;
  pctMargen: number;
}) {
  const pctSobreVenta = t.neto > 0 ? ((t.margen / t.neto) * 100).toFixed(1).replace(".", ",") : null;

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-muted p-4 text-sm">
      {(Object.keys(RUBROS) as Rubro[])
        .filter((r) => t.costoPorRubro[r] > 0)
        .map((r) => (
          <Renglon key={r} titulo={RUBROS[r].nombre} valor={t.costoPorRubro[r]} suave />
        ))}
      <Renglon titulo="Costo total" valor={t.costo} />
      <Renglon titulo={`Imprevistos (${formatearNumero(pctImprevistos)}%)`} valor={t.imprevistos} />
      <Renglon
        titulo={`Margen (${formatearNumero(pctMargen)}%)`}
        valor={t.margen}
        nota={pctSobreVenta ? `${pctSobreVenta}% del precio sin IVA` : undefined}
      />
      <div className="my-1 border-t border-foreground/10" />
      <Renglon titulo="Neto (sin IVA)" valor={t.neto} fuerte />
      {t.ivaPorAlicuota.map((a) => (
        <Renglon key={a.alicuota} titulo={`IVA ${formatearAlicuota(a.alicuota)}`} valor={a.iva} />
      ))}
      <div className="mt-1 flex justify-between border-t border-foreground/10 pt-2 text-base font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatearMoneda(t.total)}</span>
      </div>
    </div>
  );
}

function Renglon({
  titulo,
  valor,
  nota,
  suave,
  fuerte,
}: {
  titulo: string;
  valor: number;
  nota?: string;
  suave?: boolean;
  fuerte?: boolean;
}) {
  return (
    <div className={cn("flex justify-between gap-3", suave && "text-muted-foreground", fuerte && "font-medium")}>
      <span>
        {titulo}
        {nota && <span className="block text-xs text-muted-foreground">{nota}</span>}
      </span>
      <span className="tabular-nums">{formatearMoneda(valor)}</span>
    </div>
  );
}

export default function CotizacionPage({ params }: PageProps<"/cotizaciones/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <FichaCotizacion params={params} />
      </Suspense>
    </div>
  );
}
