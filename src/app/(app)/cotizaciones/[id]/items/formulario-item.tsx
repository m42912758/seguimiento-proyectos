"use client";

import { useState, useTransition } from "react";
import { Campo, Formulario, Selector } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HORAS_JORNADA } from "@/app/(app)/empleados/datos";
import { ALICUOTAS_IVA, UNIDADES } from "@/app/(app)/catalogo/materiales/datos";
import {
  formatearMoneda,
  formatearNumero,
  leerNumero,
  numeroParaInput,
} from "@/lib/formato";
import { eliminarItem, guardarItem } from "../../actions";
import { formatearAlicuota, type ItemCotizacion, type Rubro } from "../../datos";

export type MaterialOpcion = {
  id: number;
  descripcion: string;
  unidad: string;
  precio: number;
  alicuota_iva: number;
  proveedor: string | null;
};
export type EmpleadoOpcion = { id: number; nombre: string; jornal_referencia: number };
export type VehiculoOpcion = { id: number; nombre: string; costo_por_km: number };

export function FormularioItem({
  cotizacionId,
  rubro,
  item,
  materiales = [],
  empleados = [],
  vehiculos = [],
}: {
  cotizacionId: number;
  rubro: Rubro;
  item?: ItemCotizacion;
  materiales?: MaterialOpcion[];
  empleados?: EmpleadoOpcion[];
  vehiculos?: VehiculoOpcion[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Formulario accion={guardarItem} volverHref={`/cotizaciones/${cotizacionId}`}>
        <input type="hidden" name="cotizacion_id" value={cotizacionId} />
        <input type="hidden" name="rubro" value={rubro} />
        {item && <input type="hidden" name="id" value={item.id} />}

        {rubro === "material" && <CamposMaterial item={item} materiales={materiales} />}
        {rubro === "mano_obra" && <CamposManoObra item={item} empleados={empleados} />}
        {rubro === "viaje" && <CamposViaje item={item} vehiculos={vehiculos} />}
        {rubro === "otro" && <CamposOtro item={item} />}

        {!item && (
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="otro" value="1" className="size-5" />
            Después de guardar, agregar otro
          </label>
        )}
      </Formulario>
      {item && <BotonEliminar cotizacionId={cotizacionId} itemId={item.id} />}
    </div>
  );
}

function BotonEliminar({ cotizacionId, itemId }: { cotizacionId: number; itemId: number }) {
  const [eliminando, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      className="h-11"
      disabled={eliminando}
      onClick={() => {
        if (!confirm("¿Eliminar este ítem?")) return;
        startTransition(() => eliminarItem(cotizacionId, itemId));
      }}
    >
      Eliminar ítem
    </Button>
  );
}

// Campos comunes ------------------------------------------------------------
function CampoNumero({
  id,
  etiqueta,
  valor,
  cambiar,
  ayuda,
  entero,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  cambiar: (v: string) => void;
  ayuda?: React.ReactNode;
  entero?: boolean;
}) {
  return (
    <Campo id={id} etiqueta={etiqueta} ayuda={ayuda}>
      <Input
        id={id}
        name={id}
        inputMode={entero ? "numeric" : "decimal"}
        placeholder="0"
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        required
        className="h-11"
      />
    </Campo>
  );
}

function SelectorIva({ valor, cambiar }: { valor: string; cambiar: (v: string) => void }) {
  return (
    <Campo id="alicuota_iva" etiqueta="IVA">
      <Selector
        id="alicuota_iva"
        name="alicuota_iva"
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
      >
        {ALICUOTAS_IVA.map((a) => (
          <option key={a} value={a}>
            {formatearAlicuota(a)}
          </option>
        ))}
      </Selector>
    </Campo>
  );
}

function Subtotal({ cantidad, costo }: { cantidad: string; costo: string }) {
  const c = leerNumero(cantidad);
  const u = leerNumero(costo);
  if (c == null || u == null || c <= 0) return null;
  return (
    <p className="rounded-xl bg-muted p-3 text-sm">
      Costo del renglón: <strong className="tabular-nums">{formatearMoneda(c * u)}</strong>{" "}
      <span className="text-muted-foreground">(sin IVA, antes de imprevistos y margen)</span>
    </p>
  );
}

// Material del catálogo -----------------------------------------------------
function CamposMaterial({
  item,
  materiales,
}: {
  item?: ItemCotizacion;
  materiales: MaterialOpcion[];
}) {
  const [materialId, setMaterialId] = useState(item?.material_id ?? null);
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? "");
  const [unidad, setUnidad] = useState(item?.unidad ?? "u");
  const [costo, setCosto] = useState(numeroParaInput(item?.costo_unitario));
  const [alicuota, setAlicuota] = useState(String(item?.alicuota_iva ?? 21));
  const [cantidad, setCantidad] = useState(numeroParaInput(item?.cantidad));
  const [busqueda, setBusqueda] = useState("");

  // Cada palabra buscada tiene que aparecer, en cualquier orden.
  const buscado = normalizar(busqueda).trim();
  const palabras = buscado.split(/\s+/);
  const encontrados = buscado
    ? materiales
        .filter((m) => {
          const texto = normalizar(`${m.descripcion} ${m.proveedor ?? ""}`);
          return palabras.every((p) => texto.includes(p));
        })
        .slice(0, 8)
    : [];

  function elegir(m: MaterialOpcion) {
    setMaterialId(m.id);
    setDescripcion(m.descripcion);
    setUnidad(m.unidad);
    setCosto(numeroParaInput(m.precio));
    setAlicuota(String(m.alicuota_iva));
    setBusqueda("");
    document.getElementById("cantidad")?.focus();
  }

  return (
    <>
      <input type="hidden" name="material_id" value={materialId ?? ""} />

      <Campo id="busqueda" etiqueta="Buscar en el catálogo">
        <Input
          id="busqueda"
          type="search"
          placeholder="Ej.: termica 2x16"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          autoFocus={!item}
          className="h-11"
        />
      </Campo>
      {encontrados.length > 0 && (
        <ul className="-mt-2 flex flex-col divide-y rounded-xl ring-1 ring-foreground/10">
          {encontrados.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => elegir(m)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate">{m.descripcion}</span>
                  {m.proveedor && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {m.proveedor}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm tabular-nums">
                  {formatearMoneda(m.precio)}/{m.unidad}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {buscado && encontrados.length === 0 && (
        <p className="-mt-2 text-sm text-muted-foreground">
          No está en el catálogo: completá los datos a mano.
        </p>
      )}

      <Campo id="descripcion" etiqueta="Descripción">
        <Input
          id="descripcion"
          name="descripcion"
          value={descripcion}
          onChange={(e) => {
            setDescripcion(e.target.value);
            setMaterialId(null);
          }}
          required
          className="h-11"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <CampoNumero id="cantidad" etiqueta="Cantidad" valor={cantidad} cambiar={setCantidad} />
        <Campo id="unidad" etiqueta="Unidad">
          <Input
            id="unidad"
            name="unidad"
            list="unidades"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            className="h-11"
          />
          <datalist id="unidades">
            {UNIDADES.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoNumero
          id="costo_unitario"
          etiqueta="Costo unitario sin IVA ($)"
          valor={costo}
          cambiar={setCosto}
        />
        <SelectorIva valor={alicuota} cambiar={setAlicuota} />
      </div>
      {materialId != null && (
        <p className="-mt-2 text-sm text-muted-foreground">
          Precio del catálogo. Si lo cambiás acá, el catálogo no cambia.
        </p>
      )}

      <Subtotal cantidad={cantidad} costo={costo} />
    </>
  );
}

// Mano de obra en horas o jornales ------------------------------------------
function CamposManoObra({
  item,
  empleados,
}: {
  item?: ItemCotizacion;
  empleados: EmpleadoOpcion[];
}) {
  const [unidad, setUnidad] = useState<"h" | "jornal">("h");
  const [cantidad, setCantidad] = useState(numeroParaInput(item?.cantidad));
  const [valor, setValor] = useState(numeroParaInput(item?.costo_unitario));
  const [alicuota, setAlicuota] = useState(String(item?.alicuota_iva ?? 21));

  // Al cambiar de horas a jornales (o al revés) se convierten los números.
  function cambiarUnidad(nueva: "h" | "jornal") {
    if (nueva === unidad) return;
    const c = leerNumero(cantidad);
    const v = leerNumero(valor);
    const redondear = (n: number) => Math.round(n * 100) / 100;
    if (nueva === "jornal") {
      if (c != null) setCantidad(numeroParaInput(redondear(c / HORAS_JORNADA)));
      if (v != null) setValor(numeroParaInput(redondear(v * HORAS_JORNADA)));
    } else {
      if (c != null) setCantidad(numeroParaInput(redondear(c * HORAS_JORNADA)));
      if (v != null) setValor(numeroParaInput(redondear(v / HORAS_JORNADA)));
    }
    setUnidad(nueva);
  }

  const conValor = empleados.filter((e) => e.jornal_referencia > 0);
  const c = leerNumero(cantidad);

  return (
    <>
      <input type="hidden" name="unidad" value={unidad} />

      <Campo id="descripcion" etiqueta="Tarea" ayuda="Ej.: armado de tablero, cableado planta alta">
        <Input
          id="descripcion"
          name="descripcion"
          defaultValue={item?.descripcion}
          required
          autoFocus={!item}
          className="h-11"
        />
      </Campo>

      <div className="flex gap-2">
        {(["h", "jornal"] as const).map((u) => (
          <Button
            key={u}
            type="button"
            variant={unidad === u ? "default" : "outline"}
            className="h-10 flex-1"
            onClick={() => cambiarUnidad(u)}
          >
            En {u === "h" ? "horas" : "jornales"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoNumero
          id="cantidad"
          etiqueta={unidad === "h" ? "Horas" : "Jornales"}
          valor={cantidad}
          cambiar={setCantidad}
          ayuda={
            unidad === "jornal" && c != null && c > 0
              ? `= ${formatearNumero(c * HORAS_JORNADA)} h`
              : undefined
          }
        />
        <CampoNumero
          id="costo_unitario"
          etiqueta={unidad === "h" ? "Costo por hora ($)" : "Costo por jornal ($)"}
          valor={valor}
          cambiar={setValor}
        />
      </div>

      {conValor.length > 0 && (
        <div className="-mt-2 flex flex-wrap gap-2">
          {conValor.map((e) => {
            const v = unidad === "h" ? e.jornal_referencia / HORAS_JORNADA : e.jornal_referencia;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setValor(numeroParaInput(Math.round(v * 100) / 100))}
                className="rounded-full px-3 py-1 text-sm ring-1 ring-foreground/15 hover:bg-muted"
              >
                {e.nombre}: {formatearMoneda(v)}
              </button>
            );
          })}
        </div>
      )}

      <SelectorIva valor={alicuota} cambiar={setAlicuota} />
      <p className="-mt-2 text-sm text-muted-foreground">
        Se guarda en horas: un jornal son {HORAS_JORNADA} h.
      </p>

      <Subtotal cantidad={cantidad} costo={valor} />
    </>
  );
}

// Viajes: viajes × (km × costo por km + peajes) -----------------------------
function CamposViaje({
  item,
  vehiculos,
}: {
  item?: ItemCotizacion;
  vehiculos: VehiculoOpcion[];
}) {
  const inicial = item?.vehiculo_id ?? (vehiculos.length === 1 ? vehiculos[0].id : null);
  const [vehiculoId, setVehiculoId] = useState(inicial ? String(inicial) : "");
  const [descripcion, setDescripcion] = useState(
    item?.descripcion ?? descripcionViaje(vehiculos.find((v) => v.id === inicial)),
  );
  const [viajes, setViajes] = useState(numeroParaInput(item?.cantidad));
  const [km, setKm] = useState(numeroParaInput(item?.km_por_viaje));
  const [costoKm, setCostoKm] = useState(
    numeroParaInput(item?.costo_por_km ?? vehiculos.find((v) => v.id === inicial)?.costo_por_km),
  );
  const [peajes, setPeajes] = useState(numeroParaInput(item?.peajes_por_viaje));
  const [alicuota, setAlicuota] = useState(String(item?.alicuota_iva ?? 21));

  const porViaje = (leerNumero(km) ?? 0) * (leerNumero(costoKm) ?? 0) + (leerNumero(peajes) ?? 0);

  return (
    <>
      <Campo id="vehiculo_id" etiqueta="Vehículo">
        <Selector
          id="vehiculo_id"
          name="vehiculo_id"
          value={vehiculoId}
          onChange={(e) => {
            setVehiculoId(e.target.value);
            const v = vehiculos.find((x) => String(x.id) === e.target.value);
            if (v) {
              setCostoKm(numeroParaInput(v.costo_por_km));
              setDescripcion(descripcionViaje(v));
            }
          }}
        >
          <option value="">Otro / sin vehículo cargado</option>
          {vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre} ({formatearMoneda(v.costo_por_km)}/km)
            </option>
          ))}
        </Selector>
      </Campo>

      <Campo id="descripcion" etiqueta="Descripción">
        <Input
          id="descripcion"
          name="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="h-11"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <CampoNumero id="cantidad" etiqueta="Cantidad de viajes" valor={viajes} cambiar={setViajes} entero />
        <CampoNumero
          id="km_por_viaje"
          etiqueta="Km por viaje"
          valor={km}
          cambiar={setKm}
          ayuda="Ida y vuelta"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoNumero id="costo_por_km" etiqueta="Costo por km ($)" valor={costoKm} cambiar={setCostoKm} />
        <Campo id="peajes_por_viaje" etiqueta="Peajes por viaje ($)">
          <Input
            id="peajes_por_viaje"
            name="peajes_por_viaje"
            inputMode="decimal"
            placeholder="0"
            value={peajes}
            onChange={(e) => setPeajes(e.target.value)}
            className="h-11"
          />
        </Campo>
      </div>

      <SelectorIva valor={alicuota} cambiar={setAlicuota} />

      {porViaje > 0 && (
        <p className="rounded-xl bg-muted p-3 text-sm">
          {formatearMoneda(porViaje)} por viaje
          {(leerNumero(viajes) ?? 0) > 0 && (
            <>
              {" "}· costo total{" "}
              <strong className="tabular-nums">
                {formatearMoneda(porViaje * (leerNumero(viajes) ?? 0))}
              </strong>
            </>
          )}
        </p>
      )}
    </>
  );
}

function descripcionViaje(v?: VehiculoOpcion) {
  return v ? `Viajes en ${v.nombre}` : "Viajes";
}

// Otros gastos: fletes, alquileres, subcontratos… ---------------------------
function CamposOtro({ item }: { item?: ItemCotizacion }) {
  const [cantidad, setCantidad] = useState(numeroParaInput(item?.cantidad ?? 1));
  const [costo, setCosto] = useState(numeroParaInput(item?.costo_unitario));
  const [alicuota, setAlicuota] = useState(String(item?.alicuota_iva ?? 21));

  return (
    <>
      <Campo
        id="descripcion"
        etiqueta="Descripción"
        ayuda="Ej.: alquiler de andamio, flete, subcontrato de zanjeo"
      >
        <Input
          id="descripcion"
          name="descripcion"
          defaultValue={item?.descripcion}
          required
          autoFocus={!item}
          className="h-11"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <CampoNumero id="cantidad" etiqueta="Cantidad" valor={cantidad} cambiar={setCantidad} />
        <Campo id="unidad" etiqueta="Unidad">
          <Input id="unidad" name="unidad" defaultValue={item?.unidad ?? "u"} className="h-11" />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoNumero
          id="costo_unitario"
          etiqueta="Costo unitario sin IVA ($)"
          valor={costo}
          cambiar={setCosto}
        />
        <SelectorIva valor={alicuota} cambiar={setAlicuota} />
      </div>

      <Subtotal cantidad={cantidad} costo={costo} />
    </>
  );
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
