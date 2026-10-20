import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Tests use the same script list and order as the actual buildless application.
export async function runtimeFiles() {
  const root=new URL('../dist/',import.meta.url);
  const html=await readFile(new URL('index.html',root),'utf8');
  const files=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match=>{
    const url=new URL(match[1],root);
    if(url.protocol!=='file:'||!url.href.startsWith(root.href)||!url.pathname.endsWith('.js')) throw new Error('Runtime scripts must be local JavaScript.');
    url.search='';return fileURLToPath(url);
  });
  if(new Set(files).size!==files.length) throw new Error('Duplicate runtime script in index.html.');
  return files;
}
