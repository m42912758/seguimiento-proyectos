# Esquema de la base de datos

Propuesta completa según la sección "Modelo de datos" de `PLAN.md`. Solo las tablas marcadas **creada** existen hoy; el resto se crea en su fase y puede ajustarse antes.

## Reglas comunes

- Toda tabla tiene `id bigint` autoincremental, `user_id uuid` (por defecto el usuario logueado) y `created_at`.
- RLS activado en todas: cada fila solo la ve y la modifica su dueño (`user_id = auth.uid()`).
- Montos en `numeric(14,2)`, en pesos. Cada registro de dinero tiene su `fecha` para la conversión al dólar.
- IVA por ítem: `alicuota_iva` es 21 o 10,5.
- Lo que se da de baja se marca `activo = false` en vez de borrarse, para no romper el historial.

## Fase 1 — Catálogos (creadas)

| Tabla | Campos | Notas |
| --- | --- | --- |
| `tipos_trabajo` | nombre, activo | Tableros, Iluminación, Mantenimiento, Instalaciones; lista editable |
| `clientes` | nombre, cuit, condicion_iva, telefono, email, direccion, notas, activo | condicion_iva: responsable_inscripto, monotributo, exento, consumidor_final |
| `materiales` | descripcion, unidad, precio, alicuota_iva, proveedor, fecha_precio, activo | precio sin IVA |
| `empleados` | nombre, categoria, costo_hora, tarifa_hora, activo | costo_hora = sueldo + cargas; tarifa_hora = lo que se cobra |
| `vehiculos` | nombre, patente, consumo_l_100km, precio_litro, mantenimiento_anual, km_por_anio, valor_compra, valor_reventa, km_vida_util, costo_por_km, fecha_costo, activo | costo_por_km se calcula en la ficha y se guarda fijo |
| `precios_combustible` | fecha, tipo, precio_litro | Historial de precios para recalcular vehículos |

## Fase 2 — Cotizaciones

| Tabla | Campos | Notas |
| --- | --- | --- |
| `proyectos` | codigo, nombre, cliente_id, tipo_trabajo_id, estado, direccion, fecha_inicio_plan, fecha_fin_plan, fecha_inicio_real, fecha_fin_real | estado: borrador, enviada, rechazada, en_ejecucion, finalizado, cerrado |
| `cotizaciones` | proyecto_id, version, fecha, vencimiento, pct_imprevistos, pct_margen, total_neto, total_iva, total, dolar_dia, estado, aceptada | La versión aceptada queda congelada como línea base |
| `cotizacion_items` | cotizacion_id, rubro, descripcion, cantidad, unidad, costo_unitario, precio_unitario, alicuota_iva, material_id, orden | rubro: material, mano_obra, viaje, otro |

## Fase 3 — Ejecución

Todos llevan `proyecto_id`, `fecha` y, cuando corresponde, `cotizacion_item_id` para comparar renglón por renglón.

| Tabla | Campos | Notas |
| --- | --- | --- |
| `partes_horas` | empleado_id, horas_normales, horas_extra, costo_hora_aplicado, nota | El costo hora se copia al cargar, para que no cambie si después sube el sueldo |
| `compras` | proveedor, monto, alicuota_iva, comprobante_path, descripcion | Foto en Supabase Storage; una compra repartida entre proyectos se guarda como varias filas |
| `viajes` | vehiculo_id, km, costo_por_km_aplicado, peajes, quienes, origen, destino | costo = km × costo_por_km_aplicado + peajes |
| `gastos` | tipo, monto, descripcion, comprobante_path | tipo: comida, alojamiento, alquiler, flete, subcontrato, otro |
| `adicionales` | descripcion, monto_aprobado | Cambios de alcance pedidos por el cliente |
| `cobros` | monto, medio, nota | Anticipos y pagos |
| `avances` | porcentaje, nota, fotos | Avance estimado del día |

## Fase 4 y 5 — Cierre e indicadores

| Tabla | Campos | Notas |
| --- | --- | --- |
| `cierres` | proyecto_id, fecha, lecciones, margen_real, snapshot | snapshot guarda los totales al cerrar |
| `cotizaciones_dolar` | fecha, valor | Dólar Banco Nación por día |
