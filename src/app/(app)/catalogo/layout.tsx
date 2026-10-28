import { Suspense } from "react";
import { Pestanas, PestanasLinks } from "@/components/pestanas";

const PESTANAS = [
  { href: "/catalogo/materiales", titulo: "Materiales" },
  { href: "/catalogo/vehiculos", titulo: "Vehículos" },
  { href: "/catalogo/tipos-trabajo", titulo: "Tipos de trabajo" },
];

export default function CatalogoLayout({ children }: LayoutProps<"/catalogo">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<PestanasLinks pestanas={PESTANAS} />}>
        <Pestanas pestanas={PESTANAS} />
      </Suspense>
      {children}
    </div>
  );
}
