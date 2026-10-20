import {randomBytes,createHash} from 'node:crypto';

const safeUser=value=>value&&/^[a-zA-Z0-9-]{1,80}$/.test(value.id)&&typeof value.email==='string'?{id:value.id,email:value.email}:null;
const messages={invalid_credentials:'That email and password don’t match.',email_not_confirmed:'Confirm your email first, then log in.',weak_password:'Choose a stronger password with at least 8 characters.',signup_disabled:'Account creation is currently unavailable.',email_address_invalid:'Enter a valid email address.',captcha_failed:'Account verification is required. Please try again later.'};

// The browser receives an opaque, HttpOnly session cookie, never provider tokens.
// Sessions are memory-only in this prototype; a server restart signs users out.
export function createAuthService(environment,{origin,fetchImpl=fetch,now=Date.now}={}) {
  const project=environment.SUPABASE_URL?.trim(),key=environment.SUPABASE_SECRET_KEY?.trim();
  let configured=false;
  try {const url=new URL(project);configured=url.protocol==='https:'&&/^[a-z0-9][a-z0-9-]*\.supabase\.co$/.test(url.hostname)&&!url.port&&url.origin+'/'===url.href&&/^sb_secret_[A-Za-z0-9_-]+$/.test(key);}catch{}
  if(new URL(origin).origin!==origin)throw new Error('APP_ORIGIN must be an origin without a path.');
  const allowedOrigins=new Set([origin]);
  const localOrigin=new URL(origin);
  if(localOrigin.protocol==='http:'&&['127.0.0.1','localhost'].includes(localOrigin.hostname)){localOrigin.hostname=localOrigin.hostname==='localhost'?'127.0.0.1':'localhost';allowedOrigins.add(localOrigin.origin);}
  const sessions=new Map(),pending=new Map(),attempts=new Map();
  const ttl=7*86400_000;
  const cookie=(name,value,maxAge)=>`${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${origin.startsWith('https:')?'; Secure':''}`;
  const cookies=request=>Object.fromEntries((request.headers.cookie||'').split(';').map(part=>part.trim().split('=')));
  const json=(response,status,body)=>{response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});response.end(JSON.stringify(body));};
  const clean=()=>{for(const map of [sessions,pending,attempts])for(const [id,value]of map)if(value.expires<=now())map.delete(id);};
  async function provider(route,{body,token}={}) {
    const response=await fetchImpl(new URL('/auth/v1/'+route,project),{method:body?'POST':'GET',headers:{apikey:key,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(12_000)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) {const code=data.error_code||data.code;const error=new Error(response.status===429?'Too many attempts. Please try again later.':messages[code]||'We couldn’t complete that request. Please try again.');error.status=response.status===429?429:response.status>=500?503:400;throw error;}
    return data;
  }
  function establish(response,data) {
    const user=safeUser(data.user);
    if(!user||!data.access_token||!data.refresh_token) return null;
    clean();if(sessions.size>=1000)sessions.delete(sessions.keys().next().value);
    const id=randomBytes(32).toString('base64url');
    sessions.set(id,{user,access:data.access_token,refresh:data.refresh_token,expires:now()+ttl});
    response.setHeader('Set-Cookie',[cookie('bd_session',id,ttl/1000),cookie('bd_signup','',0)]);
    return user;
  }
  async function sessionUser(request) {
    const id=cookies(request).bd_session,session=sessions.get(id);
    if(!session||session.expires<=now()){sessions.delete(id);return null;}
    // Supabase validates the token instead of trusting a user ID from the browser.
    if(!session.validation) session.validation=(async()=>{
      try{const user=safeUser(await provider('user',{token:session.access}));if(!user||user.id!==session.user.id){sessions.delete(id);return null;}return user;}
      catch(error){
        if(error.status!==400)throw error;
        try {const data=await provider('token?grant_type=refresh_token',{body:{refresh_token:session.refresh}});const user=safeUser(data.user);if(!user||user.id!==session.user.id)throw new Error('Invalid session');session.access=data.access_token;session.refresh=data.refresh_token;return user;}
        catch {sessions.delete(id);return null;}
      }
    })().finally(()=>{session.validation=null;});
    return session.validation;
  }
  async function readBody(request) {
    let source='';
    for await(const chunk of request){source+=chunk;if(Buffer.byteLength(source)>8192){const error=new Error('This request is too large.');error.status=413;throw error;}}
    try{return JSON.parse(source||'{}');}catch{const error=new Error('Enter your email and password, then try again.');error.status=400;throw error;}
  }
  async function handle(request,response,url) {
    const route=url.pathname;
    if(route==='/auth/callback') {
      if(request.method!=='GET'){response.setHeader('Allow','GET');json(response,405,{error:'Use the confirmation link to continue.'});return;}
      clean();const id=cookies(request).bd_signup,entry=pending.get(id);pending.delete(id);
      try {if(!entry||!url.searchParams.get('code'))throw new Error();const data=await provider('token?grant_type=pkce',{body:{auth_code:url.searchParams.get('code'),code_verifier:entry.verifier}});if(!establish(response,data))throw new Error();response.writeHead(303,{Location:'/', 'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}).end();}
      catch {response.setHeader('Set-Cookie',cookie('bd_signup','',0));response.writeHead(303,{Location:'/?auth=confirmation_failed','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}).end();}
      return;
    }
    if(!route.startsWith('/api/auth/'))return false;
    try {
      clean();
      if(route==='/api/auth/session'&&request.method==='GET') {json(response,200,{available:configured,user:configured?await sessionUser(request):null});return;}
      if(!['/api/auth/sign-up','/api/auth/log-in','/api/auth/log-out'].includes(route)){json(response,404,{error:'Account route not found.'});return;}
      if(request.method!=='POST'){response.setHeader('Allow','POST');json(response,405,{error:'Use POST for this action.'});return;}
      if(!allowedOrigins.has(request.headers.origin)||!request.headers['content-type']?.startsWith('application/json')){json(response,403,{error:'Reload the app and try again.'});return;}
      if(route==='/api/auth/log-out') {
        const id=cookies(request).bd_session,session=sessions.get(id);sessions.delete(id);
        response.setHeader('Set-Cookie',[cookie('bd_session','',0),cookie('bd_signup','',0)]);
        if(session)await provider('logout?scope=local',{body:{},token:session.access}).catch(()=>{});
        json(response,200,{user:null});return;
      }
      if(!configured){json(response,503,{error:'Account access is temporarily unavailable. Please try again later.'});return;}
      const address=request.socket.remoteAddress,limit=attempts.get(address)||{count:0,expires:now()+15*60_000};
      if(limit.count>=12){json(response,429,{error:'Too many attempts. Please try again later.'});return;}
      limit.count++;if(attempts.size<1000||attempts.has(address))attempts.set(address,limit);
      const body=await readBody(request),input=body&&typeof body==='object'&&!Array.isArray(body)?body:{};
      const email=typeof input.email==='string'?input.email.trim().toLowerCase():'',password=input.password;
      if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<(route.endsWith('sign-up')?8:1)||password.length>128){json(response,400,{error:route.endsWith('sign-up')?'Enter a valid email and a password with 8–128 characters.':'Enter your email and password.'});return;}
      if(route.endsWith('sign-up')) {
        const verifier=randomBytes(32).toString('base64url'),challenge=createHash('sha256').update(verifier).digest('base64url');
        const data=await provider('signup?redirect_to='+encodeURIComponent(request.headers.origin+'/auth/callback'),{body:{email,password,code_challenge:challenge,code_challenge_method:'s256'}});
        const user=establish(response,data);
        if(user)json(response,200,{user});
        else {const id=randomBytes(32).toString('base64url');if(pending.size>=1000)pending.delete(pending.keys().next().value);pending.set(id,{verifier,expires:now()+3600_000});response.setHeader('Set-Cookie',cookie('bd_signup',id,3600));json(response,200,{user:null,confirmationRequired:true});}
      } else {
        const user=establish(response,await provider('token?grant_type=password',{body:{email,password}}));
        if(!user){json(response,401,{error:'We couldn’t open your account. Please try again.'});return;}
        json(response,200,{user});
      }
    } catch(error){json(response,error.status||503,{error:error.status?error.message:'Account access is temporarily unavailable. Please try again.'});}
  }
  return {handle};
}
