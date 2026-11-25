import Image from "next/image";
import Link from "next/link";
import { MENSAJE_GENERAL, waLink } from "@/lib/whatsapp";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-3 py-[18px]">
      <Link href="/" className="flex items-center gap-2.5" aria-label="Solvera Labs, inicio">
        <Image src="/brand/symbol.png" alt="" width={32} height={32} priority />
        <Image src="/brand/wordmark.png" alt="Solvera Labs" width={175} height={26} className="h-[26px] w-auto" priority />
      </Link>
      <a className="btn btn-pri" href={waLink(MENSAJE_GENERAL)} target="_blank" rel="noopener">
        Hablemos
      </a>
    </header>
  );
}
