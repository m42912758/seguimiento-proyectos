"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export type ItemLista = {
  id: number;
  href: string;
  titulo: string;
  detalle?: string;
  // Dato destacado a la derecha, por ejemplo un precio.
  valor?: string;
  aviso?: string;
  activo: boolean;
  busqueda: string;
};

// Lista de un catálogo con buscador y filtro de dados de baja. Se filtra en el
// navegador: para un solo usuario los catálogos son chicos.
export function ListaBuscable({
  items,
  vacio,
}: {
  items: ItemLista[];
  vacio: string;
}) {
  const [texto, setTexto] = useState("");
  const [verBajas, setVerBajas] = useState(false);

  const buscado = normalizar(texto);
  const visibles = items.filter(
    (item) =>
      item.activo !== verBajas && normalizar(item.busqueda).includes(buscado),
  );
  const cantidadBajas = items.filter((item) => !item.activo).length;

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="search"
        placeholder="Buscar…"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="h-11"
      />

      {visibles.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">
          {items.length === 0 ? vacio : "No hay resultados."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl ring-1 ring-foreground/10">
          {visibles.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{item.titulo}</span>
                  {item.detalle && (
                    <span className="truncate text-sm text-muted-foreground">
                      {item.detalle}
                    </span>
                  )}
                  {item.aviso && (
                    <span className="text-sm text-amber-700 dark:text-amber-400">
                      {item.aviso}
                    </span>
                  )}
                </div>
                {item.valor && (
                  <span className="shrink-0 font-medium tabular-nums">
                    {item.valor}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(cantidadBajas > 0 || verBajas) && (
        <button
          type="button"
          onClick={() => setVerBajas(!verBajas)}
          className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {verBajas
            ? "Volver a los activos"
            : `Ver dados de baja (${cantidadBajas})`}
        </button>
      )}
    </div>
  );
}

// Sin mayúsculas ni tildes, para que "iluminacion" encuentre "Iluminación".
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
