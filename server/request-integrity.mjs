import {randomBytes,timingSafeEqual} from 'node:crypto';

// Synchronizer tokens protect even pre-login actions. Origin/Fetch Metadata are
// additional checks, not the only proof available to embedded browsers.
export function createRequestIntegrity({origin,now=Date.now,ttl=3600_000,capacity=1000}) {
  const configured=new URL(origin);
  if(configured.origin!==origin)throw new Error('APP_ORIGIN must be an origin without a path.');
  const origins=new Set([origin]);
  if(configured.protocol==='http:'&&['localhost','127.0.0.1'].includes(configured.hostname)) {
    const alias=new URL(origin);alias.hostname=alias.hostname==='localhost'?'127.0.0.1':'localhost';origins.add(alias.origin);
  }
  const sessions=new Map();
  const cookieId=request=>{
    const value=(request.headers.cookie||'').split(';').map(part=>part.trim()).find(part=>part.startsWith('bd_request='))?.slice('bd_request='.length);
    return typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value)?value:null;
  };
  const clean=()=>{for(const [id,entry]of sessions)if(entry.expires<=now())sessions.delete(id);};
  function issue(request,response) {
    clean();let id=cookieId(request),entry=sessions.get(id);
    if(!entry) {
      if(sessions.size>=capacity)sessions.delete(sessions.keys().next().value);
      id=randomBytes(32).toString('base64url');entry={token:randomBytes(32).toString('base64url'),expires:now()+ttl};sessions.set(id,entry);
    }
    const existing=response.getHeader('Set-Cookie');
    const cookie=`bd_request=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(1,Math.floor((entry.expires-now())/1000))}${configured.protocol==='https:'?'; Secure':''}`;
    response.setHeader('Set-Cookie',[...(Array.isArray(existing)?existing:existing?[existing]:[]),cookie]);
    return entry.token;
  }
  function accepts(request) {
    const headers=request.headers,source=headers.origin;
    if(source&&source!=='null'&&!origins.has(source))return false;
    if(headers['sec-fetch-site']&&!['same-origin','none'].includes(headers['sec-fetch-site']))return false;
    if(headers.referer){try{if(!origins.has(new URL(headers.referer).origin))return false;}catch{return false;}}
    if(headers['content-type']?.split(';')[0].trim().toLowerCase()!=='application/json')return false;
    const entry=sessions.get(cookieId(request)),token=headers['x-csrf-token'];
    if(!entry||entry.expires<=now()||typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return false;
    return timingSafeEqual(Buffer.from(token),Buffer.from(entry.token));
  }
  function callbackOrigin(request) {
    if(origins.has(request.headers.origin))return request.headers.origin;
    try{const referring=new URL(request.headers.referer).origin;if(origins.has(referring))return referring;}catch{}
    return origin;
  }
  return{issue,accepts,callbackOrigin};
}
