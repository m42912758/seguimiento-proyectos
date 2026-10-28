"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cambiarActivo, type TablaCatalogo } from "@/lib/acciones-comunes";

export function BotonActivo({
  tabla,
  id,
  activo,
}: {
  tabla: TablaCatalogo;
  id: number;
  activo: boolean;
}) {
  const [cambiando, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={activo ? "destructive" : "outline"}
      className="h-11"
      disabled={cambiando}
      onClick={() => {
        if (activo && !confirm("¿Dar de baja? Queda oculto pero no se borra."))
          return;
        startTransition(() => cambiarActivo(tabla, id, !activo));
      }}
    >
      {activo ? "Dar de baja" : "Reactivar"}
    </Button>
  );
}
