import { readFile, writeFile } from 'node:fs/promises';
import { resolveDeploymentConfig } from '../cms/domain.mjs';

const path = new URL('../cms/config.json', import.meta.url);
const config = JSON.parse(await readFile(path, 'utf8'));
const resolved = resolveDeploymentConfig(config, process.env.SITE_URL);
// A normal build preserves committed settings. An explicit build variable overrides all consumers.
if (process.env.SITE_URL !== undefined) {
  await writeFile(path, JSON.stringify(resolved) + '\n');
}
console.log(`Site origin: ${resolved.canonicalOrigin}`);
