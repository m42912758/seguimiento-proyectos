"use client";

import { useState } from "react";
import { Campo, Formulario, Selector } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { formatearMoneda, leerNumero, numeroParaInput } from "@/lib/formato";
import { guardarMaterial } from "./actions";
import { ALICUOTAS_IVA, UNIDADES, precioConIva, type Material } from "./datos";

export function FormularioMaterial({
  material,
  proveedores,
}: {
  material?: Material;
  proveedores: string[];
}) {
  const [precio, setPrecio] = useState(numeroParaInput(material?.precio));
  const [alicuota, setAlicuota] = useState(String(material?.alicuota_iva ?? 21));
  const valorPrecio = leerNumero(precio);

  return (
    <Formulario accion={guardarMaterial} volverHref="/catalogo/materiales">
      {material && (
        <>
          <input type="hidden" name="id" value={material.id} />
          <input type="hidden" name="precio_original" value={material.precio} />
          <input type="hidden" name="fecha_original" value={material.fecha_precio} />
        </>
      )}

      <Campo id="descripcion" etiqueta="Descripción">
        <Input
          id="descripcion"
          name="descripcion"
          defaultValue={material?.descripcion}
          required
          className="h-11"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo id="precio" etiqueta="Precio sin IVA ($)">
          <Input
            id="precio"
            name="precio"
            inputMode="decimal"
            placeholder="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
            className="h-11"
          />
        </Campo>
        <Campo id="alicuota_iva" etiqueta="IVA">
          <Selector
            id="alicuota_iva"
            name="alicuota_iva"
            value={alicuota}
            onChange={(e) => setAlicuota(e.target.value)}
          >
            {ALICUOTAS_IVA.map((a) => (
              <option key={a} value={a}>
                {String(a).replace(".", ",")}%
              </option>
            ))}
          </Selector>
        </Campo>
      </div>
      {valorPrecio != null && valorPrecio > 0 && (
        <p className="-mt-2 text-sm text-muted-foreground">
          Con IVA: {formatearMoneda(precioConIva(valorPrecio, Number(alicuota)))}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Campo id="unidad" etiqueta="Unidad">
          <Input
            id="unidad"
            name="unidad"
            list="unidades"
            defaultValue={material?.unidad ?? "u"}
            className="h-11"
          />
          <datalist id="unidades">
            {UNIDADES.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Campo>
        <Campo id="fecha_precio" etiqueta="Fecha del precio">
          <Input
            id="fecha_precio"
            name="fecha_precio"
            type="date"
            defaultValue={material?.fecha_precio ?? ""}
            className="h-11"
          />
        </Campo>
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">
        Si dejás la fecha vacía o cambiás el precio sin tocarla, se guarda la de hoy.
      </p>

      <Campo id="proveedor" etiqueta="Proveedor">
        <Input
          id="proveedor"
          name="proveedor"
          list="proveedores"
          defaultValue={material?.proveedor ?? ""}
          className="h-11"
        />
        <datalist id="proveedores">
          {proveedores.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </Campo>
    </Formulario>
  );
}
