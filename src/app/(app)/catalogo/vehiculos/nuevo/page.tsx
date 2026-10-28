import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { ultimosPrecios } from "../datos";
import { FormularioVehiculo } from "../formulario-vehiculo";
import { preciosCombustible } from "../precios";

async function FormularioNuevo() {
  const precios = ultimosPrecios(await preciosCombustible());
  return <FormularioVehiculo precios={precios} />;
}

export default function NuevoVehiculoPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Nuevo vehículo"
        volver={{ href: "/catalogo/vehiculos", texto: "Vehículos" }}
      />
      <Suspense fallback={<Cargando />}>
        <FormularioNuevo />
      </Suspense>
    </div>
  );
}
