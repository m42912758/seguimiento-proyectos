import { createClient } from "@/lib/supabase/server";
import type { PrecioCombustible } from "./datos";

// Historial de precios de combustible, del más nuevo al más viejo.
export async function preciosCombustible(limite = 100) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("precios_combustible")
    .select("id, fecha, tipo, precio_litro")
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .limit(limite)
    .returns<PrecioCombustible[]>();
  return data ?? [];
}
