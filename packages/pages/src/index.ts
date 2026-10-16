export { projectsModule } from '@navfolio/page-projects';
export { mediaModule } from '@navfolio/page-media';
export { vibeModule } from '@navfolio/page-vibe';
export {
  defaultPageModules,
  getConfiguredPageModules,
  getPageModuleRoute,
  getResolvedPageModule,
  getResolvedPageModuleScaffolds,
  getResolvedPageModuleI18n,
  getResolvedPageModules,
  isPageModuleEnabled,
  normalizeModuleRoute,
} from './config.js';
export { pages } from './plugin.js';
export { renderScaffoldTemplate } from './scaffold.js';
export type {
  NavfolioContentExtension,
  NavfolioPageModule,
  NavfolioPageModuleBuiltinId,
  NavfolioPageModuleId,
  NavfolioPageModuleNav,
  NavfolioPageModuleOptions,
  NavfolioPageModuleRoute,
  NavfolioPageModuleScaffold,
  NavfolioPagesPlugin,
  NavfolioScaffoldTemplateContext,
  NavfolioScaffoldTemplateVariable,
  ResolvedNavfolioPageModule,
} from './types';
