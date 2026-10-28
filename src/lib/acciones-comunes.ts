"use server";

import { revalidatePath } from "next/cache";
import { clienteConSesion } from "@/lib/sesion";

const TABLAS = {
  clientes: "/clientes",
  empleados: "/empleados",
  materiales: "/catalogo/materiales",
  vehiculos: "/catalogo/vehiculos",
  tipos_trabajo: "/catalogo/tipos-trabajo",
} as const;

export type TablaCatalogo = keyof typeof TABLAS;

// Dar de baja o reactivar: nunca se borra, para no romper el historial.
export async function cambiarActivo(
  tabla: TablaCatalogo,
  id: number,
  activo: boolean,
) {
  if (!(tabla in TABLAS)) throw new Error("Tabla inválida.");

  const supabase = await clienteConSesion();
  const { error } = await supabase.from(tabla).update({ activo }).eq("id", id);
  if (error) throw new Error("No se pudo guardar el cambio.");

  revalidatePath(TABLAS[tabla], "layout");
}
