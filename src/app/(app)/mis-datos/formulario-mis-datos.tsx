"use client";

import { useState } from "react";
import { Campo, Formulario } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatearCuit } from "@/lib/cuit";
import { guardarMisDatos } from "./actions";
import { LARGO_MAXIMO_LOGO, type MisDatos } from "./datos";

// El logo se achica en el navegador para que entre en la base y el PDF pese poco.
const ANCHO_LOGO = 600;
const ALTO_LOGO = 300;

export function FormularioMisDatos({ datos }: { datos: MisDatos | null }) {
  const [logo, setLogo] = useState(datos?.logo ?? "");
  const [errorLogo, setErrorLogo] = useState<string | null>(null);

  async function elegirLogo(archivo: File | undefined) {
    setErrorLogo(null);
    if (!archivo) return;
    try {
      setLogo(await achicarImagen(archivo));
    } catch {
      setErrorLogo("No se pudo leer la imagen. Probá con un PNG o JPG.");
    }
  }

  return (
    <Formulario accion={guardarMisDatos} volverHref="/">
      <input type="hidden" name="logo" value={logo} />

      <Campo id="razon_social" etiqueta="Nombre o razón social">
        <Input
          id="razon_social"
          name="razon_social"
          defaultValue={datos?.razon_social}
          required
          className="h-11"
        />
      </Campo>

      <Campo id="nombre_fantasia" etiqueta="Nombre comercial" ayuda="Opcional. Es el que se destaca en el PDF.">
        <Input
          id="nombre_fantasia"
          name="nombre_fantasia"
          defaultValue={datos?.nombre_fantasia ?? ""}
          className="h-11"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo id="cuit" etiqueta="CUIT">
          <Input
            id="cuit"
            name="cuit"
            inputMode="numeric"
            placeholder="20-12345678-9"
            defaultValue={datos?.cuit ? formatearCuit(datos.cuit) : ""}
            className="h-11"
          />
        </Campo>
        <Campo id="telefono" etiqueta="Teléfono">
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            defaultValue={datos?.telefono ?? ""}
            className="h-11"
          />
        </Campo>
      </div>

      <Campo id="email" etiqueta="Email">
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={datos?.email ?? ""}
          className="h-11"
        />
      </Campo>

      <Campo id="direccion" etiqueta="Dirección">
        <Input
          id="direccion"
          name="direccion"
          defaultValue={datos?.direccion ?? ""}
          className="h-11"
        />
      </Campo>

      <Campo id="archivo_logo" etiqueta="Logo" ayuda="Opcional. PNG o JPG; se achica solo.">
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element -- es un data URL local
          <img
            src={logo}
            alt="Logo"
            className="max-h-24 self-start rounded-md bg-white p-2 ring-1 ring-foreground/10"
          />
        )}
        <Input
          id="archivo_logo"
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => elegirLogo(e.target.files?.[0])}
          className="h-11 py-2"
        />
        {logo && (
          <Button
            type="button"
            variant="outline"
            className="h-10 self-start"
            onClick={() => setLogo("")}
          >
            Quitar logo
          </Button>
        )}
        {errorLogo && <p className="text-sm text-destructive">{errorLogo}</p>}
      </Campo>
    </Formulario>
  );
}

// Dibuja la imagen en un canvas del tamaño máximo y la devuelve como data URL.
// PNG mantiene la transparencia; si queda pesado, pasa a JPEG con fondo blanco.
async function achicarImagen(archivo: File) {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, ANCHO_LOGO / bitmap.width, ALTO_LOGO / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  let url = canvas.toDataURL("image/png");
  if (url.length > LARGO_MAXIMO_LOGO / 2) {
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    url = canvas.toDataURL("image/jpeg", 0.85);
  }
  if (url.length > LARGO_MAXIMO_LOGO) throw new Error("Imagen demasiado grande");
  return url;
}
