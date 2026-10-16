# @navfolio/plugin-callout

Obsidian-style callouts for Astro and Navfolio.

This package parses Markdown blockquotes that use Obsidian callout markers and
renders them as semantic HTML with Navfolio-ready classes, Lucide-style inline
SVG icons, and optional CSS.

## Features

- Obsidian syntax such as `> [!tip]` and `> [!faq]-`
- Collapsible callouts with `+` and `-`
- Type aliases compatible with Obsidian defaults
- Inline Lucide-style SVG icons
- Light and dark theme friendly CSS variables
- Direct `remarkPlugins` usage or Navfolio plugin usage

## Usage

```ts
import { calloutPlugin } from '@navfolio/plugin-callout';
import { defineNavfolioConfig } from './src/plugins/config';

export default defineNavfolioConfig({
  plugins: [calloutPlugin()],
});
```

Import the default styles once in your global stylesheet:

```css
@import '@navfolio/plugin-callout/styles.css';
```

You can also use the remark plugin directly in Astro:

```js
import remarkCallouts from '@navfolio/plugin-callout';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkCallouts],
  },
});
```

## Markdown

```md
> [!tip] Custom title
> Use callouts to highlight important context.

> [!faq]- Collapsed by default
> The minus marker renders a collapsed `<details>` element.

> [!warning]+ Expanded by default
> The plus marker renders an open `<details>` element.
```

## Supported Types

The default type set follows Obsidian's callout names and aliases: `note`,
`abstract`, `summary`, `tldr`, `info`, `todo`, `tip`, `hint`, `important`,
`success`, `check`, `done`, `question`, `help`, `faq`, `warning`, `caution`,
`attention`, `failure`, `fail`, `missing`, `danger`, `error`, `bug`, `example`,
`quote`, and `cite`.
