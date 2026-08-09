# Design QA — page Sources & données

Date : 5 août 2026

## Cible

- Ajouter les quatre pages « Comprendre » à l’inventaire des sources.
- Corriger le manque de contraste du bandeau final bleu foncé.
- Préserver la structure graphique et la lisibilité du tableau existant.

## Résultat

- Une nouvelle section « Pages Comprendre » documente Domicile–travail, Sol & formes urbaines, Nature & adaptation et Logement & modes de vie.
- Chaque ligne précise la source principale, le sujet expliqué et son état « Connecté ».
- La numérotation est continue : la recommandation finale devient l’étape 05.
- Le libellé « À retenir » passe du bleu au jaune clair sur fond bleu foncé.
- Le texte du bandeau final passe au blanc cassé pour une lecture plus nette.
- Le tableau reste en quatre colonnes sur desktop et passe en pile sur petit écran.
- Aucun message d’erreur applicatif relevé pendant le contrôle local.

## Points bloquants

Aucun P0, P1 ou P2 restant.

final result: passed

## Pass — accès à la carte éclipse

- Source visual truth: user capture `Capture d’écran 2026-08-09 à 15.45.21.png`.
- Implementation evidence: `implementation-eclipse-link.png`, viewport 1440 × 1024.
- Added “Où voir l’éclipse ? · 2026 ↗” beside “Explorer en 3D”, reusing the exact `map-3d-link` component and opening `https://ddt95.github.io/eclipse95/` in a new tab.
- GitHub Pages production build passes; no actionable P0/P1/P2 finding remains.

final result: passed

## Ajout du 5 août 2026 — accès à Vo-3D

- Le lien « Explorer en 3D · bêta » est placé dans la légende inférieure, à droite de la carte départementale, comme sur la zone indiquée dans la capture de référence.
- Le traitement reste secondaire : petit bouton clair bordé, typographie Marianne, couleurs bleu institutionnel et cyan du système existant.
- Le texte d’aide cartographique reste visible à gauche et l’ensemble se replie sans chevauchement sur mobile.
- Le lien ouvre la publication GitHub Pages de Vo-3D dans un nouvel onglet.
- Constructions GitHub Pages et production réussies.

final result: passed
