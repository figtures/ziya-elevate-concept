import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, 'media/manifest.json'), 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

for (const file of manifest.files) {
  const bytes = Buffer.concat(await Promise.all(file.parts.map((part) => readFile(resolve(root, part)))));
  if (bytes.length !== file.size || digest(bytes) !== file.sha256) {
    throw new Error(`Media integrity check failed: ${file.outputs[0]}`);
  }
  for (const output of file.outputs) {
    const target = resolve(root, output);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
  console.log(`Restored original media: ${file.outputs[0]} (${bytes.length} bytes)`);
}
