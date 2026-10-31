import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFile(path.join(root, relativePath), 'utf8');
const exists = async (relativePath) => {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
};

// Vite must resolve the same @/ alias already declared in jsconfig.json.
const viteConfig = await read('vite.config.js');
assert.match(viteConfig, /resolve\s*:\s*\{[\s\S]*alias\s*:\s*\{\s*['"]@['"]\s*:\s*srcDir/s,
  'Vite must map @ to the src directory.');
assert.equal(await exists('src/App.jsx'), true, 'Application entry module must exist.');
assert.equal(await exists('src/index.css'), true, 'Global stylesheet must exist.');

// Every local import needs to resolve before Vite starts bundling.
const sourceFiles = [];
await walk(path.join(root, 'src'), sourceFiles);
const supportedExtensions = ['', '.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.svg'];
const missing = [];
for (const absoluteFile of sourceFiles) {
  const content = await fs.readFile(absoluteFile, 'utf8');
  const imports = content.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g);
  for (const match of imports) {
    const specifier = match[1];
    if (!specifier.startsWith('@/') && !specifier.startsWith('.')) continue;
    const target = specifier.startsWith('@/')
      ? path.join(root, 'src', specifier.slice(2))
      : path.resolve(path.dirname(absoluteFile), specifier);
    const candidates = supportedExtensions.map((extension) => `${target}${extension}`);
    candidates.push(path.join(target, 'index.js'), path.join(target, 'index.jsx'));
    let found = false;
    for (const candidate of candidates) {
      if (await fileExists(candidate)) { found = true; break; }
    }
    if (!found) missing.push(`${path.relative(root, absoluteFile)} -> ${specifier}`);
  }
}
assert.deepEqual(missing, [], `Unresolved local imports:\n${missing.join('\n')}`);

// package.json declares ESM, so the Tailwind config must also be ESM.
const tailwindConfig = await read('tailwind.config.js');
assert.match(tailwindConfig, /export\s+default\s+\{/,
  'Tailwind config must use ESM export syntax.');
assert.doesNotMatch(tailwindConfig, /module\.exports|require\(/,
  'CommonJS config syntax is incompatible with this ESM package.');

// Production deployment and offline assets must have predictable routes.
const vercel = JSON.parse(await read('vercel.json'));
assert.ok(vercel.rewrites?.some((rule) => rule.destination === '/index.html'),
  'Vercel must serve index.html for client-side routes.');
for (const asset of ['public/sw.js', 'public/manifest.webmanifest', 'public/apex-mark.svg']) {
  assert.equal(await exists(asset), true, `${asset} is required for the standalone PWA.`);
}

// Node's Vite 8 runtime requirement is kept within the tested Node 22 LTS line.
const packageJson = JSON.parse(await read('package.json'));
assert.equal(packageJson.engines?.node, '>=22.12.0 <23', 'Pin builds to supported Node 22 versions.');

console.log(`APEX build preflight passed (${sourceFiles.length} source files; all local imports resolved).`);

async function walk(directory, files) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute, files);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) files.push(absolute);
  }
}

async function fileExists(filePath) {
  try { await fs.access(filePath); return true; } catch { return false; }
}
