import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp'};

export function createAppServer({supabase,auth}) {
  return http.createServer(async (request,response)=>{
    try {
      const url=new URL(request.url,'http://localhost');
      const pathname=decodeURIComponent(url.pathname);
      if(auth&&(pathname.startsWith('/api/auth/')||pathname==='/auth/callback')){if(await auth.handle(request,response,url)===false)response.writeHead(404).end('Not found');return;}
      if(pathname==='/api/health/supabase') {
        if(!['GET','HEAD'].includes(request.method)) {response.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
        const status=await supabase.status();
        response.writeHead(status.connected?200:503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
        response.end(request.method==='HEAD'?undefined:JSON.stringify(status));
        return;
      }
      if(!['GET','HEAD'].includes(request.method)) {response.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
      const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
      const relative=path.relative(root,filename);
      if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative)) {response.writeHead(403).end();return;}
      const file=await readFile(filename);
      response.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});
      response.end(request.method==='HEAD'?undefined:file);
    } catch {response.writeHead(404).end('Not found');}
  });
}
