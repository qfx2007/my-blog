import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
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

// bun 将 file: 依赖物理复制进 node_modules（安装时刻的快照，其中没有之后编译出的
// dist），且安装位置按 bun.lock 可能在根 node_modules，也可能嵌套在依赖它的包内
// （如 node_modules/@navfolio/pages/node_modules/@navfolio/page-media）。因此同步
// 前先搜索该包的所有已安装位置（根 + 同 scope 各包的嵌套 node_modules + packages/
// 自身的 node_modules），每个位置都要写入 dist，否则类型解析与运行时都会找不到入口。
function findInstalledDirs(name: string, allPackages: PackageInfo[]): string[] {
  const segments = name.split('/');
  const found: string[] = [];
  const nodeModulesDirs = [
    join(projectRoot, 'node_modules'),
    ...allPackages.map((pkg) => join(pkg.dir, 'node_modules')),
  ];

  for (const nodeModulesDir of nodeModulesDirs) {
    if (!existsSync(nodeModulesDir)) {
      continue;
    }

    const direct = join(nodeModulesDir, ...segments);

    if (existsSync(join(direct, 'package.json'))) {
      found.push(direct);
    }

    const scopeDir = join(nodeModulesDir, segments[0]);

    if (!existsSync(scopeDir)) {
      continue;
    }

    for (const entry of readdirSync(scopeDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const nested = join(scopeDir, entry.name, 'node_modules', ...segments);

      if (existsSync(join(nested, 'package.json'))) {
        found.push(nested);
      }
    }
  }

  return found;
}

function syncDist(pkg: PackageInfo, allPackages: PackageInfo[]): void {
  const sourceDist = join(pkg.dir, 'dist');
  const rootInstallDir = join(projectRoot, 'node_modules', ...pkg.name.split('/'));
  // 目标 = 所有已安装位置（嵌套副本等）∪ 根 node_modules。bun 可能只把间接依赖装进
  // 嵌套位置（如 node_modules/@navfolio/pages/node_modules/@navfolio/page-media），
  // 而 packages/<pkg>/src 的源码解析走 packages/<pkg>/node_modules → 根 node_modules，
  // 所以根位置必须始终存在（bun 没装就整包补一份）。
  const targets = new Set([...findInstalledDirs(pkg.name, allPackages), rootInstallDir]);

  for (const targetDir of targets) {
    if (!existsSync(join(targetDir, 'package.json'))) {
      cpSync(pkg.dir, targetDir, { recursive: true });
      continue;
    }

    const targetDist = join(targetDir, 'dist');
    rmSync(targetDist, { recursive: true, force: true });
    cpSync(sourceDist, targetDist, { recursive: true });
  }

  console.log(`[packages:build] synced ${pkg.name} dist -> ${targets.size} location(s)`);
}

if (!existsSync(tscPath)) {
  console.error(`[packages:build] TypeScript compiler not found: ${tscPath}`);
  process.exit(1);
}

const allPackages = readPackages();
const buildablePackages = sortPackages(allPackages);

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

  syncDist(pkg, allPackages);
}

console.log(`[packages:build] built ${buildablePackages.length} packages`);
