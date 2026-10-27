"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const SECCIONES = [
  { href: "/", titulo: "Inicio" },
  { href: "/cotizaciones", titulo: "Cotizaciones" },
  { href: "/proyectos", titulo: "Proyectos" },
  { href: "/clientes", titulo: "Clientes" },
  { href: "/catalogo", titulo: "Catálogo" },
  { href: "/empleados", titulo: "Empleados" },
];

export function MenuPrincipal() {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4">
      {SECCIONES.map(({ href, titulo }) => {
        const activa =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm font-medium",
              activa
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {titulo}
          </Link>
        );
      })}
    </nav>
  );
}
