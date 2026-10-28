import { renderToBuffer } from "@react-pdf/renderer";
import type { MisDatos } from "@/app/(app)/mis-datos/datos";
import { createClient } from "@/lib/supabase/server";
import { leerCotizacionCompleta } from "../../consultas";
import { DocumentoCotizacion, type ModoPdf } from "./documento";

// PDF de la cotización para el cliente: precios de venta, sin costos ni margen.
// ?modo=rubros muestra un importe por rubro en vez del detalle.
export async function GET(
  request: Request,
  { params }: RouteContext<"/cotizaciones/[id]/pdf">,
) {
  const supabase = await createClient();
  const { data: sesion } = await supabase.auth.getClaims();
  if (!sesion?.claims) return new Response("Sin sesión", { status: 401 });

  const { id } = await params;
  const [leida, { data: misDatos }] = await Promise.all([
    leerCotizacionCompleta(Number(id)),
    supabase
      .from("mis_datos")
      .select("razon_social, nombre_fantasia, cuit, telefono, email, direccion, logo")
      .returns<MisDatos[]>()
      .maybeSingle(),
  ]);
  if (!leida) return new Response("No se encontró la cotización", { status: 404 });

  const modo: ModoPdf =
    new URL(request.url).searchParams.get("modo") === "rubros" ? "rubros" : "detalle";
  const { cotizacion, items } = leida;
  // Se llama como función (no tiene hooks) para que devuelva el <Document> que
  // espera renderToBuffer.
  const pdf = await renderToBuffer(
    DocumentoCotizacion({ cotizacion, items, misDatos, modo }),
  );

  const proyecto = cotizacion.proyectos;
  const nombre = [
    "Presupuesto",
    proyecto.codigo,
    cotizacion.version > 1 ? `v${cotizacion.version}` : null,
    proyecto.nombre,
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\- ]/g, "")
    .trim();

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombre}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
