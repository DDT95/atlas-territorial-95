"use client";

import { useEffect, useRef, useState } from "react";

type Commune = {
  code: string;
  nom: string;
  codeEpci?: string;
  centre?: { coordinates?: [number, number] };
  contour?: { type: string; coordinates: unknown };
};

const themes = [
  { href: "https://ddt95.github.io/portail-communal95/", index: "01", title: "Portail communal", text: "Fiches communales, comparaisons et fiches actions.", tone: "slate", status: "En construction" },
  { href: "https://ddt95.github.io/urbanisme95/", index: "02", title: "Urbanisme à la parcelle", text: "Cadastre, PLU, prescriptions, servitudes et risques.", tone: "blue", status: "Connecté" },
  { href: "https://ddt95.github.io/artificialisation-zan95/", index: "03", title: "Artificialisation & ZAN", text: "Occupation du sol, consommation d’espace, trajectoire ZAN et friches.", tone: "violet", status: "Connecté" },
  { href: "https://ddt95.github.io/agriculture95/", index: "04", title: "Agriculture", text: "Cultures, bio, prairies, haies et enjeux environnementaux.", tone: "green", status: "Connecté" },
  { href: "https://ddt95.github.io/eau95/", index: "05", title: "Eau", text: "Cours d’eau, zones humides, nappes, stations et débits.", tone: "cyan", status: "Connecté" },
  { href: "https://ddt95.github.io/observatoire_risques_95/", index: "06", title: "Risques majeurs", text: "Inondations, argiles, cavités, ICPE et sites pollués.", tone: "orange", status: "Connecté" },
  { href: "https://ddt95.github.io/observatoire_bati/", index: "07", title: "Logement & Habitat", text: "DPE, parc social, vacance, construction et marchés fonciers.", tone: "pink", status: "Connecté" },
  { href: "https://ddt95.github.io/biodiversite95/", index: "08", title: "Biodiversité", text: "ZNIEFF, Natura 2000, continuités et observations d’espèces.", tone: "leaf", status: "Connecté" },
  { href: "https://ddt95.github.io/transport95/", index: "09", title: "Mobilités & transports", text: "Réseaux, lignes, pôles et services de mobilité.", tone: "red", status: "Connecté" },
  { href: "https://ddt95.github.io/transition-energetique95/", index: "10", title: "Transition énergétique", text: "Consommation, production, rénovation et qualité de l’air.", tone: "gold", status: "Connecté" },
];

const connectedReferences = themes.filter((theme) => theme.status === "Connecté").length;
const communalSheetsBase = "https://piece-jointe-carto.developpement-durable.gouv.fr/DEPT095A/DONNEE_GENERIQUE/N_BASE_COMMUNALE/OCTE/Fiches";

export default function Home() {
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const communeLayerRef = useRef<any>(null);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [query, setQuery] = useState("");
  const [sourceState, setSourceState] = useState<"loading" | "ok" | "error">("loading");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);

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
      const map = L.map(mapNode.current, {
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
      }).setView([49.075, 2.105], 9);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: "© OpenStreetMap · © CARTO",
      }).addTo(map);
      mapRef.current = map;
      setMapReady(true);
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
      style: () => ({
        color: "#71839d",
        weight: 0.65,
        opacity: 0.72,
        fillColor: "#f4f7fb",
        fillOpacity: 0.46,
      }),
      onEachFeature: (feature: any, featureLayer: any) => {
        featureLayer.bindTooltip(feature.properties.nom, { sticky: true, direction: "top", className: "atlas-commune-tooltip" });
        featureLayer.on({
          mouseover: () => {
            featureLayer.setStyle({ color: "#496b7b", weight: 1.05, opacity: 0.9, fillColor: "#e6f0f4", fillOpacity: 0.62 });
          },
          mouseout: () => layer.resetStyle(featureLayer),
          click: () => openCommune(feature.properties.code),
        });
      },
    }).addTo(map);
    communeLayerRef.current = layer;
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  }, [communes, mapReady]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const normalized = query.trim().toLocaleLowerCase("fr");
    const match = communes.find((commune) => commune.nom.toLocaleLowerCase("fr").startsWith(normalized));
    if (match) {
      setQuery(match.nom);
      openCommune(match.code);
    }
  }

  function openCommune(code: string) {
    const commune = communes.find((item) => item.code === code);
    if (!commune) return;
    window.open(`${communalSheetsBase}/${encodeURIComponent(commune.nom)}.pdf`, "_blank", "noopener,noreferrer");
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
          <a href="#comprendre">Comprendre</a>
          <a href="#liens-utiles">Liens utiles</a>
          <a className="weather-nav" href="https://ddt95.github.io/observatoire_meteo/" target="_blank" rel="noreferrer">Météo ↗</a>
          <a className="info-nav" href={`${basePath}/?page=donnees`}><i aria-hidden="true">i</i><span>Sources & données</span></a>
        </nav>
      </header>

      <section className="hero" id="accueil">
        <div className="hero-copy">
          <p className="eyebrow">Observer · comprendre · décider</p>
          <h1>Le Val-d’Oise,<br /><span>carte après carte.</span></h1>
          <p className="hero-lead">Une entrée commune vers les données territoriales de la DDT 95 et dix lectures thématiques.</p>
          <form className="territory-search" onSubmit={submitSearch}>
            <label htmlFor="commune-search">Ouvrir une fiche communale</label>
            <div>
              <input id="commune-search" value={query} onChange={(event) => setQuery(event.target.value)} list="communes-list" placeholder="Pontoise, Argenteuil, Avernes…" />
              <datalist id="communes-list">{communes.map((commune) => <option key={commune.code} value={commune.nom} />)}</datalist>
              <button type="submit">Ouvrir</button>
            </div>
          </form>
          <div className="hero-metrics" aria-label="Chiffres clés">
            <div><strong>{sourceState === "ok" ? communes.length : "—"}</strong><span>communes</span></div>
            <div><strong>10</strong><span>lectures</span></div>
            <div><strong>{sourceState === "ok" ? connectedReferences : "—"}</strong><span>{sourceState === "ok" ? "référentiels connectés" : sourceState === "error" ? "connexion à rétablir" : "connexion…"}</span><i className={`source-dot ${sourceState}`} aria-hidden="true" /></div>
          </div>
        </div>

        <div className="hero-map-card" id="territoire">
          <div className="map-card-head">
            <div><span>Vue départementale</span><strong><a className="territory-map-link" href="https://ddt95.github.io/valdoise95/" target="_blank" rel="noreferrer">Val-d’Oise ↗</a></strong></div>
            <span className="commune-count">183 communes</span>
          </div>
          <div ref={mapNode} className="atlas-map" aria-label="Carte des communes du Val-d’Oise ; cliquez sur une commune pour ouvrir sa fiche PDF" />
          <div className="map-caption"><span>Survolez une commune pour afficher son nom · cliquez pour ouvrir sa fiche PDF</span></div>
        </div>
        <a className="themes-cue" href="#thematiques"><span>Les dix lectures territoriales</span><strong>Découvrir les thématiques</strong></a>
      </section>

      <section className="themes-section" id="thematiques">
        <div className="section-heading"><div><p className="eyebrow">Les dix lectures</p><h2>Choisir une thématique</h2></div><p>Une entrée communale et neuf cartes pour lire le territoire à la bonne échelle.</p></div>
        <div className="themes-grid">
          {themes.map((theme) => <article className={`theme-card ${theme.tone}`} key={theme.index}>
            <div className="theme-top"><span className="theme-index">{theme.index}</span><span className={`theme-status ${theme.status === "Connecté" ? "is-connected" : ""}`}><i aria-hidden="true" />{theme.status}</span></div>
            <h3>{theme.title}</h3><p>{theme.text}</p>
            <a href={theme.href} target="_blank" rel="noreferrer">Ouvrir <span aria-hidden="true">↗</span></a>
          </article>)}
        </div>
      </section>

      <section className="understand-section" id="comprendre">
        <div className="understand-heading">
          <div><p className="eyebrow">Comprendre le territoire</p><h2>Des données aux<br /><span>clés de lecture.</span></h2></div>
          <p>Des formats courts, visuels et sourcés pour transformer une carte en compréhension du Val-d’Oise.</p>
        </div>
        <div className="understand-grid">
          <a className="understand-card featured" href="https://ddt95.github.io/val-doise-domicile-travail/" target="_blank" rel="noreferrer">
            <div className="story-visual flow-story" aria-hidden="true"><i /><i /><i /><b>95</b></div>
            <div className="story-copy"><span className="story-status live">À explorer</span><small>Mobilités · INSEE 2022</small><h3>Où vont travailler les habitants ?</h3><p>Explorez les flux domicile-travail, commune par commune, et observez les polarités du territoire.</p><strong>Ouvrir le décryptage <b>↗</b></strong></div>
          </a>
          <article className="understand-card warm">
            <div className="story-visual land-story" aria-hidden="true"><i /><i /><i /></div>
            <div className="story-copy"><span className="story-status soon">En préparation</span><small>Sol · formes urbaines</small><h3>Comment le territoire se transforme-t-il ?</h3><p>Une lecture accessible de l’artificialisation, des friches et de la trajectoire ZAN.</p></div>
          </article>
          <article className="understand-card green-story-card">
            <div className="story-visual nature-story" aria-hidden="true"><i /><i /><i /></div>
            <div className="story-copy"><span className="story-status soon">En préparation</span><small>Nature · adaptation</small><h3>Où le vivant résiste-t-il ?</h3><p>Continuités écologiques, eau et îlots de fraîcheur racontés par la carte.</p></div>
          </article>
          <a className="understand-card habitat-story-card is-live" href="https://ddt95.github.io/val-doise-logement-habitat/" target="_blank" rel="noreferrer">
            <div className="story-visual habitat-story" aria-hidden="true"><i /><i /><i /><b /></div>
            <div className="story-copy"><span className="story-status live">À explorer</span><small>Habitat · modes de vie</small><h3>Comment se loge-t-on dans le Val-d’Oise ?</h3><p>Parc social, vacance, construction et rénovation expliqués à hauteur de territoire.</p><strong>Ouvrir le décryptage <b>↗</b></strong></div>
          </a>
        </div>
      </section>

      <section className="quick-links" id="liens-utiles">
        <div><p className="eyebrow">Vérifier · approfondir · télécharger</p><h2>Services publics utiles</h2></div>
        <nav aria-label="Services publics de référence">
          <a href="https://cartes.gouv.fr/" target="_blank" rel="noreferrer">Cartes.gouv.fr ↗</a>
          <a href="https://www.geoportail-urbanisme.gouv.fr/" target="_blank" rel="noreferrer">Géoportail de l’urbanisme ↗</a>
          <a href="https://www.georisques.gouv.fr/" target="_blank" rel="noreferrer">Géorisques ↗</a>
          <a href="https://www.cadastre.gouv.fr/" target="_blank" rel="noreferrer">Cadastre ↗</a>
          <a href="https://www.data.gouv.fr/" target="_blank" rel="noreferrer">data.gouv.fr ↗</a>
        </nav>
      </section>
      <footer><span>DDT du Val-d’Oise – Pôle géomatique</span><a href={`${basePath}/?page=donnees`}>Sources, état et méthode</a></footer>
    </main>
  );
}
