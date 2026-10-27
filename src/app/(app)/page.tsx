import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function UsuarioActual() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return <>{data?.claims?.email ?? "usuario"}</>;
}

export default function InicioPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Inicio</h1>
      <p className="text-muted-foreground">
        Sesión iniciada como{" "}
        <Suspense fallback="…">
          <UsuarioActual />
        </Suspense>
        .
      </p>
      <p className="text-muted-foreground">
        El panel con proyectos activos, horas y cobros llega en la Fase 5.
      </p>
    </div>
  );
}
