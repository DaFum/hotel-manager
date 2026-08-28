#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'playwright-report', 'test-results', '.turbo', '.cache']);

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  } catch {
    return null;
  }
}

function walk(dir, maxDepth = 5, depth = 0, out = []) {
  if (depth > maxDepth) return out;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, maxDepth, depth + 1, out);
    else out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

const pkg = readJson('package.json') || {};
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.peerDependencies || {}) };
const lockfiles = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json', 'bun.lock', 'bun.lockb'].filter(exists);
let packageManager = pkg.packageManager || null;
if (!packageManager) {
  if (lockfiles.includes('pnpm-lock.yaml')) packageManager = 'pnpm';
  else if (lockfiles.includes('yarn.lock')) packageManager = 'yarn';
  else if (lockfiles.includes('package-lock.json')) packageManager = 'npm';
  else if (lockfiles.some(x => x.startsWith('bun.lock'))) packageManager = 'bun';
}

const files = walk(root);
const configPatterns = [
  /^playwright\.config\.(ts|js|mts|mjs|cts|cjs)$/,
  /^vite\.config\.(ts|js|mts|mjs|cts|cjs)$/,
  /^next\.config\.(ts|js|mts|mjs|cts|cjs)$/,
  /^tsconfig(?:\.[^.]+)?\.json$/,
];
const configs = files.filter(f => configPatterns.some(re => re.test(path.basename(f)))).map(rel).sort();
const testFiles = files.filter(f => /(?:^|\/)(?:e2e|tests?|playwright)(?:\/|$)/i.test(rel(f)) && /\.(spec|test)\.[cm]?[jt]sx?$/.test(f)).map(rel).sort();
const instructionFiles = files.filter(f => /(?:^|\/)(AGENTS\.md|CLAUDE\.md|CODEX\.md)$/i.test(rel(f))).map(rel).sort();
const ciFiles = files.filter(f => /^\.github\/workflows\/.*\.ya?ml$/.test(rel(f)) || /(^|\/)(gitlab-ci\.yml|azure-pipelines\.ya?ml)$/.test(rel(f))).map(rel).sort();

const framework = {
  react: deps.react || null,
  next: deps.next || null,
  vite: deps.vite || null,
  typescript: deps.typescript || null,
};

const playwrightPackages = Object.fromEntries(
  Object.entries(deps).filter(([name]) => name === '@playwright/test' || name === 'playwright' || name.startsWith('@playwright/experimental-ct-'))
);

const result = {
  root,
  packageManager,
  lockfiles,
  packageJson: exists('package.json'),
  scripts: pkg.scripts || {},
  workspaces: pkg.workspaces || null,
  framework,
  playwrightPackages,
  configs,
  instructionFiles,
  ciFiles,
  testFileCount: testFiles.length,
  testFiles: testFiles.slice(0, 200),
  truncatedTestFiles: testFiles.length > 200,
  hints: [
    playwrightPackages['@playwright/experimental-ct-react'] ? 'Legacy experimental React component testing package detected; verify installed Playwright version before migration.' : null,
    framework.next ? 'Next.js detected; inspect App Router/Pages Router and prefer production-build E2E when practical.' : null,
    framework.vite ? 'Vite detected; use a deterministic port when Playwright baseURL depends on local server orchestration.' : null,
  ].filter(Boolean),
};

console.log(JSON.stringify(result, null, 2));
