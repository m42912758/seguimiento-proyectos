import { Encabezado } from "@/components/encabezado";
import { FormularioTipo } from "../formulario-tipo";

export default function NuevoTipoPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Nuevo tipo de trabajo"
        volver={{ href: "/catalogo/tipos-trabajo", texto: "Tipos de trabajo" }}
      />
      <FormularioTipo />
    </div>
  );
}
