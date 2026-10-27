// Marcador para secciones que todavía no se construyeron.
export function SeccionPendiente({
  titulo,
  fase,
}: {
  titulo: string;
  fase: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <p className="text-muted-foreground">Esta sección llega en la {fase}.</p>
    </div>
  );
}
