import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Título de una pantalla, con botón opcional (por ejemplo "Nuevo").
export function Encabezado({
  titulo,
  boton,
  volver,
}: {
  titulo: string;
  boton?: { href: string; texto: string };
  volver?: { href: string; texto: string };
}) {
  return (
    <div className="flex flex-col gap-1">
      {volver && (
        <Link
          href={volver.href}
          className="self-start text-sm text-muted-foreground hover:underline"
        >
          ← {volver.texto}
        </Link>
      )}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        {boton && (
          <Link
            href={boton.href}
            className={cn(buttonVariants(), "h-10 px-4")}
          >
            {boton.texto}
          </Link>
        )}
      </div>
    </div>
  );
}

export function Cargando() {
  return <p className="py-6 text-center text-muted-foreground">Cargando…</p>;
}
