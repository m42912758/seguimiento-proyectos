import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { buttonVariants } from "@/components/ui/button";
import { formatearFecha, formatearMoneda, formatearNumero } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { HORAS_JORNADA } from "@/app/(app)/empleados/datos";
import {
  ESTADOS_CON_CARGA,
  ESTADOS_PROYECTO,
  costoParte,
  costoViaje,
  type ParteHoras,
  type Viaje,
} from "../datos";
import { leerProyecto, nombresCatalogo } from "../consultas";

// Cuántos registros se muestran en la ficha.
const REGISTROS_VISIBLES = 40;

async function FichaProyecto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [leido, nombres] = await Promise.all([leerProyecto(Number(id)), nombresCatalogo()]);
  if (!leido) notFound();
  const { proyecto, cotizacion, equipo, partes, viajes } = leido;
  const conCarga = ESTADOS_CON_CARGA.includes(proyecto.estado);

  // Planificado (costos de la cotización aceptada) contra lo cargado.
  const items = cotizacion?.cotizacion_items ?? [];
  const costoCotizado = (rubro: string) =>
    items.filter((i) => i.rubro === rubro).reduce((s, i) => s + i.cantidad * i.costo_unitario, 0);
  const horasCotizadas = items
    .filter((i) => i.rubro === "mano_obra")
    .reduce((s, i) => s + i.cantidad, 0);
  const horasReales = partes.reduce((s, p) => s + p.horas_normales + p.horas_extra, 0);
  const costoHoras = partes.reduce((s, p) => s + costoParte(p), 0);
  const costoViajes = viajes.reduce((s, v) => s + costoViaje(v), 0);

  const registros = [
    ...partes.map((p) => ({ tipo: "horas" as const, fecha: p.fecha, id: p.id, parte: p })),
    ...viajes.map((v) => ({ tipo: "viaje" as const, fecha: v.fecha, id: v.id, viaje: v })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
    .slice(0, REGISTROS_VISIBLES);

  return (
    <>
      <Encabezado
        titulo={`${proyecto.codigo} · ${proyecto.nombre}`}
        volver={{ href: "/proyectos", texto: "Proyectos" }}
      />
      <div className="-mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
        <p>
          {ESTADOS_PROYECTO[proyecto.estado]}
          {proyecto.fecha_inicio_real && ` desde el ${formatearFecha(proyecto.fecha_inicio_real)}`}
          {" · "}
          <Link href={`/clientes/${proyecto.cliente_id}`} className="hover:underline">
            {proyecto.clientes.nombre}
          </Link>
          {proyecto.direccion && ` · ${proyecto.direccion}`}
        </p>
        {cotizacion && (
          <Link href={`/cotizaciones/${cotizacion.id}`} className="self-start hover:underline">
            Ver cotización aceptada{cotizacion.version > 1 && ` (v${cotizacion.version})`}
          </Link>
        )}
      </div>

      {conCarga && (
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/proyectos/${proyecto.id}/horas/nuevo`}
            className={cn(buttonVariants(), "h-14 text-base")}
          >
            + Horas
          </Link>
          <Link
            href={`/proyectos/${proyecto.id}/viajes/nuevo`}
            className={cn(buttonVariants(), "h-14 text-base")}
          >
            + Viaje
          </Link>
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-xl bg-muted p-4 text-sm">
        <h2 className="font-semibold">Gastado hasta hoy contra lo cotizado</h2>
        <Comparacion
          titulo="Mano de obra"
          real={costoHoras}
          cotizado={costoCotizado("mano_obra")}
          detalle={`${formatearNumero(horasReales)} h de ${formatearNumero(horasCotizadas)} h cotizadas`}
        />
        <Comparacion titulo="Viajes" real={costoViajes} cotizado={costoCotizado("viaje")} />
        <p className="text-xs text-muted-foreground">
          Costos sin IVA. Materiales y otros gastos se suman cuando se carguen compras.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Equipo</h2>
          {conCarga && (
            <Link
              href={`/proyectos/${proyecto.id}/equipo`}
              className="text-sm underline-offset-4 hover:underline"
            >
              Editar
            </Link>
          )}
        </div>
        {equipo.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no elegiste quiénes trabajan en esta obra.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {equipo.map((m) => (
              <li key={m.id} className="flex justify-between gap-3">
                <span>{m.empleados.nombre}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatearMoneda(m.jornal)}/día · {formatearMoneda(m.jornal / HORAS_JORNADA)}/h
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Lo cargado</h2>
        {registros.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no cargaste nada.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-xl ring-1 ring-foreground/10">
            {registros.map((r) =>
              r.tipo === "horas" ? (
                <Registro
                  key={`h${r.id}`}
                  href={`/proyectos/${proyecto.id}/horas/${r.id}`}
                  fecha={r.fecha}
                  titulo={nombres.empleados.get(r.parte.empleado_id) ?? "Empleado"}
                  detalle={detalleHoras(r.parte)}
                  valor={costoParte(r.parte)}
                  editable={conCarga}
                />
              ) : (
                <Registro
                  key={`v${r.id}`}
                  href={`/proyectos/${proyecto.id}/viajes/${r.id}`}
                  fecha={r.fecha}
                  titulo={`Viaje${r.viaje.destino ? ` a ${r.viaje.destino}` : ""}`}
                  detalle={detalleViaje(r.viaje, nombres.vehiculos)}
                  valor={costoViaje(r.viaje)}
                  editable={conCarga}
                />
              ),
            )}
          </ul>
        )}
      </section>
    </>
  );
}

function detalleHoras(p: ParteHoras) {
  const partes = [];
  if (p.horas_normales > 0) partes.push(`${formatearNumero(p.horas_normales)} h`);
  if (p.horas_extra > 0) partes.push(`${formatearNumero(p.horas_extra)} h extra`);
  return [partes.join(" + "), p.nota].filter(Boolean).join(" · ");
}

function detalleViaje(v: Viaje, vehiculos: Map<number, string>) {
  return [
    `${formatearNumero(v.km)} km`,
    v.vehiculo_id ? vehiculos.get(v.vehiculo_id) : null,
    v.peajes > 0 ? `${formatearMoneda(v.peajes)} peajes` : null,
    v.quienes,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Registro({
  href,
  fecha,
  titulo,
  detalle,
  valor,
  editable,
}: {
  href: string;
  fecha: string;
  titulo: string;
  detalle: string;
  valor: number;
  editable: boolean;
}) {
  const contenido = (
    <>
      <div className="flex min-w-0 flex-col">
        <span className="truncate">
          <span className="text-muted-foreground tabular-nums">{formatearFecha(fecha).slice(0, 5)}</span>{" "}
          <span className="font-medium">{titulo}</span>
        </span>
        <span className="truncate text-sm text-muted-foreground">{detalle}</span>
      </div>
      <span className="shrink-0 tabular-nums">{formatearMoneda(valor)}</span>
    </>
  );
  const clase = "flex items-center justify-between gap-3 px-4 py-3";
  return (
    <li>
      {editable ? (
        <Link href={href} className={cn(clase, "hover:bg-muted")}>
          {contenido}
        </Link>
      ) : (
        <div className={clase}>{contenido}</div>
      )}
    </li>
  );
}

// Barra de lo gastado contra lo cotizado: verde hasta 80%, ámbar hasta 100%
// y roja si se pasó.
function Comparacion({
  titulo,
  real,
  cotizado,
  detalle,
}: {
  titulo: string;
  real: number;
  cotizado: number;
  detalle?: string;
}) {
  const pct = cotizado > 0 ? (real / cotizado) * 100 : null;
  const color =
    pct == null ? "bg-foreground/30" : pct > 100 ? "bg-red-600" : pct >= 80 ? "bg-amber-500" : "bg-green-600";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-3">
        <span className="font-medium">{titulo}</span>
        <span className="tabular-nums">
          {formatearMoneda(real)}
          <span className="text-muted-foreground"> de {formatearMoneda(cotizado)}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
      </div>
      <div className="flex justify-between gap-3 text-xs text-muted-foreground">
        <span>{detalle}</span>
        <span>
          {pct == null
            ? cotizado === 0 && real > 0
              ? "no estaba cotizado"
              : ""
            : `${formatearNumero(Math.round(pct))}%`}
        </span>
      </div>
    </div>
  );
}

export default function ProyectoPage({ params }: PageProps<"/proyectos/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <FichaProyecto params={params} />
      </Suspense>
    </div>
  );
}
