# @navfolio/plugin-markdown

Navfolio Markdown preset plugin.

This package composes the Markdown-related Astro, remark, and rehype plugins
used by Navfolio:

- `astro-expressive-code`
- `remark-math`
- `rehype-katex`
- `rehype-mathjax`
- `@navfolio/plugin-callout`
- `@navfolio/plugin-markdown-layouts`
- automatic Callout style injection
- Navfolio's Mermaid code-block transform
- Navfolio's responsive table wrapper

The package does not reimplement those upstream libraries. It provides a stable
Navfolio-level configuration interface for enabling, disabling, and ordering
them.

## Usage

```ts
import { defineNavfolioConfig } from './src/plugins/config';
import { markdownPlugin } from '@navfolio/plugin-markdown';

export default defineNavfolioConfig({
  plugins: [
    markdownPlugin({
      math: {
        enabled: true,
        renderer: 'katex',
      },
      callouts: true,
      layouts: true,
      mermaid: true,
      responsiveTables: true,
      expressiveCode: true,
    }),
  ],
});
```

## Options

```ts
markdownPlugin({
  enabled: true,
  expressiveCode: true,
  callouts: true,
  layouts: true,
  math: {
    enabled: true,
    renderer: 'katex',
  },
  mermaid: true,
  responsiveTables: true,
});
```

- `enabled`: disables the whole plugin when set to `false`.
- `callouts`: enables Obsidian-style callouts from `@navfolio/plugin-callout` and injects the default styles.
- `layouts`: enables local Markdown layout directives from `@navfolio/plugin-markdown-layouts` and injects responsive structural styles.
- `expressiveCode`: enables `astro-expressive-code`.
- `math`: enables `remark-math` and either `rehype-katex` or `rehype-mathjax`.
- `mermaid`: enables Navfolio's Mermaid code-block transform.
- `responsiveTables`: wraps generated Markdown tables for horizontal scrolling.

The default behavior matches Navfolio's current Markdown pipeline.
