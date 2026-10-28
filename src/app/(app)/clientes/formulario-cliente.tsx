"use client";

import { AreaTexto, Campo, Formulario, Selector } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { formatearCuit } from "@/lib/cuit";
import { guardarCliente } from "./actions";
import { CONDICIONES_IVA, type Cliente } from "./datos";

export function FormularioCliente({ cliente }: { cliente?: Cliente }) {
  return (
    <Formulario accion={guardarCliente} volverHref="/clientes">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <Campo id="nombre" etiqueta="Nombre o razón social">
        <Input
          id="nombre"
          name="nombre"
          defaultValue={cliente?.nombre}
          required
          className="h-11"
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="cuit" etiqueta="CUIT">
          <Input
            id="cuit"
            name="cuit"
            inputMode="numeric"
            placeholder="20-12345678-9"
            defaultValue={cliente?.cuit ? formatearCuit(cliente.cuit) : ""}
            className="h-11"
          />
        </Campo>
        <Campo id="condicion_iva" etiqueta="Condición frente al IVA">
          <Selector
            id="condicion_iva"
            name="condicion_iva"
            defaultValue={cliente?.condicion_iva ?? "responsable_inscripto"}
          >
            {Object.entries(CONDICIONES_IVA).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Selector>
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="telefono"
          etiqueta="Teléfono"
          ayuda="Con código de área, sin 0 ni 15. Ej.: 11 2345 6789"
        >
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            defaultValue={cliente?.telefono ?? ""}
            className="h-11"
          />
        </Campo>
        <Campo id="email" etiqueta="Email">
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={cliente?.email ?? ""}
            className="h-11"
          />
        </Campo>
      </div>

      <Campo id="direccion" etiqueta="Dirección">
        <Input
          id="direccion"
          name="direccion"
          defaultValue={cliente?.direccion ?? ""}
          className="h-11"
        />
      </Campo>

      <Campo id="notas" etiqueta="Notas">
        <AreaTexto id="notas" name="notas" defaultValue={cliente?.notas ?? ""} />
      </Campo>
    </Formulario>
  );
}
