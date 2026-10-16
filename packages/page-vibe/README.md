# @navfolio/page-vibe

Vibe page module for Navfolio. This package owns the Vibe route, page UI,
progressive stream behavior, image layout, and scaffold metadata.

Install and register this package when a site needs Vibe. The host supplies only
shared theme/runtime components; page-specific markup, styles, and browser logic
remain independently versioned here.

```ts
import { vibeModule } from '@navfolio/page-vibe';

export default defineNavfolioConfig({
  modules: [
    vibeModule({
      route: '/space',
    }),
  ],
});
```

Registering the module injects its package-owned Astro route. Setting
`enabled: false` or omitting the module removes the route, content collection,
navigation target, and scaffold command from the host build.

## Content scaffold

The default document lives in `templates/default.md`, so module authors can
change frontmatter and starter content without editing TypeScript. Register the
standard host script as `"vibe:new": "bun scripts/new-content.ts vibe"`, then
run:

```bash
bun run vibe:new today-note
bun run vibe:new today-note src/content/drafts
```

The filename becomes the initial title and output basename. `--mdx` can
override the default `.md` extension.

## Host contract

The route consumes the stable `virtual:navfolio/page-runtime` module supplied by
the Navfolio host. That runtime provides the shared head, navigation, footer,
image components, zoom behavior, site configuration, language resolution, and
decorative asset URL without exposing host-relative source paths.
