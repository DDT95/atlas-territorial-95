"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-hooks/immutability, react-hooks/refs, react-hooks/preserve-manual-memoization, @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";

type Feature = {
  id?: string;
  properties?: Record<string, any>;
  geometry?: any;
};
type Service = {
  id: string;
  category: string;
  name: string;
  type?: string;
  typeLabel: string;
  lat: number;
  lon: number;
  source: string;
  wheelchair?: string;
  operator?: string;
  website?: string[];
  phone?: string[];
  openingHours?: string;
};
type Analysis = {
  lon: number;
  lat: number;
  address: string;
  commune: string;
  codeInsee: string;
  parcel?: Feature;
  zones: Feature[];
  servitudes: Feature[];
  risks: any[];
  services: Service[];
  isochrones: Record<string, any>;
  roadAccess: Record<string, string>;
  errors: string[];
  buildings: any[];
  selectedBuilding?: Feature | null;
  buildingData?: Record<string, any> | null;
  mos?: Record<string, any>;
  biodiversity: string[];
  heat?: Record<string, any>;
  nuisance?: Record<string, any>;
  housing?: Record<string, any>;
  market?: Record<string, any>;
  sol?: Record<string, any>;
  water?: Record<string, any>;
  peb?: Record<string, any> | null;
  noiseRoad: any[];
  noiseRail: any[];
  riskObservatory?: {
    pprn: any[];
    tri: any[];
    azi: any[];
    radon: any[];
    cavities: any[];
    icpe: any[];
  };
  study?: Record<string, any>;
};

const SOURCE_LINKS = [
  [
    "Cadastre",
    "IGN / DGFiP",
    "API Carto · PCI",
    "à la requête",
    "https://apicarto.ign.fr/api/doc/cadastre",
  ],
  [
    "PLU, prescriptions, SUP",
    "Géoportail de l’urbanisme / IGN",
    "API Carto GPU",
    "à la requête",
    "https://www.geoportail-urbanisme.gouv.fr/",
  ],
  [
    "Bâtiments",
    "RNB / CSTB",
    "RNB + BDNB 2026-02.a",
    "à la requête",
    "https://rnb.beta.gouv.fr/",
  ],
  [
    "Risques",
    "Géorisques / MTECT",
    "API Gaspar + rapport réglementaire",
    "à la requête",
    "https://www.georisques.gouv.fr/",
  ],
  [
    "Risques majeurs du Val-d’Oise",
    "DDT 95 + Géorisques",
    "PPRN, TRI, AZI, radon, cavités, ICPE",
    "à la requête",
    "https://ddt95.github.io/observatoire_risques_95/",
  ],
  [
    "Services et équipements",
    "DILA + OpenStreetMap",
    "référentiel DDT 95 consolidé",
    "hebdomadaire",
    "https://ddt95.github.io/acces-services95/",
  ],
  [
    "Médecins, hôpitaux et cliniques",
    "Insee BPE + OpenStreetMap",
    "équipements géolocalisés consolidés",
    "hebdomadaire",
    "https://www.insee.fr/fr/metadonnees/source/serie/s1161",
  ],
  [
    "Arrêts, lignes et gares",
    "Île-de-France Mobilités",
    "GTFS / référentiel transport",
    "quotidienne",
    "https://www.data.gouv.fr/datasets/reseau-urbain-et-interurbain-dile-de-france-mobilites",
  ],
  [
    "Accessibilité 5/10/15 min",
    "OpenStreetMap / Valhalla",
    "isochrones sur réseau piéton",
    "à la requête",
    "https://valhalla.github.io/valhalla/",
  ],
  [
    "Artificialisation / ENAF",
    "Cerema",
    "Portail national de l’artificialisation",
    "annuelle",
    "https://artificialisation.developpement-durable.gouv.fr/",
  ],
  [
    "Logement social",
    "SDES",
    "RPLS",
    "annuelle",
    "https://www.statistiques.developpement-durable.gouv.fr/repertoire-des-logements-locatifs-des-bailleurs-sociaux-rpls",
  ],
  [
    "Prix immobiliers",
    "DGFiP",
    "DVF",
    "semestrielle",
    "https://explore.data.gouv.fr/fr/immobilier?onglet=carte&filtre=tous",
  ],
  [
    "Vacance du parc privé",
    "Cerema / DGALN",
    "LOVAC 2026",
    "annuelle",
    "https://www.data.gouv.fr/fr/datasets/logements-vacants-du-parc-prive-par-commune-et-par-epci/",
  ],
  [
    "Production de logements",
    "SDES",
    "Sitadel 2025",
    "mensuelle",
    "https://www.statistiques.developpement-durable.gouv.fr/sitadel2",
  ],
  [
    "Application de l’article 55 SRU",
    "Ministère de la Transition écologique",
    "Inventaire SRU 2025",
    "annuelle",
    "https://www.ecologie.gouv.fr/politiques-publiques/article-55-loi-sru-taux-logements-sociaux",
  ],
  [
    "Performance énergétique",
    "ADEME",
    "DPE des logements",
    "mensuelle",
    "https://data.ademe.fr/datasets/dpe-v2-logements-existants",
  ],
  [
    "Bruit routier et ferroviaire",
    "DDT 95",
    "Classement sonore / CBS",
    "selon arrêté",
    "https://www.data.gouv.fr/fr/organizations/direction-departementale-des-territoires-du-val-doise/",
  ],
  [
    "Air",
    "Airparif",
    "Cartes annuelles / indices",
    "annuelle et quotidienne",
    "https://www.airparif.fr/",
  ],
  [
    "Eau",
    "OFB / agences de l’eau / ARS",
    "Hub’Eau, SISPEA, contrôle sanitaire",
    "selon source",
    "https://hubeau.eaufrance.fr/",
  ],
  [
    "Biodiversité",
    "INPN / ARB Île-de-France",
    "zonages et observations SINP",
    "trimestrielle cible",
    "https://inpn.mnhn.fr/",
  ],
  [
    "Projets",
    "DDT 95 / collectivités",
    "référentiel projets de l’Atlas",
    "mensuelle cible",
    "https://ddt95.github.io/projets-transformations-95/",
  ],
] as const;

const MAP_LAYERS = [
  ["cadastre", "Cadastre", "Urbanisme et foncier", "#000091"],
  ["buildings", "Bâtiments · RNB / BDNB", "Urbanisme et foncier", "#e77735"],
  ["mos", "MOS 2025 · occupation du sol", "Urbanisme et foncier", "#009081"],
  ["plu", "PLU / PLUi", "Urbanisme et foncier", "#3153a4"],
  [
    "servitudes",
    "Servitudes d’utilité publique",
    "Urbanisme et foncier",
    "#6f4c9b",
  ],
  ["peb", "PEB · bruit aérien", "Risques et nuisances", "#6f4c9b"],
  [
    "isochrones",
    "Accessibilité piétonne · 15 min",
    "Accessibilité et transports",
    "#00a7b5",
  ],
  [
    "routes",
    "Accès au réseau routier",
    "Accessibilité et transports",
    "#087e8b",
  ],
  [
    "services",
    "Services et équipements",
    "Accessibilité et transports",
    "#33845b",
  ],
  ["busStops", "Arrêts de bus", "Transports collectifs", "#0078f3"],
  ["busLines", "Lignes de bus", "Transports collectifs", "#635bff"],
  ["stations", "Gares ferroviaires", "Transports collectifs", "#a558a0"],
  ["doctors", "Médecins", "Santé", "#18753c"],
  ["pharmacies", "Pharmacies", "Santé", "#00a95c"],
  ["hospitals", "Hôpitaux et cliniques", "Santé", "#e1000f"],
  ["franceServices", "Maisons France Services", "Services publics", "#000091"],
] as const;
const LAYER_GROUPS = [
  [
    "Urbanisme et foncier",
    ["cadastre", "buildings", "mos", "plu", "servitudes"],
  ],
  ["Risques et nuisances", ["peb"]],
  [
    "Accessibilité et transports",
    ["isochrones", "routes", "services", "busStops", "busLines", "stations"],
  ],
  ["Services", ["doctors", "pharmacies", "hospitals", "franceServices"]],
] as const;
const SERVICE_CATEGORIES = [
  ["education", "Éducation", "É", "#e1000f"],
  ["mobilite", "Transports", "T", "#000091"],
  ["administration", "Services publics", "SP", "#18753c"],
  ["culture", "Équipements sportifs", "S", "#a558a0"],
] as const;
const serviceBucket = (service: Service) =>
  service.category === "france_services" ? "administration" : service.category;
const isPublicService = (service: Service) =>
  !(
    service.source === "OpenStreetMap" &&
    service.type === "swimming_pool" &&
    !service.operator &&
    !service.website?.length &&
    !service.phone?.length &&
    !service.openingHours
  );
const first = (
  p: Record<string, any> | undefined,
  keys: string[],
  fallback = "—",
) =>
  keys
    .map((k) => p?.[k])
    .find((v) => v !== undefined && v !== null && String(v) !== "") ?? fallback;
const percent = (value: unknown) =>
  value == null || String(value).trim() === ""
    ? "Non renseigné"
    : `${String(value).replace(/\s*%\s*$/, "")} %`;
const rnbStatus = (value: unknown) =>
  ({
    constructed: "Construit",
    ongoing: "En construction",
    demolished: "Démoli",
    cancelled: "Annulé",
  })[String(value || "").toLowerCase()] || String(value || "Non renseigné");
const frenchValue = (value: unknown) => {
  if (value === true || String(value).toLowerCase() === "true") return "Oui";
  if (value === false || String(value).toLowerCase() === "false") return "Non";
  return String(value ?? "Non renseigné");
};
const renovationLabel = (key: string) =>
  ({
    batenr_favorabilite_geothermie_nappe: "Géothermie sur nappe favorable",
    batenr_favorabilite_geothermie_sonde: "Géothermie sur sondes favorable",
    batenr_favorabilite_solaire_thermique: "Solaire thermique favorable",
    batenr_potentiel_geothermique_nappe: "Potentiel géothermique sur nappe",
    batenr_potentiel_prod_solaire_thermique_annuelle:
      "Production solaire thermique potentielle annuelle",
    batenr_potentiel_prod_solaire_thermique_ete:
      "Production solaire thermique potentielle en été",
    batenr_zone_geothermie_profonde: "Zone de géothermie profonde",
  })[key] || key.replaceAll("_", " ");
const pointGeom = (lon: number, lat: number) =>
  encodeURIComponent(
    JSON.stringify({ type: "Point", coordinates: [lon, lat] }),
  );
function ringContains(point: [number, number], ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
}
function geometryContains(geometry: any, lon: number, lat: number) {
  if (!geometry) return false;
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  return polygons.some(
    (polygon: number[][][]) =>
      ringContains([lon, lat], polygon[0]) &&
      !polygon.slice(1).some((ring) => ringContains([lon, lat], ring)),
  );
}
function collectionContains(collection: any, service: Service) {
  return Boolean(
    collection?.features?.some((feature: Feature) =>
      geometryContains(feature.geometry, service.lon, service.lat),
    ),
  );
}
function intersectLabels(
  collection: any,
  lon: number,
  lat: number,
  prefix: string,
) {
  return (collection?.features || [])
    .filter((feature: Feature) => geometryContains(feature.geometry, lon, lat))
    .map(
      (feature: Feature) =>
        `${prefix} · ${first(feature.properties, ["nom", "toponyme", "nature_detaillee", "nature"], "périmètre intersecté")}`,
    );
}
function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax,
    dy = by - ay,
    l = dx * dx + dy * dy,
    t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
function decodePolyline(shape: string, precision = 6) {
  const points: number[][] = [];
  let index = 0,
    lat = 0,
    lon = 0;
  while (index < shape.length) {
    let result = 0,
      shift = 0,
      byte = 0;
    do {
      byte = shape.charCodeAt(index++) - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;
    do {
      byte = shape.charCodeAt(index++) - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    lon += result & 1 ? ~(result >> 1) : result >> 1;
    points.push([lat / 10 ** precision, lon / 10 ** precision]);
  }
  return points;
}
function regulatoryMatches(data: any, lon: number, lat: number) {
  const rad = Math.PI / 180,
    R = 6371000,
    project = (x: number, y: number) => [
      x * rad * R * Math.cos(lat * rad),
      y * rad * R,
    ];
  const [px, py] = project(lon, lat);
  return (data?.features || [])
    .filter((f: Feature) => {
      const width = Number(first(f.properties, ["es", "tampon"], 0));
      const lines =
        f.geometry?.type === "MultiLineString"
          ? f.geometry.coordinates
          : [f.geometry?.coordinates || []];
      return lines.some((line: number[][]) =>
        line.slice(1).some((b, i) => {
          const a = line[i],
            [ax, ay] = project(a[0], a[1]),
            [bx, by] = project(b[0], b[1]);
          return distanceToSegment(px, py, ax, ay, bx, by) <= width;
        }),
      );
    })
    .sort(
      (a: Feature, b: Feature) =>
        Number(first(a.properties, ["categorie"], 9)) -
        Number(first(b.properties, ["categorie"], 9)),
    );
}
async function queryPeb(lon: number, lat: number, signal: AbortSignal) {
  const d = 0.005,
    q = new URLSearchParams({
      SERVICE: "WMS",
      VERSION: "1.3.0",
      REQUEST: "GetFeatureInfo",
      LAYERS: "dgac_peb_plan_wmsv",
      QUERY_LAYERS: "dgac_peb_plan_wmsv",
      CRS: "EPSG:4326",
      BBOX: `${lat - d},${lon - d},${lat + d},${lon + d}`,
      WIDTH: "101",
      HEIGHT: "101",
      I: "50",
      J: "50",
      INFO_FORMAT: "application/json",
      FEATURE_COUNT: "4",
    });
  const data = await jsonOr<any>(
    `https://data.geopf.fr/wms-v/ows?${q}`,
    { features: [] },
    signal,
  );
  return data.features?.[0]?.properties || null;
}

async function jsonOr<T>(
  url: string,
  fallback: T,
  signal?: AbortSignal,
): Promise<T> {
  try {
    const requestSignal = signal
      ? AbortSignal.any([signal, AbortSignal.timeout(8000)])
      : AbortSignal.timeout(8000);
    const response = await fetch(url, { signal: requestSignal });
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } catch {
    return fallback;
  }
}

const rnbIdOf = (feature?: Feature | null) =>
  feature?.id ||
  feature?.properties?.rnb_id ||
  feature?.properties?.id ||
  feature?.properties?.rnbId ||
  null;
const rowsOf = (value: any) =>
  Array.isArray(value)
    ? value
    : Array.isArray(value?.data)
      ? value.data
      : Array.isArray(value?.results)
        ? value.results
        : [];
async function fetchBdnbByRnb(rnbId: string, signal: AbortSignal) {
  const base = "https://api.bdnb.io/v1/bdnb";
  let relations: any[] = [];
  for (const table of [
    "rel_batiment_construction_rnb",
    "batiment_construction",
  ]) {
    const params = new URLSearchParams({
      rnb_id: `eq.${rnbId}`,
      select: "rnb_id,batiment_construction_id,batiment_groupe_id",
      limit: "20",
    });
    relations = rowsOf(
      await jsonOr<any>(`${base}/donnees/${table}?${params}`, [], signal),
    );
    if (relations.length) break;
  }
  const groupId = relations.find(
    (row) => row?.batiment_groupe_id,
  )?.batiment_groupe_id;
  if (!groupId) return null;
  const tables: Record<string, string> = {
    building: "batiment_groupe",
    address: "batiment_groupe_adresse",
    usage: "batiment_groupe_synthese_propriete_usage",
    rpls: "batiment_groupe_rpls",
    dpe: "batiment_groupe_dpe_representatif_logement",
    rnc: "batiment_groupe_rnc",
    risks: "batiment_groupe_risques",
    bdtopo: "batiment_groupe_bdtopo_bat",
    renovation: "batiment_groupe_contrainte_opportunite_renovation",
    ffo: "batiment_groupe_ffo_bat",
  };
  const entries = await Promise.all(
    Object.entries(tables).map(async ([key, table]) => {
      const params = new URLSearchParams({
        batiment_groupe_id: `eq.${groupId}`,
        limit: "1",
      });
      const value = await jsonOr<any>(
        `${base}/donnees/${table}?${params}`,
        [],
        signal,
      );
      return [key, rowsOf(value)[0] || null] as const;
    }),
  );
  return {
    rnbId,
    groupId,
    vintage: "2026-02.a",
    ...Object.fromEntries(entries),
  };
}

export default function DecisionTerritorialePage() {
  const mapNode = useRef<HTMLDivElement>(null),
    mapRef = useRef<any>(null),
    markerRef = useRef<any>(null),
    roadLayers = useRef<any[]>([]),
    mapLayersRef = useRef<Record<string, any>>({}),
    layerRequestRef = useRef<Record<string, number>>({}),
    communesRef = useRef<Feature[]>([]),
    servicesRef = useRef<Service[]>([]),
    busNetworkRef = useRef<any>({ stops: [], routes: [] }),
    studyProfilesRef = useRef<Record<string, any>>({}),
    activeLayersRef = useRef<Record<string, boolean>>({}),
    serviceCategoriesRef = useRef<Record<string, boolean>>({}),
    sourceDialog = useRef<HTMLDialogElement>(null),
    requestRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceDate, setSourceDate] = useState("non chargée");
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>(
    () => Object.fromEntries(MAP_LAYERS.map((layer) => [layer[0], false])),
  );
  const [loadingLayers, setLoadingLayers] = useState<Record<string, boolean>>(
    {},
  );
  const [activeServiceCategories, setActiveServiceCategories] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      SERVICE_CATEGORIES.map((category) => [category[0], true]),
    ),
  );
  useEffect(() => {
    activeLayersRef.current = activeLayers;
  }, [activeLayers]);
  useEffect(() => {
    serviceCategoriesRef.current = activeServiceCategories;
  }, [activeServiceCategories]);
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

  useEffect(() => {
    jsonOr<any>(`${basePath}/data/decision/services-95.json`, null)
      .then(
        async (data) =>
          data ||
          jsonOr<any>(
            "https://ddt95.github.io/acces-services95/data/services-95.json",
            null,
          ),
      )
      .then((data) => {
        if (data?.records) {
          servicesRef.current = data.records.filter(isPublicService);
          setSourceDate(new Date(data.generatedAt).toLocaleDateString("fr-FR"));
          if (activeLayersRef.current.services)
            drawServiceLayer(serviceCategoriesRef.current);
        }
      });
  }, [basePath]);
  useEffect(() => {
    jsonOr<any>(`${basePath}/data/decision/bus-network-95.json`, {
      stops: [],
      routes: [],
    }).then((data) => {
      busNetworkRef.current = data;
      if (activeLayersRef.current.busStops) applyMapLayer("busStops", true);
      if (activeLayersRef.current.busLines) applyMapLayer("busLines", true);
    });
  }, [basePath]);
  useEffect(() => {
    jsonOr<any>(`${basePath}/data/decision/housing-study-95.json`, {
      profiles: {},
    }).then((data) => {
      studyProfilesRef.current = data.profiles || {};
    });
  }, [basePath]);
  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    let cancelled = false;
    if (!document.getElementById("decision-leaflet-css")) {
      const css = document.createElement("link");
      css.id = "decision-leaflet-css";
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
    }
    const startMap = () => {
      if (cancelled || mapRef.current || !mapNode.current) return;
      const L = (window as any).L;
      if (!L) return;
      const initialBounds = L.latLngBounds([
        [48.89, 1.6],
        [49.25, 2.6],
      ]);
      const map = L.map(mapNode.current, {
        zoomControl: false,
        minZoom: 9,
        maxBoundsViscosity: 0.65,
      }).fitBounds(initialBounds, { padding: [8, 8], animate: false });
      mapRef.current = map;
      map.setMaxBounds(initialBounds.pad(0.28));
      L.control.zoom({ position: "bottomleft" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: "decision-neutral-tiles",
        attribution: "© OpenStreetMap",
      }).addTo(map);
      map.on("click", (e: any) => analyse(e.latlng.lng, e.latlng.lat));
      map.on("moveend", () => {
        if (activeLayersRef.current.services)
          drawServiceLayer(serviceCategoriesRef.current);
        if (activeLayersRef.current.mos) applyMapLayer("mos", true);
        if (activeLayersRef.current.plu) applyMapLayer("plu", true);
        if (activeLayersRef.current.buildings) applyMapLayer("buildings", true);
        if (activeLayersRef.current.servitudes)
          applyMapLayer("servitudes", true);
        if (activeLayersRef.current.busStops) applyMapLayer("busStops", true);
        if (activeLayersRef.current.busLines) applyMapLayer("busLines", true);
        for (const id of [
          "stations",
          "doctors",
          "pharmacies",
          "hospitals",
          "franceServices",
        ])
          if (activeLayersRef.current[id]) drawSpecialServiceLayer(id);
      });
      jsonOr<any>(
        "https://geo.api.gouv.fr/departements/95/communes?fields=nom,code,contour&format=geojson&geometry=contour",
        { features: [] },
      ).then((communes) => {
        if (!communes.features?.length) return;
        communesRef.current = communes.features;
        const outerRings = communes.features.flatMap((feature: Feature) => {
          const g = feature.geometry;
          if (g?.type === "Polygon") return [g.coordinates[0]];
          if (g?.type === "MultiPolygon")
            return g.coordinates.map((polygon: number[][][]) => polygon[0]);
          return [];
        });
        const holes = outerRings.map((ring: number[][]) =>
          ring.map(([x, y]) => [y, x]),
        );
        L.polygon(
          [
            [
              [-85, -180],
              [-85, 180],
              [85, 180],
              [85, -180],
            ],
            ...holes,
          ],
          {
            stroke: false,
            fillColor: "#eef1f7",
            fillOpacity: 0.78,
            fillRule: "evenodd",
            interactive: false,
          },
        )
          .addTo(map)
          .bringToBack();
        jsonOr<any>(
          "https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ADMINEXPRESS-COG-CARTO-PE.LATEST%3Adepartement&outputFormat=application%2Fjson&CQL_FILTER=code_insee%3D%2795%27&srsName=EPSG%3A4326",
          { features: [] },
        ).then((boundary) =>
          L.geoJSON(boundary, {
            style: { color: "#000091", weight: 2.5, fill: false },
            interactive: false,
          }).addTo(map),
        );
      });
    };
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-decision-leaflet="true"]',
    );
    if ((window as any).L) startMap();
    else if (existing)
      existing.addEventListener("load", startMap, { once: true });
    else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.dataset.decisionLeaflet = "true";
      script.onload = startMap;
      document.body.appendChild(script);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  async function analyse(lon: number, lat: number) {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    const errors: string[] = [];
    const geom = pointGeom(lon, lat);
    const spatialCommune = communesRef.current.find((feature) =>
      geometryContains(feature.geometry, lon, lat),
    );
    const spatialName = String(
      spatialCommune?.properties?.nom || "Commune en cours",
    );
    const spatialCode = String(spatialCommune?.properties?.code || "—");
    setAnalysis({
      lon,
      lat,
      address: "Point sélectionné",
      commune: spatialName,
      codeInsee: spatialCode,
      zones: [],
      servitudes: [],
      risks: [],
      services: [],
      isochrones: {},
      roadAccess: {},
      buildings: [],
      biodiversity: [],
      noiseRoad: [],
      noiseRail: [],
      errors: [],
    });
    drawSelection(lon, lat);
    const [ban, parcel, zones, supS, supL, supP, risks, iso15] =
      await Promise.all([
        jsonOr<any>(
          `https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}&limit=1`,
          {},
          controller.signal,
        ),
        jsonOr<any>(
          `https://apicarto.ign.fr/api/cadastre/parcelle?geom=${geom}`,
          { features: [] },
          controller.signal,
        ),
        jsonOr<any>(
          `https://apicarto.ign.fr/api/gpu/zone-urba?geom=${geom}`,
          { features: [] },
          controller.signal,
        ),
        jsonOr<any>(
          `https://apicarto.ign.fr/api/gpu/assiette-sup-s?geom=${geom}`,
          { features: [] },
          controller.signal,
        ),
        jsonOr<any>(
          `https://apicarto.ign.fr/api/gpu/assiette-sup-l?geom=${geom}`,
          { features: [] },
          controller.signal,
        ),
        jsonOr<any>(
          `https://apicarto.ign.fr/api/gpu/assiette-sup-p?geom=${geom}`,
          { features: [] },
          controller.signal,
        ),
        jsonOr<any>(
          `https://georisques.gouv.fr/api/v1/gaspar/risques?latlon=${lon},${lat}`,
          { data: [] },
          controller.signal,
        ),
        valhalla(lon, lat, 15, controller.signal),
      ]);
    if (controller.signal.aborted) return;
    const address = ban.features?.[0]?.properties || {};
    if (!parcel.features?.length)
      errors.push("Parcelle non retournée au point");
    if (!zones.features?.length) errors.push("Zonage GPU non retourné");
    const [pprn, tri, azi, radon, cavities, icpe] = await Promise.all([
      jsonOr<any>(
        `https://www.georisques.gouv.fr/api/v1/gaspar/pprn?codeInsee=${spatialCode}`,
        { content: [] },
        controller.signal,
      ),
      jsonOr<any>(
        `https://www.georisques.gouv.fr/api/v1/gaspar/tri?code_insee=${spatialCode}&page_size=100`,
        { data: [] },
        controller.signal,
      ),
      jsonOr<any>(
        `https://www.georisques.gouv.fr/api/v1/gaspar/azi?code_insee=${spatialCode}&page_size=100`,
        { data: [] },
        controller.signal,
      ),
      jsonOr<any>(
        `https://www.georisques.gouv.fr/api/v1/radon?code_insee=${spatialCode}&page_size=100`,
        { data: [] },
        controller.signal,
      ),
      jsonOr<any>(
        `https://www.georisques.gouv.fr/api/v1/cavites?code_insee=${spatialCode}&page_size=100`,
        { data: [] },
        controller.signal,
      ),
      jsonOr<any>(
        `https://www.georisques.gouv.fr/api/v1/installations_classees?code_insee=${spatialCode}&page_size=100`,
        { data: [] },
        controller.signal,
      ),
    ]);
    const polygons = { "15": iso15 };
    const selectedServices = servicesRef.current.filter((s) =>
      collectionContains(iso15, s),
    );
    const selectedParcel = parcel.features?.[0];
    const parcelId = String(selectedParcel?.properties?.idu || "");
    const buildingDelta = 0.00018;
    const rnbCollection = await jsonOr<any>(
      `https://rnb-api.beta.gouv.fr/api/alpha/ogc/collections/buildings/items?bbox=${encodeURIComponent(`${lon - buildingDelta},${lat - buildingDelta},${lon + buildingDelta},${lat + buildingDelta}`)}&limit=30`,
      { features: [] },
      controller.signal,
    );
    const selectedBuilding =
      (rnbCollection.features || []).find((feature: Feature) =>
        geometryContains(feature.geometry, lon, lat),
      ) || null;
    const selectedRnbId = rnbIdOf(selectedBuilding);
    const [bdnbData, dvfData, qpvData] = await Promise.all([
      selectedRnbId
        ? fetchBdnbByRnb(String(selectedRnbId), controller.signal)
        : null,
      selectedBuilding
        ? jsonOr<any>(
            `https://apidf.k8-dev.cerema.fr/dvf_opendata/geomutations?contains_lon_lat=${lon},${lat}&page_size=30`,
            { results: [] },
            controller.signal,
          )
        : { results: [] },
      jsonOr<any>(
        "https://ddt95.github.io/observatoire_bati/qpv_95.geojson",
        { features: [] },
        controller.signal,
      ),
    ]);
    const qpv = (qpvData.features || []).find((feature: Feature) =>
      geometryContains(feature.geometry, lon, lat),
    );
    const buildingData = selectedBuilding
      ? {
          ...(bdnbData || {}),
          dvf: rowsOf(dvfData),
          qpv: qpv?.properties || null,
        }
      : null;
    const [
      buildings,
      mos,
      znieff1,
      znieff2,
      natura,
      protectedAreas,
      heatProfiles,
      nuisanceProfiles,
      housingProfiles,
      marketProfiles,
      solProfiles,
      waterPrices,
      roadNoiseLines,
      railSncf,
      railRatp,
      railSgp,
      peb,
      potable,
    ] = await Promise.all([
      parcelId
        ? jsonOr<any>(
            `https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/parcelle?parcelle_id=eq.${encodeURIComponent(parcelId)}`,
            [],
            controller.signal,
          )
        : [],
      jsonOr<any>(
        `https://geoweb.iau-idf.fr/agsmap1/rest/services/OPENDATA/OpendataIAU4/MapServer/25/query?f=json&geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=mos2025,mos2021&returnGeometry=false`,
        { features: [] },
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/biodiversite95/data/znieff1.json",
        { features: [] },
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/biodiversite95/data/znieff2.json",
        { features: [] },
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/biodiversite95/data/natura-habitat.json",
        { features: [] },
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/biodiversite95/data/espaces-naturels-proteges.json",
        { features: [] },
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/chaleur-refuges-95/data/commune_profiles.json",
        {},
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/val-doise-nuisances/data/commune_stats.json",
        {},
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/val-doise-logement-habitat/data/processed/commune_profiles.json",
        {},
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/val-doise-logement-habitat/data/processed/market_profiles.json",
        {},
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/val-doise-sol-formes-urbaines/data/processed/sol_commune_profiles.json",
        {},
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/eau95/data/processed/prix_eau.geojson",
        { features: [] },
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/val-doise-nuisances/data/cs-lines.geojson",
        { features: [] },
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/val-doise-nuisances/data/cs-rail-sncf-lines.geojson",
        { features: [] },
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/val-doise-nuisances/data/cs-rail-ratp-lines.geojson",
        { features: [] },
        controller.signal,
      ),
      jsonOr<any>(
        "https://ddt95.github.io/val-doise-nuisances/data/cs-rail-sgp-lines.geojson",
        { features: [] },
        controller.signal,
      ),
      queryPeb(lon, lat, controller.signal),
      jsonOr<any>(
        `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_commune=${spatialCode}&code_parametre=1340&date_min_prelevement=2025-09-04&size=500&fields=code_commune,code_prelevement,date_prelevement,conformite_limites_bact_prelevement,conformite_limites_pc_prelevement,conformite_references_bact_prelevement,conformite_references_pc_prelevement`,
        { data: [] },
        controller.signal,
      ),
    ]);
    const riskDetails = (Array.isArray(risks.data) ? risks.data : [])
      .filter((entry: any) => !spatialCode || entry.code_insee === spatialCode)
      .flatMap((entry: any) => entry.risques_detail || []);
    const biodiversity = [
      ...intersectLabels(znieff1, lon, lat, "ZNIEFF 1"),
      ...intersectLabels(znieff2, lon, lat, "ZNIEFF 2"),
      ...intersectLabels(natura, lon, lat, "Natura 2000"),
      ...intersectLabels(protectedAreas, lon, lat, "Espace protégé"),
    ];
    const waterPrice = (waterPrices.features || []).find(
      (f: Feature) => String(f.properties?.INSEE_COM) === spatialCode,
    )?.properties;
    const potableRows = potable.data || [];
    const potableOk = !potableRows.some(
      (r: any) =>
        r.conformite_limites_bact_prelevement === "N" ||
        r.conformite_limites_pc_prelevement === "N",
    );
    const complete = {
      lon,
      lat,
      address: address.label || "Point cartographique",
      commune: address.city || spatialName,
      codeInsee: address.citycode || spatialCode,
      parcel: selectedParcel,
      zones: zones.features || [],
      servitudes: [
        ...(supS.features || []),
        ...(supL.features || []),
        ...(supP.features || []),
      ],
      risks: riskDetails,
      services: selectedServices,
      isochrones: polygons,
      roadAccess: {},
      buildings: Array.isArray(buildings) ? buildings : [],
      selectedBuilding,
      buildingData,
      mos: mos.features?.[0]?.attributes || mos.features?.[0]?.properties,
      biodiversity,
      heat: heatProfiles[spatialCode],
      nuisance: nuisanceProfiles[spatialCode],
      housing: housingProfiles[spatialCode],
      market: marketProfiles[spatialCode],
      sol: solProfiles[spatialCode],
      water: {
        price: waterPrice?.TARIF_AEP,
        potable: potableRows.length ? potableOk : null,
        controls: potableRows.length,
      },
      peb,
      noiseRoad: regulatoryMatches(roadNoiseLines, lon, lat),
      noiseRail: regulatoryMatches(
        {
          features: [
            ...(railSncf.features || []),
            ...(railRatp.features || []),
            ...(railSgp.features || []),
          ],
        },
        lon,
        lat,
      ),
      riskObservatory: {
        pprn: pprn.content || [],
        tri: tri.data || [],
        azi: azi.data || [],
        radon: radon.data || [],
        cavities: cavities.data || [],
        icpe: icpe.data || [],
      },
      study: studyProfilesRef.current[spatialCode],
      errors,
    };
    setAnalysis(complete);
    setLoading(false);
    loadReachableRoads(lon, lat, polygons, controller.signal).then(
      (roadAccess) => {
        if (!controller.signal.aborted)
          setAnalysis((current) =>
            current && current.lon === lon && current.lat === lat
              ? { ...current, roadAccess }
              : current,
          );
      },
    );
  }

  async function loadReachableRoads(
    lon: number,
    lat: number,
    polygons: Record<string, any>,
    signal: AbortSignal,
  ) {
    const bbox = [
      lon - 0.1,
      lat - 0.065,
      lon + 0.1,
      lat + 0.065,
      "EPSG:4326",
    ].join(",");
    const url = `https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=BDTOPO_V3%3Atroncon_de_route&outputFormat=application%2Fjson&srsName=EPSG%3A4326&BBOX=${bbox}&COUNT=5000&PROPERTYNAME=geometrie,cpx_numero`;
    const data = await jsonOr<any>(url, { features: [] }, signal);
    const L = (window as any).L,
      map = mapRef.current;
    roadLayers.current.forEach((layer) => map?.removeLayer(layer));
    roadLayers.current = [];
    const candidates: Record<
      string,
      { lat: number; lon: number; ref: string; d: number } | undefined
    > = { A: undefined, N: undefined, D: undefined };
    const reachable: number[][][] = [];
    for (const feature of data.features || []) {
      const coords =
        feature.geometry?.type === "LineString"
          ? feature.geometry.coordinates
          : [];
      if (coords.length < 2) continue;
      const rawRef = feature.properties?.cpx_numero;
      const refs = Array.isArray(rawRef) ? rawRef : [rawRef];
      const ref = String(
        refs.find((value: any) =>
          /^(A|N|D) ?[0-9]/i.test(String(value || "")),
        ) || "",
      );
      const type = /^A\s?\d/i.test(ref)
        ? "A"
        : /^N\s?\d/i.test(ref)
          ? "N"
          : /^D\s?\d/i.test(ref)
            ? "D"
            : "";
      if (type)
        for (const [x, y] of coords) {
          const d = (x - lon) ** 2 + (y - lat) ** 2;
          if (!candidates[type] || d < candidates[type]!.d)
            candidates[type] = { lon: x, lat: y, ref, d };
        }
      for (let i = 1; i < coords.length; i++) {
        const a = coords[i - 1],
          b = coords[i],
          mid = { lon: (a[0] + b[0]) / 2, lat: (a[1] + b[1]) / 2 } as Service;
        if (collectionContains(polygons["15"], mid))
          reachable.push([
            [a[1], a[0]],
            [b[1], b[0]],
          ]);
      }
    }
    if (activeLayersRef.current.isochrones && L && map && reachable.length) {
      const layer = L.polyline(reachable, {
        color: "#00a7b5",
        weight: 2.2,
        opacity: 0.72,
        interactive: false,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      roadLayers.current.push(layer);
    }
    const routeShapes: { type: string; ref: string; points: number[][] }[] = [];
    const entries = await Promise.all(
      Object.entries(candidates).map(async ([type, target]) => {
        if (!target) return [type, "Non présent dans un rayon de 7 km"];
        try {
          const body = {
            locations: [
              { lat, lon },
              { lat: target.lat, lon: target.lon },
            ],
            costing: "auto",
            units: "kilometers",
          };
          const r = await fetch("https://valhalla1.openstreetmap.de/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
          });
          const route = r.ok ? await r.json() : null;
          const minutes =
              route?.trip?.summary?.time != null
                ? Math.round(route.trip.summary.time / 60)
                : null,
            shape = route?.trip?.legs?.[0]?.shape;
          if (shape)
            routeShapes.push({
              type,
              ref: target.ref,
              points: decodePolyline(shape),
            });
          return [
            type,
            minutes != null
              ? `${minutes} min · ${target.ref}`
              : `${target.ref} · temps indisponible`,
          ];
        } catch {
          return [type, `${target.ref} · temps indisponible`];
        }
      }),
    );
    const oldRoutes = mapLayersRef.current.routes;
    if (oldRoutes && map?.hasLayer(oldRoutes)) map.removeLayer(oldRoutes);
    if (activeLayersRef.current.routes && L && map) {
      const colors: Record<string, string> = {
          A: "#000091",
          N: "#6f4c9b",
          D: "#087e8b",
        },
        layers = routeShapes.map((route) =>
          L.polyline(route.points, {
            color: colors[route.type],
            weight: 4,
            opacity: 0.82,
            interactive: true,
            lineCap: "round",
            lineJoin: "round",
          }).bindTooltip(
            `<strong>${route.ref}</strong><br>Itinéraire depuis le point`,
          ),
        );
      mapLayersRef.current.routes = L.layerGroup(layers).addTo(map);
    }
    return Object.fromEntries(entries);
  }

  async function valhalla(
    lon: number,
    lat: number,
    minutes: number,
    signal: AbortSignal,
  ) {
    const body = {
      locations: [{ lat, lon }],
      costing: "pedestrian",
      contours: [{ time: minutes, color: "00a7b5" }],
      polygons: true,
      generalize: 25,
    };
    try {
      const requestSignal = AbortSignal.any([
        signal,
        AbortSignal.timeout(8000),
      ]);
      const r = await fetch("https://valhalla1.openstreetmap.de/isochrone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: requestSignal,
      });
      return r.ok ? r.json() : null;
    } catch {
      return null;
    }
  }
  function drawSelection(lon: number, lat: number) {
    const L = (window as any).L,
      map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) map.removeLayer(markerRef.current);
    markerRef.current = L.circleMarker([lat, lon], {
      radius: 6,
      color: "#fff",
      weight: 2.5,
      fillColor: "#e1000f",
      fillOpacity: 1,
      interactive: false,
    }).addTo(map);
  }
  function drawServiceLayer(categories = serviceCategoriesRef.current) {
    const L = (window as any).L,
      map = mapRef.current;
    if (!L || !map) return;
    const old = mapLayersRef.current.services;
    if (old && map.hasLayer(old)) map.removeLayer(old);
    if (!activeLayersRef.current.services) return;
    const style = Object.fromEntries(
      SERVICE_CATEGORIES.map((c) => [c[0], { glyph: c[2], color: c[3] }]),
    );
    const bounds = map.getBounds().pad(0.08),
      visible = servicesRef.current.filter(
        (service) =>
          categories[serviceBucket(service)] &&
          bounds.contains([service.lat, service.lon]),
      );
    const renderer = L.canvas({ padding: 0.25 }),
      detailed = map.getZoom() >= 12;
    const markers = visible.map((service) => {
      const item = style[serviceBucket(service)] || {
        glyph: "•",
        color: "#68798a",
      };
      return detailed
        ? L.marker([service.lat, service.lon], {
            icon: L.divIcon({
              className: "decision-service-marker",
              html: `<span style="--marker-color:${item.color}">${item.glyph}</span>`,
              iconSize: [25, 25],
              iconAnchor: [12, 12],
            }),
          }).bindTooltip(
            `<strong>${service.name}</strong><br>${service.typeLabel}`,
          )
        : L.circleMarker([service.lat, service.lon], {
            renderer,
            radius: 3,
            color: "#fff",
            weight: 1,
            fillColor: item.color,
            fillOpacity: 0.85,
          }).bindTooltip(
            `<strong>${service.name}</strong><br>${service.typeLabel}`,
          );
    });
    mapLayersRef.current.services = L.layerGroup(markers).addTo(map);
  }
  function drawSpecialServiceLayer(id: string) {
    const L = (window as any).L,
      map = mapRef.current;
    if (!L || !map) return;
    const old = mapLayersRef.current[id];
    if (old && map.hasLayer(old)) map.removeLayer(old);
    if (!activeLayersRef.current[id]) return;
    const configs: Record<
        string,
        { types: string[]; glyph: string; color: string }
      > = {
        stations: { types: ["station"], glyph: "G", color: "#a558a0" },
        doctors: {
          types: ["doctors", "doctor", "cabinet_médical"],
          glyph: "M",
          color: "#18753c",
        },
        pharmacies: { types: ["pharmacy"], glyph: "⚕", color: "#00a95c" },
        hospitals: {
          types: ["hospital", "clinic", "health_centre"],
          glyph: "H",
          color: "#e1000f",
        },
        franceServices: { types: [], glyph: "FS", color: "#000091" },
      },
      config = configs[id];
    if (!config) return;
    const bounds = map.getBounds().pad(0.08),
      renderer = L.canvas({ padding: 0.25 }),
      detailed = map.getZoom() >= 11,
      symbol =
        id === "franceServices"
          ? `<img src="https://media.anct.gouv.fr/s3fs-public/2020-12/logo_France-services_CMJN.jpg" alt="">`
          : config.glyph,
      visible = servicesRef.current.filter(
        (service) =>
          (id === "franceServices"
            ? service.category === "france_services"
            : config.types.includes(String(service.type))) &&
          bounds.contains([service.lat, service.lon]),
      );
    const markers = visible.map((service) =>
      detailed
        ? L.marker([service.lat, service.lon], {
            icon: L.divIcon({
              className: "decision-service-marker",
              html: `<span style="--marker-color:${config.color}">${symbol}</span>`,
              iconSize: [25, 25],
              iconAnchor: [12, 12],
            }),
          }).bindTooltip(
            `<strong>${service.name}</strong><br>${service.typeLabel}`,
          )
        : L.circleMarker([service.lat, service.lon], {
            renderer,
            radius: 3.5,
            color: "#fff",
            weight: 1,
            fillColor: config.color,
            fillOpacity: 0.9,
          }).bindTooltip(
            `<strong>${service.name}</strong><br>${service.typeLabel}`,
          ),
    );
    mapLayersRef.current[id] = L.layerGroup(markers).addTo(map);
  }
  async function applyMapLayer(id: string, enabled: boolean) {
    const L = (window as any).L,
      map = mapRef.current;
    if (!L || !map) return;
    const requestId = (layerRequestRef.current[id] || 0) + 1;
    layerRequestRef.current[id] = requestId;
    const old = mapLayersRef.current[id];
    if (old && map.hasLayer(old)) map.removeLayer(old);
    if (!enabled) {
      setLoadingLayers((current) => ({ ...current, [id]: false }));
      return;
    }
    if (id === "cadastre") {
      const layer = L.tileLayer(
        "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=PCI%20vecteur&TILEMATRIXSET=PM&TILEROW={y}&TILECOL={x}&TILEMATRIX={z}&FORMAT=image/png",
        {
          minZoom: 13,
          maxZoom: 19,
          opacity: 0.82,
          attribution: "© IGN · DGFiP",
        },
      ).addTo(map);
      mapLayersRef.current[id] = layer;
      return;
    }
    if (id === "buildings") {
      if (map.getZoom() < 16) {
        setLoadingLayers((current) => ({ ...current, [id]: false }));
        return;
      }
      setLoadingLayers((current) => ({ ...current, [id]: true }));
      const b = map.getBounds();
      const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(
        ",",
      );
      const collection = await jsonOr<any>(
        `https://rnb-api.beta.gouv.fr/api/alpha/ogc/collections/buildings/items?bbox=${encodeURIComponent(bbox)}&limit=500`,
        { features: [] },
      );
      if (
        !activeLayersRef.current[id] ||
        layerRequestRef.current[id] !== requestId
      ) {
        setLoadingLayers((current) => ({ ...current, [id]: false }));
        return;
      }
      const layer = L.geoJSON(collection, {
        style: {
          color: "#8d3d1e",
          weight: 1.2,
          fillColor: "#e77735",
          fillOpacity: 0.34,
        },
        onEachFeature: (feature: Feature, featureLayer: any) => {
          const rnbId = rnbIdOf(feature);
          featureLayer.bindTooltip(
            rnbId ? `ID-RNB · ${rnbId}` : "Bâtiment RNB",
            { sticky: true },
          );
          featureLayer.on("click", (event: any) => {
            L.DomEvent.stopPropagation(event);
            analyse(event.latlng.lng, event.latlng.lat);
          });
        },
      }).addTo(map);
      mapLayersRef.current[id] = layer;
      setLoadingLayers((current) => ({ ...current, [id]: false }));
      return;
    }
    if (id === "mos") {
      const b = map.getBounds(),
        size = map.getSize(),
        params = new URLSearchParams({
          bbox: `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`,
          bboxSR: "4326",
          imageSR: "4326",
          layers: "show:0",
          size: `${Math.max(256, Math.round(size.x))},${Math.max(256, Math.round(size.y))}`,
          format: "png32",
          transparent: "true",
          f: "image",
        });
      const layer = L.imageOverlay(
        `https://geoweb.iau-idf.fr/agsmap1/rest/services/MOS_MOS/mos2025_79/MapServer/export?${params}`,
        b,
        {
          opacity: 0.72,
          interactive: false,
          attribution: "© Institut Paris Region · MOS 2025",
        },
      ).addTo(map);
      mapLayersRef.current[id] = layer;
      return;
    }
    if (id === "peb") {
      const layer = L.tileLayer
        .wms("https://data.geopf.fr/wms-v/ows", {
          layers: "dgac_peb_plan_wmsv",
          styles: "default-style-dgac_peb_plan_wmsv",
          format: "image/png",
          transparent: true,
          opacity: 0.68,
          attribution: "© DGAC · Géoplateforme",
        })
        .addTo(map);
      mapLayersRef.current[id] = layer;
      return;
    }
    if (id === "busStops") {
      const bounds = map.getBounds().pad(0.05),
        renderer = L.canvas({ padding: 0.2 }),
        markers = (busNetworkRef.current.stops || [])
          .filter((stop: any) => bounds.contains([stop.lat, stop.lon]))
          .map((stop: any) =>
            L.circleMarker([stop.lat, stop.lon], {
              renderer,
              radius: 4,
              color: "#fff",
              weight: 1.2,
              fillColor: "#0078f3",
              fillOpacity: 0.92,
            }).bindTooltip(
              `<strong>${stop.name}</strong><br>${stop.routes.length} ligne${stop.routes.length > 1 ? "s" : ""}`,
            ),
          );
      mapLayersRef.current[id] = L.layerGroup(markers).addTo(map);
      return;
    }
    if (id === "busLines") {
      const bounds = map.getBounds().pad(0.1),
        renderer = L.canvas({ padding: 0.3 }),
        lines = (busNetworkRef.current.routes || [])
          .filter((route: any) =>
            route.geometry.some((p: number[]) => bounds.contains(p)),
          )
          .map((route: any) =>
            L.polyline(route.geometry, {
              renderer,
              color: `#${route.color}`,
              weight: 2.4,
              opacity: 0.75,
              interactive: true,
            }).bindTooltip(
              `<strong>Ligne ${route.short || ""}</strong><br>${route.long || ""}`,
            ),
          );
      mapLayersRef.current[id] = L.layerGroup(lines).addTo(map);
      return;
    }
    if (id === "services") {
      drawServiceLayer();
      return;
    }
    if (
      [
        "stations",
        "doctors",
        "pharmacies",
        "hospitals",
        "franceServices",
      ].includes(id)
    ) {
      drawSpecialServiceLayer(id);
      return;
    }
    if (id === "plu" || id === "servitudes") {
      setLoadingLayers((current) => ({ ...current, [id]: true }));
      const b = map.getBounds(),
        geom = encodeURIComponent(
          JSON.stringify({
            type: "Polygon",
            coordinates: [
              [
                [b.getWest(), b.getSouth()],
                [b.getEast(), b.getSouth()],
                [b.getEast(), b.getNorth()],
                [b.getWest(), b.getNorth()],
                [b.getWest(), b.getSouth()],
              ],
            ],
          }),
        );
      const urls =
        id === "plu"
          ? [`https://apicarto.ign.fr/api/gpu/zone-urba?geom=${geom}`]
          : [
              `https://apicarto.ign.fr/api/gpu/assiette-sup-s?geom=${geom}`,
              `https://apicarto.ign.fr/api/gpu/assiette-sup-l?geom=${geom}`,
              `https://apicarto.ign.fr/api/gpu/assiette-sup-p?geom=${geom}`,
            ];
      const pages = await Promise.all(
        urls.map((url) => jsonOr<any>(url, { features: [] })),
      );
      if (
        !activeLayersRef.current[id] ||
        layerRequestRef.current[id] !== requestId
      ) {
        setLoadingLayers((current) => ({ ...current, [id]: false }));
        return;
      }
      const features = pages.flatMap((page) => page.features || []);
      const polygons = L.geoJSON(
        { type: "FeatureCollection", features },
        {
          style:
            id === "plu"
              ? {
                  color: "#3153a4",
                  weight: 1.4,
                  fillColor: "#4fd1ff",
                  fillOpacity: 0.16,
                }
              : {
                  color: "#6f4c9b",
                  weight: 1.8,
                  fillColor: "#a558a0",
                  fillOpacity: 0.09,
                  dashArray: "6 4",
                },
          interactive: false,
        },
      );
      const labels =
        id === "plu" && map.getZoom() >= 12
          ? features
              .map((feature: Feature) => {
                const shape = L.geoJSON(feature),
                  label = String(
                    first(
                      feature.properties,
                      ["libelle", "lib_idzone", "typezone"],
                      "",
                    ),
                  ),
                  full = String(
                    first(
                      feature.properties,
                      ["libelong", "libelle", "typezone"],
                      label,
                    ),
                  );
                if (!label || !shape.getBounds().isValid()) return null;
                return L.marker(shape.getBounds().getCenter(), {
                  interactive: false,
                  keyboard: false,
                  icon: L.divIcon({
                    className: "decision-plu-label",
                    html: `<span title="${full.replace(/\"/g, "&quot;")}">${label}</span>`,
                  }),
                });
              })
              .filter(Boolean)
          : [];
      const layer = L.layerGroup([polygons, ...labels]).addTo(map);
      mapLayersRef.current[id] = layer;
      setLoadingLayers((current) => ({ ...current, [id]: false }));
    }
  }
  function toggleLayer(id: string) {
    const layers = { ...activeLayers, [id]: !activeLayers[id] };
    activeLayersRef.current = layers;
    setActiveLayers(layers);
    applyMapLayer(id, layers[id]);
    if (id === "isochrones" && !layers.isochrones) {
      roadLayers.current.forEach((layer) => mapRef.current?.removeLayer(layer));
      roadLayers.current = [];
    }
    if (analysis && (id === "isochrones" || id === "routes") && layers[id])
      loadReachableRoads(
        analysis.lon,
        analysis.lat,
        analysis.isochrones,
        new AbortController().signal,
      );
  }
  function clearAllLayers() {
    const map = mapRef.current;
    for (const [id] of MAP_LAYERS)
      layerRequestRef.current[id] = (layerRequestRef.current[id] || 0) + 1;
    Object.values(mapLayersRef.current).forEach((layer) => {
      if (layer && map?.hasLayer(layer)) map.removeLayer(layer);
    });
    mapLayersRef.current = {};
    roadLayers.current.forEach((layer) => {
      if (layer && map?.hasLayer(layer)) map.removeLayer(layer);
    });
    roadLayers.current = [];
    const cleared = Object.fromEntries(
      MAP_LAYERS.map((layer) => [layer[0], false]),
    );
    activeLayersRef.current = cleared;
    setActiveLayers(cleared);
    setLoadingLayers({});
  }
  function toggleServiceCategory(id: string) {
    const categories = {
      ...activeServiceCategories,
      [id]: !activeServiceCategories[id],
    };
    setActiveServiceCategories(categories);
    drawServiceLayer(categories);
  }
  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const data = await jsonOr<any>(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query + " Val-d'Oise")}&limit=1`,
      {},
    );
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (coords) {
      mapRef.current?.setView([coords[1], coords[0]], 14, { animate: false });
      analyse(coords[0], coords[1]);
    } else setLoading(false);
  }
  async function openDecisionPdf() {
    if (!analysis) return;
    const viewer = window.open("", "_blank");
    if (viewer) {
      viewer.document.title = "Préparation de la fiche territoriale";
      viewer.document.body.innerHTML =
        '<main style="font-family:Arial,sans-serif;display:grid;place-items:center;min-height:90vh;color:#000091"><div style="text-align:center"><h1>Préparation de la fiche territoriale</h1><p style="color:#647381">Génération du document PDF complet…</p></div></main>';
    }
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      }),
      navy: [number, number, number] = [0, 0, 145],
      deep: [number, number, number] = [7, 0, 71],
      muted: [number, number, number] = [91, 103, 123];
    const logo = await fetch(`${basePath}/prefet-val-doise-logo.png`)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }),
      )
      .catch(() => "");
    let page = 0,
      y = 0;
    const footer = () => {
      pdf.setDrawColor(215, 222, 232);
      pdf.line(14, 284, 196, 284);
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.text(
        "DDT du Val-d’Oise · Atlas territorial · document de consultation",
        14,
        290,
      );
      pdf.text(`Page ${page}`, 196, 290, { align: "right" });
    };
    const newPage = () => {
      if (page) {
        footer();
        pdf.addPage();
      }
      page++;
      pdf.setFillColor(246, 248, 253);
      pdf.rect(0, 0, 210, 297, "F");
      pdf.setFillColor(...navy);
      pdf.rect(0, 0, 210, 4, "F");
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 4, 210, 34, "F");
      if (logo) pdf.addImage(logo, "PNG", 14, 8, 25, 18, undefined, "FAST");
      pdf.setTextColor(...deep);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      if (page === 1) {
        pdf.text(pdf.splitTextToSize(analysis.address, 118), 46, 16);
      }
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text(
        `${analysis.commune} · ${analysis.codeInsee} · ${new Date().toLocaleDateString("fr-FR")}`,
        46,
        31,
      );
      pdf.setTextColor(...navy);
      pdf.setFont("helvetica", "bold");
      pdf.text("FICHE TERRITORIALE", 196, 15, { align: "right" });
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `${analysis.lat.toFixed(6)}, ${analysis.lon.toFixed(6)}`,
        196,
        22,
        { align: "right" },
      );
      y = 46;
    };
    const ensure = (height: number) => {
      if (y + height > 280) newPage();
    };
    const section = (
      title: string,
      rows: [string, string][],
      accent: [number, number, number] = navy,
    ) => {
      ensure(16);
      pdf.setFillColor(...accent);
      pdf.roundedRect(14, y, 182, 8, 2, 2, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text(title.toUpperCase(), 19, y + 5.4);
      y += 11;
      for (const [label, raw] of rows) {
        const value = String(raw || "Non renseigné"),
          valueLines = pdf.splitTextToSize(value, 112),
          rowH = Math.max(10, 5 + valueLines.length * 3.5);
        ensure(rowH);
        const tint: [number, number, number] = accent.map((channel) =>
          Math.round(255 - (255 - channel) * 0.09),
        ) as [number, number, number];
        pdf.setFillColor(...tint);
        pdf.roundedRect(14, y, 182, rowH - 1, 1.5, 1.5, "F");
        pdf.setFillColor(...accent);
        pdf.roundedRect(14, y, 2, rowH - 1, 1, 1, "F");
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6.6);
        pdf.text(label.toUpperCase(), 19, y + 5.8);
        pdf.setTextColor(...accent);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.4);
        pdf.text(valueLines, 77, y + 5.8);
        y += rowH;
      }
      y += 4;
    };
    const yesNo = (value: boolean) => (value ? "Oui" : "Non");
    newPage();
    const summaryCard = (
      x: number,
      w: number,
      label: string,
      value: string,
      color: [number, number, number],
    ) => {
      const tint: [number, number, number] = color.map((channel) =>
        Math.round(255 - (255 - channel) * 0.12),
      ) as [number, number, number];
      pdf.setFillColor(...tint);
      pdf.roundedRect(x, y, w, 23, 3, 3, "F");
      pdf.setFillColor(...color);
      pdf.roundedRect(x, y, 3, 23, 1.5, 1.5, "F");
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      pdf.text(label.toUpperCase(), x + 8, y + 7);
      pdf.setTextColor(...color);
      pdf.setFontSize(10);
      pdf.text(pdf.splitTextToSize(value, w - 13), x + 8, y + 15);
    };
    summaryCard(
      14,
      57,
      "Parcelle",
      `${first(p, ["section"], "")} ${first(p, ["numero"])}`,
      [0, 0, 145],
    );
    summaryCard(
      76.5,
      57,
      "Secteur PLU",
      String(first(analysis.zones[0]?.properties, ["libelle", "typezone"])),
      [0, 144, 129],
    );
    summaryCard(139, 57, "Commune", analysis.commune, [165, 88, 160]);
    y += 30;
    section("Parcelle et urbanisme", [
      ["Parcelle", `${first(p, ["section"], "")} ${first(p, ["numero"])}`],
      ["Surface cadastrale", `${first(p, ["contenance"])} m²`],
      [
        "Zone PLU",
        String(
          first(analysis.zones[0]?.properties, [
            "libelong",
            "libelle",
            "typezone",
          ]),
        ),
      ],
      ["Servitudes intersectées", String(analysis.servitudes.length)],
      [
        "MOS 2025",
        analysis.mos?.mos2025
          ? `Poste ${analysis.mos.mos2025}`
          : "Non renseigné",
      ],
      ["Groupes de bâtiments BDNB", String(analysis.buildings.length)],
    ]);
    if (analysis.servitudes.length)
      section(
        "Détail des servitudes",
        analysis.servitudes.map((item, i) => [
          `Servitude ${i + 1}`,
          `${first(item.properties, ["libelle", "nom", "typeass", "categorie"], "Servitude GPU")} · ${first(item.properties, ["idass", "idsup", "nomfic"], "identifiant non renseigné")}`,
        ]),
      );
    if (analysis.selectedBuilding) {
      const bd = analysis.buildingData || {};
      const building = bd.building || {},
        usage = bd.usage || {},
        rpls = bd.rpls || {},
        dpe = bd.dpe || {},
        rnc = bd.rnc || {},
        risks = bd.risks || {},
        bdtopo = bd.bdtopo || {},
        ffo = bd.ffo || {};
      const dpeClass =
        dpe.classe_bilan_dpe || dpe.classe_conso_energie_arrete_2012;
      const gesClass =
        dpe.classe_emission_ges || dpe.classe_emission_ges_arrete_2012;
      section(
        "Bâtiment au point · RNB / BDNB",
        [
          [
            "ID-RNB",
            String(rnbIdOf(analysis.selectedBuilding) || "Non renseigné"),
          ],
          ["Groupe BDNB", bd.groupId || "Non renseigné"],
          [
            "Statut RNB",
            rnbStatus(
              first(
                analysis.selectedBuilding.properties,
                ["status"],
                "Non renseigné",
              ),
            ),
          ],
          [
            "Usage principal",
            String(
              first(
                usage,
                ["usage_principal_bdnb_open", "categorie_usage_propriete"],
                "Non renseigné",
              ),
            ),
          ],
          [
            "Année de construction",
            String(
              first(
                building,
                ["annee_construction"],
                first(ffo, ["annee_construction"], "Non renseigné"),
              ),
            ),
          ],
          [
            "Logements",
            String(
              first(
                ffo,
                ["nb_log"],
                first(building, ["nb_log"], "Non renseigné"),
              ),
            ),
          ],
          [
            "Nombre de niveaux",
            String(first(building, ["nb_niveau"], "Non renseigné")),
          ],
          [
            "Hauteur maximale",
            bdtopo.max_hauteur == null
              ? "Non renseigné"
              : `${bdtopo.max_hauteur} m`,
          ],
          [
            "Bâtiment relevant du parc social",
            Number(rpls.nb_log) > 0 ? "Oui" : "Non",
          ],
          [
            "Logements sociaux",
            rpls.nb_log == null ? "Non" : String(rpls.nb_log),
          ],
          [
            "Bailleur principal",
            String(first(rpls, ["raison_sociale_principal"], "Non renseigné")),
          ],
          ["Classe DPE", dpeClass || "Absent"],
          ["Classe GES", gesClass || "Absent"],
          [
            "Consommation énergétique",
            dpe.conso_5_usages_ep_m2 == null
              ? "Non renseigné"
              : `${dpe.conso_5_usages_ep_m2} kWhEP/m²/an`,
          ],
          ["Copropriété immatriculée", rnc.numero_immat ? "Oui" : "Non"],
          [
            "Nombre de lots",
            String(first(rnc, ["nb_lot_tot"], "Non renseigné")),
          ],
          [
            "Aléa argile",
            String(first(risks, ["argile_alea"], "Non renseigné")),
          ],
          [
            "Potentiel radon",
            String(first(risks, ["radon_niveau"], "Non renseigné")),
          ],
          [
            "Zone sismique",
            String(first(risks, ["sismique_niveau"], "Non renseigné")),
          ],
          [
            "Famille incendie",
            String(first(risks, ["classe_risque_incendie"], "Non renseigné")),
          ],
        ],
        [231, 119, 53],
      );
    }
    section(
      "Risques recensés · GASPAR",
      analysis.risks.length
        ? analysis.risks.map((risk: any) => [
            risk.libelle_risque_long || risk.libelle_risque,
            "Oui",
          ])
        : [["Risque recensé", "Non"]],
      [0, 0, 145],
    );
    section("Prévention des risques · DDT 95", [
      [
        "PPRN communaux",
        analysis.riskObservatory?.pprn.map((item) => item.libPpr).join(" · ") ||
          "Non",
      ],
      ["TRI", analysis.riskObservatory?.tri.length ? "Oui" : "Non"],
      ["AZI", analysis.riskObservatory?.azi.length ? "Oui" : "Non"],
      [
        "Potentiel radon",
        analysis.riskObservatory?.radon[0]?.classe_potentiel
          ? `Classe ${analysis.riskObservatory.radon[0].classe_potentiel}`
          : "Non renseigné",
      ],
      [
        "Cavités dans la commune",
        String(analysis.riskObservatory?.cavities.length || 0),
      ],
      [
        "ICPE dans la commune",
        String(analysis.riskObservatory?.icpe.length || 0),
      ],
      [
        "Établissements Seveso",
        String(
          analysis.riskObservatory?.icpe.filter((item) => item.statutSeveso)
            .length || 0,
        ),
      ],
    ]);
    section("Bruit réglementaire", [
      ["Dans un PEB", yesNo(Boolean(analysis.peb))],
      ["Classement sonore routier", yesNo(analysis.noiseRoad.length > 0)],
      [
        "Secteur routier",
        analysis.noiseRoad.length
          ? `Catégorie ${first(analysis.noiseRoad[0].properties, ["categorie"])} · ${first(analysis.noiseRoad[0].properties, ["es", "tampon"])} m`
          : "Non",
      ],
      ["Classement sonore ferroviaire", yesNo(analysis.noiseRail.length > 0)],
      [
        "Secteur ferroviaire",
        analysis.noiseRail.length
          ? `Catégorie ${first(analysis.noiseRail[0].properties, ["categorie"])} · ${first(analysis.noiseRail[0].properties, ["es", "tampon"])} m`
          : "Non",
      ],
    ]);
    section(
      "Habitat et marché",
      [
        [
          "Logements sociaux RPLS",
          String(
            first(analysis.housing, [
              "rpls_count",
              "nb_rpls",
              "logements_sociaux",
            ]),
          ),
        ],
        [
          "Part du parc social",
          `${first(analysis.housing, ["rpls_share", "part_rpls"])} %`,
        ],
        [
          "Prix médian au m²",
          `${first(analysis.market, ["prix_m2_median", "median_price_m2", "prix_m2"])} €`,
        ],
        [
          "Loyer moyen",
          `${first(analysis.market, ["loyer_m2", "rent_m2", "loyer_moyen"])} €/m²`,
        ],
      ],
      [165, 88, 160],
    );
    if (analysis.study) {
      const study = analysis.study;
      section(
        "Besoin et dynamique de logement",
        [
          [
            "Logements privés vacants",
            study.vacant == null ? "Non renseigné" : String(study.vacant),
          ],
          [
            "Vacants depuis plus de 2 ans",
            study.longVacant == null
              ? "Non renseigné"
              : String(study.longVacant),
          ],
          [
            "Taux de vacance du parc privé",
            study.vacancyRate == null
              ? "Non renseigné"
              : `${study.vacancyRate} %`,
          ],
          [
            "Logements autorisés en 2025",
            study.housingAuthorized == null
              ? "Non renseigné"
              : String(study.housingAuthorized),
          ],
          [
            "Logements commencés en 2025",
            study.housingStarted == null
              ? "Non renseigné"
              : String(study.housingStarted),
          ],
          [
            "Surface de plancher autorisée",
            study.floorAreaAuthorized == null
              ? "Non renseigné"
              : `${study.floorAreaAuthorized} m²`,
          ],
          [
            "DPE F ou G",
            study.dpeFG == null
              ? "Non renseigné"
              : `${study.dpeFG} logements · ${study.dpeFGRate ?? 0} %`,
          ],
          [
            "Commune soumise à l’article 55 SRU",
            yesNo(Boolean(study.sruApplicable)),
          ],
          ...(study.sruApplicable
            ? ([
                ["Taux SRU", percent(study.sruRate)],
                ["Commune déficitaire", yesNo(Boolean(study.sruDeficit))],
                ["Commune carencée", yesNo(Boolean(study.sruDeficient))],
                ["Taux cible SRU", percent(study.sruTarget)],
              ] as [string, string][])
            : []),
        ],
        [165, 88, 160],
      );
    }
    section(
      "Artificialisation · ENAF · ZAN",
      [
        [
          "ENAF consommés 2011–2020",
          `${first(analysis.sol, ["enaf_2011_2020", "conso_2011_2020", "enaf_avant_2021"])} ha`,
        ],
        [
          "ENAF consommés depuis 2021",
          `${first(analysis.sol, ["enaf_since_2021", "conso_depuis_2021", "enaf_2021_2023"])} ha`,
        ],
        [
          "Trajectoire ZAN",
          `${first(analysis.sol, ["zan_ratio", "taux_conso_enveloppe", "ratio_zan"])} %`,
        ],
      ],
      [228, 121, 74],
    );
    section(
      "Eau",
      [
        [
          "Potabilité",
          analysis.water?.potable === true
            ? "Oui"
            : analysis.water?.potable === false
              ? "Non"
              : "Non renseignée",
        ],
        ["Contrôles sanitaires", String(analysis.water?.controls || 0)],
        [
          "Prix de l’eau",
          analysis.water?.price
            ? `${analysis.water.price} €/m³`
            : "Non renseigné",
        ],
      ],
      [0, 120, 243],
    );
    section(
      "Environnement et nuisances",
      [
        ["Zonages biodiversité", analysis.biodiversity.join(" · ") || "Non"],
        [
          "Indice thermique diurne",
          String(
            first(analysis.heat, ["day_index", "indice_jour", "indice_diurne"]),
          ),
        ],
        [
          "Indice thermique nocturne",
          String(
            first(analysis.heat, [
              "night_index",
              "indice_nuit",
              "indice_nocturne",
            ]),
          ),
        ],
        [
          "Vulnérabilité chaleur",
          String(
            first(analysis.heat, [
              "vulnerability",
              "vulnerabilite",
              "score_vulnerabilite",
            ]),
          ),
        ],
        [
          "Population en air dégradé",
          `${first(analysis.nuisance, ["air_population_share", "part_air_degrade"])} %`,
        ],
        [
          "Population en bruit dégradé",
          `${first(analysis.nuisance, ["noise_population_share", "part_bruit_degrade"])} %`,
        ],
      ],
      [24, 117, 60],
    );
    section(
      "Accessible à 15 min à pied",
      [
        ...access.map(
          (item) =>
            [
              item.label,
              item.count
                ? `Oui · ${item.count} équipement${item.count > 1 ? "s" : ""}`
                : "Non",
            ] as [string, string],
        ),
        [
          "Médecins",
          reachableHealth.doctors.length
            ? `Oui · ${reachableHealth.doctors.length}`
            : "Non",
        ],
        [
          "Pharmacies",
          reachableHealth.pharmacies.length
            ? `Oui · ${reachableHealth.pharmacies.length}`
            : "Non",
        ],
        [
          "Hôpitaux et cliniques",
          reachableHealth.hospitals.length
            ? reachableHealth.hospitals.map((item) => item.name).join(" · ")
            : "Non",
        ],
        [
          "Maisons France Services",
          reachableHealth.franceServices.length
            ? reachableHealth.franceServices
                .map((item) => item.name)
                .join(" · ")
            : "Non",
        ],
        [
          "Arrêts de bus",
          reachableTransit.stops.length
            ? `Oui · ${reachableTransit.stops.length}`
            : "Non",
        ],
        ["Lignes de bus", reachableTransit.lines.join(" · ") || "Non"],
        ["Gare ferroviaire", reachableTransit.stations.join(" · ") || "Non"],
        ["Accès autoroute", analysis.roadAccess.A || "Calcul en cours"],
        ["Accès route nationale", analysis.roadAccess.N || "Calcul en cours"],
        [
          "Accès route départementale",
          analysis.roadAccess.D || "Calcul en cours",
        ],
      ],
      [0, 167, 181],
    );
    section(
      "Sources",
      SOURCE_LINKS.map((source) => [
        source[0],
        `${source[1]} · ${source[2]} · mise à jour ${source[3]}`,
      ]),
    );
    footer();
    const url = URL.createObjectURL(pdf.output("blob"));
    if (viewer) viewer.location.replace(url);
    else window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 120000);
  }
  const access = useMemo(() => {
    if (!analysis) return [];
    const categories: Record<string, string> = {
      education: "Éducation",
      sante: "Santé",
      quotidien: "Commerces et quotidien",
      administration: "Services publics",
      mobilite: "Transports",
      culture: "Sport et culture",
      securite: "Sécurité et secours",
    };
    return Object.entries(categories).map(([key, label]) => ({
      label,
      count: analysis.services.filter((s) => s.category === key).length,
    }));
  }, [analysis]);
  const reachableTransit = useMemo(() => {
    if (!analysis?.isochrones["15"])
      return { stops: [], lines: [], stations: [] };
    const polygon = analysis.isochrones["15"],
      stops = (busNetworkRef.current.stops || []).filter((stop: any) =>
        collectionContains(polygon, {
          lat: stop.lat,
          lon: stop.lon,
        } as Service),
      );
    const routeIds = new Set(stops.flatMap((stop: any) => stop.routes || []));
    const lines = (busNetworkRef.current.routes || [])
      .filter((route: any) => routeIds.has(route.id))
      .map((route: any) => route.short || route.long)
      .filter(Boolean)
      .sort((a: string, b: string) =>
        a.localeCompare(b, "fr", { numeric: true }),
      );
    const stations = analysis.services
      .filter(
        (service) =>
          service.category === "mobilite" && service.type === "station",
      )
      .map((service) => service.name)
      .filter((name, index, all) => all.indexOf(name) === index);
    return { stops, lines, stations };
  }, [analysis]);
  const reachableHealth = useMemo(() => {
    const doctors =
        analysis?.services.filter((service) =>
          ["doctors", "doctor", "cabinet_médical"].includes(
            String(service.type),
          ),
        ) || [],
      hospitals =
        analysis?.services.filter((service) =>
          ["hospital", "clinic", "health_centre"].includes(
            String(service.type),
          ),
        ) || [],
      pharmacies =
        analysis?.services.filter((service) => service.type === "pharmacy") ||
        [],
      franceServices =
        analysis?.services.filter(
          (service) => service.category === "france_services",
        ) || [];
    return { doctors, pharmacies, hospitals, franceServices };
  }, [analysis]);
  const p = analysis?.parcel?.properties || {};
  const georisquesPdf = analysis
    ? `https://georisques.gouv.fr/api/v1/rapport_pdf?latlon=${analysis.lon},${analysis.lat}`
    : "#";

  return (
    <main className="decision-page">
      <header className="decision-header">
        <a href={`${basePath}/`}>
          <img
            src={`${basePath}/prefet-val-doise-logo.png`}
            alt="Préfet du Val-d’Oise"
          />
        </a>
        <div className="decision-header-copy">
          <span>INSTRUCTION · CONNAISSANCE TERRITORIALE</span>
          <h1>Diagnostic d’aide à la décision</h1>
          <p>Cadastre · urbanisme · risques · environnement · accessibilité</p>
        </div>
        <div className="decision-livebox">
          <i />
          <span>
            <strong>Sources contrôlées</strong>
            <small>Actualisation automatique</small>
          </span>
        </div>
      </header>
      <div className="decision-progress">
        <span />
      </div>
      <div className="decision-workspace">
        <aside className="decision-sidebar">
          <div className="decision-sidebar-intro">
            <span>LECTURE CARTOGRAPHIQUE</span>
            <h2>
              Analyser
              <br />
              un site
            </h2>
          </div>
          <form className="decision-search" onSubmit={search}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Adresse ou commune"
              aria-label="Adresse à analyser"
            />
            <button aria-label="Analyser">→</button>
          </form>
          <div className="decision-theme-heading">
            <span>COUCHES ACTIVES</span>
            <button type="button" onClick={clearAllLayers}>
              Tout effacer
            </button>
          </div>
          <div className="decision-group">
            {LAYER_GROUPS.map(([group, ids]) => (
              <section className="decision-layer-group" key={group}>
                <h3>{group}</h3>
                {MAP_LAYERS.filter((layer) =>
                  (ids as readonly string[]).includes(layer[0]),
                ).map((layer) => (
                  <label
                    className={`decision-switch ${loadingLayers[layer[0]] ? "is-loading" : ""}`}
                    key={layer[0]}
                    style={
                      { "--switch-color": layer[3] } as React.CSSProperties
                    }
                  >
                    <input
                      type="checkbox"
                      checked={activeLayers[layer[0]]}
                      onChange={() => toggleLayer(layer[0])}
                    />
                    <span>
                      <strong>{layer[1]}</strong>
                      {loadingLayers[layer[0]] && (
                        <small>
                          <i className="decision-layer-spinner" />
                          Chargement des données…
                        </small>
                      )}
                    </span>
                  </label>
                ))}
                {group === "Accessibilité et transports" &&
                  activeLayers.services && (
                    <div className="decision-service-filters">
                      {SERVICE_CATEGORIES.map((category) => (
                        <label
                          key={category[0]}
                          className="decision-service-filter"
                          style={
                            {
                              "--service-color": category[3],
                            } as React.CSSProperties
                          }
                        >
                          <input
                            type="checkbox"
                            checked={activeServiceCategories[category[0]]}
                            onChange={() => toggleServiceCategory(category[0])}
                          />
                          <i>{category[2]}</i>
                          <span>{category[1]}</span>
                        </label>
                      ))}
                    </div>
                  )}
              </section>
            ))}
          </div>
          <button
            className="decision-sources-button"
            onClick={() => sourceDialog.current?.showModal()}
          >
            Sources, millésimes et licences
          </button>
          <div className="decision-sidebar-status">
            <i />
            <span>
              <strong>{sourceDate}</strong>
              <small>Dernière consolidation</small>
            </span>
          </div>
        </aside>
        <section className="decision-map-shell">
          <div
            ref={mapNode}
            className="decision-map"
            aria-label="Carte d’analyse territoriale"
          />
          <div className="decision-hint">
            <i />
            <span>
              <strong>
                {loading
                  ? "Analyse des référentiels…"
                  : analysis
                    ? "Diagnostic disponible"
                    : "Sélectionnez un point"}
              </strong>
              <small>
                {analysis
                  ? analysis.commune
                  : "Cliquez sur la carte ou recherchez une adresse"}
              </small>
            </span>
          </div>
        </section>
        <aside
          className={`decision-drawer ${analysis ? "open" : ""}`}
          aria-label="Diagnostic du point"
        >
          <div className="decision-drawer-head">
            <small>
              POINT · DIAGNOSTIC TERRITORIAL · {analysis?.codeInsee}
            </small>
            <h2>{analysis?.commune}</h2>
            <p>
              {analysis?.address} · {analysis?.lat.toFixed(6)},{" "}
              {analysis?.lon.toFixed(6)}
            </p>
            <button
              className="decision-close"
              onClick={() => setAnalysis(null)}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
          {analysis && (
            <>
              <div className="decision-body">
                <Section
                  title="Parcelle et urbanisme"
                  state={
                    analysis.parcel ? "Données retournées" : "Aucune parcelle"
                  }
                >
                  <div className="decision-kpis">
                    <Kpi
                      label="Parcelle"
                      value={`${first(p, ["section"], "")} ${first(p, ["numero"])}`}
                    />
                    <Kpi
                      label="Surface cadastrale"
                      value={`${first(p, ["contenance"])} m²`}
                    />
                    <Kpi
                      label="Zone PLU"
                      value={String(
                        first(analysis.zones[0]?.properties, [
                          "libelle",
                          "typezone",
                          "libelle_zone",
                        ]),
                      )}
                    />
                    <Kpi
                      label="Servitudes intersectées"
                      value={String(analysis.servitudes.length)}
                    />
                    {analysis.mos?.mos2025 && (
                      <Kpi
                        label="Occupation du sol · MOS 2025"
                        value={`Poste ${analysis.mos.mos2025}`}
                      />
                    )}
                    <Kpi
                      label="Groupes de bâtiments · BDNB"
                      value={String(analysis.buildings.length)}
                    />
                  </div>
                  <div className="decision-links">
                    <a
                      href="https://www.geoportail-urbanisme.gouv.fr/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      GPU
                    </a>
                    <a
                      href="https://www.cadastre.gouv.fr/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Cadastre
                    </a>
                  </div>
                </Section>
                {analysis.selectedBuilding && (
                  <BuildingDetails analysis={analysis} />
                )}
                {analysis.risks.length > 0 ? (
                  <Section
                    title="Risques recensés · GASPAR"
                    state={`${analysis.risks.length} risque${analysis.risks.length > 1 ? "s" : ""}`}
                  >
                    <div className="decision-list">
                      {analysis.risks.map((r: any, i) => (
                        <Row
                          key={i}
                          label={r.libelle_risque_long || r.libelle_risque}
                          value="Oui"
                          tone="alert"
                        />
                      ))}
                    </div>
                  </Section>
                ) : (
                  <Section title="Risques recensés · GASPAR" state="0 risque">
                    <div className="decision-list">
                      <Row label="Risque recensé" value="Non" />
                    </div>
                  </Section>
                )}
                <Section
                  title="Prévention des risques · DDT 95"
                  state="Géorisques à la requête"
                >
                  <div className="decision-list">
                    <Row
                      label="PPRN communaux"
                      value={
                        analysis.riskObservatory?.pprn.length
                          ? `Oui · ${analysis.riskObservatory.pprn.map((item) => item.libPpr).join(" · ")}`
                          : "Non"
                      }
                      tone={
                        analysis.riskObservatory?.pprn.length
                          ? "alert"
                          : "neutral"
                      }
                    />
                    <Row
                      label="Territoire à risque important d’inondation · TRI"
                      value={
                        analysis.riskObservatory?.tri.length ? "Oui" : "Non"
                      }
                      tone={
                        analysis.riskObservatory?.tri.length
                          ? "alert"
                          : "neutral"
                      }
                    />
                    <Row
                      label="Atlas des zones inondables · AZI"
                      value={
                        analysis.riskObservatory?.azi.length ? "Oui" : "Non"
                      }
                      tone={
                        analysis.riskObservatory?.azi.length
                          ? "alert"
                          : "neutral"
                      }
                    />
                    <Row
                      label="Potentiel radon"
                      value={
                        analysis.riskObservatory?.radon[0]?.classe_potentiel
                          ? `Classe ${analysis.riskObservatory.radon[0].classe_potentiel}`
                          : "Non renseigné"
                      }
                      tone={
                        String(
                          analysis.riskObservatory?.radon[0]?.classe_potentiel,
                        ) === "3"
                          ? "alert"
                          : "neutral"
                      }
                    />
                    <Row
                      label="Cavités recensées dans la commune"
                      value={String(
                        analysis.riskObservatory?.cavities.length || 0,
                      )}
                    />
                    <Row
                      label="ICPE recensées dans la commune"
                      value={String(analysis.riskObservatory?.icpe.length || 0)}
                    />
                    <Row
                      label="Établissements Seveso dans la commune"
                      value={String(
                        analysis.riskObservatory?.icpe.filter(
                          (item) => item.statutSeveso,
                        ).length || 0,
                      )}
                      tone={
                        analysis.riskObservatory?.icpe.some(
                          (item) => item.statutSeveso,
                        )
                          ? "alert"
                          : "neutral"
                      }
                    />
                  </div>
                  <div className="decision-links">
                    <a
                      href="https://ddt95.github.io/observatoire_risques_95/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Observatoire des risques 95
                    </a>
                    <a
                      href="https://errial.georisques.gouv.fr/#/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      ERRIAL
                    </a>
                  </div>
                </Section>
                <Section
                  title="Bruit réglementaire"
                  state="Référentiels DDT 95 · DGAC"
                >
                  <div className="decision-list">
                    <Row
                      label="Dans un PEB"
                      value={
                        analysis.peb
                          ? `Oui · zone ${first(analysis.peb, ["zone"])}`
                          : "Non"
                      }
                      tone={analysis.peb ? "alert" : "neutral"}
                    />
                    <Row
                      label="Classement sonore routier"
                      value={
                        analysis.noiseRoad.length
                          ? `Oui · catégorie ${first(analysis.noiseRoad[0].properties, ["categorie"])} · secteur ${first(analysis.noiseRoad[0].properties, ["es", "tampon"])} m`
                          : "Non"
                      }
                      tone={analysis.noiseRoad.length ? "alert" : "neutral"}
                    />
                    <Row
                      label="Classement sonore ferroviaire"
                      value={
                        analysis.noiseRail.length
                          ? `Oui · catégorie ${first(analysis.noiseRail[0].properties, ["categorie"])} · secteur ${first(analysis.noiseRail[0].properties, ["tampon", "es"])} m`
                          : "Non"
                      }
                      tone={analysis.noiseRail.length ? "alert" : "neutral"}
                    />
                    {analysis.peb && (
                      <Row
                        label="Aérodrome"
                        value={String(
                          first(analysis.peb, ["nom", "code_oaci"]),
                        )}
                      />
                    )}
                  </div>
                  <div className="decision-links">
                    <a
                      href="https://ddt95.github.io/val-doise-nuisances/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Carte nuisances
                    </a>
                    {analysis.peb?.ref_doc && (
                      <a
                        href={analysis.peb.ref_doc}
                        target="_blank"
                        rel="noreferrer"
                      >
                        PEB approuvé
                      </a>
                    )}
                  </div>
                </Section>
                {(analysis.housing || analysis.market) && (
                  <Section
                    title="Habitat et marché"
                    state="RPLS 2025 · DVF 2023–2025"
                  >
                    <div className="decision-list">
                      <Row
                        label="Logements sociaux RPLS"
                        value={
                          analysis.housing?.social?.rpls_count?.value == null
                            ? "Non renseigné"
                            : Math.round(
                                analysis.housing.social.rpls_count.value,
                              ).toLocaleString("fr-FR")
                        }
                      />
                      <Meter
                        label="Part RPLS des résidences principales"
                        value={
                          analysis.housing?.social
                            ?.part_rpls_residences_principales?.value
                        }
                        color="#a558a0"
                      />
                      <Row
                        label="Prix médian"
                        value={
                          analysis.market?.prix_m2_median?.value == null
                            ? "Non renseigné"
                            : `${Math.round(analysis.market.prix_m2_median.value).toLocaleString("fr-FR")} €/m²`
                        }
                      />
                      <Row
                        label="Loyer moyen appartement"
                        value={
                          analysis.market?.loyer_m2_appartement?.value == null
                            ? "Non renseigné"
                            : `${Number(analysis.market.loyer_m2_appartement.value).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} €/m²/mois`
                        }
                      />
                    </div>
                    <div className="decision-links">
                      <a
                        href="https://ddt95.github.io/val-doise-logement-habitat/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Carte logement
                      </a>
                    </div>
                  </Section>
                )}
                {analysis.study && (
                  <Section
                    title="Besoin et dynamique de logement"
                    state="LOVAC 2026 · SRU 2025 · Sitadel 2025 · DPE"
                  >
                    <div className="decision-list">
                      <Row
                        label="Logements privés vacants"
                        value={
                          analysis.study.vacant == null
                            ? "Non renseigné"
                            : Number(analysis.study.vacant).toLocaleString(
                                "fr-FR",
                              )
                        }
                      />
                      <Row
                        label="Vacants depuis plus de 2 ans"
                        value={
                          analysis.study.longVacant == null
                            ? "Non renseigné"
                            : Number(analysis.study.longVacant).toLocaleString(
                                "fr-FR",
                              )
                        }
                      />
                      <Meter
                        label="Taux de vacance du parc privé"
                        value={analysis.study.vacancyRate}
                        color="#e4794a"
                      />
                      <Row
                        label="Logements autorisés en 2025"
                        value={
                          analysis.study.housingAuthorized == null
                            ? "Non renseigné"
                            : Number(
                                analysis.study.housingAuthorized,
                              ).toLocaleString("fr-FR")
                        }
                      />
                      <Row
                        label="Logements commencés en 2025"
                        value={
                          analysis.study.housingStarted == null
                            ? "Non renseigné"
                            : Number(
                                analysis.study.housingStarted,
                              ).toLocaleString("fr-FR")
                        }
                      />
                      <Row
                        label="Surface de plancher autorisée"
                        value={
                          analysis.study.floorAreaAuthorized == null
                            ? "Non renseigné"
                            : `${Number(analysis.study.floorAreaAuthorized).toLocaleString("fr-FR")} m²`
                        }
                      />
                      <Row
                        label="DPE F ou G"
                        value={
                          analysis.study.dpeFG == null
                            ? "Non renseigné"
                            : `${Number(analysis.study.dpeFG).toLocaleString("fr-FR")} logements · ${Number(analysis.study.dpeFGRate || 0).toLocaleString("fr-FR")} %`
                        }
                      />
                      <Row
                        label="Commune soumise à l’article 55 SRU"
                        value={analysis.study.sruApplicable ? "Oui" : "Non"}
                      />
                      {analysis.study.sruApplicable && (
                        <>
                          <Row
                            label="Taux SRU"
                            value={percent(analysis.study.sruRate)}
                          />
                          <Row
                            label="Commune déficitaire"
                            value={analysis.study.sruDeficit ? "Oui" : "Non"}
                            tone={
                              analysis.study.sruDeficit ? "alert" : "neutral"
                            }
                          />
                          <Row
                            label="Commune carencée"
                            value={analysis.study.sruDeficient ? "Oui" : "Non"}
                            tone={
                              analysis.study.sruDeficient ? "alert" : "neutral"
                            }
                          />
                          <Row
                            label="Taux cible SRU"
                            value={percent(analysis.study.sruTarget)}
                          />
                        </>
                      )}
                    </div>
                  </Section>
                )}
                {analysis.sol && (
                  <Section
                    title="ENAF et trajectoire ZAN"
                    state="Cerema · 2011–2024"
                  >
                    <div className="decision-list">
                      <Row
                        label="ENAF consommés 2011–2020"
                        value={`${Number(analysis.sol.consommation?.reference_2011_2020?.value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ha`}
                      />
                      <Row
                        label="ENAF consommés depuis 2021"
                        value={`${Number(analysis.sol.consommation?.depuis_2021?.value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ha`}
                      />
                      <Row
                        label="Repère indicatif 2021–2030"
                        value={`${Number(analysis.sol.consommation?.objectif_2021_2030?.value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ha`}
                      />
                      <Meter
                        label="Part du repère consommée"
                        value={
                          analysis.sol.consommation?.avancement_objectif?.value
                        }
                        color="#e4794a"
                      />
                    </div>
                    <div className="decision-links">
                      <a
                        href="https://ddt95.github.io/val-doise-sol-formes-urbaines/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Carte sol et ZAN
                      </a>
                    </div>
                  </Section>
                )}
                {analysis.water && (
                  <Section title="Eau" state="Hub’Eau · ARS · DDT 95">
                    <div className="decision-list">
                      <Row
                        label="Eau potable conforme"
                        value={
                          analysis.water.potable == null
                            ? "Non renseigné"
                            : analysis.water.potable
                              ? "Oui"
                              : "Non"
                        }
                        tone={
                          analysis.water.potable == null
                            ? "neutral"
                            : analysis.water.potable
                              ? "positive"
                              : "alert"
                        }
                      />
                      <Row
                        label="Contrôles sanitaires · 12 mois"
                        value={String(analysis.water.controls)}
                      />
                      <Row
                        label="Prix de l’eau potable"
                        value={
                          analysis.water.price == null
                            ? "Non renseigné"
                            : `${Number(analysis.water.price).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €/m³`
                        }
                      />
                    </div>
                    <div className="decision-links">
                      <a
                        href="https://ddt95.github.io/eau95/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Carte de l’eau
                      </a>
                    </div>
                  </Section>
                )}
                {(analysis.biodiversity.length > 0 ||
                  analysis.heat ||
                  analysis.nuisance) && (
                  <Section
                    title="Environnement et nuisances"
                    state="Données calculées"
                  >
                    <div className="decision-list">
                      {analysis.biodiversity.map((label, i) => (
                        <Row
                          key={`${label}-${i}`}
                          label="Zonage intersecté"
                          value={label}
                        />
                      ))}
                      {analysis.heat && (
                        <>
                          <Row
                            label="Indice thermique diurne"
                            value={Number(analysis.heat.day).toLocaleString(
                              "fr-FR",
                              { maximumFractionDigits: 2 },
                            )}
                          />
                          <Row
                            label="Indice thermique nocturne"
                            value={Number(analysis.heat.night).toLocaleString(
                              "fr-FR",
                              { maximumFractionDigits: 2 },
                            )}
                          />
                          <Row
                            label="Vulnérabilité chaleur"
                            value={Number(
                              analysis.heat.vulnerability,
                            ).toLocaleString("fr-FR", {
                              maximumFractionDigits: 2,
                            })}
                          />
                        </>
                      )}
                      {analysis.nuisance && (
                        <>
                          <Row
                            label="Population en air dégradé"
                            value={`${Number(analysis.nuisance.air_degrade_pct).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`}
                          />
                          <Row
                            label="Population en bruit dégradé"
                            value={`${Number(analysis.nuisance.bruit_degrade_pct).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`}
                          />
                          <Row
                            label="Cumul très dégradé"
                            value={`${Number(analysis.nuisance.cumul_tres_degrade_pct).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`}
                          />
                        </>
                      )}
                    </div>
                  </Section>
                )}
                <Section
                  title="Services accessibles à 15 min à pied"
                  state="Calcul réseau"
                >
                  <div className="decision-list">
                    <Row
                      label="Médecins"
                      value={
                        reachableHealth.doctors.length
                          ? `Oui · ${reachableHealth.doctors.length}`
                          : "Non"
                      }
                    />
                    <Row
                      label="Pharmacies"
                      value={
                        reachableHealth.pharmacies.length
                          ? `Oui · ${reachableHealth.pharmacies.length}`
                          : "Non"
                      }
                    />
                    <Row
                      label="Hôpitaux et cliniques"
                      value={
                        reachableHealth.hospitals.length
                          ? `Oui · ${reachableHealth.hospitals.map((item) => item.name).join(" · ")}`
                          : "Non"
                      }
                    />
                    <Row
                      label="Maisons France Services"
                      value={
                        reachableHealth.franceServices.length
                          ? `Oui · ${reachableHealth.franceServices.map((item) => item.name).join(" · ")}`
                          : "Non"
                      }
                    />
                  </div>
                </Section>
                <Section
                  title="Accessible à 15 min à pied"
                  state={
                    analysis.isochrones["15"] ? "Calcul réseau" : "Indisponible"
                  }
                >
                  <div className="decision-list">
                    {access.map((x) => (
                      <Row
                        key={x.label}
                        label={x.label}
                        value={
                          x.count
                            ? `Oui · ${x.count} équipement${x.count > 1 ? "s" : ""}`
                            : "Non"
                        }
                      />
                    ))}
                    <Row
                      label="Arrêts de bus"
                      value={
                        reachableTransit.stops.length
                          ? `Oui · ${reachableTransit.stops.length}`
                          : "Non"
                      }
                    />
                    <Row
                      label="Lignes de bus"
                      value={
                        reachableTransit.lines.length
                          ? reachableTransit.lines.join(" · ")
                          : "Non"
                      }
                    />
                    <Row
                      label="Gare ferroviaire"
                      value={
                        reachableTransit.stations.length
                          ? `Oui · ${reachableTransit.stations.join(" · ")}`
                          : "Non"
                      }
                    />
                    <Row
                      label="Accès autoroute"
                      value={analysis.roadAccess.A || "Calcul en cours…"}
                    />
                    <Row
                      label="Accès route nationale"
                      value={analysis.roadAccess.N || "Calcul en cours…"}
                    />
                    <Row
                      label="Accès route départementale"
                      value={analysis.roadAccess.D || "Calcul en cours…"}
                    />
                  </div>
                </Section>
                {analysis.errors.length > 0 && (
                  <div className="decision-alert">
                    {analysis.errors.join(" · ")}
                  </div>
                )}
              </div>
              <div className="decision-actions">
                <button onClick={openDecisionPdf}>
                  Consulter la fiche PDF ↗
                </button>
                <a href={georisquesPdf} target="_blank" rel="noreferrer">
                  Rapport Géorisques ↗
                </a>
              </div>
            </>
          )}
        </aside>
      </div>
      <dialog ref={sourceDialog} className="decision-source-dialog">
        <header>
          <small>Traçabilité</small>
          <h2>Sources, fréquence et statut d’intégration</h2>
          <button
            onClick={() => sourceDialog.current?.close()}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>
        <div className="dialog-body">
          <table>
            <thead>
              <tr>
                <th>Donnée</th>
                <th>Producteur</th>
                <th>Référentiel</th>
                <th>Mise à jour cible</th>
                <th>Accès</th>
              </tr>
            </thead>
            <tbody>
              {SOURCE_LINKS.map((s) => (
                <tr key={s[0]}>
                  <td>
                    <strong>{s[0]}</strong>
                  </td>
                  <td>{s[1]}</td>
                  <td>{s[2]}</td>
                  <td>{s[3]}</td>
                  <td>
                    <a href={s[4]} target="_blank" rel="noreferrer">
                      Source officielle
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </dialog>
    </main>
  );
}

function BuildingDetails({ analysis }: { analysis: Analysis }) {
  const data = analysis.buildingData || {};
  const building = data.building || {};
  const address = data.address || {};
  const usage = data.usage || {};
  const rpls = data.rpls || {};
  const dpe = data.dpe || {};
  const rnc = data.rnc || {};
  const risks = data.risks || {};
  const bdtopo = data.bdtopo || {};
  const renovation = data.renovation || {};
  const ffo = data.ffo || {};
  const dvf = Array.isArray(data.dvf) ? data.dvf.slice(0, 8) : [];
  const dpeClass = dpe.classe_bilan_dpe || dpe.classe_conso_energie_arrete_2012;
  const gesClass =
    dpe.classe_emission_ges || dpe.classe_emission_ges_arrete_2012;
  const consumption =
    dpe.conso_5_usages_ep_m2 ?? dpe.conso_3_usages_ep_m2_arrete_2012;
  const totalHousing = ffo.nb_log ?? building.nb_log;
  const socialHousing = rpls.nb_log;
  const renovationRows = Object.entries(renovation)
    .filter(
      ([key, value]) =>
        value != null &&
        value !== "" &&
        key !== "batiment_groupe_id" &&
        /(pac|geother|solaire|renov|contrainte|opportunite|faisabilite)/i.test(
          key,
        ),
    )
    .slice(0, 8);
  return (
    <Section
      title="Bâtiment au point"
      state={data.groupId ? `BDNB ${data.vintage}` : "RNB"}
    >
      <div className="decision-kpis">
        <Kpi
          label="ID-RNB"
          value={String(rnbIdOf(analysis.selectedBuilding) || "Non renseigné")}
        />
        <Kpi
          label="Statut RNB"
          value={rnbStatus(
            first(
              analysis.selectedBuilding?.properties,
              ["status"],
              "Non renseigné",
            ),
          )}
        />
        <Kpi
          label="Logements"
          value={totalHousing == null ? "Non renseigné" : String(totalHousing)}
        />
        <Kpi
          label="Parc social"
          value={Number(socialHousing) > 0 ? "Oui" : "Non"}
        />
        <Kpi label="DPE" value={dpeClass || "Absent"} />
        <Kpi
          label="Bâtiment public"
          value={String(
            first(usage, ["categorie_usage_propriete"], "Non renseigné"),
          )}
        />
      </div>
      <div className="decision-list">
        <Row label="Groupe BDNB" value={data.groupId || "Non renseigné"} />
        <Row
          label="Quartier prioritaire · QPV"
          value={
            data.qpv ? `Oui · ${first(data.qpv, ["libelle"], "QPV")}` : "Non"
          }
        />
        <Row
          label="Adresse BDNB"
          value={String(
            first(
              address,
              ["adresse", "libelle_adresse", "cle_interop_adr"],
              analysis.address,
            ),
          )}
        />
        <Row
          label="Usage principal"
          value={String(
            first(
              usage,
              ["usage_principal_bdnb_open", "categorie_usage_propriete"],
              "Non renseigné",
            ),
          )}
        />
        <Row
          label="Année de construction"
          value={String(
            first(
              building,
              ["annee_construction"],
              first(ffo, ["annee_construction"], "Non renseigné"),
            ),
          )}
        />
        <Row
          label="Nombre de niveaux"
          value={String(first(building, ["nb_niveau"], "Non renseigné"))}
        />
        <Row
          label="Hauteur maximale"
          value={
            bdtopo.max_hauteur == null
              ? "Non renseigné"
              : `${bdtopo.max_hauteur} m`
          }
        />
        <Row
          label="Nature BD TOPO"
          value={String(first(bdtopo, ["l_nature"], "Non renseigné"))}
        />
        <Row
          label="Usage BD TOPO"
          value={String(first(bdtopo, ["l_usage_1"], "Non renseigné"))}
        />
        <Row
          label="Logements sociaux"
          value={socialHousing == null ? "Non" : String(socialHousing)}
        />
        {Number(socialHousing) > 0 && (
          <>
            <Row
              label="Logements sociaux loués"
              value={String(first(rpls, ["nb_log_loue"], "Non renseigné"))}
            />
            <Row
              label="Logements sociaux vacants"
              value={String(first(rpls, ["nb_log_vac"], "Non renseigné"))}
            />
            <Row
              label="Bailleur principal"
              value={String(
                first(rpls, ["raison_sociale_principal"], "Non renseigné"),
              )}
            />
            <Row
              label="Loyer moyen RPLS"
              value={
                rpls.loyer_moyen_m2 == null
                  ? "Non renseigné"
                  : `${rpls.loyer_moyen_m2} €/m²`
              }
            />
            <Row
              label="Accessible PMR"
              value={
                rpls.accessible_pmr === true
                  ? "Oui"
                  : rpls.accessible_pmr === false
                    ? "Non"
                    : "Non renseigné"
              }
            />
          </>
        )}
        <Row
          label="Classe DPE"
          value={dpeClass || "Absent"}
          tone={dpeClass === "F" || dpeClass === "G" ? "alert" : "neutral"}
        />
        <Row
          label="Classe GES"
          value={gesClass || "Absent"}
          tone={gesClass === "F" || gesClass === "G" ? "alert" : "neutral"}
        />
        <Row
          label="Consommation énergétique"
          value={
            consumption == null ? "Non renseigné" : `${consumption} kWhEP/m²/an`
          }
        />
        <Row
          label="Énergie de chauffage"
          value={String(
            first(dpe, ["type_energie_chauffage"], "Non renseigné"),
          )}
        />
        <Row
          label="Ventilation"
          value={String(first(dpe, ["type_ventilation"], "Non renseigné"))}
        />
        <Row
          label="Isolation des murs"
          value={String(
            first(dpe, ["type_isolation_mur_exterieur"], "Non renseigné"),
          )}
        />
        <Row
          label="Copropriété immatriculée"
          value={rnc.numero_immat ? "Oui" : "Non"}
        />
        {rnc.numero_immat && (
          <>
            <Row label="Immatriculation RNC" value={String(rnc.numero_immat)} />
            <Row
              label="Nombre de lots"
              value={String(first(rnc, ["nb_lot_tot"], "Non renseigné"))}
            />
            <Row
              label="Lots d’habitation"
              value={String(first(rnc, ["nb_lot_hab"], "Non renseigné"))}
            />
            <Row
              label="Syndic"
              value={String(first(rnc, ["syndic_nom"], "Non renseigné"))}
            />
          </>
        )}
        <Row
          label="Aléa argile"
          value={String(first(risks, ["argile_alea"], "Non renseigné"))}
        />
        <Row
          label="Potentiel radon"
          value={String(first(risks, ["radon_niveau"], "Non renseigné"))}
        />
        <Row
          label="Zone sismique"
          value={String(first(risks, ["sismique_niveau"], "Non renseigné"))}
        />
        <Row
          label="Famille incendie"
          value={String(
            first(risks, ["classe_risque_incendie"], "Non renseigné"),
          )}
        />
        <Row label="Transactions DVF+ rapprochées" value={String(dvf.length)} />
        {dvf.map((mutation: any, index: number) => {
          const amount = mutation.valeurfonc ?? mutation.valeur_fonciere;
          return (
            <Row
              key={`dvf-${index}`}
              label={`Mutation ${mutation.datemut || mutation.date_mutation || index + 1}`}
              value={`${amount == null ? "Montant non renseigné" : `${Number(amount).toLocaleString("fr-FR")} €`} · ${mutation.libnatmut || mutation.nature_mutation || "Mutation"}`}
            />
          );
        })}
        {renovationRows.map(([key, value]) => (
          <Row
            key={key}
            label={renovationLabel(key)}
            value={frenchValue(value)}
          />
        ))}
      </div>
      <div className="decision-links">
        <a
          href="https://ddt95.github.io/observatoire_bati/"
          target="_blank"
          rel="noreferrer"
        >
          Observatoire du bâti
        </a>
      </div>
    </Section>
  );
}

function Section({
  title,
  state,
  children,
}: {
  title: string;
  state: string;
  children: React.ReactNode;
}) {
  const theme = /bruit|risque/i.test(title)
    ? "risk"
    : /habitat/i.test(title)
      ? "housing"
      : /ENAF|ZAN/i.test(title)
        ? "land"
        : /eau/i.test(title)
          ? "water"
          : /environnement/i.test(title)
            ? "environment"
            : /accessible/i.test(title)
              ? "access"
              : "urban";
  return (
    <section className={`decision-section theme-${theme}`}>
      <div className="decision-section-title">
        <h3>{title}</h3>
        <span
          className={`decision-state ${/à |partiel|consolider/i.test(state) ? "pending" : ""}`}
        >
          {state}
        </span>
      </div>
      {children}
    </section>
  );
}
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Row({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "alert" | "positive";
}) {
  return (
    <div className={`decision-row tone-${tone}`}>
      <b>{label}</b>
      <span>{value}</span>
    </div>
  );
}
function Meter({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color: string;
}) {
  const number = Number(value);
  return (
    <div
      className="decision-meter"
      style={
        {
          "--meter-color": color,
          "--meter-value": `${Math.max(0, Math.min(100, Number.isFinite(number) ? number : 0))}%`,
        } as React.CSSProperties
      }
    >
      <div>
        <b>{label}</b>
        <strong>
          {Number.isFinite(number)
            ? `${number.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
            : "Non renseigné"}
        </strong>
      </div>
      <i>
        <span />
      </i>
    </div>
  );
}
