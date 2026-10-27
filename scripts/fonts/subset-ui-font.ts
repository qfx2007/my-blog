import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'smol-toml';
import navfolioConfig from '../../navfolio.config';
import {
  getResolvedPageModule,
  getResolvedPageModuleI18n,
  isPageModuleEnabled,
} from '../../src/plugins/config';

type FontConfig = {
  en: string;
  zh: string;
  file: string;
};

const projectRoot = process.cwd();
const uiCharsPath = join(projectRoot, 'scripts/fonts/ui-chars.txt');
const contentCharsPath = join(projectRoot, 'scripts/fonts/content-chars.txt');
const friendCirclePath = join(projectRoot, 'public/friend-circle.json');
const fontConfig = readFontConfig();
const uiSubsetFontUrl = getSubsetFontUrl(fontConfig.file, 'ui');
const contentSubsetFontUrl = getSubsetFontUrl(fontConfig.file, 'content');
const uiOutputFontPath = resolveProjectPath(uiSubsetFontUrl);
const contentOutputFontPath = resolveProjectPath(contentSubsetFontUrl);
const sourceFontPath = resolveSourceFontPath(fontConfig.file);
const uiSubsetFontName = `${fontConfig.zh} UI Subset`;
const contentSubsetFontName = `${fontConfig.zh} Content Subset`;
const isWindows = process.platform === 'win32';
const venvBinDir = isWindows ? 'Scripts' : 'bin';
const pythonExe = isWindows ? 'python.exe' : 'python';
const pyftsubsetExe = isWindows ? 'pyftsubset.exe' : 'pyftsubset';
const pythonCommands = [
  join(projectRoot, '.venv', venvBinDir, pythonExe),
  'python',
  'python3',
].filter(
  (command, index, commands) =>
    (index === 0 ? existsSync(command) : true) && commands.indexOf(command) === index,
);
const contentSource = process.env.NAVFOLIO_CONTENT_SOURCE === 'docs' ? 'docs' : 'content';
const contentRoot = contentSource === 'docs' ? 'src/docs' : 'src/content';
const projectsModuleEnabled = isPageModuleEnabled(navfolioConfig, 'projects');
const resolvedVibeModule = getResolvedPageModule(navfolioConfig, 'vibe');
const vibeModuleEnabled = Boolean(resolvedVibeModule);
const vibeRouteEntrypoint = resolvedVibeModule?.routes?.[0]?.entrypoint;
const vibeRouteSourceFile = vibeRouteEntrypoint ? fileURLToPath(vibeRouteEntrypoint) : undefined;
const resolvedMediaModule = getResolvedPageModule(navfolioConfig, 'media');
const mediaModuleEnabled = Boolean(resolvedMediaModule);
const mediaRouteEntrypoint = resolvedMediaModule?.routes?.[0]?.entrypoint;
const mediaRouteSourceFile = mediaRouteEntrypoint ? fileURLToPath(mediaRouteEntrypoint) : undefined;

const sourceDirs = [
  'src/pages',
  'src/components',
  'src/layouts',
  'src/config',
  'src/utils',
  'src/i18n',
];
const sourceFiles = [
  ...(projectsModuleEnabled
    ? ['src/modules/routes/projects-index.astro', 'src/modules/routes/project-detail.astro']
    : []),
  ...(vibeRouteSourceFile ? [vibeRouteSourceFile] : []),
  ...(mediaRouteSourceFile ? [mediaRouteSourceFile] : []),
];
const contentFrontmatterDirs = [
  `${contentRoot}/blog`,
  ...(projectsModuleEnabled ? [`${contentRoot}/projects`] : []),
  ...(vibeModuleEnabled ? [`${contentRoot}/vibe`] : []),
  ...(mediaModuleEnabled ? [`${contentRoot}/media`] : []),
];
const lightweightContentDirs = [
  ...(vibeModuleEnabled ? [`${contentRoot}/vibe`] : []),
  ...(mediaModuleEnabled ? [`${contentRoot}/media`] : []),
];
const lightweightContentFiles = [
  `${contentRoot}/about.mdx`,
  `${contentRoot}/about.md`,
  ...(projectsModuleEnabled
    ? [`${contentRoot}/projects/index.mdx`, `${contentRoot}/projects/index.md`]
    : []),
];
const sourceExtensions = new Set(['.astro', '.ts', '.js', '.mjs', '.cjs', '.json', '.toml']);
const frontmatterExtensions = new Set(['.md', '.mdx']);
const frontmatterKeys = new Set([
  'title',
  'description',
  'subtitle',
  'note',
  'tags',
  'categories',
  'series',
  'creator',
]);
const cjkPattern =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\u3000-\u303f\uff00-\uffef]/u;

function readFontConfig(): FontConfig {
  const defaults: FontConfig = {
    en: 'Maple Mono',
    zh: 'ChillRoundM',
    file: '/fonts/ChillRoundM.ttf',
  };
  const siteConfigPath = join(projectRoot, 'src/config/site.toml');

  if (!existsSync(siteConfigPath)) return defaults;

  const parsed = parse(readFileSync(siteConfigPath, 'utf8')) as {
    config?: {
      fonts?: Partial<Record<keyof FontConfig, unknown>>;
    };
  };
  const fonts = parsed.config?.fonts ?? {};

  return {
    en: normalizeConfigString(fonts.en, defaults.en),
    zh: normalizeConfigString(fonts.zh, defaults.zh),
    file: normalizeConfigString(fonts.file, defaults.file),
  };
}

function getSubsetFontUrl(fontUrl: string, variant: 'ui' | 'content') {
  const queryIndex = fontUrl.search(/[?#]/);
  const suffix = queryIndex === -1 ? '' : fontUrl.slice(queryIndex);
  const path = queryIndex === -1 ? fontUrl : fontUrl.slice(0, queryIndex);
  const extensionIndex = path.lastIndexOf('.');
  const basePath = extensionIndex === -1 ? path : path.slice(0, extensionIndex);

  return `${basePath}-${variant}-subset.woff2${suffix}`;
}

function normalizeConfigString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function resolveProjectPath(value: string) {
  if (/^https?:\/\//i.test(value)) {
    throw new Error(
      `Font subsetting needs a local font file, but config.fonts.file received a remote URL: ${value}`,
    );
  }

  const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '');
  const relativePath = normalized.startsWith('public/') ? normalized : `public/${normalized}`;

  return join(projectRoot, relativePath);
}

function resolveSourceFontPath(value: string) {
  if (/^https?:\/\//i.test(value)) {
    throw new Error(
      `Font subsetting needs a local font file, but config.fonts.file received a remote URL: ${value}`,
    );
  }

  const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '');
  const candidates = [
    join(projectRoot, normalized.startsWith('public/') ? normalized : `public/${normalized}`),
    join(
      projectRoot,
      'src/assets',
      normalized.startsWith('public/') ? normalized.slice(7) : normalized,
    ),
    join(projectRoot, 'src/assets/fonts', normalized.split('/').pop() ?? normalized),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

function walkFiles(dir: string, extensions: Set<string>) {
  if (!existsSync(dir)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(path, extensions));
      continue;
    }

    if (entry.isFile() && extensions.has(extname(entry.name))) files.push(path);
  }

  return files;
}

function collectCjk(chars: Set<string>, text: string) {
  for (const char of text) {
    if (cjkPattern.test(char)) chars.add(char);
  }
}

function collectNonAscii(chars: Set<string>, text: string) {
  for (const char of text) {
    if ((char.codePointAt(0) ?? 0) > 0x7f) chars.add(char);
  }
}

function extractFrontmatter(text: string) {
  if (!text.startsWith('---')) return '';

  const endIndex = text.indexOf('\n---', 3);
  if (endIndex === -1) return '';

  return text.slice(3, endIndex);
}

function extractFrontmatterFields(frontmatter: string) {
  const values: string[] = [];
  let activeKey: string | null = null;

  for (const line of frontmatter.split(/\r?\n/)) {
    const keyMatch = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (keyMatch) {
      activeKey = keyMatch[1];
      if (frontmatterKeys.has(activeKey)) values.push(keyMatch[2]);
      continue;
    }

    if (activeKey && frontmatterKeys.has(activeKey) && /^\s+/.test(line)) {
      values.push(line);
    }
  }

  return values.join('\n');
}

function collectFriendCircleChars(
  chars: Set<string>,
  collect: (chars: Set<string>, text: string) => void = collectCjk,
) {
  if (!existsSync(friendCirclePath)) return;

  try {
    const data: unknown = JSON.parse(readFileSync(friendCirclePath, 'utf8'));
    const collectStrings = (value: unknown): void => {
      if (typeof value === 'string') {
        collect(chars, value);
      } else if (Array.isArray(value)) {
        for (const item of value) collectStrings(item);
      } else if (value && typeof value === 'object') {
        for (const nestedValue of Object.values(value)) collectStrings(nestedValue);
      }
    };

    collectStrings(data);
  } catch (error) {
    console.warn(`Unable to collect friend-circle characters from ${friendCirclePath}:`, error);
  }
}

function runSubset(textFile: string, outputFile: string) {
  const args = [
    sourceFontPath,
    `--text-file=${textFile}`,
    `--output-file=${outputFile}`,
    '--flavor=woff2',
    '--with-zopfli',
    '--layout-features=*',
    '--name-IDs=*',
    '--glyph-names',
    '--notdef-glyph',
    '--notdef-outline',
    '--recommended-glyphs',
    '--no-hinting',
  ];

  const commands = [
    { command: join(projectRoot, '.venv', venvBinDir, pyftsubsetExe), args },
    ...pythonCommands.map((command) => ({ command, args: ['-m', 'fontTools.subset', ...args] })),
  ];

  for (const { command, args: commandArgs } of commands) {
    const result = spawnSync(command, commandArgs, { stdio: 'inherit' });
    if (result.status === 0) {
      return;
    }

    if (result.error && 'code' in result.error && result.error.code === 'ENOENT') continue;
  }

  throw new Error(
    'Unable to run fonttools. Install it in the project virtual environment with `python3 -m venv .venv && .venv/bin/python -m pip install fonttools brotli`.',
  );
}

function syncSubsetFontName(outputFile: string, familyName: string) {
  const script = `
from fontTools.ttLib import TTFont
import sys

path = sys.argv[1]
family = sys.argv[2]
font = TTFont(path)
name_table = font['name']

for record in name_table.names:
    if record.nameID == 1:
        record.string = family.encode(record.getEncoding(), errors='replace')
    elif record.nameID == 2:
        record.string = 'Regular'.encode(record.getEncoding(), errors='replace')
    elif record.nameID == 4:
        record.string = f'{family} Regular'.encode(record.getEncoding(), errors='replace')
    elif record.nameID == 6:
        record.string = ''.join(part for part in f'{family}-Regular' if part.isalnum() or part == '-').encode(record.getEncoding(), errors='replace')

font.save(path)
`;
  let result;
  for (const command of pythonCommands) {
    result = spawnSync(command, ['-c', script, outputFile, familyName], {
      stdio: 'inherit',
    });
    if (result.status === 0) return;
  }

  throw new Error(
    `Generated subset font, but failed to sync its internal name to ${familyName}. Ensure Python 3 and fonttools are installed. Error: ${result?.error?.message ?? `status ${result?.status}`}`,
  );
}

const uiCharsSet = new Set<string>();

for (const contribution of getResolvedPageModuleI18n(navfolioConfig)) {
  collectCjk(uiCharsSet, JSON.stringify(contribution.messages));
}

for (const dir of sourceDirs) {
  for (const file of walkFiles(join(projectRoot, dir), sourceExtensions)) {
    collectCjk(uiCharsSet, readFileSync(file, 'utf8'));
  }
}

for (const file of sourceFiles) {
  const path = isAbsolute(file) ? file : join(projectRoot, file);
  if (existsSync(path)) collectCjk(uiCharsSet, readFileSync(path, 'utf8'));
}

for (const dir of contentFrontmatterDirs) {
  for (const file of walkFiles(join(projectRoot, dir), frontmatterExtensions)) {
    const frontmatter = extractFrontmatter(readFileSync(file, 'utf8'));
    collectCjk(uiCharsSet, extractFrontmatterFields(frontmatter));
  }
}

for (const dir of lightweightContentDirs) {
  for (const file of walkFiles(join(projectRoot, dir), frontmatterExtensions)) {
    collectCjk(uiCharsSet, readFileSync(file, 'utf8'));
  }
}

for (const file of lightweightContentFiles) {
  const path = join(projectRoot, file);
  if (existsSync(path)) collectCjk(uiCharsSet, readFileSync(path, 'utf8'));
}

// The sync Action writes RSS-derived display text before this build step.
collectFriendCircleChars(uiCharsSet);

const contentCharsSet = new Set(uiCharsSet);
for (const file of walkFiles(join(projectRoot, contentRoot), frontmatterExtensions)) {
  collectNonAscii(contentCharsSet, readFileSync(file, 'utf8'));
}
collectFriendCircleChars(contentCharsSet, collectNonAscii);

const uiChars = [...uiCharsSet].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!).join('');
const contentChars = [...contentCharsSet]
  .sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)
  .join('');
if (!uiChars) throw new Error('No CJK UI characters were found for font subsetting.');
if (!contentChars) throw new Error('No content characters were found for font subsetting.');

mkdirSync(join(projectRoot, 'scripts/fonts'), { recursive: true });
mkdirSync(dirname(uiOutputFontPath), { recursive: true });
mkdirSync(dirname(contentOutputFontPath), { recursive: true });
writeFileSync(uiCharsPath, `${uiChars}\n`, 'utf8');
writeFileSync(contentCharsPath, `${contentChars}\n`, 'utf8');

if (!existsSync(sourceFontPath)) {
  throw new Error(
    `${fontConfig.zh} source font not found. Place the full font at ${sourceFontPath}, or update config.fonts.file in src/config/site.toml.`,
  );
}

runSubset(uiCharsPath, uiOutputFontPath);
syncSubsetFontName(uiOutputFontPath, uiSubsetFontName);
runSubset(contentCharsPath, contentOutputFontPath);
syncSubsetFontName(contentOutputFontPath, contentSubsetFontName);

const contentSubsetSize = statSync(contentOutputFontPath).size;
if (contentSubsetSize > 1.5 * 1024 * 1024) {
  console.warn(
    `[fonts] Content subset is ${(contentSubsetSize / 1024 / 1024).toFixed(2)}MB. Consider switching to a common-character subset if it keeps growing.`,
  );
}

console.log(`Generated ${uiCharsPath} with ${uiChars.length} CJK UI characters.`);
console.log(`Generated ${contentCharsPath} with ${contentChars.length} content characters.`);
console.log(`Generated ${uiSubsetFontName} at ${uiOutputFontPath} from ${sourceFontPath}.`);
console.log(
  `Generated ${contentSubsetFontName} at ${contentOutputFontPath} (${(contentSubsetSize / 1024).toFixed(0)}KB).`,
);
