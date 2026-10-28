"use client";

import { useState } from "react";
import { Campo, Formulario } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { formatearMoneda, leerNumero, numeroParaInput } from "@/lib/formato";
import { guardarEmpleado } from "./actions";
import { HORAS_JORNADA, type Empleado } from "./datos";

export function FormularioEmpleado({ empleado }: { empleado?: Empleado }) {
  const [jornal, setJornal] = useState(
    numeroParaInput(empleado?.jornal_referencia),
  );
  const valorJornal = leerNumero(jornal);

  return (
    <Formulario accion={guardarEmpleado} volverHref="/empleados">
      {empleado && <input type="hidden" name="id" value={empleado.id} />}

      <Campo id="nombre" etiqueta="Nombre">
        <Input
          id="nombre"
          name="nombre"
          defaultValue={empleado?.nombre}
          required
          className="h-11"
        />
      </Campo>

      <Campo id="categoria" etiqueta="Categoría" ayuda="Ej.: oficial, medio oficial, ayudante">
        <Input
          id="categoria"
          name="categoria"
          defaultValue={empleado?.categoria ?? ""}
          className="h-11"
        />
      </Campo>

      <Campo
        id="jornal_referencia"
        etiqueta={`Jornada de ${HORAS_JORNADA} h de referencia ($)`}
        ayuda={
          valorJornal != null && valorJornal > 0
            ? `${formatearMoneda(valorJornal / HORAS_JORNADA)} por hora. En cada proyecto podés poner otro valor.`
            : "Se sugiere al asignarlo a un proyecto; ahí podés poner otro valor."
        }
      >
        <Input
          id="jornal_referencia"
          name="jornal_referencia"
          inputMode="decimal"
          placeholder="0"
          value={jornal}
          onChange={(e) => setJornal(e.target.value)}
          className="h-11"
        />
      </Campo>
    </Formulario>
  );
}
