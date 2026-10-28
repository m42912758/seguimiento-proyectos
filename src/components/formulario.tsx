"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EstadoFormulario } from "@/lib/sesion";

// Formulario que llama a una Server Action. Se envía con onSubmit en vez de
// action={…} para que React no vacíe los campos cuando la acción devuelve un
// error de validación.
export function Formulario({
  accion,
  volverHref,
  children,
}: {
  accion: (estado: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>;
  volverHref: string;
  children: React.ReactNode;
}) {
  const [estado, enviar, enviando] = useActionState(accion, null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        startTransition(() => enviar(datos));
      }}
      className="flex flex-col gap-4"
    >
      {children}
      {estado?.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" className="h-11 flex-1" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar"}
        </Button>
        <Link
          href={volverHref}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-4")}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

export function Campo({
  id,
  etiqueta,
  ayuda,
  className,
  children,
}: {
  id: string;
  etiqueta: string;
  ayuda?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {ayuda && <p className="text-sm text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

const claseControl =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

// Select nativo: en el celular abre el selector del sistema, que es más cómodo.
export function Selector({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return <select className={cn(claseControl, "h-11", className)} {...props} />;
}

export function AreaTexto({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      rows={3}
      className={cn(claseControl, "py-2", className)}
      {...props}
    />
  );
}
