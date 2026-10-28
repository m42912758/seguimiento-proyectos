import { createClient } from "@/lib/supabase/server";
import type { Cotizacion, ItemCotizacion, Proyecto } from "./datos";

type Opcion = { id: number; nombre: string; activo: boolean };

// Clientes y tipos de trabajo activos para los selectores. Si se edita una
// cotización vieja, se suma el cliente o tipo aunque esté dado de baja.
export async function opcionesEncabezado(proyecto?: Proyecto) {
  const supabase = await createClient();
  const [{ data: clientes }, { data: tipos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, activo")
      .order("nombre")
      .returns<Opcion[]>(),
    supabase
      .from("tipos_trabajo")
      .select("id, nombre, activo")
      .order("nombre")
      .returns<Opcion[]>(),
  ]);
  const visible = (o: Opcion, actual?: number | null) => o.activo || o.id === actual;
  return {
    clientes: (clientes ?? []).filter((c) => visible(c, proyecto?.cliente_id)),
    tipos: (tipos ?? []).filter((t) => visible(t, proyecto?.tipo_trabajo_id)),
  };
}

export type CotizacionCompleta = Cotizacion & {
  proyectos: Proyecto & {
    clientes: { nombre: string; cuit: string | null };
    tipos_trabajo: { nombre: string } | null;
  };
};

export async function leerCotizacionCompleta(id: number) {
  const supabase = await createClient();
  const [{ data: cotizacion }, { data: items }] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("*, proyectos(*, clientes(nombre, cuit), tipos_trabajo(nombre))")
      .eq("id", id)
      .returns<CotizacionCompleta[]>()
      .maybeSingle(),
    supabase
      .from("cotizacion_items")
      .select("*")
      .eq("cotizacion_id", id)
      .order("orden")
      .returns<ItemCotizacion[]>(),
  ]);
  return cotizacion ? { cotizacion, items: items ?? [] } : null;
}
