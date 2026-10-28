import ExcelJS from "exceljs";
import { leerNumero } from "@/lib/formato";
import { leerAlicuota, type Material } from "./datos";

// Planilla de materiales: se descarga, se edita en Excel y se vuelve a subir.
// La columna ID identifica cada material; las filas sin ID son nuevas.

const HOJA = "Materiales";

const COLUMNAS = [
  { header: "ID (no tocar)", key: "id", width: 12 },
  { header: "Descripción", key: "descripcion", width: 45 },
  { header: "Unidad", key: "unidad", width: 10 },
  { header: "Precio sin IVA", key: "precio", width: 16 },
  { header: "IVA % (21 o 10,5)", key: "alicuota_iva", width: 18 },
  { header: "Proveedor", key: "proveedor", width: 24 },
  { header: "Fecha del precio", key: "fecha_precio", width: 18 },
];

export async function generarPlanilla(materiales: Material[]) {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet(HOJA, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  hoja.columns = COLUMNAS;

  for (const m of materiales) {
    hoja.addRow({
      ...m,
      fecha_precio: fechaExcel(m.fecha_precio),
    });
  }

  hoja.getRow(1).font = { bold: true };
  hoja.getColumn("precio").numFmt = "#,##0.00";
  hoja.getColumn("fecha_precio").numFmt = "dd/mm/yyyy";
  hoja.getColumn("id").font = { color: { argb: "FF888888" } };

  const ayuda = libro.addWorksheet("Instrucciones");
  ayuda.getColumn(1).width = 100;
  [
    "Cómo usar esta planilla",
    "",
    "• Para cambiar un precio, editalo en su fila. Si no cambiás la fecha, al subirla se pone la de hoy.",
    "• Para agregar un material, completá una fila nueva dejando el ID vacío.",
    "• No cambies ni copies los ID: es lo que permite saber qué material es cada fila.",
    "• Borrar una fila no borra el material. Para darlo de baja, hacelo desde la app.",
    "• IVA: 21 o 10,5. Si lo dejás vacío se toma 21.",
    "• Unidad: u, m, kg, l, rollo, caja… Si la dejás vacía se toma u.",
    "• Al subirla, la app te muestra qué va a cambiar antes de aplicarlo.",
  ].forEach((texto, i) => {
    ayuda.getCell(i + 1, 1).value = texto;
  });
  ayuda.getCell(1, 1).font = { bold: true, size: 14 };

  return libro.xlsx.writeBuffer();
}

export type FilaPlanilla = {
  fila: number;
  id: number | null;
  descripcion: string;
  unidad: string;
  precio: number;
  alicuota_iva: number;
  proveedor: string | null;
  fecha_precio: string | null;
};

export async function leerPlanilla(contenido: ArrayBuffer) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(contenido);
  const hoja = libro.getWorksheet(HOJA) ?? libro.worksheets[0];
  if (!hoja) return { filas: [], errores: ["La planilla está vacía."] };

  const filas: FilaPlanilla[] = [];
  const errores: string[] = [];

  hoja.eachRow((row, numero) => {
    if (numero === 1) return;
    const celda = (columna: number) => valorCelda(row.getCell(columna));
    const valores = [1, 2, 3, 4, 5, 6, 7].map(celda);
    if (valores.every((v) => v === null || v === "")) return;

    const [id, descripcion, unidad, precio, alicuota, proveedor, fecha] = valores;
    const problemas: string[] = [];

    const idNumero = id === null || id === "" ? null : Number(id);
    if (idNumero !== null && !Number.isInteger(idNumero)) problemas.push("el ID no es válido");

    const textoDescripcion = String(descripcion ?? "").trim();
    if (!textoDescripcion) problemas.push("falta la descripción");

    const precioNumero =
      typeof precio === "number" ? precio : leerNumero(String(precio ?? ""));
    if (precioNumero === null || precioNumero < 0) {
      problemas.push("el precio no es un número");
    }

    const alicuotaNumero =
      alicuota === null || alicuota === "" ? 21 : leerAlicuota(alicuota);
    if (alicuotaNumero === null) problemas.push("el IVA tiene que ser 21 o 10,5");

    const fechaIso = fecha === null || fecha === "" ? null : leerFecha(fecha);
    if (fecha !== null && fecha !== "" && !fechaIso) {
      problemas.push("la fecha tiene que ser dd/mm/aaaa");
    }

    if (problemas.length > 0) {
      errores.push(`Fila ${numero}: ${problemas.join(", ")}.`);
      return;
    }

    filas.push({
      fila: numero,
      id: idNumero,
      descripcion: textoDescripcion,
      unidad: String(unidad ?? "").trim() || "u",
      precio: Math.round(precioNumero! * 100) / 100,
      alicuota_iva: alicuotaNumero!,
      proveedor: String(proveedor ?? "").trim() || null,
      fecha_precio: fechaIso,
    });
  });

  return { filas, errores };
}

// Valor "plano" de una celda: resuelve fórmulas, texto con formato y links.
function valorCelda(celda: ExcelJS.Cell): string | number | Date | null {
  const v = celda.value;
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || v instanceof Date) return v;
  if (typeof v === "boolean") return String(v);
  if ("result" in v) {
    const r = v.result;
    return typeof r === "number" || typeof r === "string" || r instanceof Date ? r : null;
  }
  if ("richText" in v) return v.richText.map((t) => t.text).join("").trim();
  if ("text" in v) return String(v.text).trim();
  return null;
}

// Excel guarda las fechas sin zona horaria; ExcelJS las devuelve en UTC.
function fechaExcel(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

function leerFecha(valor: string | number | Date) {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor.toISOString().slice(0, 10);
  }
  const partes = String(valor).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!partes) return null;
  const [, dia, mes, anio] = partes;
  const iso = `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}
