"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cuitValido, soloDigitos } from "@/lib/cuit";
import { clienteConSesion, type EstadoFormulario } from "@/lib/sesion";
import { LARGO_MAXIMO_LOGO } from "./datos";

export async function guardarMisDatos(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const texto = (campo: string) => String(datos.get(campo) ?? "").trim();

  const razon_social = texto("razon_social");
  const cuit = texto("cuit");
  const logo = texto("logo") || null;

  if (!razon_social) return { error: "Falta el nombre o razón social." };
  if (cuit && !cuitValido(cuit)) return { error: "El CUIT no es válido. Revisá los números." };
  if (logo && (!/^data:image\/(png|jpeg);base64,/.test(logo) || logo.length > LARGO_MAXIMO_LOGO)) {
    return { error: "El logo no es válido o es demasiado grande. Probá con otra imagen." };
  }

  const supabase = await clienteConSesion();
  const { error } = await supabase.from("mis_datos").upsert({
    razon_social,
    nombre_fantasia: texto("nombre_fantasia") || null,
    cuit: cuit ? soloDigitos(cuit) : null,
    telefono: texto("telefono") || null,
    email: texto("email") || null,
    direccion: texto("direccion") || null,
    logo,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidatePath("/", "layout");
  redirect("/");
}
