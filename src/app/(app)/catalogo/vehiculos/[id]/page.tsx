import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BotonActivo } from "@/components/boton-activo";
import { Cargando, Encabezado } from "@/components/encabezado";
import { createClient } from "@/lib/supabase/server";
import { ultimosPrecios, type Vehiculo } from "../datos";
import { FormularioVehiculo } from "../formulario-vehiculo";
import { preciosCombustible } from "../precios";

async function FichaVehiculo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: vehiculo }, precios] = await Promise.all([
    supabase
      .from("vehiculos")
      .select("*")
      .eq("id", Number(id))
      .returns<Vehiculo[]>()
      .maybeSingle(),
    preciosCombustible(),
  ]);
  if (!vehiculo) notFound();

  return (
    <>
      <Encabezado
        titulo={
          vehiculo.activo ? vehiculo.nombre : `${vehiculo.nombre} (de baja)`
        }
        volver={{ href: "/catalogo/vehiculos", texto: "Vehículos" }}
      />
      <FormularioVehiculo vehiculo={vehiculo} precios={ultimosPrecios(precios)} />
      <BotonActivo tabla="vehiculos" id={vehiculo.id} activo={vehiculo.activo} />
    </>
  );
}

export default function VehiculoPage({
  params,
}: PageProps<"/catalogo/vehiculos/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <FichaVehiculo params={params} />
      </Suspense>
    </div>
  );
}
