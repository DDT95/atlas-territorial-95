"use client";

import { useEffect, useRef, useState } from "react";
import { ToolHeader } from "../components/ToolHeader";

type FeatureCollection = { type: "FeatureCollection"; features: any[] };
type AddressResult = { label: string; city?: string; citycode?: string; postcode?: string; coordinates: [number, number] };
type ParcelResult = { address: string; addressLabel: string; commune: string; codeInsee: string; parcel?: any; zones: any[]; servitudes: any[]; risks: any[]; buildings: any[]; mos?: { mos2021?: number; mos2025?: number; surface?: number } };

const emptyCollection: FeatureCollection = { type: "FeatureCollection", features: [] };

function pointGeometry(lon: number, lat: number) {
  return encodeURIComponent(JSON.stringify({ type: "Point", coordinates: [lon, lat] }));
}

function nearbyGeometry(lon: number, lat: number) {
  const dx = 0.00055;
  const dy = 0.00038;
  return encodeURIComponent(JSON.stringify({
    type: "Polygon",
    coordinates: [[[lon - dx, lat - dy], [lon + dx, lat - dy], [lon + dx, lat + dy], [lon - dx, lat + dy], [lon - dx, lat - dy]]],
  }));
}

function geometryCenter(geometry: any): [number, number] {
  const points: number[][] = [];
  const collect = (value: any) => {
    if (Array.isArray(value) && typeof value[0] === "number") points.push(value);
    else if (Array.isArray(value)) value.forEach(collect);
  };
  collect(geometry?.coordinates);
  if (!points.length) return [0, 0];
  return [points.reduce((sum, p) => sum + p[0], 0) / points.length, points.reduce((sum, p) => sum + p[1], 0) / points.length];
}

function closestParcel(collection: FeatureCollection, lon: number, lat: number): FeatureCollection {
  if (collection.features.length < 2) return collection;
  const selected = [...collection.features].sort((a, b) => {
    const [ax, ay] = geometryCenter(a.geometry); const [bx, by] = geometryCenter(b.geometry);
    return ((ax - lon) ** 2 + (ay - lat) ** 2) - ((bx - lon) ** 2 + (by - lat) ** 2);
  })[0];
  return { type: "FeatureCollection", features: selected ? [selected] : [] };
}

function firstValue(object: any, keys: string[], fallback = "Non renseigné") {
  for (const key of keys) if (object?.[key] !== undefined && object?.[key] !== null && object?.[key] !== "") return String(object[key]);
  return fallback;
}

const mosLabels: Record<number, string> = {
  1:"Bois ou forêts",2:"Coupes ou clairères en forêts",3:"Peupleraies",4:"Espaces ouverts à végétation arborée ou herbacée",5:"Berges",6:"Terres labourées",7:"Prairies",8:"Vergers, pépinières",9:"Maraîchage, horticulture",10:"Cultures intensives sous serres",11:"Eau fermée",12:"Cours d’eau",13:"Parcs ou jardins publics",14:"Autres espaces verts publics",15:"Jardins familiaux",16:"Jardins de l’habitat",17:"Terrains de sport en plein air",18:"Tennis découverts",19:"Baignade",20:"Golfs",21:"Hippodromes",22:"Camping, caravaning",23:"Parcs liés aux activités de loisirs",24:"Esplanades et places",25:"Cimetières",26:"Surfaces engazonnées avec ou sans arbustes",27:"Terrains vacants",28:"Habitat pavillonnaire",29:"Ensemble d’habitat pavillonnaire",30:"Habitat rural",31:"Habitat continu bas",32:"Habitat collectif continu haut",33:"Habitat collectif discontinu",34:"Prisons",35:"Habitat autre",36:"Activités en tissu urbain mixte",37:"Grandes emprises industrielles",38:"Zones d’activités économiques",39:"Entreposage à l’air libre",40:"Entrepôts logistiques",41:"Stockage de données",42:"Grandes surfaces commerciales",43:"Autres commerces",44:"Stations-services",45:"Bureaux",46:"Production d’eau",47:"Assainissement",48:"Électricité",49:"Gaz",50:"Pétrole",51:"Chaleur",52:"Extraction de matériaux",53:"Tri et valorisation des déchets",54:"Stockage de déchets",55:"Installations sportives couvertes",56:"Centres équestres",57:"Piscines couvertes",58:"Piscines de plein air",59:"Circuits sportifs",60:"Enseignement du premier degré",61:"Enseignement secondaire",62:"Enseignement supérieur",63:"Centre de formation professionnelle",64:"Hôpitaux, cliniques",65:"Autres équipements de santé",66:"Grands centres de congrès et d’exposition",67:"Équipements culturels et de loisirs",68:"Sièges de grandes administrations",69:"Équipements de sécurité civile",70:"Équipements à accès public limité",71:"Lieux de culte",72:"Autres équipements de proximité",73:"Emprise ferrée",74:"Voies routières",75:"Parkings de surface",76:"Parkings en étages",77:"Gares routières, dépôts de bus",78:"Installations aéroportuaires",79:"Chantiers",
};

function numberValue(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function uniqueValues(values: unknown[]) { return [...new Set(values.flatMap((value) => Array.isArray(value) ? value : value ? [value] : []).map(String))]; }
function formatNumber(value: number, unit = "") { return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value)}${unit}`; }
function classifyOwners(owners: string[]) {
  if (owners.some((owner) => /\bETAT\b|MINISTERE|DIRECTION (DEPARTEMENTALE|REGIONALE|GENERALE)|PREFECTURE/i.test(owner))) return "Foncier de l’État détecté";
  if (owners.some((owner) => /COMMUNE|DEPARTEMENT|REGION|COMMUNAUTE|METROPOLE|SYNDICAT|ETABLISSEMENT PUBLIC|OFFICE PUBLIC/i.test(owner))) return "Foncier public local détecté";
  return owners.length ? "Personne morale identifiée" : "Non disponible en données ouvertes";
}

export default function UrbanismePage() {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const markerRef = useRef<any>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapZoom, setMapZoom] = useState(10);
  const [result, setResult] = useState<ParcelResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [message, setMessage] = useState("Recherchez une adresse ou cliquez sur la carte.");

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const launch = () => {
      const L = (window as any).L;
      if (!L || !mapNode.current || mapRef.current) return;
      const map = L.map(mapNode.current, { zoomControl: false, maxBoundsViscosity: .65 }).setView([49.075, 2.105], 10);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", { maxZoom: 20, subdomains: "abcd", attribution: "© OpenStreetMap · © CARTO" }).addTo(map);
      L.tileLayer("https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=PCI%20vecteur&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png", {
        minZoom: 15, maxZoom: 19, opacity: .82, attribution: "© IGN · DGFiP",
      }).addTo(map);
      map.on("zoomend", () => setMapZoom(map.getZoom()));
      fetch("https://geo.api.gouv.fr/departements/95/communes?fields=nom,code,contour&format=geojson&geometry=contour")
        .then((response) => response.json())
        .then((communes) => {
          const territory = L.geoJSON(communes, { style: { color: "#64748b", weight: .7, fillColor: "#000091", fillOpacity: .025 }, interactive: false }).addTo(map);
          const bounds = territory.getBounds();
          if (bounds.isValid()) { map.fitBounds(bounds, { padding: [25, 25] }); map.setMaxBounds(bounds.pad(.28)); }
        }).catch(() => undefined);
      map.on("click", (event: any) => inspectMapPoint(event.latlng.lng, event.latlng.lat));
      mapRef.current = map;
    };
    if ((window as any).L) launch();
    else {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link"); link.id = "leaflet-css"; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
      }
      const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet="true"]');
      if (existing) existing.addEventListener("load", launch, { once: true });
      else { const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.dataset.leaflet = "true"; script.onload = launch; document.body.appendChild(script); }
    }
  }, []);

  async function inspectMapPoint(lon: number, lat: number) {
    setLoading(true);
    setMessage("Recherche de l’adresse la plus proche…");
    let address = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    let addressMeta: Partial<AddressResult> = {};
    try {
      const response = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}&limit=1`);
      const data = response.ok ? await response.json() : { features: [] };
      const feature = data.features?.[0];
      if (feature) {
        const properties = feature.properties;
        address = properties.label;
        addressMeta = { label: properties.label, city: properties.city, citycode: properties.citycode, postcode: properties.postcode, coordinates: feature.geometry.coordinates };
        setQuery(properties.label);
      }
    } catch { /* Les coordonnées restent disponibles si la BAN ne répond pas. */ }
    await inspectPoint(lon, lat, address, addressMeta, "Adresse la plus proche");
  }

  async function inspectPoint(lon: number, lat: number, address: string, addressMeta?: Partial<AddressResult>, addressLabel = "Adresse recherchée") {
    setLoading(true); setResult(null); setMessage("Interrogation du cadastre, du GPU et de Géorisques…");
    const geom = pointGeometry(lon, lat);
    try {
      const [parcelResponse, zonesResponse, supResponse, risksResponse] = await Promise.all([
        fetch(`https://apicarto.ign.fr/api/cadastre/parcelle?geom=${geom}`),
        fetch(`https://apicarto.ign.fr/api/gpu/zone-urba?geom=${geom}`),
        fetch(`https://apicarto.ign.fr/api/gpu/assiette-sup-s?geom=${geom}`),
        fetch(`https://georisques.gouv.fr/api/v1/gaspar/risques?latlon=${lon},${lat}`),
      ]);
      let parcelData: FeatureCollection = parcelResponse.ok ? await parcelResponse.json() : emptyCollection;
      if (!parcelData.features?.length) {
        const nearbyResponse = await fetch(`https://apicarto.ign.fr/api/cadastre/parcelle?geom=${nearbyGeometry(lon, lat)}`);
        parcelData = nearbyResponse.ok ? closestParcel(await nearbyResponse.json(), lon, lat) : emptyCollection;
      }
      const zoneData: FeatureCollection = zonesResponse.ok ? await zonesResponse.json() : emptyCollection;
      const supData: FeatureCollection = supResponse.ok ? await supResponse.json() : emptyCollection;
      const risksData = risksResponse.ok ? await risksResponse.json() : { data: [] };
      drawResults(lon, lat, parcelData, zoneData, supData);
      const parcel = parcelData.features?.[0];
      const props = parcel?.properties || {};
      const parcelId = firstValue(props, ["idu"], "");
      const [parcelLon, parcelLat] = geometryCenter(parcel?.geometry);
      const [buildingsResponse, mosResponse] = await Promise.all([
        parcelId ? fetch(`https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/parcelle?parcelle_id=eq.${encodeURIComponent(parcelId)}`) : Promise.resolve(null),
        fetch(`https://geoweb.iau-idf.fr/agsmap1/rest/services/OPENDATA/OpendataIAU4/MapServer/25/query?f=geojson&geometry=${parcelLon || lon},${parcelLat || lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false`),
      ]);
      const buildings = buildingsResponse?.ok ? await buildingsResponse.json() : [];
      const mosData = mosResponse.ok ? await mosResponse.json() : emptyCollection;
      const mosProps = mosData.features?.[0]?.properties || {};
      const riskDetails = (risksData.data || []).flatMap((entry: any) => entry.risques_detail || []);
      setResult({ address, addressLabel, commune: addressMeta?.city || firstValue(props, ["nom_com", "nom_commune"]), codeInsee: addressMeta?.citycode || firstValue(props, ["code_insee", "code_dep"], "—"), parcel, zones: zoneData.features || [], servitudes: supData.features || [], risks: riskDetails, buildings: Array.isArray(buildings) ? buildings : [], mos: { mos2021: numberValue(mosProps.mos2021), mos2025: numberValue(mosProps.mos2025), surface: numberValue(mosProps["st_area(shape)"]) } }); setDetailsOpen(true);
      setMessage(parcel ? "Informations disponibles pour le point sélectionné." : "Aucune parcelle trouvée à cet emplacement.");
    } catch {
      setMessage("Une source publique n’a pas répondu. Vous pouvez réessayer dans quelques instants.");
    } finally { setLoading(false); }
  }

  function drawResults(lon: number, lat: number, parcels: FeatureCollection, zones: FeatureCollection, servitudes: FeatureCollection) {
    const L = (window as any).L; const map = mapRef.current; if (!L || !map) return;
    layersRef.current.forEach((layer) => map.removeLayer(layer)); layersRef.current = [];
    if (markerRef.current) map.removeLayer(markerRef.current);
    const configs = [
      [servitudes, { color: "#6f4c9b", weight: 2, fillColor: "#6f4c9b", fillOpacity: .12, dashArray: "6 4" }],
      [zones, { color: "#18753c", weight: 2, fillColor: "#18753c", fillOpacity: .10 }],
      [parcels, { color: "#000091", weight: 4, fillColor: "#4fd1ff", fillOpacity: .32 }],
    ] as const;
    configs.forEach(([data, style]) => { if (data.features.length) { const layer = L.geoJSON(data, { style }).addTo(map); layersRef.current.push(layer); } });
    markerRef.current = L.circleMarker([lat, lon], { radius: 6, color: "#e1000f", fillColor: "#fff", fillOpacity: 1, weight: 3 }).addTo(map);
    const parcelLayer = layersRef.current.at(-1); if (parcelLayer?.getBounds?.().isValid()) map.fitBounds(parcelLayer.getBounds(), { padding: [40, 40], maxZoom: 19 }); else map.setView([lat, lon], 17);
  }

  function resetSearch() {
    const map = mapRef.current;
    if (map) {
      layersRef.current.forEach((layer) => map.removeLayer(layer));
      layersRef.current = [];
      if (markerRef.current) map.removeLayer(markerRef.current);
      markerRef.current = null;
      map.setView([49.075, 2.105], 10);
    }
    setQuery("");
    setResult(null);
    setDetailsOpen(false);
    setLoading(false);
    setMessage("Recherchez une adresse ou cliquez sur la carte.");
  }

  async function searchAddress(event: React.FormEvent) {
    event.preventDefault(); if (!query.trim()) return;
    setLoading(true); setMessage("Recherche de l’adresse…");
    try {
      const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1&autocomplete=0`);
      const data = await response.json(); const feature = data.features?.[0];
      if (!feature) { setMessage("Adresse non trouvée."); setLoading(false); return; }
      const [lon, lat] = feature.geometry.coordinates; const p = feature.properties;
      setQuery(p.label); await inspectPoint(lon, lat, p.label, { label: p.label, city: p.city, citycode: p.citycode, postcode: p.postcode, coordinates: [lon, lat] });
    } catch { setLoading(false); setMessage("La recherche d’adresse est momentanément indisponible."); }
  }

  const parcelProps = result?.parcel?.properties || {};
  const buildingCount = result?.buildings.length || 0;
  const builtFootprint = result?.buildings.reduce((sum, building) => sum + numberValue(building.surface_emprise_sol), 0) || 0;
  const parcelArea = numberValue(parcelProps.contenance);
  const coverageRatio = parcelArea ? (builtFootprint / parcelArea) * 100 : 0;
  const publicOwners = uniqueValues(result?.buildings.map((building) => building.l_denomination_proprietaire) || []);
  const ownerCategory = classifyOwners(publicOwners);
  const oldestBuilding = result?.buildings.map((building) => numberValue(building.annee_construction)).filter(Boolean).sort((a,b) => a-b)[0];
  const maxHeight = Math.max(0, ...(result?.buildings.map((building) => numberValue(building.hauteur_mean)) || []));
  const dwellingCount = result?.buildings.reduce((sum, building) => sum + numberValue(building.nb_log), 0) || 0;
  const dpeClasses = uniqueValues(result?.buildings.map((building) => building.classe_bilan_dpe || (building.classe_conso_energie_arrete_2012 !== "N" ? building.classe_conso_energie_arrete_2012 : null)) || []);
  return (
    <main className="urban-tool">
      <ToolHeader title="Urbanisme à la parcelle" subtitle="Foncier · bâti · occupation du sol · règles · risques" />
      <div className="urban-layout">
        <aside className="urban-panel">
          <div className="urban-intro"><span className="tool-kicker">Lecture 02</span><h1>La carte d’identité d’une parcelle</h1><p>Foncier, bâti, occupation du sol, règles d’urbanisme et risques réunis dans une fiche imprimable.</p></div>
          <div className="urban-steps" aria-label="Comment utiliser la carte"><div><b>1</b><span><strong>Recherchez une adresse</strong><small>ou zoomez puis cliquez directement sur une parcelle.</small></span></div><div><b>2</b><span><strong>Vérifiez le terrain sélectionné</strong><small>la parcelle est entourée en bleu sur la carte.</small></span></div><div><b>3</b><span><strong>Lisez ou imprimez la fiche</strong><small>bâti, propriété morale, MOS, zonage, servitudes et risques.</small></span></div></div>
          <form className="urban-search" onSubmit={searchAddress}><label htmlFor="urban-address">Adresse dans le Val-d’Oise</label><div><input id="urban-address" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="12 avenue du Général Schmitz, Pontoise" /><button disabled={loading}>{loading ? "…" : "Rechercher"}</button></div></form>
          <div className={`urban-message ${loading ? "loading" : ""}`}><i />{message}</div>
          {(result || query) && !loading && <button className="reset-search" type="button" onClick={resetSearch}><span aria-hidden="true">↺</span> Nouvelle recherche</button>}
        </aside>
        <section className="urban-map-wrap">
          <div className={`map-guidance ${mapZoom >= 15 ? "ready" : ""}`}><strong>{mapZoom >= 15 ? "Les parcelles sont visibles" : "Pour voir les parcelles"}</strong><span>{mapZoom >= 15 ? "Cliquez sur le terrain qui vous intéresse." : "Recherchez une adresse ou zoomez encore sur une rue."}</span></div>
          <div className="urban-legend"><span><i className="parcel" />Parcelle sélectionnée</span><span><i className="zone" />Zonage</span><span><i className="sup" />Servitude</span></div><div ref={mapNode} className="urban-map" aria-label="Carte interactive d’urbanisme à la parcelle" />
        </section>
      </div>
      {result && detailsOpen && <aside className="observatory-drawer" aria-label="Détail de la parcelle"><div className="observatory-drawer-head"><div className="print-brand"><img src="https://ddt95.github.io/atlas-territorial-95/prefet-val-doise-logo.png" alt="Préfet du Val-d’Oise"/><span><b>Fiche d’identité parcellaire</b><small>DDT du Val-d’Oise · {new Date().toLocaleDateString("fr-FR")}</small></span></div><div className="drawer-actions"><button className="print-parcel" onClick={() => window.print()} aria-label="Imprimer la fiche de parcelle">Imprimer la fiche</button><button onClick={() => setDetailsOpen(false)} aria-label="Fermer">×</button></div><small>{result.addressLabel}</small><h2>{result.commune}</h2><p>{result.address}</p><div className="parcel-id-print">Parcelle {firstValue(parcelProps,["section"],"")} {firstValue(parcelProps,["numero"],"—")}</div></div><div className="observatory-drawer-body urban-results">
        <section><div className="result-heading"><span>01</span><h2>Parcelle cadastrale</h2></div><dl><div><dt>Référence</dt><dd>{firstValue(parcelProps,["section"],"")} {firstValue(parcelProps,["numero"],"—")}</dd></div><div><dt>Contenance</dt><dd>{firstValue(parcelProps,["contenance"],"—")} m²</dd></div></dl>{result.addressLabel === "Adresse la plus proche" && <p className="address-caution">Adresse BAN la plus proche du point cliqué.</p>}</section>
        <section className="building-summary"><div className="result-heading"><span>02</span><h2>Bâti présent</h2></div>{buildingCount ? <><div className="parcel-kpis"><div><strong>{buildingCount}</strong><span>groupe{buildingCount > 1 ? "s" : ""} de bâtiments</span></div><div><strong>{formatNumber(builtFootprint," m²")}</strong><span>emprise bâtie estimée</span></div><div><strong>{formatNumber(coverageRatio," %")}</strong><span>taux d’emprise</span></div></div><dl><div><dt>Usage principal</dt><dd>{uniqueValues(result.buildings.map((building) => building.usage_principal_bdnb_open)).join(", ") || "Non renseigné"}</dd></div><div><dt>Construction la plus ancienne</dt><dd>{oldestBuilding || "Non renseignée"}</dd></div><div><dt>Hauteur maximale estimée</dt><dd>{maxHeight ? formatNumber(maxHeight," m") : "Non renseignée"}</dd></div><div><dt>Logements recensés</dt><dd>{dwellingCount || "Non renseigné"}</dd></div><div><dt>DPE disponible</dt><dd>{dpeClasses.length ? dpeClasses.join(", ") : "Non disponible"}</dd></div></dl><p className="source-caption">Source : BDNB Open, CSTB. Les groupes de bâtiments peuvent agréger plusieurs constructions.</p></> : <p className="empty-result">Aucun bâtiment rattaché à cette parcelle dans la BDNB Open.</p>}</section>
        <section><div className="result-heading"><span>03</span><h2>Propriété et foncier public</h2></div><div className={`ownership-status ${publicOwners.length ? "known" : "unknown"}`}><small>Catégorie détectée</small><strong>{ownerCategory}</strong></div>{publicOwners.length ? <div className="owner-list">{publicOwners.map((owner) => <span key={owner}>{owner}</span>)}</div> : <p className="empty-result">Le nom des propriétaires privés n’est pas diffusé en open data. L’absence de nom ne signifie pas que la parcelle est sans propriétaire.</p>}<p className="source-caption">Pour une carte exhaustive du foncier de l’État et des autres propriétaires publics, la DDT peut raccorder l’API Données foncières du Cerema avec son accès métier sécurisé.</p></section>
        <section><div className="result-heading"><span>04</span><h2>Occupation du sol — MOS 2025</h2></div>{result.mos?.mos2025 ? <><div className="mos-reading"><small>Usage observé en 2025</small><strong>{mosLabels[result.mos.mos2025] || `Poste MOS ${result.mos.mos2025}`}</strong><span>{result.mos.mos2021 === result.mos.mos2025 ? "Usage stable depuis 2021" : `Évolution depuis : ${mosLabels[result.mos?.mos2021 || 0] || `poste ${result.mos?.mos2021}`}`}</span></div><p className="source-caption">Source : Institut Paris Region, MOS 2021–2025, nomenclature détaillée à 79 postes.</p></> : <p className="empty-result">Occupation du sol non retournée à cet emplacement.</p>}</section>
        <section><div className="result-heading"><span>05</span><h2>Zonage d’urbanisme</h2></div>{result.zones.length ? result.zones.map((zone,index)=><div className="result-chip green" key={zone.id || index}><b>{firstValue(zone.properties,["libelle","typezone","libelle_zone"],"Zone GPU")}</b><small>{firstValue(zone.properties,["partition","nomfic"],"Document opposable")}</small></div>) : <p className="empty-result">Aucun zonage retourné par le GPU.</p>}</section>
        <section><div className="result-heading"><span>06</span><h2>Servitudes</h2></div><p className="result-count"><strong>{result.servitudes.length}</strong> assiette(s) intersectée(s)</p>{result.servitudes.slice(0,6).map((sup,index)=><div className="result-chip violet" key={sup.id || index}><b>{firstValue(sup.properties,["libelle","nom_sup","categorie"],"Servitude d’utilité publique")}</b><small>{firstValue(sup.properties,["categorie","idass"],"GPU")}</small></div>)}</section>
        <section><div className="result-heading"><span>07</span><h2>Risques recensés</h2></div>{result.risks.length ? <div className="risk-list">{result.risks.map((risk,index)=><span key={index}>{risk.libelle_risque_long || risk.libelle_risque || "Risque"}</span>)}</div> : <p className="empty-result">Aucun risque Gaspar retourné pour ce point.</p>}</section>
        <div className="urban-official-links"><strong>Vérifier auprès des services officiels</strong><a href="https://www.geoportail-urbanisme.gouv.fr/" target="_blank" rel="noreferrer">Géoportail de l’urbanisme ↗</a><a href="https://www.georisques.gouv.fr/" target="_blank" rel="noreferrer">Géorisques ↗</a><a href="https://www.cadastre.gouv.fr/" target="_blank" rel="noreferrer">Cadastre ↗</a></div>
        <p className="legal-note">Cette lecture est indicative. Les documents opposables et les services officiels restent la référence.</p>
      </div></aside>}
    </main>
  );
}
