import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 3000;
const ROOT_DIR = process.cwd();
const CHUNKS_DIR = path.join(ROOT_DIR, '_next', 'static', 'immutable', 'chunks');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.txt': 'text/plain; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream'
};

function serveFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Internal Server Error: ${err.message}`);
      return;
    }
    res.writeHead(statusCode, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // 1. Handle Next.js Image Optimization route: /_next/image?url=...
  if (pathname === '/_next/image') {
    const targetImg = parsedUrl.searchParams.get('url');
    if (targetImg) {
      const decodedImg = decodeURIComponent(targetImg);
      const imgRel = decodedImg.startsWith('/') ? decodedImg.slice(1) : decodedImg;
      const imgPath = path.join(ROOT_DIR, imgRel);
      if (fs.existsSync(imgPath) && fs.statSync(imgPath).isFile()) {
        return serveFile(res, imgPath);
      }
    }
  }

  // 2. Handle analytics scripts (/insights/script.js, /_vercel/insights/script.js, /script.js)
  if (pathname.endsWith('/script.js') || pathname === '/script.js') {
    const mockPath = path.join(ROOT_DIR, '_vercel', 'insights', 'script.js');
    if (fs.existsSync(mockPath)) {
      return serveFile(res, mockPath);
    }
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    return res.end('window.va=window.va||function(){};');
  }

  // Normalize path
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath.startsWith(path.sep)) safePath = safePath.slice(1);
  let fullPath = path.join(ROOT_DIR, safePath);

  // 3. Check direct file existence
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const indexPath = path.join(fullPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return serveFile(res, indexPath);
      }
    } else {
      return serveFile(res, fullPath);
    }
  }

  // 4. Smart Chunk Locator: If a JS file is requested by basename or partial path,
  // check if it exists in _next/static/immutable/chunks/
  const ext = path.extname(pathname).toLowerCase();
  if (ext === '.js' || ext === '.mjs') {
    const basename = path.basename(pathname);
    const chunkPath = path.join(CHUNKS_DIR, basename);
    if (fs.existsSync(chunkPath)) {
      return serveFile(res, chunkPath);
    }
  }

  // 5. Try appending .html for clean URLs (e.g. /work -> /work.html)
  if (fs.existsSync(fullPath + '.html')) {
    return serveFile(res, fullPath + '.html');
  }

  // 6. Try directory index.html (e.g. /work/ -> /work/index.html)
  const dirIndexPath = path.join(fullPath, 'index.html');
  if (fs.existsSync(dirIndexPath)) {
    return serveFile(res, dirIndexPath);
  }

  // 7. If request is for a static asset (.js, .css, .glb, images, fonts, etc.)
  // NEVER return index.html for asset requests to prevent syntax errors like "Unexpected token '<'"!
  if (ext) {
    if (ext === '.js' || ext === '.mjs') {
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      return res.end('/* empty module fallback */');
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end(`404 Asset Not Found: ${pathname}`);
  }

  // 8. For client navigation (no extension), fallback to index.html if user accepts html
  const accept = req.headers['accept'] || '';
  if (accept.includes('text/html') || !accept) {
    const rootIndex = path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(rootIndex)) {
      return serveFile(res, rootIndex);
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`CodeofSagar Clone Server running at http://localhost:${PORT}`);
  console.log(`====================================================`);
});
