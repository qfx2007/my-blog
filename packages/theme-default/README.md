# @navfolio/theme-default

Navfolio's built-in visual system. It supplies the default layout, components,
CSS tokens, and named theme slots without being imported by `@navfolio/core`.

## Development status

The first migration slice exports the stable theme manifest and the legacy
palette tokens. Layout and component entry points will be added one surface at
a time while the current Astro application continues to use its compatibility
adapter.

## Local development

For local verification, `tsconfig.json` resolves `@navfolio/core` to the
adjacent `../core` checkout. This is a compile-time convenience only: the
published package installs `@navfolio/core` as a one-way dependency.
