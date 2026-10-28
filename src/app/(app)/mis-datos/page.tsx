import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { createClient } from "@/lib/supabase/server";
import type { MisDatos } from "./datos";
import { FormularioMisDatos } from "./formulario-mis-datos";

async function Ficha() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mis_datos")
    .select("razon_social, nombre_fantasia, cuit, telefono, email, direccion, logo")
    .returns<MisDatos[]>()
    .maybeSingle();
  return <FormularioMisDatos datos={data} />;
}

export default function MisDatosPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado titulo="Mis datos" />
      <p className="-mt-2 text-sm text-muted-foreground">
        Encabezan los PDF que le mandás al cliente. Condición frente al IVA:
        responsable inscripto.
      </p>
      <Suspense fallback={<Cargando />}>
        <Ficha />
      </Suspense>
    </div>
  );
}
