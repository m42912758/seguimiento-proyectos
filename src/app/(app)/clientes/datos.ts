export type Cliente = {
  id: number;
  nombre: string;
  cuit: string | null;
  condicion_iva: CondicionIva;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
};

export const CONDICIONES_IVA = {
  responsable_inscripto: "Responsable inscripto",
  monotributo: "Monotributo",
  exento: "Exento",
  consumidor_final: "Consumidor final",
} as const;

export type CondicionIva = keyof typeof CONDICIONES_IVA;

// Teléfono cargado con código de área, sin 0 ni 15 (ej. "11 2345 6789"):
// WhatsApp lo necesita en formato internacional, 549 + número.
export function enlaceWhatsapp(telefono: string) {
  const digitos = telefono.replace(/\D/g, "");
  return `https://wa.me/${digitos.startsWith("54") ? digitos : `549${digitos}`}`;
}
