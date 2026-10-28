import { createClient } from "@/lib/supabase/server";

// Para Server Actions: se pueden llamar con un POST directo, así que cada una
// verifica la sesión antes de tocar la base (además del RLS).
export async function clienteConSesion() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    throw new Error("La sesión venció. Volvé a ingresar.");
  }
  return supabase;
}

export type EstadoFormulario = { error: string } | null;
