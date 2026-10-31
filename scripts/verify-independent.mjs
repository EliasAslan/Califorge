import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};
assert.equal(Object.keys(allDependencies).some((name) => name.startsWith('@base44/')), false, 'Base44 packages must not be installed');
assert.equal(await exists(path.join(root, 'base44')), false, 'Base44 project folder must not exist');
assert.equal(await exists(path.join(root, 'src/api/base44Client.js')), false, 'Base44 API client must not exist');

const viteConfig = await fs.readFile(path.join(root, 'vite.config.js'), 'utf8');
assert.equal(viteConfig.includes('@base44'), false, 'Vite config must not load the Base44 plugin');
const hooks = await fs.readFile(path.join(root, 'src/hooks/useTrainingData.js'), 'utf8');
assert.equal(hooks.includes('@/lib/localDatabase'), true, 'Training hooks must use the local data store');

const sourceRoot = path.join(root, 'src');
const files = [];
await walk(sourceRoot, files);
const forbidden = /@base44\/|__B44_DB__|VITE_BASE44_|base44_access_token|db\.entities\.|db\.auth\./;
for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  assert.equal(forbidden.test(text), false, `Platform dependency remains in ${path.relative(root, file)}`);
}

console.log('APEX standalone dependency checks passed.');

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function walk(dir, result) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(fullPath, result);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) result.push(fullPath);
  }
}
