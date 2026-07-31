# Design QA — accueil de l’Atlas

- Source visual truth: `/var/folders/3h/px_6bwl96w50x8y34bkz_k_80000gn/T/codex-clipboard-6b873a3f-208e-4de1-a02f-1fd839981128.png`
- Implementation screenshot: `/Volumes/Backup/Atlas du Val d'Oise/01_Socle_Atlas/qa-home-laptop.png`
- Source dimensions: 1920 × 1031 px, desktop browser capture
- Implementation dimensions: 1280 × 720 px
- CSS viewport: 1280 × 720 px, device scale factor 1
- Density normalization: the implementation was assessed at native CSS density; the source was used as structural reference because its browser/content viewport is larger.
- State: page d’accueil, vue départementale, aucune commune sélectionnée

## Full-view comparison evidence

The source and implementation were opened in the same comparison input. The implementation preserves the two-column hero, typographic hierarchy, departmental map card, pale blue background, header navigation, and commune search. At laptop height, the new thematic cue remains fully visible at the bottom of the hero without covering the search, metrics, map, or caption.

## Focused-region comparison evidence

No additional crop was required: the map caption, thematic cue, header controls, search controls, and commune boundaries are legible in the 1280 × 720 full-view capture.

## Fidelity surfaces

- Fonts and typography: Marianne is loaded and the hierarchy remains consistent. Laptop-specific sizing prevents headline or lead-text collision.
- Spacing and layout rhythm: the hero, map, caption, and thematic cue fit without overlap at 1280 × 720. The cue clearly signals content below the fold.
- Colors and visual tokens: existing blue, pale-blue, white, border, and shadow tokens are preserved.
- Image quality and assets: the official Préfet logo remains sharp and unchanged; the Leaflet basemap and commune outlines render correctly.
- Copy and content: map instructions now describe hover-only behavior; the thematic cue explicitly announces the ten readings.

## Interaction evidence

- Clicking the map does not change the URL or open a commune page.
- “Découvrir les thématiques” is a unique accessible link and scrolls to `#thematiques`.
- The “Choisir une thématique” heading becomes visible after activating the cue.
- Browser console errors checked: none.
- Production build: passed.

## Comparison history

- Initial P1: the thematic section was undiscoverable on short laptop screens. Fixed with a persistent thematic cue and height-responsive hero/map sizing.
- Initial P1: the map exposed click affordances and navigation. Fixed by removing polygon click handlers and the commune selector while preserving hover tooltips.
- Post-fix evidence: `qa-home-laptop.png` at 1280 × 720; both primary interactions passed.

## Remaining findings

No actionable P0, P1, or P2 findings remain for the requested scope.

final result: passed
