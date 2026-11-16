import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = 'https://codeofsagar.in';
const OUTPUT_DIR = process.cwd();

const visitedUrls = new Set();
const queue = [];
const assetQueue = new Set();

const KNOWN_ROUTES = [
  '/',
  '/work',
  '/work/secnd-soul',
  '/work/lijoi',
  '/work/marianna-caliandro',
  '/work/afflu',
  '/work/stratedgy',
  '/services',
  '/about',
  '/contact',
  '/faq',
  '/photography',
  '/playground',
  '/robots.txt',
  '/sitemap.xml'
];

const KNOWN_ASSETS = [
  '/models/sagar.glb',
  '/models/chair.glb',
  '/models/desk2.glb',
  '/models/macbook_ultra_concept.glb',
  '/models/services/chair.glb',
  '/models/anim/typing.glb',
  '/models/anim/jumping.glb',
  '/models/anim/armStretch.glb',
  '/models/anim/jump.glb',
  '/models/anim/standToSit.glb',
  '/models/anim/push.glb',
  '/audio/click.mp3',
  '/audio/whoosh.mp3',
  '/hero/hand-left.webp',
  '/hero/hand-right.webp',
  '/favicon.ico',
  '/favicon.svg',
  '/icon.png',
  '/apple-icon.png'
];

async function ensureDir(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

async function downloadFile(urlStr, localPath) {
  try {
    const res = await fetch(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });
    if (!res.ok) {
      console.warn(`[${res.status}] Failed to fetch ${urlStr}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await ensureDir(localPath);
    fs.writeFileSync(localPath, buffer);
    console.log(`[SAVED] (${buffer.length} bytes) ${urlStr} -> ${localPath}`);
    return buffer;
  } catch (err) {
    console.error(`Error downloading ${urlStr}:`, err.message);
    return null;
  }
}

function normalizeUrl(targetUrl, currentUrl) {
  try {
    const resolved = new URL(targetUrl, currentUrl);
    if (resolved.origin === new URL(BASE_URL).origin) {
      return resolved.href;
    }
  } catch (e) {}
  return null;
}

function extractAssetAndPageUrls(content, currentUrl) {
  // Regex to extract URLs from href, src, url(...), /assets/..., /images/..., /models/..., /audio/..., etc.
  const regexes = [
    /href=["']([^"']+)["']/g,
    /src=["']([^"']+)["']/g,
    /url\(["']?([^"')]+)["']?\)/g,
    /["'](\/_next\/[^"']+)["']/g,
    /["'](\/images\/[^"']+)["']/g,
    /["'](\/models\/[^"']+)["']/g,
    /["'](\/audio\/[^"']+)["']/g,
    /["'](\/hero\/[^"']+)["']/g,
    /["'](\/clients\/[^"']+)["']/g,
    /["'](\/showcase\/[^"']+)["']/g
  ];

  const found = new Set();
  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const u = match[1];
      if (u && !u.startsWith('data:') && !u.startsWith('#') && !u.startsWith('mailto:') && !u.startsWith('tel:')) {
        const full = normalizeUrl(u, currentUrl);
        if (full) found.add(full);
      }
    }
  }
  return Array.from(found);
}

async function main() {
  console.log('Starting Complete Clone of codeofsagar.in...');

  // 1. Enqueue known assets
  for (const asset of KNOWN_ASSETS) {
    assetQueue.add(new URL(asset, BASE_URL).href);
  }

  // 2. Fetch sitemap.xml to find all indexed URLs
  try {
    const sitemapUrl = `${BASE_URL}/sitemap.xml`;
    const res = await fetch(sitemapUrl);
    if (res.ok) {
      const text = await res.text();
      const locMatches = text.match(/<loc>([^<]+)<\/loc>/g);
      if (locMatches) {
        for (const loc of locMatches) {
          const u = loc.replace(/<\/?loc>/g, '').trim();
          if (!visitedUrls.has(u)) queue.push(u);
        }
      }
    }
  } catch (e) {
    console.warn('Could not fetch sitemap.xml:', e.message);
  }

  // Add KNOWN_ROUTES
  for (const route of KNOWN_ROUTES) {
    const full = new URL(route, BASE_URL).href;
    if (!queue.includes(full)) queue.push(full);
  }

  // 3. Process all pages
  while (queue.length > 0) {
    const current = queue.shift();
    if (visitedUrls.has(current)) continue;
    visitedUrls.add(current);

    console.log(`Processing page: ${current}`);
    const uObj = new URL(current);
    let pathname = uObj.pathname;
    let localPath;
    if (pathname.endsWith('/') || pathname === '') {
      localPath = path.join(OUTPUT_DIR, pathname, 'index.html');
    } else if (path.extname(pathname) === '') {
      localPath = path.join(OUTPUT_DIR, pathname + '.html');
      // Also save index.html in directory for clean folder routing
      const altPath = path.join(OUTPUT_DIR, pathname, 'index.html');
      await ensureDir(altPath);
    } else {
      localPath = path.join(OUTPUT_DIR, pathname);
    }

    const buf = await downloadFile(current, localPath);
    if (localPath.endsWith('.html') && !localPath.endsWith('index.html')) {
      const altPath = path.join(OUTPUT_DIR, pathname, 'index.html');
      if (buf) {
        await ensureDir(altPath);
        fs.writeFileSync(altPath, buf);
      }
    }

    if (buf) {
      const content = buf.toString('utf-8');
      const links = extractAssetAndPageUrls(content, current);
      for (const link of links) {
        const linkObj = new URL(link);
        const ext = path.extname(linkObj.pathname).toLowerCase();
        const isAsset = [
          '.js', '.css', '.woff', '.woff2', '.ttf', '.eot',
          '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif',
          '.mp3', '.ogg', '.wav', '.glb', '.gltf', '.bin',
          '.ico', '.txt', '.json', '.mp4', '.webm'
        ].includes(ext) || linkObj.pathname.includes('/assets/') || linkObj.pathname.includes('/models/') || linkObj.pathname.includes('/audio/');

        if (isAsset) {
          assetQueue.add(link);
        } else {
          if (!visitedUrls.has(link) && !queue.includes(link)) {
            queue.push(link);
          }
        }
      }
    }
  }

  // 4. Download all assets in queue
  console.log(`Downloading ${assetQueue.size} identified assets...`);
  const assetList = Array.from(assetQueue);
  let downloadedCount = 0;

  // Process in concurrency pool of 6
  const concurrency = 6;
  for (let i = 0; i < assetList.length; i += concurrency) {
    const chunk = assetList.slice(i, i + concurrency);
    await Promise.all(chunk.map(async (assetUrl) => {
      try {
        const u = new URL(assetUrl);
        let relPath = decodeURIComponent(u.pathname);
        if (relPath.startsWith('/')) relPath = relPath.slice(1);
        const dest = path.join(OUTPUT_DIR, relPath);
        
        // Also check if asset is CSS or JS, and recursively extract referenced fonts/images/chunks
        const buf = await downloadFile(assetUrl, dest);
        downloadedCount++;
        if (buf && (dest.endsWith('.css') || dest.endsWith('.js'))) {
          const text = buf.toString('utf-8');
          const nested = extractAssetAndPageUrls(text, assetUrl);
          for (const n of nested) {
            const nUrl = new URL(n);
            const nExt = path.extname(nUrl.pathname).toLowerCase();
            if (['.woff', '.woff2', '.ttf', '.png', '.jpg', '.webp', '.svg', '.glb', '.mp3', '.js', '.css'].includes(nExt) || nUrl.pathname.includes('/assets/')) {
              if (!assetQueue.has(n)) {
                assetQueue.add(n);
                assetList.push(n);
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error processing asset ${assetUrl}:`, err.message);
      }
    }));
  }

  console.log(`\nCrawl and download complete! Total pages: ${visitedUrls.size}, Total assets: ${downloadedCount}`);
}

main().catch(console.error);
