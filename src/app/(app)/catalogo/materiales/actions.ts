"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hoyISO, leerNumero } from "@/lib/formato";
import { clienteConSesion, type EstadoFormulario } from "@/lib/sesion";
import { leerAlicuota, type Material } from "./datos";
import { leerPlanilla, type FilaPlanilla } from "./planilla";

export async function guardarMaterial(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const texto = (campo: string) => String(datos.get(campo) ?? "").trim();

  const descripcion = texto("descripcion");
  const precio = leerNumero(texto("precio"));
  const alicuota_iva = leerAlicuota(texto("alicuota_iva"));
  const fecha = texto("fecha_precio");

  if (!descripcion) return { error: "Falta la descripción." };
  if (precio == null || precio < 0) {
    return { error: "El precio tiene que ser un número." };
  }
  if (alicuota_iva == null) return { error: "Elegí el IVA: 21% o 10,5%." };

  // Si cambió el precio pero no la fecha, el precio nuevo es de hoy.
  const cambioPrecio = leerNumero(texto("precio_original")) !== precio;
  const fecha_precio =
    !fecha || (cambioPrecio && fecha === texto("fecha_original")) ? hoyISO() : fecha;

  const fila = {
    descripcion,
    unidad: texto("unidad") || "u",
    precio,
    alicuota_iva,
    proveedor: texto("proveedor") || null,
    fecha_precio,
  };

  const supabase = await clienteConSesion();
  const id = Number(datos.get("id")) || null;
  const { error } = id
    ? await supabase.from("materiales").update(fila).eq("id", id)
    : await supabase.from("materiales").insert(fila);
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidatePath("/catalogo/materiales", "layout");
  redirect("/catalogo/materiales");
}

export type ResultadoPlanilla =
  | { error: string }
  | { errores: string[] }
  | { nuevos: number; actualizados: number; sinCambios: number; aplicado: boolean }
  | null;

const TAMANIO_MAXIMO = 900 * 1024; // las Server Actions aceptan hasta 1 MB

// Primero se llama con confirmar=0 para mostrar qué va a cambiar; si está
// todo bien, se vuelve a mandar el mismo archivo con confirmar=1.
export async function importarPlanilla(
  _estadoAnterior: ResultadoPlanilla,
  datos: FormData,
): Promise<ResultadoPlanilla> {
  const archivo = datos.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Elegí la planilla." };
  }
  if (!archivo.name.toLowerCase().endsWith(".xlsx")) {
    return { error: "Tiene que ser una planilla de Excel (.xlsx)." };
  }
  if (archivo.size > TAMANIO_MAXIMO) {
    return { error: "La planilla es demasiado grande (máximo 900 KB)." };
  }

  const supabase = await clienteConSesion();

  let leida;
  try {
    leida = await leerPlanilla(await archivo.arrayBuffer());
  } catch {
    return { error: "No se pudo leer el archivo. ¿Es la planilla descargada de la app?" };
  }
  const { filas, errores } = leida;

  const { data: existentes } = await supabase
    .from("materiales")
    .select("*")
    .returns<Material[]>();
  const porId = new Map((existentes ?? []).map((m) => [m.id, m]));

  const vistos = new Set<number>();
  for (const f of filas) {
    if (f.id === null) continue;
    if (!porId.has(f.id)) errores.push(`Fila ${f.fila}: el ID ${f.id} no existe.`);
    else if (vistos.has(f.id)) errores.push(`Fila ${f.fila}: el ID ${f.id} está repetido.`);
    vistos.add(f.id);
  }
  if (errores.length > 0) return { errores };
  if (filas.length === 0) return { error: "La planilla no tiene materiales." };

  const hoy = hoyISO();
  const nuevos = filas
    .filter((f) => f.id === null)
    .map((f) => ({ ...sinMeta(f), fecha_precio: f.fecha_precio ?? hoy }));

  const cambios: { id: number; fila: ReturnType<typeof sinMeta> & { fecha_precio: string } }[] = [];
  for (const f of filas) {
    if (f.id === null) continue;
    const actual = porId.get(f.id)!;
    const cambioPrecio = actual.precio !== f.precio;
    // Fecha vacía o sin tocar con precio nuevo: el precio es de hoy.
    const fecha_precio =
      cambioPrecio && (!f.fecha_precio || f.fecha_precio === actual.fecha_precio)
        ? hoy
        : (f.fecha_precio ?? actual.fecha_precio);
    const fila = { ...sinMeta(f), fecha_precio };

    const igual =
      actual.descripcion === fila.descripcion &&
      actual.unidad === fila.unidad &&
      actual.precio === fila.precio &&
      actual.alicuota_iva === fila.alicuota_iva &&
      actual.proveedor === fila.proveedor &&
      actual.fecha_precio === fila.fecha_precio;
    if (!igual) cambios.push({ id: f.id, fila });
  }

  const resumen = {
    nuevos: nuevos.length,
    actualizados: cambios.length,
    sinCambios: filas.length - nuevos.length - cambios.length,
  };
  if (datos.get("confirmar") !== "1") return { ...resumen, aplicado: false };

  // Primero las actualizaciones: si algo falla, volver a subir la planilla no
  // duplica los materiales nuevos.
  for (let i = 0; i < cambios.length; i += 20) {
    const tanda = cambios.slice(i, i + 20);
    const resultados = await Promise.all(
      tanda.map(({ id, fila }) =>
        supabase.from("materiales").update(fila).eq("id", id),
      ),
    );
    if (resultados.some((r) => r.error)) {
      return { error: "Algunos materiales no se pudieron actualizar. Probá de nuevo." };
    }
  }
  if (nuevos.length > 0) {
    const { error } = await supabase.from("materiales").insert(nuevos);
    if (error) return { error: "No se pudieron agregar los materiales nuevos." };
  }

  revalidatePath("/catalogo/materiales", "layout");
  return { ...resumen, aplicado: true };
}

// Los datos del material, sin el número de fila, el ID ni la fecha.
function sinMeta(f: FilaPlanilla) {
  return {
    descripcion: f.descripcion,
    unidad: f.unidad,
    precio: f.precio,
    alicuota_iva: f.alicuota_iva,
    proveedor: f.proveedor,
  };
}
