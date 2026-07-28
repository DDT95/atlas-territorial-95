import Link from "next/link";

export function ToolHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return (
    <header className="tool-header">
      <Link className="tool-logo" href="/" aria-label="Retour à l’Atlas territorial">
        <img src={`${basePath}/prefet-val-doise-logo.png`} alt="Préfet du Val-d’Oise" />
      </Link>
      <div className="tool-title"><span>{subtitle}</span><strong>{title}</strong></div>
      <nav><Link href="/">← Atlas</Link><Link href="/urbanisme">Urbanisme</Link><a href="https://ddt95.github.io/agriculture95/">Agriculture</a><a href="https://ddt95.github.io/eau95/">Eau</a><a href="https://ddt95.github.io/observatoire_risques_95/">Risques</a><a href="https://ddt95.github.io/observatoire_bati/">Habitat</a><a href="https://ddt95.github.io/transport95/?v=1ac3c80">Transports</a><Link href="/securite-routiere">Sécurité routière</Link></nav>
    </header>
  );
}
