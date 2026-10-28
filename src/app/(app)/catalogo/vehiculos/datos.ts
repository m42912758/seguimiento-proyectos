export type TipoCombustible = "nafta" | "gasoil" | "gnc";

// El GNC se vende por m³; nafta y gasoil por litro.
export const COMBUSTIBLES: Record<TipoCombustible, { nombre: string; unidad: string }> = {
  nafta: { nombre: "Nafta", unidad: "litro" },
  gasoil: { nombre: "Gasoil", unidad: "litro" },
  gnc: { nombre: "GNC", unidad: "m³" },
};

export function leerCombustible(valor: unknown): TipoCombustible | null {
  return typeof valor === "string" && valor in COMBUSTIBLES
    ? (valor as TipoCombustible)
    : null;
}

export type Vehiculo = {
  id: number;
  nombre: string;
  patente: string | null;
  tipo_combustible: TipoCombustible;
  consumo_l_100km: number | null;
  precio_litro: number | null;
  mantenimiento_anual: number | null; // service, cubiertas, frenos, seguro y patente
  km_por_anio: number | null;
  valor_compra: number | null;
  valor_reventa: number | null;
  km_vida_util: number | null;
  costo_por_km: number; // resultado guardado de la calculadora
  fecha_costo: string;
  activo: boolean;
};

export type PrecioCombustible = {
  id: number;
  fecha: string;
  tipo: TipoCombustible;
  precio_litro: number;
};

export type DatosCosto = Pick<
  Vehiculo,
  | "consumo_l_100km"
  | "precio_litro"
  | "mantenimiento_anual"
  | "km_por_anio"
  | "valor_compra"
  | "valor_reventa"
  | "km_vida_util"
>;

// costo por km = consumo / 100 × precio del litro
//              + mantenimiento anual / km por año
//              + (valor de compra − valor de reventa) / km de vida útil
// Cada parte queda en null si le faltan datos y no suma al total.
export function calcularCostoPorKm(d: DatosCosto) {
  const combustible =
    d.consumo_l_100km != null && d.precio_litro != null
      ? (d.consumo_l_100km / 100) * d.precio_litro
      : null;
  const mantenimiento =
    d.mantenimiento_anual != null && d.km_por_anio
      ? d.mantenimiento_anual / d.km_por_anio
      : null;
  const desgaste =
    d.valor_compra != null && d.km_vida_util
      ? Math.max(0, d.valor_compra - (d.valor_reventa ?? 0)) / d.km_vida_util
      : null;
  const total =
    Math.round(((combustible ?? 0) + (mantenimiento ?? 0) + (desgaste ?? 0)) * 100) / 100;
  return { combustible, mantenimiento, desgaste, total };
}

// El precio más reciente de cada tipo, de una lista ordenada por fecha descendente.
export function ultimosPrecios(precios: PrecioCombustible[]) {
  const ultimos: Partial<Record<TipoCombustible, PrecioCombustible>> = {};
  for (const p of precios) ultimos[p.tipo] ??= p;
  return ultimos;
}
