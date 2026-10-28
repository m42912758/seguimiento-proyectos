export const ESTADOS_PROYECTO = {
  cotizando: "Cotizando",
  aceptado: "Aceptado, sin empezar",
  rechazado: "Rechazado",
  en_ejecucion: "En ejecución",
  finalizado: "Finalizado",
  cerrado: "Cerrado",
} as const;

export type EstadoProyecto = keyof typeof ESTADOS_PROYECTO;

// Estados en los que se cargan horas, viajes y gastos.
export const ESTADOS_CON_CARGA: EstadoProyecto[] = ["en_ejecucion", "finalizado"];

// Recargo de la hora extra sobre la hora normal.
export const RECARGO_EXTRA = 50;

export function costoHoraExtra(costoHora: number) {
  return Math.round(costoHora * (1 + RECARGO_EXTRA / 100) * 100) / 100;
}

export type ProyectoEmpleado = {
  id: number;
  proyecto_id: number;
  empleado_id: number;
  jornal: number;
};

export type ParteHoras = {
  id: number;
  proyecto_id: number;
  empleado_id: number;
  fecha: string;
  horas_normales: number;
  horas_extra: number;
  costo_hora_aplicado: number;
  costo_hora_extra_aplicado: number;
  nota: string | null;
};

export type Viaje = {
  id: number;
  proyecto_id: number;
  vehiculo_id: number | null;
  fecha: string;
  km: number;
  costo_por_km_aplicado: number;
  peajes: number;
  destino: string | null;
  quienes: string | null;
  nota: string | null;
};

export function costoParte(p: ParteHoras) {
  return p.horas_normales * p.costo_hora_aplicado + p.horas_extra * p.costo_hora_extra_aplicado;
}

export function costoViaje(v: Viaje) {
  return v.km * v.costo_por_km_aplicado + v.peajes;
}
