"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hoyISO, leerNumero } from "@/lib/formato";
import { clienteConSesion, type EstadoFormulario } from "@/lib/sesion";
import {
  calcularCostoPorKm,
  leerCombustible,
  type DatosCosto,
  type Vehiculo,
} from "./datos";

const CAMPOS_COSTO = {
  consumo_l_100km: "El consumo",
  precio_litro: "El precio del combustible",
  mantenimiento_anual: "El mantenimiento anual",
  km_por_anio: "Los km por año",
  valor_compra: "El valor de compra",
  valor_reventa: "El valor de reventa",
  km_vida_util: "Los km de vida útil",
} as const;

const CAMPOS_KM = ["km_por_anio", "km_vida_util"];

export async function guardarVehiculo(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const texto = (campo: string) => String(datos.get(campo) ?? "").trim();

  const nombre = texto("nombre");
  const tipo_combustible = leerCombustible(texto("tipo_combustible"));
  if (!nombre) return { error: "Falta el nombre." };
  if (!tipo_combustible) return { error: "Elegí el combustible." };

  // Los datos de la calculadora son opcionales; vacío queda en null.
  const costo = {} as DatosCosto;
  for (const [campo, nombreCampo] of Object.entries(CAMPOS_COSTO)) {
    const t = texto(campo);
    const valor = t === "" ? null : leerNumero(t);
    if (t !== "" && (valor == null || valor < 0)) {
      return { error: `${nombreCampo} tiene que ser un número.` };
    }
    if (valor != null && CAMPOS_KM.includes(campo)) {
      if (!Number.isInteger(valor) || valor <= 0) {
        return { error: `${nombreCampo} tiene que ser un número entero mayor que cero.` };
      }
    }
    costo[campo as keyof DatosCosto] = valor;
  }

  // Se recalcula acá: no se confía en lo que muestra el navegador.
  const { total } = calcularCostoPorKm(costo);
  if (total <= 0) {
    return { error: "Completá al menos el consumo y el precio del combustible." };
  }

  const cambioCosto = leerNumero(texto("costo_original")) !== total;
  const fila = {
    nombre,
    patente: texto("patente").toUpperCase() || null,
    tipo_combustible,
    ...costo,
    costo_por_km: total,
    ...(cambioCosto ? { fecha_costo: hoyISO() } : {}),
  };

  const supabase = await clienteConSesion();
  const id = Number(datos.get("id")) || null;
  const { error } = id
    ? await supabase.from("vehiculos").update(fila).eq("id", id)
    : await supabase.from("vehiculos").insert(fila);
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidatePath("/catalogo/vehiculos", "layout");
  redirect("/catalogo/vehiculos");
}

export async function guardarPrecioCombustible(
  _estadoAnterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const tipo = leerCombustible(datos.get("tipo"));
  const precio_litro = leerNumero(String(datos.get("precio_litro")));
  const fecha = String(datos.get("fecha") ?? "").trim() || hoyISO();

  if (!tipo) return { error: "Elegí el combustible." };
  if (precio_litro == null || precio_litro <= 0) {
    return { error: "El precio tiene que ser un número mayor que cero." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "La fecha no es válida." };

  const supabase = await clienteConSesion();

  // Un precio cargado con fecha vieja queda en el historial pero no pisa a
  // uno más nuevo en los vehículos.
  const { count: masNuevos } = await supabase
    .from("precios_combustible")
    .select("id", { count: "exact", head: true })
    .eq("tipo", tipo)
    .gt("fecha", fecha);

  const { error } = await supabase
    .from("precios_combustible")
    .insert({ tipo, precio_litro, fecha });
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  if (datos.get("actualizar_vehiculos") === "1" && !masNuevos) {
    const { data: vehiculos } = await supabase
      .from("vehiculos")
      .select("*")
      .eq("tipo_combustible", tipo)
      .eq("activo", true)
      .returns<Vehiculo[]>();

    const resultados = await Promise.all(
      (vehiculos ?? []).map((v) => {
        const { total } = calcularCostoPorKm({ ...v, precio_litro });
        return supabase
          .from("vehiculos")
          .update({ precio_litro, costo_por_km: total, fecha_costo: fecha })
          .eq("id", v.id);
      }),
    );
    if (resultados.some((r) => r.error)) {
      return {
        error: "El precio se guardó, pero algunos vehículos no se actualizaron. Revisalos a mano.",
      };
    }
  }

  revalidatePath("/catalogo/vehiculos", "layout");
  redirect("/catalogo/vehiculos");
}
