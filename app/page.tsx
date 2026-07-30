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
  { href: "https://ddt95.github.io/urbanisme95/", index: "02", title: "Urbanisme à la parcelle", tone: "blue" },
  { href: "https://ddt95.github.io/artificialisation-zan95/", index: "03", title: "Artificialisation & ZAN", tone: "violet" },
  { href: "https://ddt95.github.io/agriculture95/", index: "04", title: "Agriculture", tone: "green" },
  { href: "https://ddt95.github.io/eau95/", index: "05", title: "Eau", tone: "cyan" },
  { href: "https://ddt95.github.io/observatoire_risques_95/", index: "06", title: "Risques majeurs", tone: "orange" },
  { href: "https://ddt95.github.io/observatoire_bati/", index: "07", title: "Habitat & bâti", tone: "pink" },
  { href: "https://ddt95.github.io/biodiversite95/", index: "08", title: "Biodiversité", tone: "leaf" },
  { href: "https://ddt95.github.io/transport95/", index: "09", title: "Mobilités & transports", tone: "red" },
  { href: "https://ddt95.github.io/transition-energetique95/", index: "10", title: "Transition énergétique", tone: "gold" },
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
      style: (feature: any) => ({
        color: feature?.properties?.code === selectedCode ? "#21647a" : "#71839d",
        weight: feature?.properties?.code === selectedCode ? 1.5 : 0.65,
        opacity: feature?.properties?.code === selectedCode ? 0.95 : 0.72,
        fillColor: feature?.properties?.code === selectedCode ? "#d6edf4" : "#f4f7fb",
        fillOpacity: feature?.properties?.code === selectedCode ? 0.68 : 0.46,
      }),
      onEachFeature: (feature: any, featureLayer: any) => {
        featureLayer.bindTooltip(feature.properties.nom, { sticky: true });
        featureLayer.on({
          mouseover: () => {
            if (feature.properties.code !== selectedCode) {
              featureLayer.setStyle({ color: "#496b7b", weight: 1.05, opacity: 0.9, fillColor: "#e6f0f4", fillOpacity: 0.62 });
            }
          },
          mouseout: () => layer.resetStyle(featureLayer),
          click: () => openCommune(feature.properties.code),
        });
      },
    }).addTo(map);
    communeLayerRef.current = layer;
    if (!selectedCode) map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  }, [communes, selectedCode, mapReady]);

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
    setSelectedCode(code);
    const params = new URLSearchParams({ code });
    if (commune) params.set("nom", commune.nom);
    window.location.href = `https://ddt95.github.io/portail-communal95/?${params.toString()}`;
  }

  return (
    <main className="atlas-shell compact-atlas">
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
          <a className="weather-nav" href="https://ddt95.github.io/observatoire_meteo/" target="_blank" rel="noreferrer">Météo ↗</a>
          <a className="info-nav" href={`${basePath}/donnees`}><i aria-hidden="true">i</i><span>Sources & données</span></a>
        </nav>
      </header>

      <section className="atlas-dashboard" id="accueil">
        <div className="dashboard-intro">
          <p className="eyebrow">Observer · comprendre · décider</p>
          <h1>Le Val-d’Oise,<br /><span>carte après carte.</span></h1>
          <p className="dashboard-lead">Une entrée communale et neuf lectures thématiques, réunies sur une seule page.</p>
          <form className="territory-search" onSubmit={submitSearch}>
            <label htmlFor="commune-search">Ouvrir une fiche communale</label>
            <div>
              <input id="commune-search" value={query} onChange={(event) => setQuery(event.target.value)} list="communes-list" placeholder="Pontoise, Argenteuil, Avernes…" />
              <datalist id="communes-list">{communes.map((commune) => <option key={commune.code} value={commune.nom} />)}</datalist>
              <button type="submit">Ouvrir</button>
            </div>
          </form>
          <div className="dashboard-metrics" aria-label="Chiffres clés">
            <div><strong>{sourceState === "ok" ? communes.length : "—"}</strong><span>communes</span></div>
            <div><strong>10</strong><span>lectures</span></div>
            <div><strong className={`source-dot ${sourceState}`} /><span>{sourceState === "ok" ? "Données accessibles" : sourceState === "error" ? "Connexion à rétablir" : "Connexion…"}</span></div>
          </div>
          <a className="portal-entry" href="https://ddt95.github.io/portail-communal95/">
            <span><small>Lecture 01</small><strong>Portail communal</strong><em>Comparer · consulter les fiches actions</em></span><b aria-hidden="true">→</b>
          </a>
          <details className="official-resources">
            <summary>Vérifier, approfondir, télécharger <span>+</span></summary>
            <div>
              <a href="https://cartes.gouv.fr/" target="_blank" rel="noreferrer">Cartes.gouv.fr <span>↗</span></a>
              <a href="https://www.geoportail-urbanisme.gouv.fr/" target="_blank" rel="noreferrer">Géoportail de l’urbanisme <span>↗</span></a>
              <a href="https://www.georisques.gouv.fr/" target="_blank" rel="noreferrer">Géorisques <span>↗</span></a>
              <a href="https://www.cadastre.gouv.fr/" target="_blank" rel="noreferrer">Cadastre <span>↗</span></a>
              <a href="https://www.data.gouv.fr/" target="_blank" rel="noreferrer">data.gouv.fr <span>↗</span></a>
            </div>
          </details>
        </div>

        <div className="dashboard-map-card" id="territoire">
          <div className="map-card-head">
            <div><span>Lecture 01 · Fiches communales</span><strong>Choisir une commune</strong></div>
            <select value="" onChange={(event) => event.target.value && openCommune(event.target.value)} aria-label="Ouvrir une fiche communale">
              <option value="">183 communes</option>
              {communes.map((commune) => <option key={commune.code} value={commune.code}>{commune.nom}</option>)}
            </select>
          </div>
          <div ref={mapNode} className="atlas-map" aria-label="Carte des communes du Val-d’Oise ; un clic ouvre la fiche communale" />
          <div className="map-caption"><span><b>01</b> Cliquez sur une commune pour ouvrir sa fiche</span></div>
          <div className="compact-themes" id="thematiques" aria-label="Neuf lectures thématiques">
            {themes.map((theme) => (
              <a className={theme.tone} key={theme.index} href={theme.href} target="_blank" rel="noreferrer">
                <span>{theme.index}</span><strong>{theme.title}</strong><b aria-hidden="true">↗</b>
              </a>
            ))}
          </div>
        </div>
      </section>
      <footer className="compact-footer"><span>DDT du Val-d’Oise – Pôle géomatique</span><a href={`${basePath}/donnees`}>Sources, état et méthode</a></footer>
    </main>
  );
}
