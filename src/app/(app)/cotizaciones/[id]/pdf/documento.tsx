import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { CONDICIONES_IVA } from "@/app/(app)/clientes/datos";
import type { MisDatos } from "@/app/(app)/mis-datos/datos";
import { formatearCuit } from "@/lib/cuit";
import { formatearFecha, formatearMoneda, formatearNumero } from "@/lib/formato";
import type { CotizacionCompleta } from "../../consultas";
import {
  RUBROS,
  calcularTotales,
  factorVenta,
  formatearAlicuota,
  precioUnitario,
  type ItemCotizacion,
  type Rubro,
} from "../../datos";

// Detallado: renglón por renglón. Por rubro: un importe por cada rubro.
export type ModoPdf = "detalle" | "rubros";

const GRIS = "#6b7280";
const LINEA = "#d1d5db";

const s = StyleSheet.create({
  pagina: { padding: 40, paddingBottom: 60, fontSize: 9.5, fontFamily: "Helvetica", color: "#111827" },
  encabezado: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  emisor: { flexDirection: "column", gap: 2, maxWidth: 300 },
  logo: { maxHeight: 60, maxWidth: 180, objectFit: "contain", marginBottom: 6 },
  nombre: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  gris: { color: GRIS },
  titulo: { alignItems: "flex-end", gap: 2 },
  palabraTitulo: { fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  caja: { marginTop: 16, padding: 10, borderWidth: 1, borderColor: LINEA, borderRadius: 4, gap: 3 },
  fila: { flexDirection: "row" },
  etiqueta: { width: 80, color: GRIS },
  tabla: { marginTop: 16 },
  cabecera: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#111827",
    paddingBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  rubro: { marginTop: 8, paddingVertical: 3, fontFamily: "Helvetica-Bold" },
  renglon: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderColor: LINEA },
  subtotalRubro: { flexDirection: "row", justifyContent: "flex-end", paddingVertical: 3, color: GRIS },
  colDescripcion: { flex: 1, paddingRight: 6 },
  colCantidad: { width: 60, textAlign: "right" },
  colUnitario: { width: 75, textAlign: "right" },
  colIva: { width: 40, textAlign: "right" },
  colImporte: { width: 80, textAlign: "right" },
  totales: { marginTop: 12, alignSelf: "flex-end", width: 230, gap: 3 },
  filaTotal: { flexDirection: "row", justifyContent: "space-between" },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
    paddingTop: 4,
    borderTopWidth: 1,
    borderColor: "#111827",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  condiciones: { marginTop: 20, gap: 3 },
  subtitulo: { fontFamily: "Helvetica-Bold" },
  pie: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: GRIS,
  },
});

export function DocumentoCotizacion({
  cotizacion,
  items,
  misDatos,
  modo,
}: {
  cotizacion: CotizacionCompleta;
  items: ItemCotizacion[];
  misDatos: MisDatos | null;
  modo: ModoPdf;
}) {
  const proyecto = cotizacion.proyectos;
  const factor = factorVenta(cotizacion.pct_imprevistos, cotizacion.pct_margen);
  const totales = calcularTotales(items, cotizacion.pct_imprevistos, cotizacion.pct_margen);
  const numero =
    cotizacion.version > 1 ? `${proyecto.codigo} v${cotizacion.version}` : proyecto.codigo;
  const rubros = (Object.keys(RUBROS) as Rubro[])
    .map((rubro) => {
      const renglones = items
        .filter((i) => i.rubro === rubro)
        .map((item) => {
          const unitario = precioUnitario(item.costo_unitario, factor);
          return { item, unitario, importe: Math.round(item.cantidad * unitario * 100) / 100 };
        });
      return { rubro, renglones, neto: renglones.reduce((suma, r) => suma + r.importe, 0) };
    })
    .filter((r) => r.renglones.length > 0);

  return (
    <Document title={`Presupuesto ${numero}`} author={misDatos?.razon_social}>
      <Page size="A4" style={s.pagina}>
        <View style={s.encabezado}>
          <View style={s.emisor}>
            {misDatos?.logo && (
              // eslint-disable-next-line jsx-a11y/alt-text -- el Image de react-pdf no tiene alt
              <Image src={misDatos.logo} style={s.logo} />
            )}
            <Text style={s.nombre}>
              {misDatos?.nombre_fantasia || misDatos?.razon_social || "Completá tus datos en la app"}
            </Text>
            {misDatos?.nombre_fantasia && <Text>{misDatos.razon_social}</Text>}
            {misDatos?.cuit && (
              <Text>CUIT {formatearCuit(misDatos.cuit)} · Responsable inscripto</Text>
            )}
            {misDatos?.direccion && <Text style={s.gris}>{misDatos.direccion}</Text>}
            {(misDatos?.telefono || misDatos?.email) && (
              <Text style={s.gris}>
                {[misDatos.telefono, misDatos.email].filter(Boolean).join(" · ")}
              </Text>
            )}
          </View>
          <View style={s.titulo}>
            <Text style={s.palabraTitulo}>PRESUPUESTO</Text>
            <Text>N° {numero}</Text>
            <Text>Fecha: {formatearFecha(cotizacion.fecha)}</Text>
            {cotizacion.vencimiento && (
              <Text>Válido hasta: {formatearFecha(cotizacion.vencimiento)}</Text>
            )}
            {cotizacion.estado === "borrador" && <Text style={s.gris}>(borrador)</Text>}
          </View>
        </View>

        <View style={s.caja}>
          <View style={s.fila}>
            <Text style={s.etiqueta}>Cliente</Text>
            <Text style={{ flex: 1 }}>{proyecto.clientes.nombre}</Text>
          </View>
          {proyecto.clientes.cuit && (
            <View style={s.fila}>
              <Text style={s.etiqueta}>CUIT</Text>
              <Text style={{ flex: 1 }}>
                {formatearCuit(proyecto.clientes.cuit)} ·{" "}
                {CONDICIONES_IVA[proyecto.clientes.condicion_iva]}
              </Text>
            </View>
          )}
          <View style={s.fila}>
            <Text style={s.etiqueta}>Trabajo</Text>
            <Text style={{ flex: 1 }}>{proyecto.nombre}</Text>
          </View>
          {proyecto.direccion && (
            <View style={s.fila}>
              <Text style={s.etiqueta}>Lugar</Text>
              <Text style={{ flex: 1 }}>{proyecto.direccion}</Text>
            </View>
          )}
        </View>

        <View style={s.tabla}>
          {modo === "detalle" ? (
            <>
              <View style={s.cabecera}>
                <Text style={s.colDescripcion}>Descripción</Text>
                <Text style={s.colCantidad}>Cantidad</Text>
                <Text style={s.colUnitario}>Precio unit.</Text>
                <Text style={s.colIva}>IVA</Text>
                <Text style={s.colImporte}>Importe</Text>
              </View>
              {rubros.map(({ rubro, renglones, neto }) => (
                <View key={rubro}>
                  <Text style={s.rubro} minPresenceAhead={30}>
                    {RUBROS[rubro].nombre}
                  </Text>
                  {renglones.map(({ item, unitario, importe }) => (
                    <View key={item.id} style={s.renglon} wrap={false}>
                      <Text style={s.colDescripcion}>{item.descripcion}</Text>
                      <Text style={s.colCantidad}>
                        {formatearNumero(item.cantidad)}{" "}
                        {item.unidad === "viaje" && item.cantidad !== 1 ? "viajes" : item.unidad}
                      </Text>
                      <Text style={s.colUnitario}>{formatearMoneda(unitario)}</Text>
                      <Text style={s.colIva}>{formatearAlicuota(item.alicuota_iva)}</Text>
                      <Text style={s.colImporte}>{formatearMoneda(importe)}</Text>
                    </View>
                  ))}
                  {rubros.length > 1 && (
                    <View style={s.subtotalRubro}>
                      <Text>Subtotal {RUBROS[rubro].nombre.toLowerCase()}: </Text>
                      <Text style={s.colImporte}>{formatearMoneda(neto)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          ) : (
            <>
              <View style={s.cabecera}>
                <Text style={s.colDescripcion}>Concepto</Text>
                <Text style={s.colImporte}>Importe</Text>
              </View>
              {rubros.map(({ rubro, neto }) => (
                <View key={rubro} style={s.renglon}>
                  <Text style={s.colDescripcion}>{RUBROS[rubro].nombre}</Text>
                  <Text style={s.colImporte}>{formatearMoneda(neto)}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={s.totales} wrap={false}>
          <View style={s.filaTotal}>
            <Text>Subtotal sin IVA</Text>
            <Text>{formatearMoneda(totales.neto)}</Text>
          </View>
          {totales.ivaPorAlicuota.map((a) => (
            <View key={a.alicuota} style={s.filaTotal}>
              <Text>IVA {formatearAlicuota(a.alicuota)}</Text>
              <Text>{formatearMoneda(a.iva)}</Text>
            </View>
          ))}
          <View style={s.total}>
            <Text>Total</Text>
            <Text>{formatearMoneda(totales.total)}</Text>
          </View>
        </View>

        {cotizacion.notas && (
          <View style={s.condiciones} wrap={false}>
            <Text style={s.subtitulo}>Condiciones</Text>
            <Text>{cotizacion.notas}</Text>
          </View>
        )}

        <View style={s.pie} fixed>
          <Text>Importes en pesos argentinos.</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
