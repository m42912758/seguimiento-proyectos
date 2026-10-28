"use client";

import { useState } from "react";
import { Formulario } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { HORAS_JORNADA } from "@/app/(app)/empleados/datos";
import { formatearMoneda, leerNumero, numeroParaInput } from "@/lib/formato";
import { guardarEquipo } from "../../actions";

export type FilaEquipo = {
  empleadoId: number;
  nombre: string;
  categoria: string | null;
  enEquipo: boolean;
  jornal: number; // el de la obra si ya está; si no, el de referencia
};

export function FormularioEquipo({
  proyectoId,
  filas,
}: {
  proyectoId: number;
  filas: FilaEquipo[];
}) {
  const [elegidos, setElegidos] = useState(
    () => new Set(filas.filter((f) => f.enEquipo).map((f) => f.empleadoId)),
  );
  const [jornales, setJornales] = useState(
    () => new Map(filas.map((f) => [f.empleadoId, numeroParaInput(f.jornal)])),
  );

  function alternar(id: number) {
    const nuevos = new Set(elegidos);
    if (nuevos.has(id)) nuevos.delete(id);
    else nuevos.add(id);
    setElegidos(nuevos);
  }

  return (
    <Formulario accion={guardarEquipo} volverHref={`/proyectos/${proyectoId}`}>
      <input type="hidden" name="proyecto_id" value={proyectoId} />
      <ul className="flex flex-col divide-y rounded-xl ring-1 ring-foreground/10">
        {filas.map((f) => {
          const elegido = elegidos.has(f.empleadoId);
          const valor = jornales.get(f.empleadoId) ?? "";
          const jornal = leerNumero(valor);
          return (
            <li key={f.empleadoId} className="flex flex-col gap-2 px-4 py-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="empleado_id"
                  value={f.empleadoId}
                  checked={elegido}
                  onChange={() => alternar(f.empleadoId)}
                  className="size-5"
                />
                <span className="flex flex-col">
                  <span className="font-medium">{f.nombre}</span>
                  {f.categoria && (
                    <span className="text-sm text-muted-foreground">{f.categoria}</span>
                  )}
                </span>
              </label>
              {elegido && (
                <div className="flex items-center gap-3 pl-8">
                  <Input
                    name={`jornal_${f.empleadoId}`}
                    aria-label={`Jornada de ${f.nombre}`}
                    inputMode="decimal"
                    placeholder="0"
                    value={valor}
                    onChange={(e) =>
                      setJornales(new Map(jornales).set(f.empleadoId, e.target.value))
                    }
                    className="h-11 w-36"
                  />
                  <span className="text-sm text-muted-foreground">
                    por jornada
                    {jornal != null && jornal > 0 &&
                      ` · ${formatearMoneda(jornal / HORAS_JORNADA)}/h`}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted-foreground">
        Si cambiás el valor de la jornada, cuenta para las horas que cargues de
        ahora en adelante; las ya cargadas no cambian.
      </p>
    </Formulario>
  );
}
