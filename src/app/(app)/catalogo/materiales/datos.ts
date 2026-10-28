export type Material = {
  id: number;
  descripcion: string;
  unidad: string;
  precio: number; // sin IVA
  alicuota_iva: number;
  proveedor: string | null;
  fecha_precio: string;
  activo: boolean;
};

export const ALICUOTAS_IVA = [21, 10.5];

export const UNIDADES = ["u", "m", "kg", "l", "rollo", "caja", "juego"];

// Un precio con más días que esto se marca como desactualizado.
export const DIAS_PRECIO_VIEJO = 60;

export function precioConIva(precio: number, alicuota: number) {
  return Math.round(precio * (1 + alicuota / 100) * 100) / 100;
}

// Acepta 21, 10.5, "10,5", "21%", 0.21 o 0.105 (Excel con formato de %).
export function leerAlicuota(valor: unknown) {
  let numero =
    typeof valor === "number"
      ? valor
      : Number(String(valor ?? "").replace("%", "").replace(",", ".").trim());
  if (numero > 0 && numero < 1) numero = Math.round(numero * 1000) / 10;
  return ALICUOTAS_IVA.includes(numero) ? numero : null;
}
