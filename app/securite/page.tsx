"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Commune = { code: string; nom: string; centre?: { coordinates?: [number, number] }; contour?: { type: string; coordinates: unknown } };
type Competence = { code: string; institution: "PN" | "GN"; service: string };
type ServiceType = "police" | "gendarmerie" | "pompiers";

const fireStations = [
  ["Argenteuil",49.0,2.25],["Beaumont-sur-Oise",49.14,2.29],["Bezons",48.93,2.22],["Cergy",49.04,2.06],
  ["Deuil-la-Barre",48.98,2.33],["Domont",49.03,2.32],["Eaubonne",48.99,2.28],["Enghien-les-Bains",48.97,2.31],
  ["Ermont",48.99,2.26],["Fosses",49.10,2.51],["Garges-lès-Gonesse",48.97,2.40],["Gonesse",48.99,2.45],
  ["L’Isle-Adam",49.11,2.22],["Louvres",49.04,2.50],["Magny-en-Vexin",49.15,1.79],["Marines",49.14,1.98],
  ["Montmorency",48.99,2.32],["Osny",49.07,2.06],["Persan",49.15,2.27],["Pontoise",49.05,2.10],
  ["Roissy-en-France",49.00,2.52],["Saint-Ouen-l’Aumône",49.04,2.12],["Sarcelles",48.99,2.38],["Villiers-le-Bel",49.01,2.39]
] as const;

const emergency = [
  { number: "112", label: "Urgence européenne", detail: "Depuis un mobile ou partout dans l’Union européenne" },
  { number: "17", label: "Police · Gendarmerie", detail: "Danger immédiat, trouble à l’ordre public" },
  { number: "18", label: "Sapeurs-pompiers", detail: "Incendie, accident, secours d’urgence" },
  { number: "114", label: "Urgence par écrit", detail: "SMS, tchat et visio pour les personnes sourdes ou malentendantes" },
];

function parseCsv(text: string): Competence[] {
  return text.split(/\r?\n/).slice(1).map((line) => {
    const cells = line.split(";").map((value) => value.replace(/^"|"$/g, ""));
    return { code: cells[0], institution: cells[2] as "PN" | "GN", service: cells[4] };
  }).filter((row) => row.code?.startsWith("95") && (row.institution === "PN" || row.institution === "GN"));
}

export default function SecuritePage() {
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [active, setActive] = useState<Record<ServiceType, boolean>>({ police: true, gendarmerie: true, pompiers: true });
  const [selected, setSelected] = useState<Competence | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("https://geo.api.gouv.fr/departements/95/communes?fields=nom,code,centre,contour").then((r) => r.json()),
      fetch(`${basePath}/data/competence-police-gendarmerie.csv`).then((r) => r.text()).then(parseCsv),
    ]).then(([communeData, competenceData]) => { setCommunes(communeData); setCompetences(competenceData); });
  }, [basePath]);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link"); link.id = "leaflet-css"; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
    }
    const start = () => {
      const L = (window as any).L; if (!L || !mapNode.current || mapRef.current) return;
      const map = L.map(mapNode.current, { zoomControl: false }).setView([49.075, 2.10], 9);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd", attribution: "© OpenStreetMap · © CARTO" }).addTo(map);
      mapRef.current = map; setMapReady(true);
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet="true"]');
    if (existing) { if ((window as any).L) start(); else existing.addEventListener("load", start, { once: true }); }
    else { const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.dataset.leaflet = "true"; script.onload = start; document.body.appendChild(script); }
  }, []);

  useEffect(() => {
    const L = (window as any).L, map = mapRef.current;
    if (!L || !map || !mapReady || !communes.length || !competences.length) return;
    layersRef.current.forEach((layer) => map.removeLayer(layer)); layersRef.current = [];
    const byCode = new Map(competences.map((item) => [item.code, item]));
    const features = communes.filter((c) => c.contour).map((c) => ({ type: "Feature", properties: { ...c, competence: byCode.get(c.code) }, geometry: c.contour }));
    const territory = L.geoJSON({ type: "FeatureCollection", features }, {
      style: (feature: any) => {
        const isPolice = feature.properties.competence?.institution === "PN";
        const visible = isPolice ? active.police : active.gendarmerie;
        return { color: visible ? (isPolice ? "#000091" : "#18753c") : "#aeb7c5", weight: visible ? 1.2 : .5, fillColor: visible ? (isPolice ? "#6a6af4" : "#88d39f") : "#eef1f5", fillOpacity: visible ? .62 : .24 };
      },
      onEachFeature: (feature: any, layer: any) => {
        const item = feature.properties.competence;
        layer.bindTooltip(`<strong>${feature.properties.nom}</strong><br>${item?.institution === "PN" ? "Police nationale" : "Gendarmerie nationale"}`, { sticky: true });
        layer.on("click", () => { setSelected(item); map.fitBounds(layer.getBounds(), { maxZoom: 11, padding: [50, 50] }); });
      },
    }).addTo(map); layersRef.current.push(territory); map.fitBounds(territory.getBounds(), { padding: [20, 20] });
    if (active.pompiers) fireStations.forEach(([name, lat, lng]) => {
      const marker = L.circleMarker([lat, lng], { radius: 5.5, color: "#fff", weight: 2, fillColor: "#e1000f", fillOpacity: 1 })
        .bindTooltip(`<strong>Centre de secours</strong><br>${name}`).addTo(map); layersRef.current.push(marker);
    });
  }, [communes, competences, mapReady, active]);

  const totals = useMemo(() => ({ police: competences.filter((c) => c.institution === "PN").length, gendarmerie: competences.filter((c) => c.institution === "GN").length }), [competences]);
  const services = useMemo(() => new Set(competences.map((c) => c.service)).size, [competences]);
  const toggle = (key: ServiceType) => setActive((state) => ({ ...state, [key]: !state[key] }));

  return <main className="security-page">
    <header className="security-header">
      <a href={`${basePath}/`} className="security-logo"><img src={`${basePath}/prefet-val-doise-logo.png`} alt="Préfet du Val-d’Oise" /></a>
      <div><span>Direction départementale des territoires</span><strong>Atlas territorial du Val-d’Oise</strong></div>
      <a className="security-back" href={`${basePath}/`}>← Retour à l’Atlas</a>
    </header>

    <section className="security-hero">
      <div className="security-intro"><p className="eyebrow">Sécurité · secours · proximité</p><h1>Qui intervient,<br/><span>où et comment ?</span></h1><p>Repérez les zones de compétence de la Police nationale et de la Gendarmerie nationale, ainsi que les principales implantations des sapeurs-pompiers.</p>
        <div className="security-stats"><div><strong>{competences.length || "—"}</strong><span>communes couvertes</span></div><div><strong>{services || "—"}</strong><span>services territoriaux</span></div><div><strong>{fireStations.length}</strong><span>centres de secours repérés</span></div></div>
      </div>
      <aside className="emergency-panel"><p>En cas d’urgence</p>{emergency.map((item) => <a href={`tel:${item.number}`} key={item.number}><strong>{item.number}</strong><span><b>{item.label}</b><small>{item.detail}</small></span></a>)}</aside>
    </section>

    <section className="security-map-section">
      <div className="security-map-heading"><div><p className="eyebrow">Carte opérationnelle</p><h2>Périmètres et implantations</h2></div><p>Cliquez sur une commune pour connaître le service territorial compétent. Les points rouges localisent les principaux centres de secours.</p></div>
      <div className="security-map-layout">
        <aside className="security-filters" aria-label="Couches de la carte">
          <h3>Afficher sur la carte</h3>
          <button className={active.police ? "active police" : "police"} onClick={() => toggle("police")} aria-pressed={active.police}><i/><span><strong>Police nationale</strong><small>{totals.police || "—"} communes</small></span><b>{active.police ? "✓" : "+"}</b></button>
          <button className={active.gendarmerie ? "active gendarmerie" : "gendarmerie"} onClick={() => toggle("gendarmerie")} aria-pressed={active.gendarmerie}><i/><span><strong>Gendarmerie nationale</strong><small>{totals.gendarmerie || "—"} communes</small></span><b>{active.gendarmerie ? "✓" : "+"}</b></button>
          <button className={active.pompiers ? "active pompiers" : "pompiers"} onClick={() => toggle("pompiers")} aria-pressed={active.pompiers}><i/><span><strong>Sapeurs-pompiers</strong><small>Centres de secours</small></span><b>{active.pompiers ? "✓" : "+"}</b></button>
          <div className="security-selection"><small>Commune sélectionnée</small>{selected ? <><strong>{selected.service.replace(/^.*? - /, "")}</strong><span>{selected.institution === "PN" ? "Police nationale" : "Gendarmerie nationale"}</span></> : <p>Cliquez sur une commune pour afficher son unité de rattachement.</p>}</div>
        </aside>
        <div ref={mapNode} className="security-map" aria-label="Carte des zones de compétence police et gendarmerie et des centres de secours du Val-d’Oise" />
      </div>
    </section>

    <section className="security-actions"><div><p className="eyebrow">Prévenir · signaler · agir</p><h2>Les bons réflexes</h2></div><div className="security-action-grid">
      <a href="https://www.masecurite.interieur.gouv.fr/" target="_blank" rel="noreferrer"><span>01</span><strong>Ma Sécurité</strong><p>Échanger 24h/24 avec un policier ou un gendarme et trouver un point d’accueil.</p><b>Accéder au service ↗</b></a>
      <a href="https://www.pre-plainte-en-ligne.gouv.fr/" target="_blank" rel="noreferrer"><span>02</span><strong>Pré-plainte en ligne</strong><p>Préparer une plainte pour une atteinte aux biens lorsque l’auteur est inconnu.</p><b>Commencer la démarche ↗</b></a>
      <a href="https://www.service-public.fr/particuliers/vosdroits/F1520" target="_blank" rel="noreferrer"><span>03</span><strong>Signaler une violence</strong><p>Connaître les dispositifs d’aide, d’écoute et de signalement disponibles.</p><b>Voir les dispositifs ↗</b></a>
    </div></section>
    <section className="security-source"><strong>À propos des données</strong><p>Périmètres issus du référentiel « Compétence territoriale gendarmerie et police nationales » du ministère de l’Intérieur, édition d’août 2026. Implantations de secours présentées à titre de repérage : vérifiez toujours l’adresse et les horaires avant de vous déplacer.</p></section>
    <footer className="security-footer"><span>DDT du Val-d’Oise · Pôle géomatique</span><a href="https://www.data.gouv.fr/datasets/competence-territoriale-gendarmerie-et-police-nationales" target="_blank" rel="noreferrer">Source des périmètres ↗</a></footer>
  </main>;
}
