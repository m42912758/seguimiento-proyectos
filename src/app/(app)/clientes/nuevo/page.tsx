import { Encabezado } from "@/components/encabezado";
import { FormularioCliente } from "../formulario-cliente";

export default function NuevoClientePage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Nuevo cliente"
        volver={{ href: "/clientes", texto: "Clientes" }}
      />
      <FormularioCliente />
    </div>
  );
}
