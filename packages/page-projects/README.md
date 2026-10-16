# @navfolio/page-projects

Projects page module for Navfolio.

Most users should import `projectsModule` from `@navfolio/pages`, which
aggregates the built-in page modules. This package exists so the Projects module
can be maintained and versioned independently.

```ts
import { projectsModule } from '@navfolio/page-projects';

export default defineNavfolioConfig({
  modules: [
    projectsModule({
      route: '/work',
    }),
  ],
});
```

## Content scaffold

The module publishes an editable Markdown template at
`templates/default.md`. After registering the module, expose the standard
Navfolio script in the host:

```json
{
  "scripts": {
    "project:new": "bun scripts/new-content.ts project"
  }
}
```

Create a project with its default content directory, or choose another
project-relative output directory:

```bash
bun run project:new my-project
bun run project:new my-project src/content/drafts
```

The filename is also used as the initial `title`. The template supports
`<%= title %>`, `<%= slug %>`, `<%= isoDate %>`, `<%= date %>`, and the
`| yaml` filter for YAML-safe scalar values.
