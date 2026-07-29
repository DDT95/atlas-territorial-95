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
  { path: "01_Portail_Communal", href: "https://ddt95.github.io/portail-communal95/", index: "01", title: "Portail communal", text: "Une entrée unique par commune : chiffres clés, cartes, enjeux et accès aux dix lectures.", tone: "slate", status: "Page de préfiguration" },
  { path: "02_Urbanisme_Parcelle", href: "/urbanisme", index: "02", title: "Urbanisme à la parcelle", text: "Cadastre, PLU, prescriptions, servitudes et risques réunis au même endroit.", tone: "blue", status: "Outil disponible" },
  { path: "03_Artificialisation_ZAN", href: "https://ddt95.github.io/artificialisation-zan95/", index: "03", title: "Artificialisation & ZAN", text: "Occupation du sol, consommation d’espace, trajectoire ZAN et friches.", tone: "violet", status: "Page de préfiguration" },
  { path: "04_Agriculture", href: "https://ddt95.github.io/agriculture95/", index: "04", title: "Agriculture", text: "Cultures, bio, prairies, haies et enjeux environnementaux.", tone: "green", status: "Observatoire en ligne" },
  { path: "05_Eau", href: "https://ddt95.github.io/eau95/", index: "05", title: "Eau", text: "Cours d’eau, zones humides, nappes, stations et débits.", tone: "cyan", status: "Observatoire en ligne" },
  { path: "06_Risques", href: "https://ddt95.github.io/observatoire_risques_95/", index: "06", title: "Risques majeurs", text: "Inondations, argiles, cavités, ICPE et sites et sols pollués.", tone: "orange", status: "Observatoire en ligne" },
  { path: "07_Habitat", href: "https://ddt95.github.io/observatoire_bati/", index: "07", title: "Habitat & bâti", text: "DPE, parc social, vacance, construction et marchés fonciers.", tone: "pink", status: "Observatoire en ligne" },
  { path: "08_Biodiversite", href: "https://ddt95.github.io/biodiversite95/", index: "08", title: "Biodiversité", text: "ZNIEFF, Natura 2000, continuités écologiques et observations d’espèces.", tone: "leaf", status: "Page de préfiguration" },
  { path: "09_Mobilites", index: "09", title: "Mobilités, transports & sécurité routière", text: "Deux entrées complémentaires : se déplacer et comprendre l’accidentalité.", tone: "red", status: "Deux outils", links: [
    { label: "Transports et mobilités", href: "https://ddt95.github.io/transport95/?v=1ac3c80" },
    { label: "Sécurité routière", href: "/securite-routiere" },
  ] },
  { path: "10_Transition_Energetique", href: "https://ddt95.github.io/transition-energetique95/", index: "10", title: "Transition énergétique", text: "Consommation, production, rénovation énergétique et qualité de l’air.", tone: "gold", status: "Page de préfiguration" },
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
  }, [communes, selectedCode, mapReady]);

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
          <a className="weather-nav" href="https://ddt95.github.io/observatoire_meteo/" target="_blank" rel="noreferrer">Météo ↗</a>
          <a href="#sources">Les sources</a>
        </nav>
      </header>

      <section className="hero" id="accueil">
        <div className="hero-copy">
          <p className="eyebrow">Observer · comprendre · décider</p>
          <a className="hero-weather" href="https://ddt95.github.io/observatoire_meteo/" target="_blank" rel="noreferrer"><span>Donnée associée</span><strong>Consulter la météo du Val-d’Oise</strong><b>↗</b></a>
          <h1>Le Val-d’Oise,<br /><span>carte après carte.</span></h1>
          <p className="hero-lead">Un accès commun aux données territoriales de la DDT 95 et à dix lectures thématiques alimentées par des sources publiques.</p>
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
            <div><strong>10</strong><span>lectures</span></div>
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
              {theme.links ? (
                <div className="theme-links">{theme.links.map((link) => <a key={link.label} href={link.href.startsWith("/") ? `${basePath}${link.href}` : link.href} target="_blank" rel="noreferrer">{link.label}<span aria-hidden="true">↗</span></a>)}</div>
              ) : theme.href ? (
                <a href={theme.href.startsWith("/") ? `${basePath}${theme.href}` : theme.href} target="_blank" rel="noreferrer" aria-label={`Ouvrir ${theme.title} dans un nouvel onglet`}>Ouvrir l’observatoire <span aria-hidden="true">↗</span></a>
              ) : (
                <span className="theme-action">Emplacement préparé <b aria-hidden="true">→</b></span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="external-section" id="liens-utiles">
        <div className="external-heading"><p className="eyebrow">Services publics de référence</p><h2>Vérifier, approfondir, télécharger</h2><p>Des accès directs vers les portails officiels utiles après la lecture d’une carte de l’Atlas.</p></div>
        <a className="associated-data-card" href="https://ddt95.github.io/observatoire_meteo/" target="_blank" rel="noreferrer">
          <span><small>Donnée associée</small><strong>Météo du Val-d’Oise</strong></span>
          <p>Consulter les conditions et observations météorologiques utiles à la lecture transversale du territoire.</p>
          <b>Accéder aux données météo ↗</b>
        </a>
        <div className="external-grid">
          <a className="external-card featured" href="https://cartes.gouv.fr/" target="_blank" rel="noreferrer"><span>IGN · service public</span><strong>Cartes.gouv.fr</strong><p>Explorer les cartes et données géographiques publiques de référence.</p><b>Explorer les cartes ↗</b></a>
          <a className="external-card" href="https://www.geoportail-urbanisme.gouv.fr/" target="_blank" rel="noreferrer"><span>Urbanisme</span><strong>Géoportail de l’urbanisme</strong><p>Consulter les documents opposables, zonages, prescriptions et servitudes.</p><b>Consulter le GPU ↗</b></a>
          <a className="external-card" href="https://www.georisques.gouv.fr/" target="_blank" rel="noreferrer"><span>Prévention</span><strong>Géorisques</strong><p>Éditer un état des risques et approfondir les aléas d’un terrain.</p><b>Consulter Géorisques ↗</b></a>
          <a className="external-card" href="https://www.cadastre.gouv.fr/" target="_blank" rel="noreferrer"><span>Parcelles</span><strong>Cadastre</strong><p>Rechercher une parcelle et consulter le plan cadastral officiel.</p><b>Consulter le cadastre ↗</b></a>
          <a className="external-card" href="https://www.data.gouv.fr/" target="_blank" rel="noreferrer"><span>Données ouvertes</span><strong>data.gouv.fr</strong><p>Trouver et télécharger les jeux de données produits par les services publics.</p><b>Rechercher des données ↗</b></a>
          <a className="external-card" href="https://www.observatoire-des-territoires.gouv.fr/les-outils-interactifs/cartographie-interactive" target="_blank" rel="noreferrer"><span>Indicateurs territoriaux</span><strong>Observatoire des territoires</strong><p>Comparer les territoires à partir d’indicateurs nationaux documentés.</p><b>Ouvrir la cartographie ↗</b></a>
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
