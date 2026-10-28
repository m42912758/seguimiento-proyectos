import { hoyISO } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import type { Material } from "../datos";
import { generarPlanilla } from "../planilla";

// Descarga la planilla de Excel con los materiales activos.
export async function GET() {
  const supabase = await createClient();
  const { data: sesion } = await supabase.auth.getClaims();
  if (!sesion?.claims) return new Response("Sin sesión", { status: 401 });

  const { data } = await supabase
    .from("materiales")
    .select("*")
    .eq("activo", true)
    .order("descripcion")
    .returns<Material[]>();

  const contenido = await generarPlanilla(data ?? []);
  return new Response(contenido as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="materiales-${hoyISO()}.xlsx"`,
    },
  });
}
