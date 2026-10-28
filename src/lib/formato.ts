// Formatos de la interfaz (es-AR) y lectura de números escritos a mano.

const moneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

const numero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export function formatearMoneda(valor: number) {
  return moneda.format(valor);
}

export function formatearNumero(valor: number) {
  return numero.format(valor);
}

// "2026-10-28" → "28/10/2026", sin pasar por Date para no correr el día por
// la zona horaria.
export function formatearFecha(iso: string) {
  const [anio, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

// Fecha de hoy en Argentina, en formato ISO para inputs type="date".
export function hoyISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

export function diasDesde(iso: string) {
  const desde = Date.parse(iso.slice(0, 10));
  const hoy = Date.parse(hoyISO());
  return Math.round((hoy - desde) / 86_400_000);
}

// Acepta "1.234,56", "1234,56", "1234.56" o "1.500" (mil quinientos).
// Devuelve null si el texto está vacío o no es un número.
export function leerNumero(texto: string | null | undefined) {
  let limpio = String(texto ?? "").replace(/[\s$]/g, "");
  if (limpio === "") return null;

  if (limpio.includes(",")) {
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(limpio)) {
    limpio = limpio.replace(/\./g, "");
  }

  const valor = Number(limpio);
  return Number.isFinite(valor) ? valor : null;
}

// Valor inicial de un input numérico: coma decimal y sin separador de miles.
export function numeroParaInput(valor: number | null | undefined) {
  return valor == null ? "" : String(valor).replace(".", ",");
}
