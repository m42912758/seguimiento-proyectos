# Plan — App de seguimiento de proyectos

Oct 26, 2026 · @Pablo

## Objetivo

Una app web, usable desde el celular en obra, que acompaña cada trabajo en tres etapas: cotizar, registrar la ejecución y cerrar con un reporte de cotizado vs. real. La meta es saber cuánto se ganó de verdad en cada proyecto y usar esos desvíos para cotizar mejor el siguiente.

- **Usuarios:** solo vos. Cargás todos los datos, incluidas las horas de tus empleados, y sos el único que ve los números.
- **Regla de oro:** cargar un gasto debe tomar menos de 30 segundos desde el celular. Si cuesta, no se carga, y el reporte final miente.
- **Moneda:** todo se registra en pesos con su fecha; más adelante se suma la conversión al dólar Banco Nación, para comparar proyectos largos sin que la inflación distorsione los números.

## Ciclo de vida del proyecto

Cada trabajo nace como cotización y, si el cliente acepta, se convierte en proyecto; la versión aceptada queda congelada como línea base para comparar al final.

Estados y transiciones:

- Borrador -> Enviada al cliente -> ¿Acepta?
  - sí -> En ejecución (se cargan horas, compras, viajes, gastos, adicionales, cobros y avance) -> Finalizado (trabajo entregado; faltan cobros o cierre) -> Cerrado con reporte (cotizado vs. real, margen y lecciones)
  - no -> Rechazada o vencida (suma a la tasa de aceptación)
  - pide cambios -> vuelve a Borrador como nueva versión
- Retroalimentación: al cerrar, los factores de corrección aprendidos se usan en la próxima cotización.

La flecha punteada es lo que hace que la app mejore tu rendimiento: lo aprendido en cada cierre ajusta la estimación siguiente.

## Módulos y funcionalidades

Ocho módulos; los marcados MVP alcanzan para usar la app en un proyecto real de punta a punta.

| Módulo | Qué hace | Versión |
| --- | --- | --- |
| Clientes | Datos de contacto, CUIT, condición frente al IVA, historial de cotizaciones y proyectos | MVP |
| Catálogo | Materiales (unidad, precio, proveedor, fecha del precio), tarifas de mano de obra por empleado o categoría, vehículos (costo total por km: combustible + mantenimiento + desgaste) | MVP |
| Cotizaciones | Ítems de materiales, horas estimadas por tarea, viajes estimados, otros gastos, % de imprevistos, % de margen, IVA discriminado, vencimiento, versiones y PDF para el cliente | MVP |
| Ejecución | Partes de horas, compras, viajes, viáticos, subcontratos, adicionales aprobados, cobros y avance % | MVP |
| Empleados | Datos, costo hora real (sueldo + cargas) y tarifa que se cobra; sus horas las cargás vos | MVP |
| Cierre y reporte | Comparación cotizado vs. real por rubro, margen final, notas de lecciones aprendidas, PDF | MVP |
| Panel general | Proyectos activos, horas de la semana, gastos sin asignar, cobros pendientes, indicadores históricos | v2 |
| Asistente de cotización | Sugiere horas y materiales a partir de proyectos parecidos y aplica factores de corrección aprendidos | v3 |

### Detalle de la carga durante la ejecución

- **Horas:** fecha, persona, horas normales y extra, tarea o ítem de la cotización. Un jornal se carga como sus horas equivalentes. Botón de “empezar/terminar jornada” como alternativa a tipear.
- **Compras:** proveedor, ítems, monto, foto del ticket o factura, ítem cotizado al que corresponde. Una compra puede repartirse entre proyectos.
- **Viajes:** vehículo, km recorridos (u origen–destino), litros o costo de combustible, peajes, quién viajó. El costo sale de km × costo por km del vehículo; peajes aparte.
- **Viáticos y otros:** comida, alojamiento, alquiler de herramientas, fletes, subcontratistas.
- **Adicionales:** cambios de alcance pedidos por el cliente, con su propio monto aprobado, para que no se mezclen con desvíos propios.
- **Cobros:** anticipos y pagos recibidos, para conocer el saldo y el plazo real de cobro.
- **Avance:** % estimado y notas o fotos del día; sirve para detectar a mitad de obra si el presupuesto se va a pasar.

## Modelo de datos

Todo cuelga del Proyecto: la cotización define lo planificado y los registros de ejecución lo real, ambos ligados a los mismos ítems para poder compararlos renglón por renglón.

| Entidad | Campos clave | Se relaciona con |
| --- | --- | --- |
| Cliente | nombre, CUIT, condición IVA, contacto | Proyectos |
| Proyecto | código, nombre, cliente, tipo de trabajo, estado, fechas plan/real, dirección | Cliente, Cotizaciones, Registros |
| Cotización | proyecto, versión, fecha, vencimiento, % imprevistos, % margen, IVA, total, dólar del día, estado | Proyecto, Ítems |
| Ítem de cotización | rubro (material, mano de obra, viaje, otro), descripción, cantidad, unidad, costo unitario, precio | Cotización, Material, Registros |
| Material | descripción, unidad, precio, proveedor, fecha de precio | Ítems, Compras |
| Empleado | nombre, categoría, costo hora, tarifa hora, activo | Partes de horas |
| Vehículo | nombre, patente, consumo l/100 km, mantenimiento anual, km por año, valor de compra y de reventa, costo por km | Viajes |
| Parte de horas | proyecto, empleado, fecha, horas normales, horas extra, ítem | Proyecto, Empleado |
| Compra | proyecto, proveedor, fecha, monto, comprobante (foto), ítem | Proyecto, Material |
| Viaje | proyecto, vehículo, fecha, km, costo por km aplicado, peajes | Proyecto, Vehículo |
| Gasto | proyecto, tipo (comida, alojamiento, alquiler, subcontrato, otro), fecha, monto, comprobante | Proyecto |
| Adicional | proyecto, descripción, monto aprobado, fecha | Proyecto |
| Cobro | proyecto, fecha, monto, medio | Proyecto |
| Precio de combustible | fecha, tipo, $/litro | Viajes |
| Cotización del dólar | fecha, valor | Todos los montos |

Cada monto guarda el valor en pesos y la fecha; el equivalente en dólares se calcula con la cotización de ese día.

## Reportes e indicadores

El reporte de cierre responde tres preguntas: cuánto gané, dónde me desvié y qué tengo que corregir al cotizar el próximo trabajo parecido.

### Reporte de cierre de cada proyecto

- Tabla por rubro (materiales, mano de obra, viajes, viáticos, otros): cotizado, real, diferencia en $ y en %.
- Margen cotizado vs. margen real, en pesos y en dólares.
- Horas estimadas vs. reales por tarea y por persona.
- Adicionales cobrados aparte, separados de los desvíos propios.
- Duración planificada vs. real y días hasta el cobro total.
- Campo de “lecciones aprendidas” escrito por vos al cerrar.

### Indicadores históricos

| Indicador | Cómo se calcula | Para qué sirve |
| --- | --- | --- |
| Margen real | (cobrado − costo real) / cobrado | Saber si el trabajo valió la pena |
| Desvío de horas | horas reales / horas estimadas, por tipo de trabajo | Corregir estimaciones de mano de obra |
| Desvío de materiales | costo real / costo cotizado, por rubro | Detectar listas de materiales incompletas o precios viejos |
| Ganancia por hora | (cobrado − costo de materiales y gastos) / horas totales | Comparar qué tipo de trabajo rinde más |
| Peso de los traslados | (viajes + viáticos) / costo total | Ver si conviene cobrar movilidad aparte o agrupar visitas |
| Tasa de aceptación | cotizaciones aceptadas / enviadas | Saber si estás caro o barato frente al mercado |
| Rentabilidad por cliente | margen real acumulado por cliente | Priorizar a quién atender primero |
| Plazo de cobro | días entre cierre y último cobro | Planificar caja |

### Cómo la app te ayuda a mejorar

Con cinco o más proyectos cerrados de un mismo tipo, la app calcula un **factor de corrección** por rubro. Por ejemplo, si en tableros eléctricos las horas reales suelen ser 1,3 veces las estimadas, al cotizar el siguiente te lo avisa y sugiere ajustar. Además, durante la obra alerta cuando un rubro supera el 80% de lo cotizado con el avance todavía bajo.

## Stack tecnológico recomendado

Una app web instalable en el celular (PWA) con base de datos en la nube: un solo código para PC y teléfono, varios usuarios y sin servidores que mantener. Es un stack que Claude Code maneja muy bien.

| Parte | Elección | Por qué |
| --- | --- | --- |
| Interfaz y lógica | Next.js + TypeScript | Estándar muy documentado; TypeScript evita errores de tipos en cálculos de montos |
| Estilos y componentes | Tailwind CSS + shadcn/ui | Formularios y tablas prolijos sin diseñar desde cero |
| Base de datos, usuarios y archivos | Supabase (PostgreSQL) | Login personal, fotos de tickets y base relacional en un solo servicio; plan gratuito alcanza para empezar |
| Gráficos | Recharts | Indicadores del panel y reporte de cierre |
| PDF | react-pdf | Cotización para el cliente y reporte de cierre |
| Publicación | Vercel | Es lo que permite abrirla desde el celular; se configura una sola vez y después se actualiza sola con cada cambio. Gratis para uso personal |
| Uso en obra | PWA con ícono en el celular | Se abre como app desde el celular, sin tienda; necesita internet |

**Alternativa más simple:** una app de escritorio local con SQLite. Es más fácil de arrancar, pero solo se usa en esa PC: pierde la carga desde el celular en obra, que es clave para lo que buscás.

## Plan de desarrollo por etapas

Siete fases, cada una usable por sí sola; al terminar la fase 4 ya podés llevar un proyecto real completo. Conviene no saltar a la siguiente hasta probar la anterior con datos reales.

1. **Fase 0 — Base del proyecto.** Crear la app Next.js, conectar Supabase, login y menú principal, publicar en Vercel.
   - Listo cuando: entrás desde la PC y el celular con tu usuario.
   - **Estado (28/10/2026): terminada.** App creada (Next.js 16 + shadcn/ui), login con Supabase, registro público cerrado, menú principal, tablas de la Fase 1 creadas (`supabase/migrations/0001_fase1_catalogos.sql`, esquema completo en `supabase/ESQUEMA.md`), código en GitHub y publicada en Vercel (se actualiza sola con cada cambio subido a GitHub). Probada con login desde la PC y el celular.
2. **Fase 1 — Catálogos.** Clientes, materiales, empleados, vehículos con su calculadora de costo por km y tipos de trabajo.
   - Listo cuando: cargaste tus materiales y empleados habituales.
   - **Estado (28/10/2026): en curso.** Hechos: clientes (con validación de CUIT, llamar y WhatsApp), empleados (jornada de 8 h de referencia; el valor real va por proyecto), materiales (con planilla de Excel para descargar, editar y volver a subir, y aviso de precios de más de 60 días) y tipos de trabajo. Todo se da de baja en lugar de borrarse. Migración `0002` corrida en Supabase. Falta: vehículos con calculadora de costo por km y precios de combustible.
3. **Fase 2 — Cotizaciones.** Armado por ítems, cálculo de imprevistos, margen e IVA, versiones, estados y PDF para el cliente.
   - Listo cuando: mandás una cotización real hecha con la app.
4. **Fase 3 — Ejecución.** Pasar una cotización aceptada a proyecto y cargar horas, compras con foto, viajes, gastos, adicionales y cobros, con formularios rápidos para celular.
   - Listo cuando: llevás una semana de obra cargada sin papel.
5. **Fase 4 — Cierre y reporte.** Comparación cotizado vs. real por rubro, margen final, lecciones aprendidas y PDF del reporte.
   - Listo cuando: cerrás tu primer proyecto con reporte.
6. **Fase 5 — Panel e indicadores.** Panel general, indicadores históricos, alertas de desvío durante la obra, exportación a Excel y conversión al dólar Banco Nación.
   - Listo cuando: ves el margen real de todos los proyectos cerrados.
7. **Fase 6 — Mejoras.** Lectura automática de tickets con la cámara y asistente de cotización con factores de corrección.
   - Listo cuando: lo que vos decidas priorizar según el uso real.

## Decisiones tomadas

Es una app personal: solo vos cargás datos y ves los números, con conexión a internet. Estas decisiones ya están aplicadas en el resto del plan.

| Tema | Decisión | Efecto en la app |
| --- | --- | --- |
| Usuarios | Solo vos cargás y ves todo, incluidas las horas de tus empleados | Un único login; sin roles ni permisos |
| Conexión | Se usa con internet; sin modo sin señal | Más simple; lo hecho en un lugar sin señal se carga al volver |
| Facturación | Responsable inscripto | Cotización y reporte discriminan IVA (21% o 10,5% por ítem) |
| Dólar | Banco Nación, en una etapa posterior | Cada monto guarda su fecha para convertirlo después |
| Vehículos | Costo por km fijo: combustible + mantenimiento + desgaste | Cada viaje = km × costo por km + peajes |
| Tipos de trabajo | Tableros, iluminación, mantenimiento, instalaciones; lista editable | Etiqueta por proyecto para comparar trabajos parecidos entre sí |
| Mano de obra | Mixta, pero se carga en horas | Un jornal se carga como sus horas equivalentes |
| Valor de los empleados | Por jornada de 8 h, definido en cada proyecto | El empleado tiene un jornal de referencia que se sugiere; el costo hora es jornal ÷ 8 |
| Carga de materiales | Planilla de Excel | Se descarga, se edita y se sube; la app muestra los cambios antes de aplicarlos |

### Cómo sacar el costo por km

```latex
\text{costo por km} = \frac{\text{consumo (l/100 km)}}{100} \times \text{precio del litro} + \frac{\text{mantenimiento anual}}{\text{km por año}} + \frac{\text{valor de compra} - \text{valor de reventa}}{\text{km de vida útil}}
```

El mantenimiento anual incluye service, cubiertas, frenos, seguro y patente. La ficha de cada vehículo trae esta calculadora; el resultado se guarda fijo y conviene revisarlo cuando sube el combustible.

## Cómo arrancar en Claude Code

Este archivo es `PLAN.md`; va en la carpeta del proyecto. Después trabajá una fase por sesión, pidiendo primero el plan de la fase y aprobándolo antes de que escriba código.

1. Crear cuentas gratuitas en Supabase, Vercel y GitHub.
2. Crear una carpeta vacía, por ejemplo `seguimiento-proyectos`, con `PLAN.md` adentro.
3. Abrir Claude Code en esa carpeta y pegar el primer pedido.
4. Al terminar cada fase, probarla con datos reales y pedir a Claude Code que actualice `PLAN.md` con lo hecho.

### Primer pedido para Claude Code

```text
Leé PLAN.md: es el plan de una app para seguir mis proyectos (cotización, ejecución y cierre con reporte).
No sé mucho de desarrollo web, así que explicame cada paso que tenga que hacer yo (cuentas, claves, comandos).

Empecemos solo por la Fase 0:
- Crear la app con Next.js + TypeScript + Tailwind + shadcn/ui.
- Conectar Supabase y dejar el login funcionando.
- Crear un archivo CLAUDE.md con las convenciones del proyecto: app personal de un solo usuario (yo), textos de la interfaz en español, montos en pesos con fecha, IVA discriminado, formularios pensados primero para celular.
- Proponer el esquema completo de la base de datos según la sección "Modelo de datos", pero crear solo las tablas de la Fase 0 y 1.

Antes de escribir código, mostrame el plan de la fase y esperá mi aprobación.
```
