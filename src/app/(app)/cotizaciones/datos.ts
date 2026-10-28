import { diasDesde } from "@/lib/formato";

export const RUBROS = {
  material: { nombre: "Materiales", singular: "Material" },
  mano_obra: { nombre: "Mano de obra", singular: "Mano de obra" },
  viaje: { nombre: "Viajes", singular: "Viaje" },
  otro: { nombre: "Otros gastos", singular: "Otro gasto" },
} as const;

export type Rubro = keyof typeof RUBROS;

export function leerRubro(valor: unknown): Rubro | null {
  return typeof valor === "string" && valor in RUBROS ? (valor as Rubro) : null;
}

export const ESTADOS = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  reemplazada: "Reemplazada",
} as const;

export type EstadoCotizacion = keyof typeof ESTADOS;

// Días de validez que se proponen al crear una cotización.
export const DIAS_VALIDEZ = 15;

export type Proyecto = {
  id: number;
  codigo: string;
  nombre: string;
  cliente_id: number;
  tipo_trabajo_id: number | null;
  estado: string;
  direccion: string | null;
};

export type Cotizacion = {
  id: number;
  proyecto_id: number;
  version: number;
  fecha: string;
  vencimiento: string | null;
  pct_imprevistos: number;
  pct_margen: number;
  total_costo: number;
  total_neto: number;
  total_iva: number;
  total: number;
  estado: EstadoCotizacion;
  notas: string | null;
};

export type ItemCotizacion = {
  id: number;
  cotizacion_id: number;
  rubro: Rubro;
  descripcion: string;
  cantidad: number;
  unidad: string;
  costo_unitario: number; // sin IVA
  alicuota_iva: number;
  material_id: number | null;
  vehiculo_id: number | null;
  km_por_viaje: number | null;
  costo_por_km: number | null;
  peajes_por_viaje: number | null;
  orden: number;
};

// "Vencida" no se guarda: es una enviada cuyo vencimiento ya pasó.
export function estadoVisible(c: Pick<Cotizacion, "estado" | "vencimiento">) {
  if (c.estado === "enviada" && c.vencimiento && diasDesde(c.vencimiento) > 0) {
    return "Vencida";
  }
  return ESTADOS[c.estado];
}

function redondear(valor: number) {
  return Math.round(valor * 100) / 100;
}

// Imprevistos se suman sobre el costo y el margen sobre costo + imprevistos.
export function factorVenta(pctImprevistos: number, pctMargen: number) {
  return (1 + pctImprevistos / 100) * (1 + pctMargen / 100);
}

// Precio de venta unitario sin IVA. Se redondea por renglón para que los
// renglones del PDF sumen exactamente el neto.
export function precioUnitario(costoUnitario: number, factor: number) {
  return redondear(costoUnitario * factor);
}

type ItemParaTotales = Pick<
  ItemCotizacion,
  "rubro" | "cantidad" | "costo_unitario" | "alicuota_iva"
>;

export function calcularTotales(
  items: ItemParaTotales[],
  pctImprevistos: number,
  pctMargen: number,
) {
  const factor = factorVenta(pctImprevistos, pctMargen);
  const costoPorRubro = { material: 0, mano_obra: 0, viaje: 0, otro: 0 } as Record<Rubro, number>;
  const netoPorAlicuota = new Map<number, number>();
  let costo = 0;
  let neto = 0;

  for (const item of items) {
    const costoRenglon = redondear(item.cantidad * item.costo_unitario);
    const netoRenglon = redondear(item.cantidad * precioUnitario(item.costo_unitario, factor));
    costoPorRubro[item.rubro] += costoRenglon;
    costo += costoRenglon;
    neto += netoRenglon;
    netoPorAlicuota.set(
      item.alicuota_iva,
      (netoPorAlicuota.get(item.alicuota_iva) ?? 0) + netoRenglon,
    );
  }

  const ivaPorAlicuota = [...netoPorAlicuota.entries()]
    .sort(([a], [b]) => b - a)
    .map(([alicuota, base]) => ({
      alicuota,
      base: redondear(base),
      iva: redondear((base * alicuota) / 100),
    }));
  const iva = redondear(ivaPorAlicuota.reduce((suma, a) => suma + a.iva, 0));
  costo = redondear(costo);
  neto = redondear(neto);
  const imprevistos = redondear((costo * pctImprevistos) / 100);

  return {
    costoPorRubro,
    costo,
    imprevistos,
    margen: redondear(neto - costo - imprevistos),
    neto,
    ivaPorAlicuota,
    iva,
    total: redondear(neto + iva),
  };
}

export type Totales = ReturnType<typeof calcularTotales>;

// "10,5" → 10.5 para mostrar alícuotas.
export function formatearAlicuota(alicuota: number) {
  return `${String(alicuota).replace(".", ",")}%`;
}
