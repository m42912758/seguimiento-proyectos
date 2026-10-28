"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteConSesion, type EstadoFormulario } from "@/lib/sesion";

export async function guardarTipoTrabajo(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const nombre = String(datos.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Falta el nombre." };

  const supabase = await clienteConSesion();
  const id = Number(datos.get("id")) || null;
  const { error } = id
    ? await supabase.from("tipos_trabajo").update({ nombre }).eq("id", id)
    : await supabase.from("tipos_trabajo").insert({ nombre });
  if (error?.code === "23505") return { error: "Ya existe un tipo con ese nombre." };
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidatePath("/catalogo/tipos-trabajo", "layout");
  redirect("/catalogo/tipos-trabajo");
}
