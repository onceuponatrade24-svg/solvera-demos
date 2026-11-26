import { armarTablero } from "@/lib/santiago/datos";
import { configurado, leerHoja, sesionValida } from "@/lib/santiago/hoja";
import { Entrar } from "@/components/santiago/Entrar";
import { TableroClientes } from "@/components/santiago/TableroClientes";

export const dynamic = "force-dynamic";

export default async function Santiago() {
  if (!configurado()) {
    return (
      <Aviso titulo="Falta conectar la hoja">
        Este tablero todavía no tiene sus llaves. Hay que agregar en Vercel las variables SANTIAGO_HOJA_URL,
        SANTIAGO_HOJA_TOKEN y SANTIAGO_CLAVE, y volver a publicar.
      </Aviso>
    );
  }
  if (!(await sesionValida())) return <Entrar />;

  try {
    const { hojas, actualizado } = await leerHoja();
    const tablero = armarTablero(hojas);
    return <TableroClientes tablero={tablero} actualizado={actualizado} />;
  } catch (e) {
    return (
      <Aviso titulo="No pude leer la hoja">
        {e instanceof Error ? e.message : "Error desconocido."} Recarga en un momento; si sigue igual, avísale a Charlie.
      </Aviso>
    );
  }
}

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <div className="rounded-3xl border border-line bg-white p-7">
        <h1 className="text-xl font-bold">{titulo}</h1>
        <p className="mt-2 text-[15px] text-muted">{children}</p>
      </div>
    </main>
  );
}
