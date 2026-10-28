import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BotonActivo } from "@/components/boton-activo";
import { Cargando, Encabezado } from "@/components/encabezado";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { enlaceWhatsapp, type Cliente } from "../datos";
import { FormularioCliente } from "../formulario-cliente";

async function FichaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", Number(id))
    .returns<Cliente[]>()
    .maybeSingle();
  if (!cliente) notFound();

  return (
    <>
      <Encabezado
        titulo={cliente.activo ? cliente.nombre : `${cliente.nombre} (de baja)`}
        volver={{ href: "/clientes", texto: "Clientes" }}
      />
      {cliente.telefono && (
        <div className="flex gap-2">
          <a
            href={`tel:${cliente.telefono.replace(/\s/g, "")}`}
            className={cn(buttonVariants({ variant: "outline" }), "h-10 flex-1")}
          >
            Llamar
          </a>
          <a
            href={enlaceWhatsapp(cliente.telefono)}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "h-10 flex-1")}
          >
            WhatsApp
          </a>
        </div>
      )}
      <FormularioCliente cliente={cliente} />
      <BotonActivo tabla="clientes" id={cliente.id} activo={cliente.activo} />
    </>
  );
}

export default function ClientePage({ params }: PageProps<"/clientes/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Cargando />}>
        <FichaCliente params={params} />
      </Suspense>
    </div>
  );
}
