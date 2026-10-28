import { createClient } from "@/lib/supabase/server";
import type { VehiculoViaje } from "./formulario-viaje";

// Vehículos activos, más el del viaje que se edita aunque esté dado de baja.
export async function vehiculosParaViaje(incluir?: number | null) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehiculos")
    .select("id, nombre, costo_por_km, activo")
    .order("nombre")
    .returns<(VehiculoViaje & { activo: boolean })[]>();
  return (data ?? [])
    .filter((v) => v.activo || v.id === incluir)
    .map(({ id, nombre, costo_por_km }) => ({ id, nombre, costo_por_km }));
}
