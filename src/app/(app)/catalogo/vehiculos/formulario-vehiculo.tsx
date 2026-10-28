"use client";

import { useState } from "react";
import { Campo, Formulario, Selector } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import {
  formatearFecha,
  formatearMoneda,
  leerNumero,
  numeroParaInput,
} from "@/lib/formato";
import { guardarVehiculo } from "./actions";
import {
  COMBUSTIBLES,
  calcularCostoPorKm,
  leerCombustible,
  type DatosCosto,
  type PrecioCombustible,
  type TipoCombustible,
  type Vehiculo,
} from "./datos";

type CampoCosto = keyof DatosCosto;

export function FormularioVehiculo({
  vehiculo,
  precios,
}: {
  vehiculo?: Vehiculo;
  // Último precio cargado de cada combustible, para sugerirlo.
  precios: Partial<Record<TipoCombustible, PrecioCombustible>>;
}) {
  const [combustible, setCombustible] = useState<TipoCombustible>(
    vehiculo?.tipo_combustible ?? "nafta",
  );
  const [valores, setValores] = useState<Record<CampoCosto, string>>(() => ({
    consumo_l_100km: numeroParaInput(vehiculo?.consumo_l_100km),
    precio_litro: numeroParaInput(
      vehiculo ? vehiculo.precio_litro : precios.nafta?.precio_litro,
    ),
    mantenimiento_anual: numeroParaInput(vehiculo?.mantenimiento_anual),
    km_por_anio: numeroParaInput(vehiculo?.km_por_anio),
    valor_compra: numeroParaInput(vehiculo?.valor_compra),
    valor_reventa: numeroParaInput(vehiculo?.valor_reventa),
    km_vida_util: numeroParaInput(vehiculo?.km_vida_util),
  }));

  const numeros = Object.fromEntries(
    Object.entries(valores).map(([campo, texto]) => [campo, leerNumero(texto)]),
  ) as DatosCosto;
  const costo = calcularCostoPorKm(numeros);
  const unidad = COMBUSTIBLES[combustible].unidad;
  const ultimo = precios[combustible];

  function campo(nombre: CampoCosto, etiqueta: string, entero = false) {
    return (
      <Campo id={nombre} etiqueta={etiqueta}>
        <Input
          id={nombre}
          name={nombre}
          inputMode={entero ? "numeric" : "decimal"}
          placeholder="0"
          value={valores[nombre]}
          onChange={(e) => setValores({ ...valores, [nombre]: e.target.value })}
          className="h-11"
        />
      </Campo>
    );
  }

  return (
    <Formulario accion={guardarVehiculo} volverHref="/catalogo/vehiculos">
      {vehiculo && (
        <>
          <input type="hidden" name="id" value={vehiculo.id} />
          <input type="hidden" name="costo_original" value={vehiculo.costo_por_km} />
        </>
      )}

      <Campo id="nombre" etiqueta="Nombre" ayuda="Ej.: Kangoo blanca">
        <Input
          id="nombre"
          name="nombre"
          defaultValue={vehiculo?.nombre}
          required
          className="h-11"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo id="patente" etiqueta="Patente">
          <Input
            id="patente"
            name="patente"
            defaultValue={vehiculo?.patente ?? ""}
            autoCapitalize="characters"
            className="h-11 uppercase"
          />
        </Campo>
        <Campo id="tipo_combustible" etiqueta="Combustible">
          <Selector
            id="tipo_combustible"
            name="tipo_combustible"
            value={combustible}
            onChange={(e) => {
              const tipo = leerCombustible(e.target.value) ?? "nafta";
              setCombustible(tipo);
              // Si hay precio cargado de ese combustible, se propone.
              const precio = precios[tipo]?.precio_litro;
              if (precio != null) {
                setValores({ ...valores, precio_litro: numeroParaInput(precio) });
              }
            }}
          >
            {Object.entries(COMBUSTIBLES).map(([valor, c]) => (
              <option key={valor} value={valor}>
                {c.nombre}
              </option>
            ))}
          </Selector>
        </Campo>
      </div>

      <h2 className="mt-2 font-semibold">Combustible</h2>
      <div className="grid grid-cols-2 gap-4">
        {campo("consumo_l_100km", `Consumo (${unidad === "litro" ? "l" : unidad}/100 km)`)}
        {campo("precio_litro", `Precio por ${unidad} ($)`)}
      </div>
      {ultimo && leerNumero(valores.precio_litro) !== ultimo.precio_litro && (
        <button
          type="button"
          onClick={() =>
            setValores({ ...valores, precio_litro: numeroParaInput(ultimo.precio_litro) })
          }
          className="-mt-2 self-start text-left text-sm text-amber-700 underline-offset-4 hover:underline dark:text-amber-400"
        >
          Último precio cargado: {formatearMoneda(ultimo.precio_litro)} del{" "}
          {formatearFecha(ultimo.fecha)}. Tocá para usarlo.
        </button>
      )}

      <h2 className="mt-2 font-semibold">Mantenimiento</h2>
      <div className="grid grid-cols-2 gap-4">
        {campo("mantenimiento_anual", "Gasto por año ($)")}
        {campo("km_por_anio", "Km por año", true)}
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">
        Service, cubiertas, frenos, seguro y patente.
      </p>

      <h2 className="mt-2 font-semibold">Desgaste</h2>
      <div className="grid grid-cols-2 gap-4">
        {campo("valor_compra", "Valor de compra ($)")}
        {campo("valor_reventa", "Valor de reventa ($)")}
      </div>
      {campo("km_vida_util", "Km de vida útil", true)}

      <div className="flex flex-col gap-1 rounded-xl bg-muted p-4 text-sm">
        <Renglon titulo="Combustible" valor={costo.combustible} />
        <Renglon titulo="Mantenimiento" valor={costo.mantenimiento} />
        <Renglon titulo="Desgaste" valor={costo.desgaste} />
        <div className="mt-1 flex justify-between border-t border-foreground/10 pt-2 text-base font-semibold">
          <span>Costo por km</span>
          <span className="tabular-nums">{formatearMoneda(costo.total)}</span>
        </div>
        {vehiculo && vehiculo.costo_por_km !== costo.total && (
          <p className="text-muted-foreground">
            Antes: {formatearMoneda(vehiculo.costo_por_km)} (del{" "}
            {formatearFecha(vehiculo.fecha_costo)}). Los viajes ya cargados no
            cambian.
          </p>
        )}
      </div>
    </Formulario>
  );
}

function Renglon({ titulo, valor }: { titulo: string; valor: number | null }) {
  return (
    <div className="flex justify-between">
      <span>{titulo}</span>
      <span className="tabular-nums">
        {valor == null ? (
          <span className="text-muted-foreground">faltan datos</span>
        ) : (
          formatearMoneda(valor)
        )}
      </span>
    </div>
  );
}
