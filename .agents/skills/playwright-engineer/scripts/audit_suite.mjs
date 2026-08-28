#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const rootArg = args.find(a => !a.startsWith('--'));
const root = path.resolve(rootArg || process.cwd());
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'playwright-report', 'test-results', '.turbo', '.cache']);
const findings = [];

function walk(dir, maxDepth = 7, depth = 0, out = []) {
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

function add(severity, category, file, line, message) {
  findings.push({ severity, category, file: rel(file), line, message });
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function scanRegex(file, text, regex, severity, category, message) {
  for (const match of text.matchAll(regex)) add(severity, category, file, lineOf(text, match.index ?? 0), message);
}

const files = walk(root);
const configFiles = files.filter(f => /^playwright\.config\.[cm]?[jt]s$/.test(path.basename(f)));
const testFiles = files.filter(f => /\.(spec|test)\.[cm]?[jt]sx?$/.test(f) && /(?:^|\/)(?:e2e|tests?|playwright)(?:\/|$)/i.test(rel(f)));
const sourceFiles = [...new Set([...configFiles, ...testFiles])];

for (const file of sourceFiles) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  scanRegex(file, text, /\b(?:test|describe)\.only\s*\(/g, 'error', 'focus', 'Focused test committed (`.only`) can silently skip coverage.');
  scanRegex(file, text, /\bwaitForTimeout\s*\(/g, 'high', 'synchronization', 'Fixed sleep detected; wait for an observable condition instead.');
  scanRegex(file, text, /\bwaitForLoadState\s*\(\s*['"]networkidle['"]/g, 'medium', 'synchronization', '`networkidle` used as generic readiness; prefer a user-observable assertion or specific request condition.');
  scanRegex(file, text, /\bwaitForNavigation\s*\(/g, 'medium', 'navigation', '`waitForNavigation` detected; verify against current Playwright guidance and prefer `waitForURL`/web assertions when appropriate.');
  scanRegex(file, text, /\b(?:page|locator)\.\$\$?\s*\(/g, 'medium', 'locator', 'ElementHandle-style query detected; prefer Locator APIs for re-render safety and auto-waiting.');
  scanRegex(file, text, /\bforce\s*:\s*true\b/g, 'medium', 'actionability', '`force: true` bypasses actionability; confirm this is intentional and not masking a UI/test defect.');
  scanRegex(file, text, /expect\s*\(\s*await\s+[^\n;]*\.isVisible\s*\(\s*\)\s*\)\s*\.toBe\s*\(\s*true\s*\)/g, 'medium', 'assertion', 'Immediate `isVisible()` assertion detected; prefer web-first `await expect(locator).toBeVisible()`.');
  scanRegex(file, text, /\bsetTimeout\s*\(/g, 'medium', 'synchronization', 'Raw timer detected in Playwright test/config; verify it is not being used as a sleep.');
  scanRegex(file, text, /@playwright\/experimental-ct-(?:react|vue|svelte)/g, 'info', 'component-testing', 'Legacy experimental component-testing package detected; Playwright 1.62+ uses the built-in stories/galleries model.');
}

for (const file of configFiles) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  if (!/\bforbidOnly\s*:/.test(text)) add('info', 'ci', file, 1, '`forbidOnly` is not visible in this config; enable it on CI unless inherited elsewhere.');
  if (!/\btrace\s*:/.test(text)) add('info', 'diagnostics', file, 1, 'No trace policy is visible in this config; consider failure/retry traces for CI diagnostics.');
  if (!/\bscreenshot\s*:/.test(text)) add('info', 'diagnostics', file, 1, 'No automatic screenshot policy is visible in this config; consider failure screenshots when browser evidence would improve diagnostics.');
}

const authDir = path.join(root, 'playwright', '.auth');
if (fs.existsSync(authDir)) {
  const authFiles = walk(authDir, 3).filter(f => fs.statSync(f).isFile());
  if (authFiles.length) {
    const gitignore = fs.existsSync(path.join(root, '.gitignore')) ? fs.readFileSync(path.join(root, '.gitignore'), 'utf8') : '';
    const ignored = /(^|\n)\s*playwright\/\.auth\/?\s*($|\n)/m.test(gitignore) || /(^|\n)\s*\.auth\/?\s*($|\n)/m.test(gitignore);
    if (!ignored) add('error', 'security', path.join(root, '.gitignore'), 1, 'Authentication state files exist under `playwright/.auth` but that path is not clearly ignored.');
  }
}

const order = { error: 0, high: 1, medium: 2, info: 3 };
findings.sort((a, b) => (order[a.severity] - order[b.severity]) || a.file.localeCompare(b.file) || a.line - b.line);
const counts = findings.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; }, {});
const result = {
  root,
  scanned: { configFiles: configFiles.map(rel), testFileCount: testFiles.length },
  counts,
  findings,
  note: 'Heuristic audit only. Confirm each finding in repository context before changing code.'
};
console.log(JSON.stringify(result, null, 2));
if (strict && findings.some(f => f.severity === 'error' || f.severity === 'high')) process.exitCode = 2;
