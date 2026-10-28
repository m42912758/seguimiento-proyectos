"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Pestana = { href: string; titulo: string };

export function Pestanas({ pestanas }: { pestanas: Pestana[] }) {
  return <PestanasLinks pestanas={pestanas} pathname={usePathname()} />;
}

// Sin pathname no marca ninguna: versión para el fallback de <Suspense>.
export function PestanasLinks({
  pestanas,
  pathname,
}: {
  pestanas: Pestana[];
  pathname?: string;
}) {
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b px-4">
      {pestanas.map(({ href, titulo }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium",
            pathname?.startsWith(href)
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {titulo}
        </Link>
      ))}
    </nav>
  );
}
