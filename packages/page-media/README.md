# @navfolio/page-media

An optional Navfolio page module for a single, anchor-linked shelf of books,
films, series, albums, and podcasts. The desktop page keeps a compact section
index on the right; on small screens the same index moves above the content.

## Install and register

```ts
import { mediaModule } from '@navfolio/page-media';

export default defineNavfolioConfig({
  modules: [
    mediaModule({
      route: '/media',
      label: '书影音',
    }),
  ],
});
```

Omit the module, or set `enabled: false`, to remove the route, navigation
target, content collection, and scaffold command.

## Content contract

The host must expose a `media` Astro content collection rooted at
`src/content/media/`. Each entry is a Markdown or MDX file.

```yaml
---
title: 'The Left Hand of Darkness'
creator: 'Ursula K. Le Guin'
type: book # book | film | series | album | podcast
status: completed # completed | in-progress | planned | abandoned
completedAt: 2026-07-20
cover: '../../assets/media/left-hand-of-darkness.jpg' # local or HTTPS URL
coverAspect: portrait # portrait | landscape | square | wide; overrides the type default
rating: 5 # optional; 1–5
tags: [science-fiction, reread]
externalUrl: 'https://example.com/work'
draft: false
---
A short personal note is optional, but recommended.
```

The package publishes this starter content as `templates/default.md` instead of
embedding it in TypeScript. Add
`"media:new": "bun scripts/new-content.ts media"` to the host scripts, then
create a draft in the default or an explicit output directory:

```bash
bun run media:new work-slug
bun run media:new work-slug src/content/drafts
```

The filename is also used as the initial `title`. Pass `--mdx` when the entry
needs MDX.

## WeRead Sync

`@navfolio/weread-sync` can provide the automated book metadata: title,
creators, cover, completion state, reading progress, and deep link. Keep the
generated WeRead snapshot private to CI, then map its public fields into media
entries or a build-time data layer. Personal ratings and notes stay local to
the site; the sync tool intentionally does not export annotations or reviews.
