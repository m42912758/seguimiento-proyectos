"use client";

import { useState } from "react";
import { BotonEliminar } from "@/components/boton-eliminar";
import { AreaTexto, Campo, Formulario } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HORAS_JORNADA } from "@/app/(app)/empleados/datos";
import { numeroParaInput } from "@/lib/formato";
import { eliminarParte, guardarHoras } from "../../actions";
import { RECARGO_EXTRA, type ParteHoras } from "../../datos";

export type Trabajador = { empleadoId: number; nombre: string };

export function FormularioHoras({
  proyectoId,
  hoy,
  equipo,
  parte,
  nombre,
}: {
  proyectoId: number;
  hoy: string;
  // Al cargar: el equipo de la obra para tildar. Al editar: un solo parte.
  equipo?: Trabajador[];
  parte?: ParteHoras;
  nombre?: string;
}) {
  const [normales, setNormales] = useState(
    parte ? numeroParaInput(parte.horas_normales) : String(HORAS_JORNADA),
  );
  // Si hay uno solo en el equipo, viene tildado.
  const [elegidos, setElegidos] = useState(
    () => new Set(equipo?.length === 1 ? [equipo[0].empleadoId] : []),
  );

  return (
    <div className="flex flex-col gap-4">
      <Formulario accion={guardarHoras} volverHref={`/proyectos/${proyectoId}`}>
        <input type="hidden" name="proyecto_id" value={proyectoId} />
        {parte && <input type="hidden" name="id" value={parte.id} />}

        {equipo ? (
          <fieldset className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <legend className="text-sm font-medium">¿Quién trabajó?</legend>
              {equipo.length > 1 && (
                <button
                  type="button"
                  className="text-sm underline-offset-4 hover:underline"
                  onClick={() =>
                    setElegidos(
                      elegidos.size === equipo.length
                        ? new Set()
                        : new Set(equipo.map((t) => t.empleadoId)),
                    )
                  }
                >
                  {elegidos.size === equipo.length ? "Ninguno" : "Todos"}
                </button>
              )}
            </div>
            <ul className="flex flex-col divide-y rounded-xl ring-1 ring-foreground/10">
              {equipo.map((t) => (
                <li key={t.empleadoId}>
                  <label className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      name="empleado_id"
                      value={t.empleadoId}
                      checked={elegidos.has(t.empleadoId)}
                      onChange={() => {
                        const nuevos = new Set(elegidos);
                        if (nuevos.has(t.empleadoId)) nuevos.delete(t.empleadoId);
                        else nuevos.add(t.empleadoId);
                        setElegidos(nuevos);
                      }}
                      className="size-5"
                    />
                    {t.nombre}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : (
          <p className="font-medium">{nombre}</p>
        )}

        <Campo id="fecha" etiqueta="Fecha">
          <Input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={parte?.fecha ?? hoy}
            className="h-11"
          />
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo id="horas_normales" etiqueta="Horas normales">
            <Input
              id="horas_normales"
              name="horas_normales"
              inputMode="decimal"
              placeholder="0"
              value={normales}
              onChange={(e) => setNormales(e.target.value)}
              className="h-11"
            />
          </Campo>
          <Campo id="horas_extra" etiqueta={`Horas extra (+${RECARGO_EXTRA}%)`}>
            <Input
              id="horas_extra"
              name="horas_extra"
              inputMode="decimal"
              placeholder="0"
              defaultValue={parte?.horas_extra ? numeroParaInput(parte.horas_extra) : ""}
              className="h-11"
            />
          </Campo>
        </div>
        <div className="-mt-2 flex gap-2">
          {[4, HORAS_JORNADA, 9].map((h) => (
            <Button
              key={h}
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => setNormales(String(h))}
            >
              {h === HORAS_JORNADA ? `Jornal (${h} h)` : `${h} h`}
            </Button>
          ))}
        </div>

        <Campo id="nota" etiqueta="Nota" ayuda="Opcional. Ej.: cableado planta alta">
          <AreaTexto id="nota" name="nota" rows={2} defaultValue={parte?.nota ?? ""} />
        </Campo>
      </Formulario>

      {parte && (
        <BotonEliminar
          accion={() => eliminarParte(proyectoId, parte.id)}
          pregunta="¿Eliminar estas horas?"
        />
      )}
    </div>
  );
}
