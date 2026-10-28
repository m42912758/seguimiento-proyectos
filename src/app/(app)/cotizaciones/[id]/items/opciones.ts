import { createClient } from "@/lib/supabase/server";
import type { Rubro } from "../../datos";
import type { EmpleadoOpcion, MaterialOpcion, VehiculoOpcion } from "./formulario-item";

// Lo que cada rubro necesita del catálogo para proponer valores.
export async function opcionesItem(rubro: Rubro) {
  const supabase = await createClient();
  if (rubro === "material") {
    const { data } = await supabase
      .from("materiales")
      .select("id, descripcion, unidad, precio, alicuota_iva, proveedor")
      .eq("activo", true)
      .order("descripcion")
      .returns<MaterialOpcion[]>();
    return { materiales: data ?? [] };
  }
  if (rubro === "mano_obra") {
    const { data } = await supabase
      .from("empleados")
      .select("id, nombre, jornal_referencia")
      .eq("activo", true)
      .order("nombre")
      .returns<EmpleadoOpcion[]>();
    return { empleados: data ?? [] };
  }
  if (rubro === "viaje") {
    const { data } = await supabase
      .from("vehiculos")
      .select("id, nombre, costo_por_km")
      .eq("activo", true)
      .order("nombre")
      .returns<VehiculoOpcion[]>();
    return { vehiculos: data ?? [] };
  }
  return {};
}
