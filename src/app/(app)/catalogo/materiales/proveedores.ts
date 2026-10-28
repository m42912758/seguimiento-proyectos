import { createClient } from "@/lib/supabase/server";

// Proveedores ya usados, para sugerirlos al escribir y no cargar el mismo con
// nombres distintos.
export async function proveedoresUsados() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materiales")
    .select("proveedor")
    .not("proveedor", "is", null)
    .returns<{ proveedor: string }[]>();

  return [...new Set((data ?? []).map((m) => m.proveedor))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}
