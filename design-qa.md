# Design QA — galerie Comprendre

Date : 10 août 2026

## Cible

- Capture utilisateur du 10 août 2026 montrant six cartes trop étroites sur une seule ligne.
- Préserver l’identité visuelle des décryptages tout en rendant la section extensible.
- Empêcher les coupures disgracieuses dans les titres.

## Résultat

- La grille compressée est remplacée par une galerie horizontale à largeur de carte stable.
- Les cartes mesurent jusqu’à 340 px sur grand écran et environ 84 % de la largeur sur mobile.
- Les mots composés des titres utilisent des traits d’union insécables ; aucun mot n’est coupé entre deux lignes.
- Le défilement utilise l’aimantation par carte et accepte de nouvelles pages sans réduire les cartes existantes.
- Les boutons « Précédent » et « Suivant » sont fonctionnels, accessibles au clavier et correctement désactivés aux extrémités.
- Le compteur passe de `01 / 06` à `02 / 06` lorsque la galerie atteint sa seconde position sur un écran de 2048 px.
- Sur mobile, une carte complète et le début de la suivante restent visibles pour signaler le défilement horizontal.
- Aucun avertissement ni erreur applicative relevé dans la console.

## Points bloquants

Aucun P0, P1 ou P2 restant.

final result: passed
