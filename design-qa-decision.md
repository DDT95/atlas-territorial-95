# Design QA — aide à la décision

Date : 4 septembre 2026

## Cible

- Source visuelle : `/var/folders/3h/px_6bwl96w50x8y34bkz_k_80000gn/T/TemporaryItems/NSIRD_screencaptureui_Yfq7tK/Capture d’écran 2026-09-04 à 11.53.50.png`
- Dimensions source : 3 676 × 1 654 px.
- État attendu : nouvelle carte placée en première colonne de la troisième ligne, sous « Comment circulent les bus et les trains ? », et page métier conforme au gabarit DDT 95.
- Implémentation : `/?page=decision`, serveur local vérifié sur le port 4173.

## Contrôles réalisés

- Construction Vite de production réussie.
- Route et fichier de suivi des sources servis en HTTP.
- Parcours de données testé sur un point de Pontoise : BAN, cadastre, GPU, SUP, Géorisques et isochrone piéton retournent un résultat HTTP 200 avec CORS public.
- Typographie et couleurs utilisent les tokens Marianne, bleu France, bleu profond, cyan, fonds et bordures du gabarit existant.
- La page conserve le modèle : en-tête institutionnel, contrôles à gauche, carte centrale, panneau de résultats flottant à droite.
- La vue mobile conserve la carte et ouvre le panneau de résultat sur toute la largeur utile.

## Blocage de vérification visuelle

Le navigateur intégré requis pour produire une capture rendue et tester visuellement les interactions n’est pas exposé dans cette session. Aucune comparaison image-à-image valide ne peut donc être établie. Le serveur local et les contrôles techniques ne remplacent pas cette vérification.

## Suite de la QA

1. Capturer l’accueil à 2 048 × 921 px et la page métier à 1 280 × 720 px.
2. Tester le clic cartographique, la recherche, l’ouverture/fermeture du panneau, les liens et l’impression.
3. Contrôler la console du navigateur.
4. Comparer la capture d’accueil à la source puis corriger tout écart P0, P1 ou P2.

final result: blocked
