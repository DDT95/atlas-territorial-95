"use client";

import { useEffect, useRef, useState } from "react";

type FeatureCollection = { type: "FeatureCollection"; features: any[] };
type AddressResult = { label: string; city?: string; citycode?: string; postcode?: string; coordinates: [number, number] };
type ParcelResult = { address: string; addressLabel: string; commune: string; codeInsee: string; parcel?: any; zones: any[]; servitudes: any[]; risks: any[]; buildings: any[]; publicLand?: [string,string,string]; mos?: { mos2021?: number; mos2025?: number; surface?: number } };

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
function streetOnly(address: string) { return address.replace(/\s+\d{5}\s+.+$/u, "").trim() || address; }
function classifyOwners(owners: string[]) {
  if (owners.some((owner) => /\bETAT\b|MINISTERE|DIRECTION (DEPARTEMENTALE|REGIONALE|GENERALE)|PREFECTURE/i.test(owner))) return "Foncier de l’État détecté";
  if (owners.some((owner) => /COMMUNE|DEPARTEMENT|REGION|COMMUNAUTE|METROPOLE|SYNDICAT|ETABLISSEMENT PUBLIC|OFFICE PUBLIC/i.test(owner))) return "Foncier public local détecté";
  return owners.length ? "Personne morale identifiée" : "Non disponible en données ouvertes";
}
function mosColor(code: number) {
  if (code <= 5) return "#18753c";
  if (code <= 10) return "#e3b341";
  if (code <= 12) return "#0098d8";
  if (code <= 27) return "#62b467";
  if (code <= 35) return "#e07a9a";
  if (code <= 54) return "#a05a9c";
  if (code <= 72) return "#5576b9";
  if (code <= 78) return "#737b87";
  return "#e1000f";
}
function publicLandColor(code: string) { return ({ "1":"#e1000f", "2":"#6f4c9b", "3":"#000091", "4":"#18753c", "5":"#0098d8", "6":"#e3b341", "9":"#7b61a8" } as Record<string,string>)[code] || "#687787"; }

export default function UrbanismePage() {
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const parcelTilesRef = useRef<any>(null);
  const buildingTilesRef = useRef<any>(null);
  const pluTilesRef = useRef<any>(null);
  const supTilesRef = useRef<any>(null);
  const mosLayerRef = useRef<any>(null);
  const publicLandLayerRef = useRef<any>(null);
  const publicLandDataRef = useRef<Record<string,[string,string,string]> | null>(null);
  const mosRequestRef = useRef<AbortController | null>(null);
  const markerRef = useRef<any>(null);
  const communeFocusLayerRef = useRef<any>(null);
  const selectionPointRef = useRef<[number, number] | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapZoom, setMapZoom] = useState(10);
  const [result, setResult] = useState<ParcelResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [layerFeedback, setLayerFeedback] = useState("Vue départementale : choisissez une adresse ou une commune.");
  const [communes, setCommunes] = useState<any[]>([]);
  const [communeCode, setCommuneCode] = useState("");
  const [communeQuery, setCommuneQuery] = useState("");
  const [communeSuggestionsOpen, setCommuneSuggestionsOpen] = useState(false);
  const [activeCommune, setActiveCommune] = useState("");
  const [layers, setLayers] = useState({ parcels: true, buildings: true, mos: false, plu: false, servitudes: false, publicLand: false });
  const [services, setServices] = useState<Record<string,"checking"|"online"|"error">>({ Adresse:"checking", Cadastre:"checking", Urbanisme:"checking", Risques:"checking", Bâti:"checking", MOS:"checking", Foncier:"checking" });
  const [message, setMessage] = useState("Recherchez une adresse ou cliquez sur la carte.");
  const layersStateRef = useRef(layers);
  useEffect(() => { layersStateRef.current = layers; }, [layers]);
  useEffect(() => {
    const probes: Record<string,string> = { Adresse:"https://api-adresse.data.gouv.fr/search/?q=Pontoise&limit=1", Cadastre:`https://apicarto.ign.fr/api/cadastre/parcelle?geom=${pointGeometry(2.1,49.05)}`, Urbanisme:`https://apicarto.ign.fr/api/gpu/zone-urba?geom=${pointGeometry(2.1,49.05)}`, Risques:"https://georisques.gouv.fr/api/v1/gaspar/risques?latlon=2.1,49.05", Bâti:"https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/parcelle?parcelle_id=eq.95018000AH0001", MOS:"https://geoweb.iau-idf.fr/agsmap1/rest/services/OPENDATA/OpendataIAU4/MapServer/25/query?f=json&where=1%3D0&returnCountOnly=true", Foncier:`${basePath}/data/foncier-public-95.json` };
    Object.entries(probes).forEach(([name,url]) => fetch(url).then((response) => setServices((current) => ({...current,[name]:response.ok ? "online" : "error"}))).catch(() => setServices((current) => ({...current,[name]:"error"}))));
  }, []);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const launch = () => {
      const L = (window as any).L;
      if (!L || !mapNode.current || mapRef.current) return;
      const map = L.map(mapNode.current, { zoomControl: false, maxBoundsViscosity: .65 }).setView([49.075, 2.105], 10);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", { className: "urban-base-tiles", maxZoom: 20, subdomains: "abcd", attribution: "© OpenStreetMap · © CARTO" }).addTo(map);
      parcelTilesRef.current = L.tileLayer("https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=PCI%20vecteur&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png", {
        className: "parcel-tiles", minZoom: 13, maxZoom: 19, opacity: .82, attribution: "© IGN · DGFiP",
      }).addTo(map);
      buildingTilesRef.current = L.tileLayer("https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=BUILDINGS.BUILDINGS&STYLE=normal&TILEMATRIXSET=PM_6_18&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png", {
        className: "building-tiles", minZoom: 13, maxZoom: 18, opacity: .95, attribution: "© IGN · BD TOPO",
      }).addTo(map);
      pluTilesRef.current = L.tileLayer.wms("https://data.geopf.fr/wms-v/ows", {
        layers: "zone_secteur", format: "image/png", transparent: true, version: "1.3.0",
        className: "plu-tiles", minZoom: 13, maxZoom: 20, opacity: .72, attribution: "© Géoportail de l’urbanisme",
      });
      supTilesRef.current = L.tileLayer.wms("https://data.geopf.fr/wms-v/ows", {
        layers: "sup", format: "image/png", transparent: true, version: "1.3.0",
        className: "sup-tiles", minZoom: 13, maxZoom: 20, opacity: .82, attribution: "© Géoportail de l’urbanisme",
      });
      const refreshMos = async () => {
        if (!layersStateRef.current.mos) {
          if (mosLayerRef.current && map.hasLayer(mosLayerRef.current)) map.removeLayer(mosLayerRef.current);
          return;
        }
        const bounds = map.getBounds();
        mosRequestRef.current?.abort();
        const controller = new AbortController(); mosRequestRef.current = controller;
        const envelope = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(",");
        try {
          const response = await fetch(`https://geoweb.iau-idf.fr/agsmap1/rest/services/OPENDATA/OpendataIAU4/MapServer/25/query?f=geojson&geometry=${envelope}&geometryType=esriGeometryEnvelope&inSR=4326&outSR=4326&spatialRel=esriSpatialRelIntersects&outFields=mos2025,mos2021,insee&returnGeometry=true&resultRecordCount=2000`, { signal: controller.signal });
          if (!response.ok) return;
          const data = await response.json();
          if (mosLayerRef.current && map.hasLayer(mosLayerRef.current)) map.removeLayer(mosLayerRef.current);
          mosLayerRef.current = L.geoJSON(data, { style: (feature: any) => ({ color: mosColor(numberValue(feature?.properties?.mos2025)), weight: .7, fillColor: mosColor(numberValue(feature?.properties?.mos2025)), fillOpacity: .44 }), onEachFeature: (feature: any, layer: any) => layer.bindTooltip(`<b>${mosLabels[numberValue(feature.properties?.mos2025)] || "Occupation du sol"}</b><br>MOS 2025`, { sticky: true }) }).addTo(map);
          mosLayerRef.current.bringToBack();
          parcelTilesRef.current?.bringToFront(); buildingTilesRef.current?.bringToFront();
        } catch (error: any) { if (error?.name !== "AbortError") console.warn("MOS indisponible", error); }
      };
      const refreshPublicLand = async () => {
        if (!layersStateRef.current.publicLand) {
          if (publicLandLayerRef.current && map.hasLayer(publicLandLayerRef.current)) map.removeLayer(publicLandLayerRef.current);
          return;
        }
        try {
          if (!publicLandDataRef.current) publicLandDataRef.current = await fetch(`${basePath}/data/foncier-public-95.json`).then((response) => response.json());
          const bounds = map.getBounds();
          const geom = encodeURIComponent(JSON.stringify({ type:"Polygon", coordinates:[[[bounds.getWest(),bounds.getSouth()],[bounds.getEast(),bounds.getSouth()],[bounds.getEast(),bounds.getNorth()],[bounds.getWest(),bounds.getNorth()],[bounds.getWest(),bounds.getSouth()]]] }));
          const response = await fetch(`https://apicarto.ign.fr/api/cadastre/parcelle?geom=${geom}`);
          if (!response.ok) return;
          const data: FeatureCollection = await response.json();
          const publicFeatures = (data.features || []).filter((feature:any) => publicLandDataRef.current?.[String(feature.properties?.idu || feature.id || "")]);
          setLayerFeedback(publicFeatures.length ? `Foncier public : ${publicFeatures.length} parcelle${publicFeatures.length > 1 ? "s" : ""} visible${publicFeatures.length > 1 ? "s" : ""} dans cette vue.` : "Foncier public : aucune parcelle repérée dans cette vue. Déplacez la carte ou choisissez une autre commune.");
          if (publicLandLayerRef.current && map.hasLayer(publicLandLayerRef.current)) map.removeLayer(publicLandLayerRef.current);
          publicLandLayerRef.current = L.geoJSON({ type:"FeatureCollection", features:publicFeatures }, { style:(feature:any) => { const info=publicLandDataRef.current?.[String(feature.properties?.idu || feature.id || "")]; return { color:publicLandColor(info?.[0] || ""), weight:2, fillColor:publicLandColor(info?.[0] || ""), fillOpacity:.48 }; }, onEachFeature:(feature:any,layer:any) => { const info=publicLandDataRef.current?.[String(feature.properties?.idu || feature.id || "")]; if(info) layer.bindTooltip(`<b>${info[1]}</b><br>${info[2] || "Propriétaire public"}`,{sticky:true}); } }).addTo(map);
          parcelTilesRef.current?.bringToFront(); buildingTilesRef.current?.bringToFront();
        } catch (error) { console.warn("Foncier public indisponible", error); }
      };
      map.on("zoomend", () => { setMapZoom(map.getZoom()); refreshMos(); refreshPublicLand(); });
      map.on("moveend", () => { refreshMos(); refreshPublicLand(); });
      fetch("https://geo.api.gouv.fr/departements/95/communes?fields=nom,code,contour&format=geojson&geometry=contour")
        .then((response) => response.json())
        .then((communes) => {
          setCommunes([...(communes.features || [])].sort((a:any,b:any) => String(a.properties?.nom || "").localeCompare(String(b.properties?.nom || ""), "fr")));
          const territory = L.geoJSON(communes, { style: { color: "#64748b", weight: .7, fillColor: "#000091", fillOpacity: .025 }, interactive: false }).addTo(map);
          const bounds = territory.getBounds();
          if (bounds.isValid()) { map.fitBounds(bounds, { padding: [25, 25] }); map.setMaxBounds(bounds.pad(.28)); }
        }).catch(() => undefined);
      map.on("click", (event: any) => inspectMapPoint(event.latlng.lng, event.latlng.lat));
      mapRef.current = map;
      refreshMos();
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

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const toggleMapLayer = (layer: any, visible: boolean) => { if (!layer) return; if (visible && !map.hasLayer(layer)) layer.addTo(map); if (!visible && map.hasLayer(layer)) map.removeLayer(layer); };
    toggleMapLayer(parcelTilesRef.current, layers.parcels);
    toggleMapLayer(buildingTilesRef.current, layers.buildings);
    toggleMapLayer(pluTilesRef.current, layers.plu);
    toggleMapLayer(supTilesRef.current, layers.servitudes);
    if (!layers.mos && mosLayerRef.current && map.hasLayer(mosLayerRef.current)) map.removeLayer(mosLayerRef.current);
    if (!layers.publicLand && publicLandLayerRef.current && map.hasLayer(publicLandLayerRef.current)) map.removeLayer(publicLandLayerRef.current);
    if (layers.mos || layers.publicLand) map.fire("moveend");
    if (result && selectionPointRef.current) {
      const [lon, lat] = selectionPointRef.current;
      drawResults(lon, lat, result.parcel ? { type: "FeatureCollection", features: [result.parcel] } : emptyCollection, { type: "FeatureCollection", features: result.zones }, { type: "FeatureCollection", features: result.servitudes });
    }
  }, [layers]);

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
        setActiveCommune(properties.city || ""); setCommuneCode(properties.citycode || "");
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
      if (!publicLandDataRef.current) publicLandDataRef.current = await fetch(`${basePath}/data/foncier-public-95.json`).then((response) => response.json()).catch(() => ({}));
      const publicLand = publicLandDataRef.current?.[parcelId];
      const mosData = mosResponse.ok ? await mosResponse.json() : emptyCollection;
      const mosProps = mosData.features?.[0]?.properties || {};
      const riskDetails = (risksData.data || []).flatMap((entry: any) => entry.risques_detail || []);
      setResult({ address, addressLabel, commune: addressMeta?.city || firstValue(props, ["nom_com", "nom_commune"]), codeInsee: addressMeta?.citycode || firstValue(props, ["code_insee", "code_dep"], "—"), parcel, zones: zoneData.features || [], servitudes: supData.features || [], risks: riskDetails, buildings: Array.isArray(buildings) ? buildings : [], publicLand, mos: { mos2021: numberValue(mosProps.mos2021), mos2025: numberValue(mosProps.mos2025), surface: numberValue(mosProps["st_area(shape)"]) } }); setDetailsOpen(true);
      setMessage(parcel ? "Informations disponibles pour le point sélectionné." : "Aucune parcelle trouvée à cet emplacement.");
    } catch {
      setMessage("Une source publique n’a pas répondu. Vous pouvez réessayer dans quelques instants.");
    } finally { setLoading(false); }
  }

  function drawResults(lon: number, lat: number, parcels: FeatureCollection, zones: FeatureCollection, servitudes: FeatureCollection) {
    selectionPointRef.current = [lon, lat];
    const L = (window as any).L; const map = mapRef.current; if (!L || !map) return;
    layersRef.current.forEach((layer) => map.removeLayer(layer)); layersRef.current = [];
    if (markerRef.current) map.removeLayer(markerRef.current);
    const selectedOwners = uniqueValues(result?.buildings.map((building) => building.l_denomination_proprietaire) || []);
    const selectedIsPublic = /État|public/.test(classifyOwners(selectedOwners));
    const parcelStyle = layersStateRef.current.publicLand ? { color: selectedIsPublic ? "#18753c" : "#6b7280", weight: 4, fillColor: selectedIsPublic ? "#5ecf8b" : "#d1d5db", fillOpacity: .48 } : { color: "#000091", weight: 4, fillColor: "#4fd1ff", fillOpacity: .32 };
    const configs = [
      [layersStateRef.current.servitudes ? servitudes : emptyCollection, { color: "#6f4c9b", weight: 2, fillColor: "#6f4c9b", fillOpacity: .12, dashArray: "6 4" }],
      [layersStateRef.current.plu ? zones : emptyCollection, { color: "#18753c", weight: 2, fillColor: "#18753c", fillOpacity: .10 }],
      [parcels, parcelStyle],
    ] as const;
    configs.forEach(([data, style]) => { if (data.features.length) { const layer = L.geoJSON(data, { style }).addTo(map); layersRef.current.push(layer); } });
    markerRef.current = L.circleMarker([lat, lon], { radius: 6, color: "#e1000f", fillColor: "#fff", fillOpacity: 1, weight: 3 }).addTo(map);
    map.setMinZoom(13);
    const parcelLayer = layersRef.current.at(-1); if (parcelLayer?.getBounds?.().isValid()) map.fitBounds(parcelLayer.getBounds(), { padding: [40, 40], maxZoom: 19 }); else map.setView([lat, lon], 17);
    setLayerFeedback(`Parcelle sélectionnée · niveau ${Math.max(13, map.getZoom())}. Les couches activées restent affichées.`);
  }

  function resetSearch() {
    const map = mapRef.current;
    if (map) {
      layersRef.current.forEach((layer) => map.removeLayer(layer));
      layersRef.current = [];
      if (markerRef.current) map.removeLayer(markerRef.current);
    markerRef.current = null;
      selectionPointRef.current = null;
      if (communeFocusLayerRef.current) map.removeLayer(communeFocusLayerRef.current);
      communeFocusLayerRef.current = null;
      map.setMinZoom(9); map.setView([49.075, 2.105], 10);
    }
    setQuery("");
    setResult(null);
    setDetailsOpen(false);
    setCommuneCode("");
    setCommuneQuery("");
    setActiveCommune("");
    setLoading(false);
    setMessage("Recherchez une adresse ou cliquez sur la carte.");
    setLayerFeedback("Vue départementale : choisissez une adresse ou une commune.");
  }

  function exploreCommune(code = communeCode) {
    const feature = communes.find((item) => String(item.properties?.code) === code);
    const map = mapRef.current; const L = (window as any).L;
    if (!feature || !map || !L) return;
    if (communeFocusLayerRef.current) map.removeLayer(communeFocusLayerRef.current);
    communeFocusLayerRef.current = L.geoJSON(feature, { style: { color: "#000091", weight: 3, fillColor: "#000091", fillOpacity: .04 }, interactive: false }).addTo(map);
    const bounds = communeFocusLayerRef.current.getBounds();
    if (bounds.isValid()) { map.setMinZoom(13); map.fitBounds(bounds, { padding: [45,45], maxZoom: 15 }); }
    setActiveCommune(feature.properties?.nom || "Commune choisie");
    setCommuneQuery(feature.properties?.nom || ""); setCommuneSuggestionsOpen(false);
    setResult(null); setDetailsOpen(false); setMessage("Commune cadrée : cliquez directement sur une parcelle.");
    setLayerFeedback("Échelle parcellaire verrouillée : les couches actives restent visibles.");
  }

  function toggleLayer(key: keyof typeof layers) {
    const enable = !layers[key]; const map = mapRef.current;
    if (enable && map) {
      const target = key === "publicLand" ? 14 : 13;
      map.setMinZoom(13);
      if (map.getZoom() < target) map.setZoom(target);
      setLayerFeedback(key === "plu" ? "Zonage PLU affiché en continu — cliquez sur une parcelle pour lire la zone opposable." : key === "servitudes" ? "Servitudes affichées en continu — cliquez sur une parcelle pour obtenir leur détail." : "Couche activée. L’échelle utile reste verrouillée pour éviter toute disparition.");
    }
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  }

  async function searchAddress(event: React.FormEvent) {
    event.preventDefault(); if (!query.trim()) return;
    setLoading(true); setMessage("Recherche de l’adresse…");
    try {
      const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1&autocomplete=0`);
      const data = await response.json(); const feature = data.features?.[0];
      if (!feature) { setMessage("Adresse non trouvée."); setLoading(false); return; }
      const [lon, lat] = feature.geometry.coordinates; const p = feature.properties;
      setActiveCommune(p.city || ""); setCommuneCode(p.citycode || "");
      setQuery(p.label); await inspectPoint(lon, lat, p.label, { label: p.label, city: p.city, citycode: p.citycode, postcode: p.postcode, coordinates: [lon, lat] });
    } catch { setLoading(false); setMessage("La recherche d’adresse est momentanément indisponible."); }
  }

  async function downloadParcelPdf() {
    if (!result) return;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit:"mm", format:"a4", orientation:"portrait" });
    const navy:[number,number,number]=[0,0,145], ink:[number,number,number]=[30,39,58], muted:[number,number,number]=[91,103,123];
    pdf.setFillColor(247,248,252); pdf.rect(0,0,210,297,"F"); pdf.setFillColor(...navy); pdf.rect(0,0,210,7,"F");
    pdf.setTextColor(...navy); pdf.setFont("helvetica","bold"); pdf.setFontSize(17); pdf.text("Fiche d'identité parcellaire",14,21);
    pdf.setFontSize(12); pdf.text(streetOnly(result.address),14,30); pdf.setTextColor(...muted); pdf.setFont("helvetica","normal"); pdf.setFontSize(8); pdf.text(`${result.commune} · Parcelle ${firstValue(parcelProps,["section"],"")} ${firstValue(parcelProps,["numero"],"—")} · ${new Date().toLocaleDateString("fr-FR")}`,14,36);
    const blocks:[string,[string,string][]][] = [
      ["01  Parcelle",[["Référence",`${firstValue(parcelProps,["section"],"")} ${firstValue(parcelProps,["numero"],"—")}`],["Contenance",`${firstValue(parcelProps,["contenance"],"—")} m²`]]],
      ["02  Bâti",[["Bâtiments",String(buildingCount)],["Emprise",formatNumber(builtFootprint," m²")],["Taux",formatNumber(coverageRatio," %")],["Usage",uniqueValues(result.buildings.map((b)=>b.usage_principal_bdnb_open)).join(", ")||"Non renseigné"],["Construction",String(oldestBuilding||"Non renseignée")]]],
      ["03  Propriété",[["Lecture",ownerCategory]]],
      ["04  MOS 2025",[["Occupation",result.mos?.mos2025 ? mosLabels[result.mos.mos2025] || `Poste ${result.mos.mos2025}` : "Non renseignée"]]],
      ["05  Urbanisme",[["Zonage",result.zones.map((z)=>firstValue(z.properties,["libelle","typezone"],"Zone GPU")).join(", ")||"Non retourné"],["Servitudes",`${result.servitudes.length} assiette(s)`]]],
      ["06  Risques",[["Risques",uniqueValues(result.risks.map((r)=>r.libelle_risque_long||r.libelle_risque)).join(", ")||"Aucun risque retourné"]]],
    ];
    const heights = blocks.map(([,rows]) => Math.max(28,15+rows.reduce((sum,row)=>sum+Math.max(6,pdf.splitTextToSize(row[1],52).length*4),0)));
    let leftY=44,rightY=44;
    blocks.forEach(([title,rows],index)=>{ const left=index%2===0, x=left?14:107, y=left?leftY:rightY, h=heights[index]; pdf.setFillColor(index%3===0?238:245,index%3===1?246:248,index%3===2?241:252); pdf.roundedRect(x,y,89,h,3,3,"F"); pdf.setTextColor(...navy); pdf.setFont("helvetica","bold"); pdf.setFontSize(9); pdf.text(title,x+5,y+8); let ry=y+15; rows.forEach(([label,value])=>{ pdf.setTextColor(...muted); pdf.setFont("helvetica","normal"); pdf.setFontSize(6.5); pdf.text(label,x+5,ry); pdf.setTextColor(...ink); pdf.setFont("helvetica","bold"); const lines=pdf.splitTextToSize(value,52); pdf.text(lines,x+32,ry); ry+=Math.max(6,lines.length*4); }); if(left)leftY+=h+4; else rightY+=h+4; });
    pdf.setTextColor(...muted); pdf.setFont("helvetica","normal"); pdf.setFontSize(6.5); pdf.text("Sources : DGFiP, IGN, GPU, BDNB, Institut Paris Region, Géorisques. Lecture indicative ; les documents opposables restent la référence.",14,286,{maxWidth:182});
    pdf.save(`fiche-parcelle-${result.codeInsee || "95"}-${firstValue(parcelProps,["section"],"")}${firstValue(parcelProps,["numero"],"")}.pdf`);
  }

  const parcelProps = result?.parcel?.properties || {};
  const buildingCount = result?.buildings.length || 0;
  const builtFootprint = result?.buildings.reduce((sum, building) => sum + numberValue(building.surface_emprise_sol), 0) || 0;
  const parcelArea = numberValue(parcelProps.contenance);
  const coverageRatio = parcelArea ? (builtFootprint / parcelArea) * 100 : 0;
  const publicOwners = uniqueValues(result?.buildings.map((building) => building.l_denomination_proprietaire) || []);
  const ownerCategory = result?.publicLand ? `${result.publicLand[1]} — ${result.publicLand[2]}` : classifyOwners(publicOwners);
  const oldestBuilding = result?.buildings.map((building) => numberValue(building.annee_construction)).filter(Boolean).sort((a,b) => a-b)[0];
  const maxHeight = Math.max(0, ...(result?.buildings.map((building) => numberValue(building.hauteur_mean)) || []));
  const dwellingCount = result?.buildings.reduce((sum, building) => sum + numberValue(building.nb_log), 0) || 0;
  const dpeClasses = uniqueValues(result?.buildings.map((building) => building.classe_bilan_dpe || (building.classe_conso_energie_arrete_2012 !== "N" ? building.classe_conso_energie_arrete_2012 : null)) || []);
  return (
    <main className="urban-tool">
      <header className="urban-observatory-header">
        <img src={`${basePath}/prefet-val-doise-logo.png`} alt="Préfet du Val-d’Oise — Liberté Égalité Fraternité"/>
        <div><span>Cadastre · urbanisme · foncier · Val-d’Oise</span><h1>Urbanisme à la parcelle</h1><p><strong>Val-d’Oise</strong> · bâti · MOS · PLU · servitudes · risques</p></div>
        <div className="header-service-state"><i className={Object.values(services).every((state)=>state==="online")?"online":"checking"}/><span><strong>{Object.values(services).filter((state)=>state==="online").length}/7 sources connectées</strong><small>Données publiques actualisées</small></span></div>
      </header>
      <div className="urban-layout">
        <aside className="urban-panel">
          <div className="urban-panel-title"><h2>Rechercher et comprendre<br/><span>une parcelle</span></h2></div>
          <form className="urban-search" onSubmit={searchAddress}><div><input id="urban-address" aria-label="Adresse ou référence cadastrale" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Adresse dans le Val-d’Oise…" /><button disabled={loading}>{loading ? "…" : "Rechercher"}</button></div></form>
          <div className="commune-autocomplete"><label htmlFor="urban-commune">Explorer directement une commune</label><div><input id="urban-commune" value={communeQuery} placeholder="Commencez à saisir : Pontoise…" autoComplete="off" onFocus={()=>setCommuneSuggestionsOpen(true)} onChange={(event)=>{setCommuneQuery(event.target.value);setCommuneSuggestionsOpen(true);setCommuneCode("");}}/>{communeSuggestionsOpen && communeQuery.trim().length>0 && <div className="commune-suggestions">{communes.filter((item)=>String(item.properties?.nom||"").toLocaleLowerCase("fr").includes(communeQuery.toLocaleLowerCase("fr"))).slice(0,6).map((item)=><button key={item.properties?.code} type="button" onClick={()=>{setCommuneCode(item.properties.code);exploreCommune(item.properties.code);}}><strong>{item.properties?.nom}</strong><small>Val-d’Oise · {item.properties?.code}</small></button>)}</div>}</div>{activeCommune && <p><i/>Vous explorez <strong>{activeCommune}</strong><button type="button" onClick={resetSearch}>Quitter</button></p>}</div>
          <div className={`urban-message ${loading ? "loading" : ""}`}><i />{message}</div>
          {(result || query) && !loading && <button className="reset-search" type="button" onClick={resetSearch}><span aria-hidden="true">↺</span> Nouvelle recherche</button>}
          <div className="map-reading-card"><strong>Lecture de la carte</strong><p>Choisissez une information puis cliquez sur une parcelle. Si une couche exige plus de détail, la carte s’approche automatiquement.</p></div>
          <section className="urban-layer-panel" aria-labelledby="urban-layer-title">
            <div className="urban-layer-head"><span><small>Lecture de la carte</small><strong id="urban-layer-title">Informations affichées</strong></span><b>Niveau {mapZoom}</b></div>
            <div className="urban-layer-list">
              {([
                ["parcels","Parcelles","Limites cadastrales IGN","#000091"],
                ["buildings","Bâtiments","Empreintes BD TOPO","#444b55"],
                ["mos","MOS 2025","Occupation du sol en couleurs","#e07a9a"],
                ["plu","Zonage PLU","Carte GPU continue + détail au clic","#18753c"],
                ["servitudes","Servitudes","Carte GPU continue + détail au clic","#6f4c9b"],
                ["publicLand","Foncier public","État, collectivités, HLM et établissements","#008941"],
              ] as const).map(([key,label,description,color]) => <button key={key} type="button" role="switch" className="urban-layer-toggle" onClick={() => toggleLayer(key)} aria-checked={layers[key]}><i style={{background:color}}/><span><strong>{label}</strong><small>{description}</small></span><b aria-hidden="true"><em/></b></button>)}
            </div>
            {layers.mos && <div className="mos-mini-legend"><span><i style={{background:"#18753c"}}/>Nature</span><span><i style={{background:"#e3b341"}}/>Agriculture</span><span><i style={{background:"#e07a9a"}}/>Habitat</span><span><i style={{background:"#a05a9c"}}/>Activités</span></div>}
            {layers.publicLand && <div className="public-mini-legend"><span><i style={{background:"#e1000f"}}/>État</span><span><i style={{background:"#6f4c9b"}}/>Région</span><span><i style={{background:"#000091"}}/>Département</span><span><i style={{background:"#18753c"}}/>Commune</span><span><i style={{background:"#0098d8"}}/>HLM</span><span><i style={{background:"#7b61a8"}}/>Établissement</span></div>}
            <p className="public-land-note"><i/>Référentiel présumé : parcelles de personnes morales classées État, région, département, communes, HLM, SEM et établissements publics — millésime 2025.</p>
          </section>
          <details className="urban-services"><summary><span><strong>Sources publiques</strong><small>{Object.values(services).filter((state)=>state==="online").length}/7 services disponibles</small></span><b>{Object.values(services).every((state)=>state==="online")?"Connecté":"Vérification"}</b></summary><div className="urban-service-grid">{Object.entries(services).map(([name,state])=><span key={name}><i className={state}/><strong>{name}</strong><small>{state==="online"?"Disponible":state==="error"?"Indisponible":"Connexion…"}</small></span>)}</div></details>
        </aside>
        <section className="urban-map-wrap">
          <div className={`map-guidance ${mapZoom >= 13 ? "ready" : ""}`}><strong>{mapZoom >= 13 ? "Cliquez sur une parcelle" : "Choisissez un lieu"}</strong><span>{layerFeedback}</span></div>
          <div className="urban-legend">{result && <span><i className="parcel"/>Sélection</span>}{layers.buildings && <span><i className="building"/>Bâtiments</span>}{layers.mos && <span><i className="mos"/>MOS</span>}{layers.plu && <span><i className="zone"/>PLU</span>}{layers.servitudes && <span><i className="sup"/>SUP</span>}{layers.publicLand && <span><i className="public"/>Foncier public</span>}</div><div ref={mapNode} className="urban-map" aria-label="Carte interactive d’urbanisme à la parcelle" />
        </section>
      </div>
      <footer className="urban-footer"><span><strong>Cadastre + GPU + BDNB + MOS + DGFiP</strong> · lecture parcellaire du Val-d’Oise</span><span>DDT Val-d’Oise · Leaflet 1.9.4 · <a href={`${basePath || ""}/`}>Retour à l’Atlas</a></span></footer>
      {result && detailsOpen && <aside className="observatory-drawer" aria-label="Détail de la parcelle"><div className="observatory-drawer-head"><div className="print-brand"><img src={`${basePath}/prefet-val-doise-logo.png`} alt="Préfet du Val-d’Oise"/><span><b>Fiche d’identité parcellaire</b><small>DDT du Val-d’Oise · {new Date().toLocaleDateString("fr-FR")}</small></span></div><div className="drawer-actions"><button className="print-parcel" onClick={downloadParcelPdf}>Télécharger le PDF</button><button className="print-parcel secondary" onClick={() => window.print()}>Imprimer</button><button onClick={() => setDetailsOpen(false)} aria-label="Fermer">×</button></div><small>{result.addressLabel} · {result.commune}</small><h2 className="drawer-address">{streetOnly(result.address)}</h2><div className="parcel-id-print">Parcelle {firstValue(parcelProps,["section"],"")} {firstValue(parcelProps,["numero"],"—")}</div></div><div className="observatory-drawer-body urban-results">
        <section><div className="result-heading"><span>01</span><h2>Parcelle cadastrale</h2></div><dl><div><dt>Référence</dt><dd>{firstValue(parcelProps,["section"],"")} {firstValue(parcelProps,["numero"],"—")}</dd></div><div><dt>Contenance</dt><dd>{firstValue(parcelProps,["contenance"],"—")} m²</dd></div></dl>{result.addressLabel === "Adresse la plus proche" && <p className="address-caution">Adresse BAN la plus proche du point cliqué.</p>}</section>
        <section className="building-summary"><div className="result-heading"><span>02</span><h2>Bâti présent</h2></div>{buildingCount ? <><div className="parcel-kpis"><div><strong>{buildingCount}</strong><span>groupe{buildingCount > 1 ? "s" : ""} de bâtiments</span></div><div><strong>{formatNumber(builtFootprint," m²")}</strong><span>emprise bâtie estimée</span></div><div><strong>{formatNumber(coverageRatio," %")}</strong><span>taux d’emprise</span></div></div><dl><div><dt>Usage principal</dt><dd>{uniqueValues(result.buildings.map((building) => building.usage_principal_bdnb_open)).join(", ") || "Non renseigné"}</dd></div><div><dt>Construction la plus ancienne</dt><dd>{oldestBuilding || "Non renseignée"}</dd></div><div><dt>Hauteur maximale estimée</dt><dd>{maxHeight ? formatNumber(maxHeight," m") : "Non renseignée"}</dd></div><div><dt>Logements recensés</dt><dd>{dwellingCount || "Non renseigné"}</dd></div><div><dt>DPE disponible</dt><dd>{dpeClasses.length ? dpeClasses.join(", ") : "Non disponible"}</dd></div></dl><p className="source-caption">Source : BDNB Open, CSTB. Les groupes de bâtiments peuvent agréger plusieurs constructions.</p></> : <p className="empty-result">Aucun bâtiment rattaché à cette parcelle dans la BDNB Open.</p>}</section>
        <section><div className="result-heading"><span>03</span><h2>Propriété et foncier public</h2></div><div className={`ownership-status ${result.publicLand || publicOwners.length ? "known" : "unknown"}`}><small>{result.publicLand ? "Propriétaire public présumé" : "Catégorie détectée"}</small><strong>{ownerCategory}</strong></div>{!result.publicLand && publicOwners.length ? <div className="owner-list">{publicOwners.map((owner) => <span key={owner}>{owner}</span>)}</div> : !result.publicLand && <p className="empty-result">Le nom des propriétaires privés n’est pas diffusé en open data. L’absence de nom ne signifie pas que la parcelle est sans propriétaire.</p>}<p className="source-caption">Source ouverte : DGFiP, Fichiers des parcelles des personnes morales 2025. Le Référentiel foncier public Cerema avec accès métier reste la référence exhaustive.</p></section>
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
