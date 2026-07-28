"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Commune = {
  code: string;
  nom: string;
  codeEpci?: string;
  centre?: { coordinates?: [number, number] };
  contour?: { type: string; coordinates: unknown };
};

const themes = [
  { path: "01_Urbanisme_Parcelle", href: "/urbanisme", index: "01", title: "Urbanisme à la parcelle", text: "Cadastre, PLU, prescriptions, servitudes et risques.", tone: "blue", status: "Nouvel observatoire" },
  { path: "02_Artificialisation_ZAN", index: "02", title: "Artificialisation & ZAN", text: "Occupation du sol, consommation d’espace et friches.", tone: "violet", status: "À construire" },
  { path: "03_Agriculture", href: "https://ddt95.github.io/agriculture95/", index: "03", title: "Agriculture", text: "Cultures, bio, prairies, haies et enjeux environnementaux.", tone: "green", status: "Observatoire en ligne" },
  { path: "04_Eau", index: "04", title: "Eau", text: "Cours d’eau, zones humides, nappes, stations et débits.", tone: "cyan", status: "Priorité 2" },
  { path: "05_Risques", href: "https://ddt95.github.io/observatoire_risques_95/", index: "05", title: "Risques majeurs", text: "Inondations, mouvements de terrain et retrait-gonflement des argiles.", tone: "orange", status: "Observatoire en ligne" },
  { path: "06_Habitat", href: "https://ddt95.github.io/observatoire_bati/", index: "06", title: "Habitat", text: "DPE, parc social, vacance, construction et foncier.", tone: "pink", status: "Observatoire en ligne" },
  { path: "07_Biodiversite", index: "07", title: "Biodiversité", text: "ZNIEFF, Natura 2000, SRCE et observations d’espèces.", tone: "leaf", status: "À construire" },
  { path: "08_Securite_Routiere", href: "https://ddt95.github.io/transport95/?v=1ac3c80", index: "08", title: "Transports et sécurité routière", text: "Réseaux, offre de transport, accidents et points de vigilance.", tone: "red", status: "Observatoire en ligne" },
  { path: "09_Transition_Energetique", index: "09", title: "Transition énergétique", text: "Consommations, production, DPE et qualité de l’air.", tone: "gold", status: "À construire" },
  { path: "10_Portrait_Communal", index: "10", title: "Portrait communal", text: "Une lecture transversale et automatique de chaque commune.", tone: "slate", status: "Produit transversal" },
];

export default function Home() {
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const communeLayerRef = useRef<any>(null);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [query, setQuery] = useState("");
  const [sourceState, setSourceState] = useState<"loading" | "ok" | "error">("loading");
  const [menuOpen, setMenuOpen] = useState(false);

  const selected = useMemo(
    () => communes.find((commune) => commune.code === selectedCode),
    [communes, selectedCode],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("https://geo.api.gouv.fr/departements/95/communes?fields=nom,code,codeEpci,centre,contour")
      .then((response) => {
        if (!response.ok) throw new Error("Référentiel indisponible");
        return response.json();
      })
      .then((data: Commune[]) => {
        if (cancelled) return;
        setCommunes(data.sort((a, b) => a.nom.localeCompare(b.nom, "fr")));
        setSourceState("ok");
      })
      .catch(() => setSourceState("error"));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const startMap = () => {
      const L = (window as any).L;
      if (!L || !mapNode.current || mapRef.current) return;
      const map = L.map(mapNode.current, { zoomControl: false, attributionControl: true }).setView([49.075, 2.105], 9);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: "© OpenStreetMap · © CARTO",
      }).addTo(map);
      mapRef.current = map;
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet="true"]');
    if (existing) {
      if ((window as any).L) startMap(); else existing.addEventListener("load", startMap, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.dataset.leaflet = "true";
      script.onload = startMap;
      document.body.appendChild(script);
    }
    return () => {};
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map || communes.length === 0) return;
    if (communeLayerRef.current) map.removeLayer(communeLayerRef.current);
    const features = communes
      .filter((commune) => commune.contour)
      .map((commune) => ({ type: "Feature", properties: { code: commune.code, nom: commune.nom }, geometry: commune.contour }));
    const layer = L.geoJSON({ type: "FeatureCollection", features }, {
      style: (feature: any) => ({
        color: "#000091",
        weight: feature?.properties?.code === selectedCode ? 4 : 1.65,
        opacity: feature?.properties?.code === selectedCode ? 1 : .82,
        fillColor: feature?.properties?.code === selectedCode ? "#4fd1ff" : "#dedeff",
        fillOpacity: feature?.properties?.code === selectedCode ? 0.7 : 0.58,
      }),
      onEachFeature: (feature: any, featureLayer: any) => {
        featureLayer.bindTooltip(feature.properties.nom, { sticky: true });
        featureLayer.on("click", () => setSelectedCode(feature.properties.code));
      },
    }).addTo(map);
    communeLayerRef.current = layer;
    if (!selectedCode) map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  }, [communes, selectedCode]);

  useEffect(() => {
    if (!selected || !mapRef.current || !communeLayerRef.current) return;
    const target = communeLayerRef.current.getLayers().find((layer: any) => layer.feature?.properties?.code === selected.code);
    if (target) mapRef.current.fitBounds(target.getBounds(), { padding: [46, 46], maxZoom: 13 });
  }, [selected]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const normalized = query.trim().toLocaleLowerCase("fr");
    const match = communes.find((commune) => commune.nom.toLocaleLowerCase("fr").startsWith(normalized));
    if (match) {
      setSelectedCode(match.code);
      setQuery(match.nom);
    }
  }

  return (
    <main className="atlas-shell">
      <header className="atlas-header">
        <a className="republique" href="#accueil" aria-label="Préfet du Val-d’Oise — retour à l’accueil">
          <img src={`${basePath}/prefet-val-doise-logo.png`} alt="Préfet du Val-d’Oise — Liberté, Égalité, Fraternité" />
        </a>
        <div className="brand-copy">
          <span>Direction départementale des territoires</span>
          <strong>Atlas territorial du Val-d’Oise</strong>
        </div>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Afficher les thématiques">
          <span /> <span /> <span />
        </button>
        <nav className={menuOpen ? "top-nav open" : "top-nav"} aria-label="Navigation principale">
          <a href="#territoire">Le territoire</a>
          <a href="#thematiques">Les thématiques</a>
          <a href="#liens-utiles">Liens utiles</a>
          <a href="#sources">Les sources</a>
        </nav>
      </header>

      <section className="hero" id="accueil">
        <div className="hero-copy">
          <p className="eyebrow">Observer · comprendre · décider</p>
          <h1>Le Val-d’Oise,<br /><span>carte après carte.</span></h1>
          <p className="hero-lead">Un accès commun aux données territoriales de la DDT 95 et à dix observatoires thématiques alimentés par des sources publiques.</p>
          <form className="territory-search" onSubmit={submitSearch}>
            <label htmlFor="commune-search">Rechercher une commune</label>
            <div>
              <input id="commune-search" value={query} onChange={(event) => setQuery(event.target.value)} list="communes-list" placeholder="Pontoise, Argenteuil, Avernes…" />
              <datalist id="communes-list">{communes.map((commune) => <option key={commune.code} value={commune.nom} />)}</datalist>
              <button type="submit">Explorer</button>
            </div>
          </form>
          <div className="hero-metrics" aria-label="Chiffres clés">
            <div><strong>{sourceState === "ok" ? communes.length : "—"}</strong><span>communes</span></div>
            <div><strong>10</strong><span>thématiques</span></div>
            <div><strong className={`source-dot ${sourceState}`} /> <span>{sourceState === "ok" ? "Référentiel connecté" : sourceState === "error" ? "Connexion à rétablir" : "Connexion…"}</span></div>
          </div>
        </div>

        <div className="hero-map-card" id="territoire">
          <div className="map-card-head">
            <div><span>Vue départementale</span><strong>{selected ? selected.nom : "Val-d’Oise"}</strong></div>
            <select value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)} aria-label="Sélectionner une commune">
              <option value="">183 communes</option>
              {communes.map((commune) => <option key={commune.code} value={commune.code}>{commune.nom}</option>)}
            </select>
          </div>
          <div ref={mapNode} className="atlas-map" aria-label="Carte interactive des communes du Val-d’Oise" />
          <div className="map-caption">
            <span>Cliquez sur une commune pour la sélectionner</span>
            {selected && <button onClick={() => { setSelectedCode(""); setQuery(""); }}>Revenir au département</button>}
          </div>
        </div>
      </section>

      <section className="themes-section" id="thematiques">
        <div className="section-heading">
          <div><p className="eyebrow">Les observatoires</p><h2>Dix lectures du territoire</h2></div>
          <p>Chaque carte propose ses propres couches et indicateurs tout en conservant la même navigation, les mêmes références territoriales et la même exigence de traçabilité.</p>
        </div>
        <div className="themes-grid">
          {themes.map((theme) => (
            <article className={`theme-card ${theme.tone}`} key={theme.path}>
              <div className="theme-top"><span className="theme-index">{theme.index}</span><span className="theme-status">{theme.status}</span></div>
              <h3>{theme.title}</h3><p>{theme.text}</p>
              {theme.href ? (
                <a href={theme.href.startsWith("/") ? `${basePath}${theme.href}` : theme.href} target={theme.href.startsWith("http") ? "_blank" : undefined} rel={theme.href.startsWith("http") ? "noreferrer" : undefined} aria-label={`Ouvrir ${theme.title}`}>Ouvrir l’observatoire <span aria-hidden="true">{theme.href.startsWith("http") ? "↗" : "→"}</span></a>
              ) : (
                <span className="theme-action">Emplacement préparé <b aria-hidden="true">→</b></span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="external-section" id="liens-utiles">
        <div className="external-heading"><p className="eyebrow">Ressources et services</p><h2>Prolonger l’exploration</h2><p>Accédez aux observatoires de la DDT 95 et aux services publics de référence. Cette bibliothèque s’enrichira au fil des nouvelles cartes.</p></div>
        <div className="external-grid">
          <a className="external-card featured" href="https://ddt95.github.io/agriculture95/" target="_blank" rel="noreferrer"><span>Observatoire DDT 95</span><strong>Agriculture</strong><p>Lire les cultures, les parcelles bio et les espaces agricoles du Val-d’Oise.</p><b>Ouvrir le service ↗</b></a>
          <a className="external-card" href="https://ddt95.github.io/observatoire_risques_95/" target="_blank" rel="noreferrer"><span>Observatoire DDT 95</span><strong>Risques majeurs</strong><p>Explorer les risques naturels et technologiques du département.</p><b>Ouvrir le service ↗</b></a>
          <a className="external-card" href="https://ddt95.github.io/observatoire_bati/" target="_blank" rel="noreferrer"><span>Observatoire DDT 95</span><strong>Observatoire du bâti</strong><p>Explorer le bâti, le logement et les dynamiques territoriales du Val-d’Oise.</p><b>Ouvrir le service ↗</b></a>
          <a className="external-card" href="https://ddt95.github.io/transport95/?v=1ac3c80" target="_blank" rel="noreferrer"><span>Observatoire DDT 95</span><strong>Transports</strong><p>Comprendre les réseaux, les déplacements et l’offre de transport.</p><b>Ouvrir le service ↗</b></a>
        </div>
      </section>

      <section className="source-section" id="sources">
        <div><p className="eyebrow">Données publiques</p><h2>Des sources identifiées et datées</h2></div>
        <div className="source-list"><span>IGN</span><span>INSEE</span><span>Géorisques</span><span>Eaufrance</span><span>ADEME</span><span>DRIEAT</span></div>
        <p className="source-note">Chaque observatoire indiquera le producteur, le millésime, la dernière synchronisation et l’état de disponibilité de ses sources.</p>
      </section>

      <footer><span>DDT du Val-d’Oise · Atlas territorial</span><span>Version socle · 2026</span></footer>
    </main>
  );
}
