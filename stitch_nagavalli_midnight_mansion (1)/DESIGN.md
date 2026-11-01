---
name: The Ancestral Manor
colors:
  surface: '#131411'
  surface-dim: '#131411'
  surface-bright: '#3a3936'
  surface-container-lowest: '#0e0e0b'
  surface-container-low: '#1c1c19'
  surface-container: '#20201d'
  surface-container-high: '#2a2a27'
  surface-container-highest: '#353531'
  on-surface: '#e5e2dd'
  on-surface-variant: '#d9c1c2'
  inverse-surface: '#e5e2dd'
  inverse-on-surface: '#31302d'
  outline: '#a18b8d'
  outline-variant: '#544244'
  surface-tint: '#ffb2ba'
  primary: '#ffb2ba'
  on-primary: '#5b1725'
  primary-container: '#641e2b'
  on-primary-container: '#e58490'
  inverse-primary: '#964551'
  secondary: '#e3c284'
  on-secondary: '#402d00'
  secondary-container: '#5c4613'
  on-secondary-container: '#d4b477'
  tertiary: '#b7cbbf'
  on-tertiary: '#23342b'
  tertiary-container: '#2a3b32'
  on-tertiary-container: '#91a599'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd9dc'
  primary-fixed-dim: '#ffb2ba'
  on-primary-fixed: '#3f0211'
  on-primary-fixed-variant: '#782e3a'
  secondary-fixed: '#ffdea2'
  secondary-fixed-dim: '#e3c284'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5a4311'
  tertiary-fixed: '#d3e7db'
  tertiary-fixed-dim: '#b7cbbf'
  on-tertiary-fixed: '#0e1f17'
  on-tertiary-fixed-variant: '#394b41'
  background: '#131411'
  on-background: '#e5e2dd'
  surface-variant: '#353531'
typography:
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.01em
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Source Sans 3
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Source Sans 3
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Source Sans 3
    fontSize: 1rem
    fontWeight: '600'
    letterSpacing: 0.05em
  label-md:
    fontFamily: Source Sans 3
    fontSize: 0.875rem
    fontWeight: '600'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 0.75rem
    fontWeight: '600'
    letterSpacing: 0.08em
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 3rem
---

## Brand & Style

This design system establishes an atmospheric, cinematic, dark-mode-first aesthetic tailored for a gothic horror experience set within a decaying ancestral Kerala mansion. The visual narrative balances oppressive antiquity with suffocating elegance. 

- **Brand Personality:** Haunted, meticulous, claustrophobic, and deeply reverent of decaying heritage.
- **Target Audience:** Horror enthusiasts, narrative-driven gamers, and connoisseurs of moody, atmospheric art direction.
- **Emotional Response:** Unease, morbid curiosity, creeping dread, and the heavy weight of inherited family sins.
- **Design Style:** High-Contrast / Bold mixed with tactile editorial dark mode. It relies on deep, light-absorbing textures, razor-sharp serif focal points, and deliberate pools of warm, flickering illumination against absolute darkness.

## Colors

The palette is engineered to evoke tarnished heirlooms, decaying tropical woodwork, and the sickly glow of oil lamps in damp corridors. 

- **Primary:** Deep burgundy (`#641E2B`) for critical alerts, blood-soaked narrative notes, and interactive focal states.
- **Secondary:** Antique gold (`#C5A66A`) and candlelight amber (`#D99B51`) for precious UI framing, active states, and legible text over deep backgrounds.
- **Tertiary:** Midnight forest green (`#14251D`) and moss green (`#52664A`) for environmental grounding, secondary containers, and shadows that mimic encroaching overgrowth.
- **Neutral:** Near black (`#151512`) serves as the true obsidian canvas, while aged walnut (`#493326`) anchors structural panels.
- **Text & Accents:** Warm ivory (`#F0E5CF`) is the standard text color, offering high readability without blinding the player in dark environments.

## Layout & Spacing

The layout model utilizes a fixed grid system encased within heavy architectural borders, mimicking the rigid, symmetrical floor plans of traditional Nalukettu (Kerala ancestral homes) warped by architectural impossibility.

- **Grid:** 12-column structural layout with generous outer margins to maintain a claustrophobic, letterboxed cinematic framing.
- **Rhythm:** Generous vertical spacing (`space-xl`) separates major narrative blocks, while tight component spacing (`space-sm`) enforces dense, tactile inventory management screens.
- **Responsiveness:** On mobile, margins collapse to `1rem` and fluid grids stack into single-column vertical scrolls to simulate inspecting tight corridors and dusty ledgers.

## Elevation & Depth

Elevation is achieved through oppressive shadow layering and low-contrast outlines rather than modern floating cards. 

- **Ambient Shadows:** Deep, dark-tinted drop shadows (using near black with high blur radii) create the illusion of objects receding into heavy shadows or resting upon recessed wooden panels.
- **Borders & Framing:** Elements are anchored by fine, low-opacity antique gold or aged walnut outlines (`#C5A66A` at 30% opacity) that simulate tarnished brass inlays.
- **Surface Tiers:** Background canvases are pitch-black (`#151512`), while interactive containers use midnight forest green (`#14251D`) to lift slightly out of the dark without breaking the gloom.

## Shapes

The shape language is strictly **Sharp (0)**, reflecting the rigid joinery of heavy teak wood furniture, iron window bars, and ancestral picture frames. 

- **Corners:** All containers, buttons, and input fields maintain 0px border radii. 
- **Accents:** Inner corner notches or double-stroke borders may be used selectively on primary buttons and dialogue boxes to evoke traditional wood-carving motifs.

## Components

Components must feel like physical artifacts discovered within the mansion.

- **Buttons:** Sharp-cornered rectangles featuring aged walnut backgrounds with antique gold borders. On hover or focus, they shift to candlelight amber, accompanied by a subtle inner glow.
- **Input Fields:** Dark, recessed text areas enclosed by thin moss green or gold borders, featuring warm ivory caret markers and placeholder text that reads like fading ink.
- **Checkboxes & Radios:** Rendered as miniature carved wooden tiles or brass stamps. Checked states fill with deep burgundy accompanied by a stark antique gold checkmark or inset diamond.
- **Cards & Inventory Slots:** Designed as framed parchment or dark wood cells. They feature subtle inner drop shadows to make items (keys, letters, talismans) appear physically resting inside shallow compartments.
- **Chips & Tags:** Compact, uppercase labels bordered in gold, used to categorize journal entries, key items, or threat levels (e.g., "LOCKED", "CORRUPTED", "QUEST ITEM").
- **Narrative Log:** A specialized full-width container styled like an old ledger page, featuring warm ivory backgrounds, faint ruling lines, and Playfair Display typography for reading recovered lore.