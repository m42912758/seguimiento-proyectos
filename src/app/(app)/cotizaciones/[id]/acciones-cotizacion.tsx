"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoFormulario } from "@/lib/sesion";
import {
  cambiarEstado,
  eliminarBorrador,
  nuevaVersion,
  type CambioEstado,
} from "../actions";
import type { EstadoCotizacion } from "../datos";

type Boton = {
  texto: string;
  accion: () => Promise<EstadoFormulario>;
  variante?: "default" | "outline" | "destructive";
  confirmar?: string;
};

// Botones para mover la cotización de estado según dónde está.
export function AccionesCotizacion({
  id,
  estado,
  version,
  bloqueada,
}: {
  id: number;
  estado: EstadoCotizacion;
  version: number;
  // El proyecto ya pasó a ejecución: la cotización aceptada no se toca.
  bloqueada: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  const cambio = (c: CambioEstado) => () => cambiarEstado(id, c);
  let botones: Boton[] = [];
  if (estado === "borrador") {
    botones = [
      { texto: "Marcar como enviada", accion: cambio("enviar") },
      {
        texto: version === 1 ? "Eliminar" : "Descartar esta versión",
        accion: () => eliminarBorrador(id),
        variante: "destructive",
        confirmar:
          version === 1
            ? "¿Eliminar esta cotización? No se puede deshacer."
            : "¿Descartar esta versión? Vuelve a quedar la anterior.",
      },
    ];
  } else if (estado === "enviada") {
    botones = [
      { texto: "Aceptada", accion: cambio("aceptar") },
      { texto: "Rechazada", accion: cambio("rechazar"), variante: "outline" },
      {
        texto: "Nueva versión con cambios",
        accion: () => nuevaVersion(id),
        variante: "outline",
      },
      { texto: "Volver a borrador", accion: cambio("volver_borrador"), variante: "outline" },
    ];
  } else if (estado === "rechazada") {
    botones = [
      { texto: "Nueva versión con cambios", accion: () => nuevaVersion(id), variante: "outline" },
      { texto: "Deshacer rechazo", accion: cambio("deshacer"), variante: "outline" },
    ];
  } else if (estado === "aceptada" && !bloqueada) {
    botones = [
      { texto: "Deshacer aceptación", accion: cambio("deshacer"), variante: "outline" },
    ];
  }

  if (botones.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {botones.map((b, i) => (
          <Button
            key={b.texto}
            type="button"
            variant={b.variante ?? "default"}
            disabled={enviando}
            className={`h-11 ${i === 0 && botones.length % 2 === 1 ? "col-span-2" : ""}`}
            onClick={() => {
              if (b.confirmar && !confirm(b.confirmar)) return;
              setError(null);
              startTransition(async () => {
                const resultado = await b.accion();
                if (resultado?.error) setError(resultado.error);
              });
            }}
          >
            {b.texto}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
