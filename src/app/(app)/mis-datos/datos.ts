// Datos del dueño que encabezan los PDF para el cliente.
export type MisDatos = {
  razon_social: string;
  nombre_fantasia: string | null;
  cuit: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  logo: string | null; // imagen achicada como data URL (PNG o JPEG)
};

// Tope de la columna en la base; el formulario achica la imagen antes.
export const LARGO_MAXIMO_LOGO = 400_000;
