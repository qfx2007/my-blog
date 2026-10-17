import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();
const packagesDir = join(projectRoot, 'packages');
const tscPath = join(projectRoot, 'node_modules', 'typescript', 'lib', 'tsc.js');

type PackageInfo = {
  name: string;
  dir: string;
  deps: string[];
  hasBuild: boolean;
};

function readPackages(): PackageInfo[] {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = join(packagesDir, entry.name);
      const packageJsonPath = join(dir, 'package.json');

      if (!existsSync(packageJsonPath)) {
        return null;
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      const deps = new Set<string>();

      for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
        const entries = packageJson[field];

        if (!entries) {
          continue;
        }

        for (const [name, spec] of Object.entries(entries)) {
          if (name.startsWith('@navfolio/') && String(spec).startsWith('file:')) {
            deps.add(name);
          }
        }
      }

      return {
        name: packageJson.name,
        dir,
        deps: [...deps],
        hasBuild: Boolean(packageJson.scripts?.build),
      };
    })
    .filter((pkg): pkg is PackageInfo => pkg !== null);
}

function sortPackages(packages: PackageInfo[]): PackageInfo[] {
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const ordered: PackageInfo[] = [];

  function visit(name: string): void {
    if (visited.has(name)) {
      return;
    }

    if (visiting.has(name)) {
      throw new Error(`Dependency cycle detected while building packages: ${name}`);
    }

    visiting.add(name);

    for (const dep of byName.get(name)?.deps ?? []) {
      visit(dep);
    }

    visiting.delete(name);
    visited.add(name);

    const pkg = byName.get(name);

    if (pkg?.hasBuild) {
      ordered.push(pkg);
    }
  }

  for (const name of packages.map((pkg) => pkg.name).sort()) {
    visit(name);
  }

  return ordered;
}

if (!existsSync(tscPath)) {
  console.error(`[packages:build] TypeScript compiler not found: ${tscPath}`);
  process.exit(1);
}

const buildablePackages = sortPackages(readPackages());

for (const pkg of buildablePackages) {
  console.log(`[packages:build] building ${pkg.name}`);

  const result = spawnSync(process.execPath, [tscPath, '-p', 'tsconfig.json'], {
    cwd: pkg.dir,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error(`[packages:build] failed: ${pkg.name}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`[packages:build] built ${buildablePackages.length} packages`);
