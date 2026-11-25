import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="aura grid min-h-screen place-items-center px-5 text-center">
      <div className="grid gap-5">
        <h1 className="text-4xl font-black tracking-[-0.025em]">
          Esta página <span className="gradtxt">no existe.</span>
        </h1>
        <Link className="btn btn-pri btn-lg mx-auto" href="/">Ver todos los demos</Link>
      </div>
    </main>
  );
}
