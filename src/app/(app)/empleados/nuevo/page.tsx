import { Encabezado } from "@/components/encabezado";
import { FormularioEmpleado } from "../formulario-empleado";

export default function NuevoEmpleadoPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Nuevo empleado"
        volver={{ href: "/empleados", texto: "Empleados" }}
      />
      <FormularioEmpleado />
    </div>
  );
}
