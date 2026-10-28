"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { importarPlanilla } from "./actions";

// Descargar la planilla, editarla en Excel y volver a subirla. Al subirla se
// muestra primero qué va a cambiar y recién después se aplica.
export function ImportarPlanilla() {
  const [resultado, enviar, procesando] = useActionState(importarPlanilla, null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mostrar, setMostrar] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const visible = !procesando && mostrar ? resultado : null;

  function mandar(elegido: File, confirmar: boolean) {
    const datos = new FormData();
    datos.set("archivo", elegido);
    datos.set("confirmar", confirmar ? "1" : "0");
    setMostrar(true);
    startTransition(() => enviar(datos));
  }

  function empezarDeNuevo() {
    setArchivo(null);
    setMostrar(false);
    if (input.current) input.current.value = "";
  }

  return (
    <details className="rounded-xl ring-1 ring-foreground/10 open:pb-4">
      <summary className="cursor-pointer px-4 py-3 font-medium">
        Cargar o actualizar con Excel
      </summary>

      <div className="flex flex-col gap-3 px-4">
        <p className="text-sm text-muted-foreground">
          1. Descargá la planilla con tus materiales. 2. Editala en Excel: cambiá
          precios o agregá filas. 3. Subila acá; antes de aplicar te mostramos qué
          va a cambiar.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href="/catalogo/materiales/planilla"
            download
            className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1")}
          >
            Descargar planilla
          </a>
          <label
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 flex-1 cursor-pointer",
              procesando && "pointer-events-none opacity-50",
            )}
          >
            {archivo ? "Elegir otra planilla" : "Subir planilla"}
            <input
              ref={input}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(e) => {
                const elegido = e.target.files?.[0];
                if (!elegido) return;
                setArchivo(elegido);
                mandar(elegido, false);
              }}
            />
          </label>
        </div>

        {procesando && <p className="text-sm text-muted-foreground">Revisando…</p>}

        {visible && "error" in visible && (
          <p className="text-sm text-destructive">{visible.error}</p>
        )}

        {visible && "errores" in visible && (
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-medium text-destructive">
              La planilla tiene errores; no se cambió nada. Corregilos y volvé a subirla:
            </p>
            <ul className="list-disc pl-5 text-destructive">
              {visible.errores.slice(0, 15).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            {visible.errores.length > 15 && (
              <p className="text-muted-foreground">
                …y {visible.errores.length - 15} más.
              </p>
            )}
          </div>
        )}

        {visible && "nuevos" in visible && (
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">
              {visible.aplicado ? "Listo, se aplicaron los cambios:" : "Se va a aplicar esto:"}
            </p>
            <ul>
              <li>{visible.nuevos} materiales nuevos</li>
              <li>{visible.actualizados} materiales actualizados</li>
              <li>{visible.sinCambios} sin cambios</li>
            </ul>
            {visible.aplicado ? (
              <Button variant="outline" className="h-10 self-start" onClick={empezarDeNuevo}>
                Cerrar
              </Button>
            ) : visible.nuevos + visible.actualizados === 0 ? (
              <p className="text-muted-foreground">No hay nada para cambiar.</p>
            ) : (
              archivo && (
                <div className="flex gap-2">
                  <Button className="h-10" onClick={() => mandar(archivo, true)}>
                    Aplicar cambios
                  </Button>
                  <Button variant="outline" className="h-10" onClick={empezarDeNuevo}>
                    Cancelar
                  </Button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </details>
  );
}
