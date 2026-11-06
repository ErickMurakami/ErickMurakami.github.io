# Econolyze V1 design audit

Inspected actual source in Econolyze: app/globals.css, app/page.tsx, app/layout.tsx, components/main-nav.tsx, components/parallax-hero.tsx, components/ui/button.tsx and components/ui/card.tsx. Revision is in projects.json.

- Hue 240 OKLCH tokens across both themes; dark background rgb(9,11,14), dark card .16/.015/240, primary .62/.2/240 and border .28/.02/240.
- Light background .94/.018/240, card .975/.01/240, primary .56/.2/240, border .78/.02/240. Preserve corresponding foreground, secondary, muted and ring tokens.
- Inter sans-serif, semibold labels, bold display headings; max-w-6xl shells, 24px horizontal padding, 80px sections, 24px card padding and 32px grid gaps.
- Base radius 10px, rounded-xl cards with thin border and slight shadow. Outline and solid-blue buttons; visible ring focus.
- Landing header is sticky with translucent background/backdrop blur. App navigation has active blue-tint surfaces, muted inactive labels and 200ms transitions. Portfolio adapts this into a wrapping top navigation rather than reproducing the product's bottom app tabs.
- Hero source uses canvas financial curves and parallax. Portfolio uses an editorial preview of the financial service’s transaction boundary, with a direct source link and its testing gap. It does not reproduce decorative charts or continuous rendering.
- Cards and grids collapse on small screens. Portfolio adds explicit reduced-motion support and persistent theme controls.

No original source repository was modified. Tokens are adapted as design reference; components are implemented in Astro without React or Next.js.
