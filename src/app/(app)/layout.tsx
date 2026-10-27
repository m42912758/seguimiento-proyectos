import { MenuPrincipal } from "@/components/menu-principal";
import { Button } from "@/components/ui/button";
import { cerrarSesion } from "../login/actions";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Seguimiento de proyectos</span>
            <form action={cerrarSesion}>
              <Button type="submit" variant="ghost" size="sm">
                Salir
              </Button>
            </form>
          </div>
          <MenuPrincipal />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4">{children}</main>
    </>
  );
}
