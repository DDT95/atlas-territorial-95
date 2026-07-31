# Design QA — accueil de l’Atlas

- Source visual truth: `/var/folders/3h/px_6bwl96w50x8y34bkz_k_80000gn/T/codex-clipboard-6b873a3f-208e-4de1-a02f-1fd839981128.png`
- Intended implementation viewport: 1366 × 768 CSS px, device scale factor 1
- Source dimensions: 1919 × 1029 px, desktop browser capture
- State: page d’accueil, vue départementale, aucune commune sélectionnée
- Implementation screenshot: unavailable
- Density normalization: not applicable; implementation capture unavailable

## Full-view comparison evidence

The source capture was available and inspected. The local implementation compiled successfully, but the in-app browser blocked navigation to the local preview URL. A same-viewport rendered comparison could therefore not be produced.

## Focused-region comparison evidence

Blocked for the same reason. The intended focused regions were the bottom edge of the hero, the map caption, and the map hover state.

## Findings

- The source shows no indication above the fold that thematic cards follow the hero on shorter laptop screens.
- The source presents the map as clickable through its caption and commune selector, contrary to the requested temporary informational-only state.

## Changes implemented

- Added a persistent “Découvrir les thématiques” cue at the bottom of the hero.
- Added height-responsive rules for laptop viewports to reveal the beginning of the thematic section.
- Removed commune click handling and the commune selector from the map.
- Kept commune-name tooltips on hover and changed the map caption accordingly.

## Test evidence

- GitHub production build: passed.
- JavaScript/TypeScript bundling: passed.
- Local browser screenshot: blocked by browser URL policy.
- Primary interactions and console errors: not browser-verified.

## Comparison history

- Initial source finding: thematic section hidden below the fold; map suggests click interaction.
- Fix applied: shorter laptop hero/map, explicit thematic cue, hover-only map.
- Post-fix visual evidence: unavailable because local preview navigation was blocked.

final result: blocked
