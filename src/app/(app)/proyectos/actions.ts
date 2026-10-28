"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HORAS_JORNADA } from "@/app/(app)/empleados/datos";
import { hoyISO, leerNumero } from "@/lib/formato";
import { clienteConSesion, type EstadoFormulario } from "@/lib/sesion";
import { ESTADOS_CON_CARGA, costoHoraExtra, type EstadoProyecto } from "./datos";

type Supabase = Awaited<ReturnType<typeof clienteConSesion>>;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function lector(datos: FormData) {
  return (campo: string) => String(datos.get(campo) ?? "").trim();
}

async function estadoProyecto(supabase: Supabase, id: number) {
  const { data } = await supabase
    .from("proyectos")
    .select("estado")
    .eq("id", id)
    .maybeSingle<{ estado: EstadoProyecto }>();
  return data?.estado ?? null;
}

async function admiteCarga(supabase: Supabase, proyectoId: number) {
  const estado = await estadoProyecto(supabase, proyectoId);
  return estado != null && ESTADOS_CON_CARGA.includes(estado);
}

function revalidar() {
  revalidatePath("/proyectos", "layout");
}

// Empezar obra ----------------------------------------------------------------
// La cotización aceptada queda fija como línea base y el proyecto pasa a
// ejecución. Después se elige quiénes trabajan en la obra.
export async function empezarObra(cotizacionId: number): Promise<EstadoFormulario> {
  const supabase = await clienteConSesion();
  const { data: cotizacion } = await supabase
    .from("cotizaciones")
    .select("estado, proyecto_id")
    .eq("id", cotizacionId)
    .maybeSingle();
  if (cotizacion?.estado !== "aceptada") {
    return { error: "Solo se empieza la obra de una cotización aceptada." };
  }
  if ((await estadoProyecto(supabase, cotizacion.proyecto_id)) !== "aceptado") {
    return { error: "La obra ya estaba empezada." };
  }

  const { error } = await supabase
    .from("proyectos")
    .update({ estado: "en_ejecucion", fecha_inicio_real: hoyISO() })
    .eq("id", cotizacion.proyecto_id);
  if (error) return { error: "No se pudo empezar la obra. Probá de nuevo." };

  revalidar();
  revalidatePath("/cotizaciones", "layout");
  redirect(`/proyectos/${cotizacion.proyecto_id}/equipo?inicio=1`);
}

// Equipo: quiénes trabajan y el valor de su jornada en esta obra --------------
export async function guardarEquipo(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const texto = lector(datos);
  const proyectoId = Number(texto("proyecto_id"));
  const supabase = await clienteConSesion();
  if (!(await admiteCarga(supabase, proyectoId))) {
    return { error: "El proyecto no está en ejecución." };
  }

  const elegidos = datos.getAll("empleado_id").map(Number).filter(Boolean);
  const filas = [];
  for (const empleadoId of elegidos) {
    const jornal = leerNumero(texto(`jornal_${empleadoId}`));
    if (jornal == null || jornal < 0) {
      return { error: "Revisá los valores de la jornada: tienen que ser números." };
    }
    filas.push({ proyecto_id: proyectoId, empleado_id: empleadoId, jornal });
  }

  if (filas.length > 0) {
    const { error } = await supabase
      .from("proyecto_empleados")
      .upsert(filas, { onConflict: "proyecto_id,empleado_id" });
    if (error) return { error: "No se pudo guardar. Probá de nuevo." };
  }
  // Los que se destildaron salen del equipo; sus horas ya cargadas quedan.
  let borrar = supabase.from("proyecto_empleados").delete().eq("proyecto_id", proyectoId);
  if (elegidos.length > 0) borrar = borrar.not("empleado_id", "in", `(${elegidos.join(",")})`);
  const { error } = await borrar;
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidar();
  redirect(`/proyectos/${proyectoId}`);
}

// Horas -----------------------------------------------------------------------
// Al cargar se pueden tildar varios empleados con las mismas horas: se guarda
// un parte por cada uno, con el costo por hora de su jornal en esta obra.
export async function guardarHoras(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const texto = lector(datos);
  const proyectoId = Number(texto("proyecto_id"));
  const id = Number(texto("id")) || null;
  const fecha = texto("fecha") || hoyISO();
  const normales = leerNumero(texto("horas_normales")) ?? 0;
  const extra = leerNumero(texto("horas_extra")) ?? 0;
  const nota = texto("nota") || null;

  if (!FECHA.test(fecha)) return { error: "La fecha no es válida." };
  if (normales < 0 || extra < 0 || normales > 24 || extra > 24) {
    return { error: "Las horas tienen que ser números entre 0 y 24." };
  }
  if (normales + extra <= 0) return { error: "Cargá al menos una hora." };

  const supabase = await clienteConSesion();
  if (!(await admiteCarga(supabase, proyectoId))) {
    return { error: "El proyecto no está en ejecución." };
  }

  if (id) {
    const { error } = await supabase
      .from("partes_horas")
      .update({ fecha, horas_normales: normales, horas_extra: extra, nota })
      .eq("id", id)
      .eq("proyecto_id", proyectoId);
    if (error) return { error: "No se pudo guardar. Probá de nuevo." };
  } else {
    const elegidos = datos.getAll("empleado_id").map(Number).filter(Boolean);
    if (elegidos.length === 0) return { error: "Tildá quién trabajó." };

    const { data: equipo } = await supabase
      .from("proyecto_empleados")
      .select("empleado_id, jornal")
      .eq("proyecto_id", proyectoId)
      .in("empleado_id", elegidos);
    const jornales = new Map((equipo ?? []).map((e) => [e.empleado_id, e.jornal as number]));
    if (jornales.size !== elegidos.length) {
      return { error: "Alguien no está en el equipo de la obra. Recargá la página." };
    }

    const filas = elegidos.map((empleadoId) => {
      const costoHora = Math.round((jornales.get(empleadoId)! / HORAS_JORNADA) * 100) / 100;
      return {
        proyecto_id: proyectoId,
        empleado_id: empleadoId,
        fecha,
        horas_normales: normales,
        horas_extra: extra,
        costo_hora_aplicado: costoHora,
        costo_hora_extra_aplicado: costoHoraExtra(costoHora),
        nota,
      };
    });
    const { error } = await supabase.from("partes_horas").insert(filas);
    if (error) return { error: "No se pudo guardar. Probá de nuevo." };
  }

  revalidar();
  redirect(`/proyectos/${proyectoId}`);
}

export async function eliminarParte(proyectoId: number, id: number) {
  const supabase = await clienteConSesion();
  const { error } = await supabase
    .from("partes_horas")
    .delete()
    .eq("id", id)
    .eq("proyecto_id", proyectoId);
  if (error) throw new Error("No se pudo eliminar.");
  revalidar();
  redirect(`/proyectos/${proyectoId}`);
}

// Viajes ----------------------------------------------------------------------
export async function guardarViaje(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const texto = lector(datos);
  const proyectoId = Number(texto("proyecto_id"));
  const id = Number(texto("id")) || null;
  const fecha = texto("fecha") || hoyISO();
  const vehiculoId = Number(texto("vehiculo_id")) || null;
  const km = leerNumero(texto("km"));
  const peajes = leerNumero(texto("peajes")) ?? 0;
  const costoManual = leerNumero(texto("costo_por_km"));

  if (!FECHA.test(fecha)) return { error: "La fecha no es válida." };
  if (km == null || km <= 0) return { error: "Faltan los km recorridos." };
  if (peajes < 0) return { error: "Los peajes tienen que ser un número." };

  const supabase = await clienteConSesion();
  if (!(await admiteCarga(supabase, proyectoId))) {
    return { error: "El proyecto no está en ejecución." };
  }

  // El costo por km se copia del vehículo al cargar; al editar se conserva
  // salvo que se cambie de vehículo. Sin vehículo se escribe a mano.
  let costoKm: number | null = null;
  if (id) {
    const { data: actual } = await supabase
      .from("viajes")
      .select("vehiculo_id, costo_por_km_aplicado")
      .eq("id", id)
      .maybeSingle();
    if (actual && actual.vehiculo_id === vehiculoId && vehiculoId) {
      costoKm = actual.costo_por_km_aplicado;
    }
  }
  if (costoKm == null && vehiculoId) {
    const { data: vehiculo } = await supabase
      .from("vehiculos")
      .select("costo_por_km")
      .eq("id", vehiculoId)
      .maybeSingle();
    costoKm = vehiculo?.costo_por_km ?? null;
  }
  if (costoKm == null) costoKm = costoManual;
  if (costoKm == null || costoKm < 0) return { error: "Falta el costo por km." };

  const fila = {
    proyecto_id: proyectoId,
    vehiculo_id: vehiculoId,
    fecha,
    km,
    costo_por_km_aplicado: costoKm,
    peajes,
    destino: texto("destino") || null,
    quienes: texto("quienes") || null,
    nota: texto("nota") || null,
  };
  const { error } = id
    ? await supabase.from("viajes").update(fila).eq("id", id).eq("proyecto_id", proyectoId)
    : await supabase.from("viajes").insert(fila);
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidar();
  redirect(`/proyectos/${proyectoId}`);
}

export async function eliminarViaje(proyectoId: number, id: number) {
  const supabase = await clienteConSesion();
  const { error } = await supabase
    .from("viajes")
    .delete()
    .eq("id", id)
    .eq("proyecto_id", proyectoId);
  if (error) throw new Error("No se pudo eliminar.");
  revalidar();
  redirect(`/proyectos/${proyectoId}`);
}
