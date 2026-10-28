"use client";

import { useState } from "react";
import { BotonEliminar } from "@/components/boton-eliminar";
import { AreaTexto, Campo, Formulario, Selector } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { formatearMoneda, leerNumero, numeroParaInput } from "@/lib/formato";
import { eliminarViaje, guardarViaje } from "../../actions";
import type { Viaje } from "../../datos";

export type VehiculoViaje = { id: number; nombre: string; costo_por_km: number };

export function FormularioViaje({
  proyectoId,
  hoy,
  vehiculos,
  viaje,
  ultimo,
}: {
  proyectoId: number;
  hoy: string;
  vehiculos: VehiculoViaje[];
  viaje?: Viaje;
  // Último viaje de la obra: se repiten vehículo, km, peajes y destino.
  ultimo?: Viaje;
}) {
  const base = viaje ?? ultimo;
  const [vehiculoId, setVehiculoId] = useState(
    String(base?.vehiculo_id ?? (vehiculos.length > 0 ? vehiculos[0].id : "")),
  );
  const [km, setKm] = useState(numeroParaInput(base?.km));
  const [peajes, setPeajes] = useState(base?.peajes ? numeroParaInput(base.peajes) : "");
  const [costoManual, setCostoManual] = useState(
    numeroParaInput(viaje && !viaje.vehiculo_id ? viaje.costo_por_km_aplicado : undefined),
  );

  const vehiculo = vehiculos.find((v) => String(v.id) === vehiculoId);
  // Al editar sin cambiar de vehículo se mantiene el costo con que se cargó.
  const costoKm =
    viaje && String(viaje.vehiculo_id ?? "") === vehiculoId && vehiculoId
      ? viaje.costo_por_km_aplicado
      : vehiculo
        ? vehiculo.costo_por_km
        : leerNumero(costoManual);
  const total = (leerNumero(km) ?? 0) * (costoKm ?? 0) + (leerNumero(peajes) ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <Formulario accion={guardarViaje} volverHref={`/proyectos/${proyectoId}`}>
        <input type="hidden" name="proyecto_id" value={proyectoId} />
        {viaje && <input type="hidden" name="id" value={viaje.id} />}

        <div className="grid grid-cols-2 gap-4">
          <Campo id="fecha" etiqueta="Fecha">
            <Input
              id="fecha"
              name="fecha"
              type="date"
              defaultValue={viaje?.fecha ?? hoy}
              className="h-11"
            />
          </Campo>
          <Campo id="vehiculo_id" etiqueta="Vehículo">
            <Selector
              id="vehiculo_id"
              name="vehiculo_id"
              value={vehiculoId}
              onChange={(e) => setVehiculoId(e.target.value)}
            >
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                </option>
              ))}
              <option value="">Otro</option>
            </Selector>
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo id="km" etiqueta="Km recorridos" ayuda="Ida y vuelta">
            <Input
              id="km"
              name="km"
              inputMode="decimal"
              placeholder="0"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              required
              autoFocus={!viaje}
              className="h-11"
            />
          </Campo>
          <Campo id="peajes" etiqueta="Peajes ($)">
            <Input
              id="peajes"
              name="peajes"
              inputMode="decimal"
              placeholder="0"
              value={peajes}
              onChange={(e) => setPeajes(e.target.value)}
              className="h-11"
            />
          </Campo>
        </div>

        {!vehiculoId && (
          <Campo id="costo_por_km" etiqueta="Costo por km ($)">
            <Input
              id="costo_por_km"
              name="costo_por_km"
              inputMode="decimal"
              placeholder="0"
              value={costoManual}
              onChange={(e) => setCostoManual(e.target.value)}
              required
              className="h-11"
            />
          </Campo>
        )}

        {total > 0 && (
          <p className="rounded-xl bg-muted p-3 text-sm">
            Costo del viaje: <strong className="tabular-nums">{formatearMoneda(total)}</strong>
            {costoKm != null && (
              <span className="text-muted-foreground"> ({formatearMoneda(costoKm)}/km)</span>
            )}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Campo id="destino" etiqueta="Destino">
            <Input
              id="destino"
              name="destino"
              defaultValue={base?.destino ?? ""}
              placeholder="Ej.: obra, corralón"
              className="h-11"
            />
          </Campo>
          <Campo id="quienes" etiqueta="Quiénes viajaron">
            <Input id="quienes" name="quienes" defaultValue={viaje?.quienes ?? ""} className="h-11" />
          </Campo>
        </div>

        <Campo id="nota" etiqueta="Nota">
          <AreaTexto id="nota" name="nota" rows={2} defaultValue={viaje?.nota ?? ""} />
        </Campo>
      </Formulario>

      {viaje && (
        <BotonEliminar
          accion={() => eliminarViaje(proyectoId, viaje.id)}
          pregunta="¿Eliminar este viaje?"
        />
      )}
    </div>
  );
}
