import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { FormularioMaterial } from "../formulario-material";
import { proveedoresUsados } from "../proveedores";

async function FormularioNuevo() {
  return <FormularioMaterial proveedores={await proveedoresUsados()} />;
}

export default function NuevoMaterialPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Nuevo material"
        volver={{ href: "/catalogo/materiales", texto: "Materiales" }}
      />
      <Suspense fallback={<Cargando />}>
        <FormularioNuevo />
      </Suspense>
    </div>
  );
}
