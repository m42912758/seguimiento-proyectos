"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

// Botón rojo que pide confirmación y llama a una Server Action que borra.
export function BotonEliminar({
  accion,
  texto = "Eliminar",
  pregunta,
}: {
  accion: () => Promise<unknown>;
  texto?: string;
  pregunta: string;
}) {
  const [eliminando, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      className="h-11"
      disabled={eliminando}
      onClick={() => {
        if (!confirm(pregunta)) return;
        startTransition(async () => {
          await accion();
        });
      }}
    >
      {eliminando ? "Eliminando…" : texto}
    </Button>
  );
}
