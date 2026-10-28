"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cuitValido, soloDigitos } from "@/lib/cuit";
import { clienteConSesion, type EstadoFormulario } from "@/lib/sesion";
import { CONDICIONES_IVA } from "./datos";

export async function guardarCliente(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const texto = (campo: string) => String(datos.get(campo) ?? "").trim() || null;

  const nombre = texto("nombre");
  const cuit = texto("cuit");
  const condicion_iva = String(datos.get("condicion_iva"));
  const email = texto("email");

  if (!nombre) return { error: "Falta el nombre." };
  if (cuit && !cuitValido(cuit)) {
    return { error: "El CUIT no es válido. Revisá los 11 números." };
  }
  if (!(condicion_iva in CONDICIONES_IVA)) {
    return { error: "Elegí la condición frente al IVA." };
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "El email no parece válido." };
  }

  const fila = {
    nombre,
    cuit: cuit && soloDigitos(cuit),
    condicion_iva,
    telefono: texto("telefono"),
    email,
    direccion: texto("direccion"),
    notas: texto("notas"),
  };

  const supabase = await clienteConSesion();
  const id = Number(datos.get("id")) || null;
  const { error } = id
    ? await supabase.from("clientes").update(fila).eq("id", id)
    : await supabase.from("clientes").insert(fila);
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidatePath("/clientes", "layout");
  redirect("/clientes");
}
