// CUIT/CUIL: 11 dígitos, el último es verificador (módulo 11).

const PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function soloDigitos(cuit: string) {
  return cuit.replace(/\D/g, "");
}

export function cuitValido(cuit: string) {
  const digitos = soloDigitos(cuit);
  if (digitos.length !== 11) return false;

  const suma = PESOS.reduce((total, peso, i) => total + peso * Number(digitos[i]), 0);
  let verificador = 11 - (suma % 11);
  if (verificador === 11) verificador = 0;
  if (verificador === 10) return false;

  return verificador === Number(digitos[10]);
}

// "20123456789" → "20-12345678-9"
export function formatearCuit(cuit: string) {
  const d = soloDigitos(cuit);
  if (d.length !== 11) return cuit;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}
