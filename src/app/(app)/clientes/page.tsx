import { Suspense } from "react";
import { Cargando, Encabezado } from "@/components/encabezado";
import { ListaBuscable } from "@/components/lista-buscable";
import { formatearCuit } from "@/lib/cuit";
import { createClient } from "@/lib/supabase/server";
import { CONDICIONES_IVA, type Cliente } from "./datos";

async function ListaClientes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre")
    .returns<Cliente[]>();

  const items = (data ?? []).map((c) => ({
    id: c.id,
    href: `/clientes/${c.id}`,
    titulo: c.nombre,
    detalle: [c.cuit && formatearCuit(c.cuit), CONDICIONES_IVA[c.condicion_iva]]
      .filter(Boolean)
      .join(" · "),
    activo: c.activo,
    busqueda: [c.nombre, c.cuit, c.telefono, c.email, c.direccion].join(" "),
  }));

  return <ListaBuscable items={items} vacio="Todavía no cargaste clientes." />;
}

export default function ClientesPage() {
  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Clientes"
        boton={{ href: "/clientes/nuevo", texto: "Nuevo" }}
      />
      <Suspense fallback={<Cargando />}>
        <ListaClientes />
      </Suspense>
    </div>
  );
}
