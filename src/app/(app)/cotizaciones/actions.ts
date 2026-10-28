"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HORAS_JORNADA } from "@/app/(app)/empleados/datos";
import { leerAlicuota } from "@/app/(app)/catalogo/materiales/datos";
import { hoyISO, leerNumero, sumarDias } from "@/lib/formato";
import { clienteConSesion, type EstadoFormulario } from "@/lib/sesion";
import {
  DIAS_VALIDEZ,
  calcularTotales,
  leerRubro,
  type Cotizacion,
  type ItemCotizacion,
} from "./datos";

type Supabase = Awaited<ReturnType<typeof clienteConSesion>>;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function lector(datos: FormData) {
  return (campo: string) => String(datos.get(campo) ?? "").trim();
}

async function leerCotizacion(supabase: Supabase, id: number) {
  const { data } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("id", id)
    .returns<Cotizacion[]>()
    .maybeSingle();
  return data;
}

// Recalcula y guarda los totales a partir de los ítems.
async function actualizarTotales(supabase: Supabase, cotizacion: Cotizacion) {
  const { data: items } = await supabase
    .from("cotizacion_items")
    .select("rubro, cantidad, costo_unitario, alicuota_iva")
    .eq("cotizacion_id", cotizacion.id)
    .returns<ItemCotizacion[]>();
  const t = calcularTotales(items ?? [], cotizacion.pct_imprevistos, cotizacion.pct_margen);
  await supabase
    .from("cotizaciones")
    .update({ total_costo: t.costo, total_neto: t.neto, total_iva: t.iva, total: t.total })
    .eq("id", cotizacion.id);
}

function revalidar() {
  revalidatePath("/cotizaciones", "layout");
}

// Error de validación con tipo propio, para que TypeScript distinga el
// resultado con "error" del resultado con los datos leídos.
function fallo(error: string): { error: string } {
  return { error };
}

// Datos de la cotización y del proyecto: cliente, nombre, %, vencimiento… --
function leerEncabezado(datos: FormData) {
  const texto = lector(datos);
  const nombre = texto("nombre");
  const cliente_id = Number(texto("cliente_id")) || null;
  const pct_imprevistos = leerNumero(texto("pct_imprevistos")) ?? 0;
  const pct_margen = leerNumero(texto("pct_margen")) ?? 0;
  const fecha = texto("fecha") || hoyISO();
  const vencimiento = texto("vencimiento") || null;

  if (!cliente_id) return fallo("Elegí el cliente.");
  if (!nombre) return fallo("Falta el nombre del trabajo.");
  if (pct_imprevistos < 0 || pct_imprevistos > 999 || pct_margen < 0 || pct_margen > 999) {
    return fallo("Los porcentajes tienen que ser números entre 0 y 999.");
  }
  if (!FECHA.test(fecha) || (vencimiento && !FECHA.test(vencimiento))) {
    return fallo("Revisá las fechas.");
  }
  if (vencimiento && vencimiento < fecha) {
    return fallo("El vencimiento no puede ser anterior a la fecha.");
  }

  return {
    proyecto: {
      nombre,
      cliente_id,
      tipo_trabajo_id: Number(texto("tipo_trabajo_id")) || null,
      direccion: texto("direccion") || null,
    },
    cotizacion: {
      fecha,
      vencimiento,
      pct_imprevistos,
      pct_margen,
      notas: texto("notas") || null,
    },
  };
}

export async function crearCotizacion(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const leido = leerEncabezado(datos);
  if ("error" in leido) return leido;

  const supabase = await clienteConSesion();

  // Código correlativo: P-0001, P-0002…
  const { data: ultimo } = await supabase
    .from("proyectos")
    .select("codigo")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  const numero = Number(String(ultimo?.codigo ?? "").replace(/\D/g, "")) || 0;
  const codigo = `P-${String(numero + 1).padStart(4, "0")}`;

  const { data: proyecto, error } = await supabase
    .from("proyectos")
    .insert({ ...leido.proyecto, codigo })
    .select("id")
    .single();
  if (error || !proyecto) return { error: "No se pudo crear. Probá de nuevo." };

  const { data: cotizacion, error: errorCotizacion } = await supabase
    .from("cotizaciones")
    .insert({ ...leido.cotizacion, proyecto_id: proyecto.id })
    .select("id")
    .single();
  if (errorCotizacion || !cotizacion) {
    await supabase.from("proyectos").delete().eq("id", proyecto.id);
    return { error: "No se pudo crear. Probá de nuevo." };
  }

  revalidar();
  redirect(`/cotizaciones/${cotizacion.id}`);
}

export async function guardarEncabezado(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const leido = leerEncabezado(datos);
  if ("error" in leido) return leido;

  const supabase = await clienteConSesion();
  const cotizacion = await leerCotizacion(supabase, Number(datos.get("id")));
  if (!cotizacion) return { error: "No se encontró la cotización." };
  if (cotizacion.estado !== "borrador") {
    return { error: "Solo se puede modificar un borrador. Creá una versión nueva." };
  }

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("proyectos").update(leido.proyecto).eq("id", cotizacion.proyecto_id),
    supabase.from("cotizaciones").update(leido.cotizacion).eq("id", cotizacion.id),
  ]);
  if (e1 || e2) return { error: "No se pudo guardar. Probá de nuevo." };
  await actualizarTotales(supabase, { ...cotizacion, ...leido.cotizacion });

  revalidar();
  redirect(`/cotizaciones/${cotizacion.id}`);
}

// Ítems -----------------------------------------------------------------------
function leerItem(datos: FormData) {
  const texto = lector(datos);
  const rubro = leerRubro(texto("rubro"));
  if (!rubro) return fallo("Rubro inválido.");

  const numero = (campo: string) => leerNumero(texto(campo));
  const alicuota_iva = leerAlicuota(texto("alicuota_iva"));
  if (alicuota_iva == null) return fallo("Elegí el IVA: 21% o 10,5%.");

  const vacio = {
    material_id: null,
    vehiculo_id: null,
    km_por_viaje: null,
    costo_por_km: null,
    peajes_por_viaje: null,
  };

  if (rubro === "viaje") {
    const viajes = numero("cantidad");
    const km = numero("km_por_viaje");
    const costoKm = numero("costo_por_km");
    const peajes = numero("peajes_por_viaje") ?? 0;
    if (viajes == null || viajes <= 0 || !Number.isInteger(viajes)) {
      return fallo("La cantidad de viajes tiene que ser un número entero.");
    }
    if (km == null || km <= 0) return fallo("Faltan los km de cada viaje.");
    if (costoKm == null || costoKm < 0) return fallo("Falta el costo por km.");
    if (peajes < 0) return fallo("Los peajes tienen que ser un número.");
    return {
      fila: {
        ...vacio,
        rubro,
        descripcion: texto("descripcion") || "Viajes",
        cantidad: viajes,
        unidad: "viaje",
        costo_unitario: Math.round((km * costoKm + peajes) * 100) / 100,
        alicuota_iva,
        vehiculo_id: Number(texto("vehiculo_id")) || null,
        km_por_viaje: km,
        costo_por_km: costoKm,
        peajes_por_viaje: peajes,
      },
    };
  }

  const descripcion = texto("descripcion");
  let cantidad = numero("cantidad");
  let costo = numero("costo_unitario");
  let unidad = texto("unidad") || "u";
  if (!descripcion) return fallo("Falta la descripción.");
  if (cantidad == null || cantidad <= 0) return fallo("La cantidad tiene que ser mayor que cero.");
  if (costo == null || costo < 0) return fallo("El costo tiene que ser un número.");

  // La mano de obra se guarda siempre en horas; un jornal son 8 h.
  if (rubro === "mano_obra") {
    if (texto("unidad") === "jornal") {
      cantidad *= HORAS_JORNADA;
      costo = Math.round((costo / HORAS_JORNADA) * 100) / 100;
    }
    unidad = "h";
  }

  return {
    fila: {
      ...vacio,
      rubro,
      descripcion,
      cantidad,
      unidad,
      costo_unitario: costo,
      alicuota_iva,
      material_id: rubro === "material" ? Number(texto("material_id")) || null : null,
    },
  };
}

export async function guardarItem(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const leido = leerItem(datos);
  if ("error" in leido) return leido;

  const supabase = await clienteConSesion();
  const cotizacion = await leerCotizacion(supabase, Number(datos.get("cotizacion_id")));
  if (!cotizacion) return { error: "No se encontró la cotización." };
  if (cotizacion.estado !== "borrador") {
    return { error: "Solo se puede modificar un borrador. Creá una versión nueva." };
  }

  const id = Number(datos.get("id")) || null;
  let error;
  if (id) {
    ({ error } = await supabase
      .from("cotizacion_items")
      .update(leido.fila)
      .eq("id", id)
      .eq("cotizacion_id", cotizacion.id));
  } else {
    const { data: ultimo } = await supabase
      .from("cotizacion_items")
      .select("orden")
      .eq("cotizacion_id", cotizacion.id)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await supabase
      .from("cotizacion_items")
      .insert({ ...leido.fila, cotizacion_id: cotizacion.id, orden: (ultimo?.orden ?? 0) + 1 }));
  }
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };
  await actualizarTotales(supabase, cotizacion);

  revalidar();
  // "Guardar y agregar otro" vuelve al formulario vacío del mismo rubro.
  if (datos.get("otro") === "1") {
    redirect(`/cotizaciones/${cotizacion.id}/items/nuevo?rubro=${leido.fila.rubro}`);
  }
  redirect(`/cotizaciones/${cotizacion.id}`);
}

export async function eliminarItem(cotizacionId: number, itemId: number) {
  const supabase = await clienteConSesion();
  const cotizacion = await leerCotizacion(supabase, cotizacionId);
  if (cotizacion?.estado !== "borrador") {
    throw new Error("Solo se puede modificar un borrador.");
  }
  const { error } = await supabase
    .from("cotizacion_items")
    .delete()
    .eq("id", itemId)
    .eq("cotizacion_id", cotizacionId);
  if (error) throw new Error("No se pudo eliminar.");
  await actualizarTotales(supabase, cotizacion);

  revalidar();
  redirect(`/cotizaciones/${cotizacionId}`);
}

// Estados y versiones ---------------------------------------------------------
export type CambioEstado = "enviar" | "volver_borrador" | "aceptar" | "rechazar" | "deshacer";

// Desde qué estado se puede hacer cada cambio, a cuál pasa la cotización y
// en qué estado queda el proyecto.
const CAMBIOS: Record<
  CambioEstado,
  { desde: string[]; hacia: string; proyecto: string }
> = {
  enviar: { desde: ["borrador"], hacia: "enviada", proyecto: "cotizando" },
  volver_borrador: { desde: ["enviada"], hacia: "borrador", proyecto: "cotizando" },
  aceptar: { desde: ["enviada"], hacia: "aceptada", proyecto: "aceptado" },
  rechazar: { desde: ["enviada"], hacia: "rechazada", proyecto: "rechazado" },
  deshacer: { desde: ["aceptada", "rechazada"], hacia: "enviada", proyecto: "cotizando" },
};

export async function cambiarEstado(
  cotizacionId: number,
  cambio: CambioEstado,
): Promise<EstadoFormulario> {
  const regla = CAMBIOS[cambio];
  if (!regla) return { error: "Cambio inválido." };

  const supabase = await clienteConSesion();
  const cotizacion = await leerCotizacion(supabase, cotizacionId);
  if (!cotizacion || !regla.desde.includes(cotizacion.estado)) {
    return { error: "La cotización cambió mientras tanto. Recargá la página." };
  }

  const { data: proyecto } = await supabase
    .from("proyectos")
    .select("estado")
    .eq("id", cotizacion.proyecto_id)
    .single();
  if (proyecto && !["cotizando", "aceptado", "rechazado"].includes(proyecto.estado)) {
    return { error: "El proyecto ya está en ejecución: la cotización aceptada queda fija." };
  }

  if (cambio === "enviar") {
    const { count } = await supabase
      .from("cotizacion_items")
      .select("id", { count: "exact", head: true })
      .eq("cotizacion_id", cotizacionId);
    if (!count) return { error: "Agregá al menos un ítem antes de enviarla." };
  }

  const { error } = await supabase
    .from("cotizaciones")
    .update({ estado: regla.hacia })
    .eq("id", cotizacionId)
    .eq("estado", cotizacion.estado);
  if (error) return { error: "No se pudo guardar el cambio." };
  await supabase
    .from("proyectos")
    .update({ estado: regla.proyecto })
    .eq("id", cotizacion.proyecto_id);

  revalidar();
  return null;
}

const COLUMNAS_ITEM =
  "rubro, descripcion, cantidad, unidad, costo_unitario, alicuota_iva, material_id, vehiculo_id, km_por_viaje, costo_por_km, peajes_por_viaje, orden";

// Copia la cotización como versión nueva en borrador; la anterior queda
// guardada como "reemplazada".
export async function nuevaVersion(cotizacionId: number): Promise<EstadoFormulario> {
  const supabase = await clienteConSesion();
  const cotizacion = await leerCotizacion(supabase, cotizacionId);
  if (!cotizacion || !["enviada", "rechazada"].includes(cotizacion.estado)) {
    return { error: "Solo se crea una versión nueva de una cotización enviada o rechazada." };
  }

  const [{ data: items }, { data: ultima }] = await Promise.all([
    supabase
      .from("cotizacion_items")
      .select(COLUMNAS_ITEM)
      .eq("cotizacion_id", cotizacionId)
      .returns<Omit<ItemCotizacion, "id" | "cotizacion_id">[]>(),
    supabase
      .from("cotizaciones")
      .select("version")
      .eq("proyecto_id", cotizacion.proyecto_id)
      .order("version", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const hoy = hoyISO();
  const { data: nueva, error } = await supabase
    .from("cotizaciones")
    .insert({
      proyecto_id: cotizacion.proyecto_id,
      version: (ultima?.version ?? cotizacion.version) + 1,
      fecha: hoy,
      vencimiento: sumarDias(hoy, DIAS_VALIDEZ),
      pct_imprevistos: cotizacion.pct_imprevistos,
      pct_margen: cotizacion.pct_margen,
      total_costo: cotizacion.total_costo,
      total_neto: cotizacion.total_neto,
      total_iva: cotizacion.total_iva,
      total: cotizacion.total,
      notas: cotizacion.notas,
    })
    .select("id")
    .single();
  if (error || !nueva) return { error: "No se pudo crear la versión nueva." };

  if (items && items.length > 0) {
    const copias = items.map((item) => ({ ...item, cotizacion_id: nueva.id }));
    const { error: errorItems } = await supabase.from("cotizacion_items").insert(copias);
    if (errorItems) {
      await supabase.from("cotizaciones").delete().eq("id", nueva.id);
      return { error: "No se pudo crear la versión nueva." };
    }
  }

  await Promise.all([
    supabase.from("cotizaciones").update({ estado: "reemplazada" }).eq("id", cotizacionId),
    supabase
      .from("proyectos")
      .update({ estado: "cotizando" })
      .eq("id", cotizacion.proyecto_id),
  ]);

  revalidar();
  redirect(`/cotizaciones/${nueva.id}`);
}

// Descartar un borrador: si es la primera versión se borra el proyecto
// entero; si no, vuelve a quedar vigente la versión anterior como enviada.
export async function eliminarBorrador(cotizacionId: number): Promise<EstadoFormulario> {
  const supabase = await clienteConSesion();
  const cotizacion = await leerCotizacion(supabase, cotizacionId);
  if (!cotizacion || cotizacion.estado !== "borrador") {
    return { error: "Solo se puede descartar un borrador." };
  }

  if (cotizacion.version === 1) {
    const { error } = await supabase
      .from("proyectos")
      .delete()
      .eq("id", cotizacion.proyecto_id);
    if (error) return { error: "No se pudo eliminar." };
    revalidar();
    redirect("/cotizaciones");
  }

  const { error } = await supabase.from("cotizaciones").delete().eq("id", cotizacionId);
  if (error) return { error: "No se pudo eliminar." };
  const { data: anterior } = await supabase
    .from("cotizaciones")
    .select("id")
    .eq("proyecto_id", cotizacion.proyecto_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (anterior) {
    await supabase.from("cotizaciones").update({ estado: "enviada" }).eq("id", anterior.id);
  }

  revalidar();
  redirect(anterior ? `/cotizaciones/${anterior.id}` : "/cotizaciones");
}
