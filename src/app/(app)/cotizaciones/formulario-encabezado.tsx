"use client";

import { AreaTexto, Campo, Formulario, Selector } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { numeroParaInput } from "@/lib/formato";
import { crearCotizacion, guardarEncabezado } from "./actions";
import type { Cotizacion, Proyecto } from "./datos";

type Opcion = { id: number; nombre: string };

export function FormularioEncabezado({
  cotizacion,
  proyecto,
  clientes,
  tipos,
  inicial,
}: {
  cotizacion?: Cotizacion;
  proyecto?: Proyecto;
  clientes: Opcion[];
  tipos: Opcion[];
  // Valores propuestos para una cotización nueva.
  inicial: {
    fecha: string;
    vencimiento: string;
    clienteId?: number;
    pctImprevistos: number;
    pctMargen: number;
  };
}) {
  return (
    <Formulario
      accion={cotizacion ? guardarEncabezado : crearCotizacion}
      volverHref={cotizacion ? `/cotizaciones/${cotizacion.id}` : "/cotizaciones"}
    >
      {cotizacion && <input type="hidden" name="id" value={cotizacion.id} />}

      <Campo id="cliente_id" etiqueta="Cliente">
        <Selector
          id="cliente_id"
          name="cliente_id"
          defaultValue={proyecto?.cliente_id ?? inicial.clienteId ?? ""}
          required
        >
          <option value="" disabled>
            Elegí un cliente…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Selector>
      </Campo>

      <Campo id="nombre" etiqueta="Trabajo" ayuda="Ej.: Tablero seccional galpón">
        <Input
          id="nombre"
          name="nombre"
          defaultValue={proyecto?.nombre}
          required
          className="h-11"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo id="tipo_trabajo_id" etiqueta="Tipo de trabajo">
          <Selector
            id="tipo_trabajo_id"
            name="tipo_trabajo_id"
            defaultValue={proyecto?.tipo_trabajo_id ?? ""}
          >
            <option value="">Sin tipo</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Selector>
        </Campo>
        <Campo id="direccion" etiqueta="Dirección de la obra">
          <Input
            id="direccion"
            name="direccion"
            defaultValue={proyecto?.direccion ?? ""}
            className="h-11"
          />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo id="pct_imprevistos" etiqueta="Imprevistos (%)">
          <Input
            id="pct_imprevistos"
            name="pct_imprevistos"
            inputMode="decimal"
            placeholder="0"
            defaultValue={numeroParaInput(cotizacion?.pct_imprevistos ?? inicial.pctImprevistos)}
            className="h-11"
          />
        </Campo>
        <Campo id="pct_margen" etiqueta="Margen (%)">
          <Input
            id="pct_margen"
            name="pct_margen"
            inputMode="decimal"
            placeholder="0"
            defaultValue={numeroParaInput(cotizacion?.pct_margen ?? inicial.pctMargen)}
            className="h-11"
          />
        </Campo>
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">
        Los imprevistos se suman sobre el costo y el margen sobre costo +
        imprevistos.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Campo id="fecha" etiqueta="Fecha">
          <Input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={cotizacion?.fecha ?? inicial.fecha}
            className="h-11"
          />
        </Campo>
        <Campo id="vencimiento" etiqueta="Válida hasta">
          <Input
            id="vencimiento"
            name="vencimiento"
            type="date"
            defaultValue={cotizacion ? (cotizacion.vencimiento ?? "") : inicial.vencimiento}
            className="h-11"
          />
        </Campo>
      </div>

      <Campo
        id="notas"
        etiqueta="Condiciones para el cliente"
        ayuda="Plazo de obra, forma de pago, qué no incluye… Va en el PDF."
      >
        <AreaTexto id="notas" name="notas" defaultValue={cotizacion?.notas ?? ""} />
      </Campo>
    </Formulario>
  );
}
