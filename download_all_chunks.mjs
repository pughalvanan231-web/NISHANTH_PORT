import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://codeofsagar.in';
const ROOT_DIR = process.cwd();
const CHUNKS_DIR = path.join(ROOT_DIR, '_next', 'static', 'immutable', 'chunks');

async function ensureDir(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

async function download(url, dest) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[${res.status}] Failed: ${url}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await ensureDir(dest);
    fs.writeFileSync(dest, buf);
    console.log(`[SAVED] ${url} -> ${dest} (${buf.length} bytes)`);
    return true;
  } catch (err) {
    console.error(`Error downloading ${url}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('Scanning for all referenced chunks...');

  const chunkSet = new Set();
  const regex = /["'](static\/immutable\/chunks\/[^"']+\.js)["']/g;

  // Scan all existing files in _next/
  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.html')) {
        const text = fs.readFileSync(full, 'utf8');
        let m;
        while ((m = regex.exec(text)) !== null) {
          chunkSet.add(m[1]);
        }
        // Also look for /asset/static/immutable/chunks/
        const re2 = /["'](\/_next\/static\/immutable\/chunks\/[^"']+\.js)["']/g;
        let m2;
        while ((m2 = re2.exec(text)) !== null) {
          chunkSet.add(m2[1].replace(/^\/_next\//, ''));
        }
      }
    }
  }

  scan(ROOT_DIR);
  console.log(`Found ${chunkSet.size} chunk references in total.`);

  // Iteratively download chunks and scan newly downloaded chunks for further references
  const queue = Array.from(chunkSet);
  let downloaded = 0;

  while (queue.length > 0) {
    const chunkRel = queue.shift();
    const dest = path.join(ROOT_DIR, '_next', chunkRel);
    const url = `${BASE_URL}/asset/${chunkRel}`;

    if (!fs.existsSync(dest)) {
      const ok = await download(url, dest);
      if (ok) {
        downloaded++;
        // Scan this newly downloaded file for more chunk references
        const content = fs.readFileSync(dest, 'utf8');
        let m;
        while ((m = regex.exec(content)) !== null) {
          if (!chunkSet.has(m[1])) {
            chunkSet.add(m[1]);
            queue.push(m[1]);
          }
        }
      }
    }
  }

  console.log(`Downloaded ${downloaded} new chunks. Total chunks in catalog: ${chunkSet.size}`);
}

main().catch(console.error);
