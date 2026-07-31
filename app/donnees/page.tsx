const observatories = [
  { name: "Portail communal", sources: "API Découpage administratif, INSEE, IGN et indicateurs territoriaux publics", use: "Fiches communales, comparaisons, fiches actions et accès transversal aux cartes", status: "prefiguration", label: "Préfiguration" },
  { name: "Urbanisme à la parcelle", sources: "Cadastre (DGFiP), Géoportail de l’urbanisme, Géorisques, BDNB (CSTB), MOS (Institut Paris Region)", use: "Parcelles, documents d’urbanisme, servitudes, risques, bâti et occupation du sol", status: "connected", label: "Connecté" },
  { name: "Artificialisation & ZAN", sources: "Portail de l’artificialisation, fichiers fonciers (Cerema), OCS GE (IGN) et MOS", use: "Consommation d’espace, occupation du sol, trajectoire ZAN et friches", status: "prefiguration", label: "Préfiguration" },
  { name: "Agriculture", sources: "RPG (IGN / ASP), Agence Bio, API Carto et référentiels environnementaux publics", use: "Cultures, agriculture biologique, prairies, haies et contraintes environnementales", status: "connected", label: "Connecté" },
  { name: "Eau", sources: "Eaufrance, Sandre, Hub’Eau, BNPE et données des services de l’État", use: "Cours d’eau, masses d’eau, prélèvements, stations, nappes et gouvernance", status: "connected", label: "Connecté" },
  { name: "Risques majeurs", sources: "Géorisques, BRGM, bases nationales des installations et données réglementaires", use: "Inondations, argiles, cavités, installations classées et sites pollués", status: "connected", label: "Connecté" },
  { name: "Logement & Habitat", sources: "DPE (ADEME), BDNB (CSTB), RPLS, Sitadel, DVF et données publiques du logement", use: "Performance énergétique, parc social, vacance, construction et marchés fonciers", status: "connected", label: "Connecté" },
  { name: "Biodiversité", sources: "INPN / PatriNat et API Carto IGN, BD TOPO et ONF, Géoportail de l’urbanisme, SDRIF-E / Institut Paris Region, GeoNat’îdF / ARB Île-de-France", use: "Espaces de nature et protégés, ZNIEFF, Natura 2000, continuités écologiques et observations d’espèces", status: "connected", label: "Connecté" },
  { name: "Mobilités et transports", sources: "Île-de-France Mobilités et transport.data.gouv.fr", use: "Réseaux, pôles, lignes et offres de transport", status: "connected", label: "Connecté" },
  { name: "Transition énergétique", sources: "ADEME, Enedis, ODRE, Airparif et données territoriales de l’énergie", use: "Consommations, productions, rénovation énergétique et qualité de l’air", status: "connected", label: "Connecté" },
];

export default function DataInformationPage() {
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

  return (
    <main className="data-page">
      <header className="data-header">
        <a href={`${basePath}/`} className="data-back"><span aria-hidden="true">←</span> Retour à l’Atlas</a>
        <div className="data-brand"><span>DDT du Val-d’Oise</span><strong>Les données de l’Atlas</strong></div>
      </header>

      <section className="data-hero">
        <div className="data-hero-icon" aria-hidden="true">i</div>
        <div><p className="eyebrow">Comprendre avant d’interpréter</p><h1>D’où viennent les données&nbsp;?</h1><p>Cette page explique les sources mobilisées par l’Atlas territorial, leur rôle et leur niveau de disponibilité. Elle permet de distinguer une donnée déjà connectée d’une connexion encore en préparation.</p></div>
      </section>

      <section className="data-content">
        <section className="data-explainer" aria-labelledby="reading-title">
          <div><p className="data-step">01 · Mode d’emploi</p><h2 id="reading-title">Lire l’état d’une donnée</h2><p>Le statut décrit le fonctionnement de la page thématique, pas la qualité intrinsèque du producteur. Une source peut aussi être temporairement indisponible sans que les données déjà publiées disparaissent.</p></div>
          <div className="status-legend">
            <article><i className="connected"/><div><strong>Connecté</strong><p>La page interroge une source publique, ou utilise un jeu préparé et documenté pour l’affichage.</p></div></article>
            <article><i className="prefiguration"/><div><strong>Préfiguration</strong><p>La page et ses branchements sont préparés ; le contenu doit encore être consolidé avant la mise en service.</p></div></article>
            <article><i className="unavailable"/><div><strong>Indisponibilité ponctuelle</strong><p>Une API peut ne pas répondre. Il faut alors réessayer plus tard et vérifier la source officielle.</p></div></article>
          </div>
        </section>

        <section className="common-data" aria-labelledby="common-title">
          <div><p className="data-step">02 · Socle commun</p><h2 id="common-title">Ce qui relie toutes les pages</h2></div>
          <div className="common-grid">
            <article><span>01</span><strong>Territoires</strong><p>Communes, codes INSEE, intercommunalités et contours administratifs servent de références communes.</p></article>
            <article><span>02</span><strong>Localisation</strong><p>Les fonds cartographiques et référentiels IGN permettent de replacer les données sur le territoire.</p></article>
            <article><span>03</span><strong>Traçabilité</strong><p>Chaque lecture doit préciser le producteur, le millésime et, lorsque c’est possible, la date de mise à jour.</p></article>
          </div>
        </section>

        <section className="connection-section" aria-labelledby="connections-title">
          <div className="connection-heading"><div><p className="data-step">03 · Connexions</p><h2 id="connections-title">Les dix lectures et leurs sources</h2></div><p>Les producteurs cités restent propriétaires et responsables de leurs données. L’Atlas en propose une lecture territoriale simplifiée.</p></div>
          <div className="connection-table" role="table" aria-label="Sources et état des pages thématiques">
            <div className="connection-row connection-labels" role="row"><span>Lecture</span><span>Sources principales</span><span>Utilisation prévue</span><span>État</span></div>
            {observatories.map((item) => <article className="connection-row" role="row" key={item.name}>
              <strong>{item.name}</strong><p>{item.sources}</p><p>{item.use}</p><span className={`data-status ${item.status}`}><i/>{item.label}</span>
            </article>)}
          </div>
        </section>

        <section className="data-caution">
          <div><p className="data-step">04 · À retenir</p><h2>Une aide à la lecture, pas un document opposable</h2></div>
          <div><p>Les cartes donnent une première compréhension du territoire. Elles ne remplacent ni un document réglementaire, ni une étude de terrain, ni la consultation du producteur officiel.</p><p>Les millésimes diffèrent selon les thèmes. Deux indicateurs ne doivent être comparés que si leurs périodes, unités et périmètres sont compatibles.</p><p>Pour une décision administrative ou réglementaire, consultez toujours la source officielle indiquée dans la page concernée.</p></div>
        </section>
      </section>

      <footer className="data-footer">DDT du Val-d’Oise – Pôle géomatique</footer>
    </main>
  );
}
