import type { ItemCotizacion } from "@/app/(app)/cotizaciones/datos";
import { createClient } from "@/lib/supabase/server";
import type { EstadoProyecto, ParteHoras, ProyectoEmpleado, Viaje } from "./datos";

export type ProyectoFicha = {
  id: number;
  codigo: string;
  nombre: string;
  estado: EstadoProyecto;
  direccion: string | null;
  cliente_id: number;
  fecha_inicio_real: string | null;
  clientes: { nombre: string };
};

export type MiembroEquipo = ProyectoEmpleado & { empleados: { nombre: string } };

// Todo lo que muestra la ficha de un proyecto: la cotización aceptada (lo
// planificado) y lo cargado en obra (lo real).
export async function leerProyecto(id: number) {
  const supabase = await createClient();
  const { data: proyecto } = await supabase
    .from("proyectos")
    .select("id, codigo, nombre, estado, direccion, cliente_id, fecha_inicio_real, clientes(nombre)")
    .eq("id", id)
    .returns<ProyectoFicha[]>()
    .maybeSingle();
  if (!proyecto) return null;

  const [{ data: cotizacion }, { data: equipo }, { data: partes }, { data: viajes }] =
    await Promise.all([
      supabase
        .from("cotizaciones")
        .select("id, version, pct_imprevistos, pct_margen, cotizacion_items(*)")
        .eq("proyecto_id", id)
        .eq("estado", "aceptada")
        .returns<
          {
            id: number;
            version: number;
            pct_imprevistos: number;
            pct_margen: number;
            cotizacion_items: ItemCotizacion[];
          }[]
        >()
        .maybeSingle(),
      supabase
        .from("proyecto_empleados")
        .select("*, empleados(nombre)")
        .eq("proyecto_id", id)
        .returns<MiembroEquipo[]>(),
      supabase
        .from("partes_horas")
        .select("*")
        .eq("proyecto_id", id)
        .order("fecha", { ascending: false })
        .order("id", { ascending: false })
        .returns<ParteHoras[]>(),
      supabase
        .from("viajes")
        .select("*")
        .eq("proyecto_id", id)
        .order("fecha", { ascending: false })
        .order("id", { ascending: false })
        .returns<Viaje[]>(),
    ]);

  return {
    proyecto,
    cotizacion,
    equipo: (equipo ?? []).sort((a, b) => a.empleados.nombre.localeCompare(b.empleados.nombre)),
    partes: partes ?? [],
    viajes: viajes ?? [],
  };
}

// Nombres para mostrar en los registros (incluye dados de baja).
export async function nombresCatalogo() {
  const supabase = await createClient();
  const [{ data: empleados }, { data: vehiculos }] = await Promise.all([
    supabase.from("empleados").select("id, nombre"),
    supabase.from("vehiculos").select("id, nombre"),
  ]);
  return {
    empleados: new Map((empleados ?? []).map((e) => [e.id as number, e.nombre as string])),
    vehiculos: new Map((vehiculos ?? []).map((v) => [v.id as number, v.nombre as string])),
  };
}
