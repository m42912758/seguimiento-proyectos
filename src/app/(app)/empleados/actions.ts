"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerNumero } from "@/lib/formato";
import { clienteConSesion, type EstadoFormulario } from "@/lib/sesion";

export async function guardarEmpleado(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const nombre = String(datos.get("nombre") ?? "").trim();
  const categoria = String(datos.get("categoria") ?? "").trim() || null;
  const jornal = leerNumero(String(datos.get("jornal_referencia")));

  if (!nombre) return { error: "Falta el nombre." };
  if (jornal == null || jornal < 0) {
    return { error: "El valor de la jornada tiene que ser un número." };
  }

  const fila = { nombre, categoria, jornal_referencia: jornal };

  const supabase = await clienteConSesion();
  const id = Number(datos.get("id")) || null;
  const { error } = id
    ? await supabase.from("empleados").update(fila).eq("id", id)
    : await supabase.from("empleados").insert(fila);
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidatePath("/empleados", "layout");
  redirect("/empleados");
}
