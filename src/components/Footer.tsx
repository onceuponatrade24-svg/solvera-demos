import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-line pb-10 pt-7 text-[0.85rem] text-muted">
      <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-2">
        <Image src="/brand/wordmark.png" alt="Solvera Labs" width={148} height={22} className="h-[22px] w-auto" />
        <a href="https://wa.me/523310742087" target="_blank" rel="noopener">
          WhatsApp <span className="font-semibold tabular-nums">33 1074 2087</span>
        </a>
        <a href="mailto:solveralabs.ai@gmail.com">solveralabs.ai@gmail.com</a>
        <a href="https://www.instagram.com/solveralabs.ai" target="_blank" rel="noopener">Instagram @solveralabs.ai</a>
        <a href="https://www.tiktok.com/@solvera_labs.ai" target="_blank" rel="noopener">TikTok @solvera_labs.ai</a>
        <span>Precios antes de IVA</span>
      </div>
    </footer>
  );
}
