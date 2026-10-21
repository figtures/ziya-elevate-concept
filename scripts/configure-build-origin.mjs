import { readFile, writeFile } from 'node:fs/promises';
import { resolveDeploymentConfig } from '../cms/domain.mjs';

const path = new URL('../cms/config.json', import.meta.url);
const config = JSON.parse(await readFile(path, 'utf8'));
const resolved = resolveDeploymentConfig(config, process.env.SITE_URL);
// Preserve production canonical identity when SITE_URL points to a development host.
if (process.env.SITE_URL !== undefined) {
  await writeFile(path, JSON.stringify(resolved) + '\n');
}
console.log(`Site origin: ${resolved.siteOrigin}; canonical: ${resolved.canonicalOrigin}`);
