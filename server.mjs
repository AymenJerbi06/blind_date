import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const relative=path.relative(root,filename);
    if ((relative==='..'||relative.startsWith('..'+path.sep))||path.isAbsolute(relative)) { response.writeHead(403).end(); return; }
    const file = await readFile(filename);
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(file);
  } catch { response.writeHead(404).end('Not found'); }
});
const port=Number(process.argv[2]||4173);
if(!Number.isInteger(port)||port<1||port>65535) throw new Error('Use a local port from 1 to 65535.');
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
