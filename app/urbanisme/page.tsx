"use client";

import { useEffect, useRef, useState } from "react";
import { ToolHeader } from "../components/ToolHeader";

type FeatureCollection = { type: "FeatureCollection"; features: any[] };
type AddressResult = { label: string; city?: string; citycode?: string; postcode?: string; coordinates: [number, number] };
type ParcelResult = { address: string; addressLabel: string; commune: string; codeInsee: string; parcel?: any; zones: any[]; servitudes: any[]; risks: any[] };

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
      const riskDetails = (risksData.data || []).flatMap((entry: any) => entry.risques_detail || []);
      setResult({ address, addressLabel, commune: addressMeta?.city || firstValue(props, ["nom_com", "nom_commune"]), codeInsee: addressMeta?.citycode || firstValue(props, ["code_insee", "code_dep"], "—"), parcel, zones: zoneData.features || [], servitudes: supData.features || [], risks: riskDetails }); setDetailsOpen(true);
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
  return (
    <main className="urban-tool">
      <ToolHeader title="Urbanisme à la parcelle" subtitle="Cadastre · planification · servitudes · risques" />
      <div className="urban-layout">
        <aside className="urban-panel">
          <div className="urban-intro"><span className="tool-kicker">Observatoire 01</span><h1>Que faut-il savoir sur cette parcelle&nbsp;?</h1><p>En quelques secondes, retrouvez la parcelle, les règles d’urbanisme, les servitudes et les risques connus autour d’une adresse.</p></div>
          <form className="urban-search" onSubmit={searchAddress}><label htmlFor="urban-address">Adresse dans le Val-d’Oise</label><div><input id="urban-address" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="12 avenue du Général Schmitz, Pontoise" /><button disabled={loading}>{loading ? "…" : "Rechercher"}</button></div></form>
          <div className={`urban-message ${loading ? "loading" : ""}`}><i />{message}</div>
          {(result || query) && !loading && <button className="reset-search" type="button" onClick={resetSearch}><span aria-hidden="true">↺</span> Nouvelle recherche</button>}
        </aside>
        <section className="urban-map-wrap">
          <div className={`map-guidance ${mapZoom >= 15 ? "ready" : ""}`}><strong>{mapZoom >= 15 ? "Les parcelles sont visibles" : "Pour voir les parcelles"}</strong><span>{mapZoom >= 15 ? "Cliquez sur le terrain qui vous intéresse." : "Recherchez une adresse ou zoomez encore sur une rue."}</span></div>
          <div className="urban-legend"><span><i className="parcel" />Parcelle sélectionnée</span><span><i className="zone" />Zonage</span><span><i className="sup" />Servitude</span></div><div ref={mapNode} className="urban-map" aria-label="Carte interactive d’urbanisme à la parcelle" />
        </section>
      </div>
      {result && detailsOpen && <aside className="observatory-drawer" aria-label="Détail de la parcelle"><div className="observatory-drawer-head"><button onClick={() => setDetailsOpen(false)} aria-label="Fermer">×</button><small>{result.addressLabel}</small><h2>{result.commune}</h2><p>{result.address}</p></div><div className="observatory-drawer-body urban-results">
        <section><div className="result-heading"><span>01</span><h2>Parcelle cadastrale</h2></div><dl><div><dt>Référence</dt><dd>{firstValue(parcelProps,["section"],"")} {firstValue(parcelProps,["numero"],"—")}</dd></div><div><dt>Contenance</dt><dd>{firstValue(parcelProps,["contenance"],"—")} m²</dd></div></dl>{result.addressLabel === "Adresse la plus proche" && <p className="address-caution">Adresse BAN la plus proche du point cliqué.</p>}</section>
        <section><div className="result-heading"><span>02</span><h2>Zonage d’urbanisme</h2></div>{result.zones.length ? result.zones.map((zone,index)=><div className="result-chip green" key={zone.id || index}><b>{firstValue(zone.properties,["libelle","typezone","libelle_zone"],"Zone GPU")}</b><small>{firstValue(zone.properties,["partition","nomfic"],"Document opposable")}</small></div>) : <p className="empty-result">Aucun zonage retourné par le GPU.</p>}</section>
        <section><div className="result-heading"><span>03</span><h2>Servitudes</h2></div><p className="result-count"><strong>{result.servitudes.length}</strong> assiette(s) intersectée(s)</p>{result.servitudes.slice(0,4).map((sup,index)=><div className="result-chip violet" key={sup.id || index}><b>{firstValue(sup.properties,["libelle","nom_sup","categorie"],"Servitude d’utilité publique")}</b><small>{firstValue(sup.properties,["categorie","idass"],"GPU")}</small></div>)}</section>
        <section><div className="result-heading"><span>04</span><h2>Risques recensés</h2></div>{result.risks.length ? <div className="risk-list">{result.risks.map((risk,index)=><span key={index}>{risk.libelle_risque_long || risk.libelle_risque || "Risque"}</span>)}</div> : <p className="empty-result">Aucun risque Gaspar retourné pour ce point.</p>}</section>
        <p className="legal-note">Les documents opposables restent la référence.</p>
      </div></aside>}
    </main>
  );
}

