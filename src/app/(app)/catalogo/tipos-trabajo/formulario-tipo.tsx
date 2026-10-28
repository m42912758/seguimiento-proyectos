"use client";

import { Campo, Formulario } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { guardarTipoTrabajo } from "./actions";

export type TipoTrabajo = { id: number; nombre: string; activo: boolean };

export function FormularioTipo({ tipo }: { tipo?: TipoTrabajo }) {
  return (
    <Formulario accion={guardarTipoTrabajo} volverHref="/catalogo/tipos-trabajo">
      {tipo && <input type="hidden" name="id" value={tipo.id} />}
      <Campo
        id="nombre"
        etiqueta="Nombre"
        ayuda="Sirve para comparar proyectos parecidos entre sí."
      >
        <Input
          id="nombre"
          name="nombre"
          defaultValue={tipo?.nombre}
          required
          className="h-11"
        />
      </Campo>
    </Formulario>
  );
}
