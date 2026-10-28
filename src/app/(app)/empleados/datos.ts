export type Empleado = {
  id: number;
  nombre: string;
  categoria: string | null;
  // Valor de la jornada de 8 h que se sugiere al asignarlo a un proyecto;
  // el valor real se define en cada proyecto.
  jornal_referencia: number;
  activo: boolean;
};

export const HORAS_JORNADA = 8;
