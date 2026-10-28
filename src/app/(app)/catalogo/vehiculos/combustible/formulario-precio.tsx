"use client";

import { useState } from "react";
import { Campo, Formulario, Selector } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { guardarPrecioCombustible } from "../actions";
import { COMBUSTIBLES, leerCombustible, type TipoCombustible } from "../datos";

export function FormularioPrecio({
  hoy,
  vehiculosPorTipo,
}: {
  hoy: string;
  // Vehículos activos de cada combustible, para el aviso de recálculo.
  vehiculosPorTipo: Partial<Record<TipoCombustible, number>>;
}) {
  const [tipo, setTipo] = useState<TipoCombustible>("nafta");
  const cantidad = vehiculosPorTipo[tipo] ?? 0;
  const { nombre, unidad } = COMBUSTIBLES[tipo];

  return (
    <Formulario accion={guardarPrecioCombustible} volverHref="/catalogo/vehiculos">
      <div className="grid grid-cols-2 gap-4">
        <Campo id="tipo" etiqueta="Combustible">
          <Selector
            id="tipo"
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(leerCombustible(e.target.value) ?? "nafta")}
          >
            {Object.entries(COMBUSTIBLES).map(([valor, c]) => (
              <option key={valor} value={valor}>
                {c.nombre}
              </option>
            ))}
          </Selector>
        </Campo>
        <Campo id="precio_litro" etiqueta={`Precio por ${unidad} ($)`}>
          <Input
            id="precio_litro"
            name="precio_litro"
            inputMode="decimal"
            placeholder="0"
            required
            autoFocus
            className="h-11"
          />
        </Campo>
      </div>

      <Campo id="fecha" etiqueta="Fecha">
        <Input id="fecha" name="fecha" type="date" defaultValue={hoy} className="h-11" />
      </Campo>

      {cantidad > 0 && (
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="actualizar_vehiculos"
            value="1"
            defaultChecked
            className="mt-0.5 size-5"
          />
          <span>
            Recalcular el costo por km de{" "}
            {cantidad === 1
              ? `el vehículo a ${nombre.toLowerCase()}`
              : `los ${cantidad} vehículos a ${nombre.toLowerCase()}`}
            . Los viajes ya cargados no cambian.
          </span>
        </label>
      )}
    </Formulario>
  );
}
