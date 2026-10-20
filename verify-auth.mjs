import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {createAppServer} from './server/application.mjs';
import {createAuthService} from './server/auth.mjs';
import {createRequestIntegrity} from './server/request-integrity.mjs';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const origin='http://127.0.0.1:4173',environment={SUPABASE_URL:'https://exampleproject.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_unit_test'};
const user={id:'00000000-0000-4000-a000-000000000001',email:'sample@example.test'};
const tokens={user,access_token:'private-access',refresh_token:'private-refresh'};
let mode='session',challenge,providerCalls=0,lastPassword;
const auth=createAuthService(environment,{origin,fetchImpl:async(url,options)=>{
  providerCalls++;assert.equal(new URL(url).origin,environment.SUPABASE_URL);assert.equal(options.headers.apikey,environment.SUPABASE_SECRET_KEY);assert.equal(options.redirect,'error');
  const route=new URL(url).pathname,body=options.body?JSON.parse(options.body):{};
  const reply=(value,status=200)=>new Response(JSON.stringify(value),{status});
  if(mode==='offline')throw new Error(environment.SUPABASE_SECRET_KEY);
  if(route.endsWith('/signup')){lastPassword=body.password;assert.equal(body.data,undefined,'The browser cannot supply admin metadata');assert.equal(body.code_challenge_method,'s256');assert.equal(new URL(url).searchParams.get('redirect_to'),origin+'/auth/callback');challenge=body.code_challenge;return reply(mode==='confirm'?user:tokens);}
  if(route.endsWith('/user')){assert.equal(options.headers.Authorization,'Bearer private-access');return mode==='refresh'?reply({},401):reply(user);}
  if(route.endsWith('/token')){
    const grant=new URL(url).searchParams.get('grant_type');
    if(grant==='pkce')assert.equal(createHash('sha256').update(body.code_verifier).digest('base64url'),challenge);
    if(grant==='refresh_token'){assert.equal(body.refresh_token,'private-refresh');mode='session';}
    if(body.password==='wrong')return reply({error_code:'invalid_credentials'},400);
    return reply(tokens);
  }
  return reply({});
}});
const app=createAppServer({auth,supabase:{status:async()=>({connected:true})}});app.listen(0,'127.0.0.1');await once(app,'listening');
const base=`http://127.0.0.1:${app.address().port}`;
let csrfHeaders={};
const post=(route,body={},extra={})=>{
  const headers={Origin:origin,'Content-Type':'application/json',...csrfHeaders,...extra};
  if(extra.Cookie)headers.Cookie=csrfHeaders.Cookie+'; '+extra.Cookie;
  if(headers.Origin===null)delete headers.Origin;
  return fetch(base+'/api/auth/'+route,{method:'POST',headers,body:JSON.stringify(body)});
};
const cookie=response=>response.headers.getSetCookie().find(value=>value.startsWith('bd_session=')).split(';')[0];
try{
  const initial=await fetch(base+'/api/auth/session'),initialBody=await initial.json();assert.equal(initialBody.available,true);assert.equal(initialBody.user,null);assert.match(initialBody.csrfToken,/^[A-Za-z0-9_-]{43}$/);assert.equal(initial.headers.get('cache-control'),'no-store');
  csrfHeaders={'X-CSRF-Token':initialBody.csrfToken,Cookie:initial.headers.getSetCookie()[0].split(';')[0]};
  assert.ok(!csrfHeaders.Cookie.includes(initialBody.csrfToken),'The request cookie is an identifier, not the token');
  const crossOrigin=await post('sign-up',{email:user.email,password:'12345678'},{Origin:'https://evil.test'});assert.equal(crossOrigin.status,403);assert.equal(providerCalls,0);
  assert.equal((await post('log-in',{}, {'X-CSRF-Token':'bad'})).status,403);
  const missingOrigin=await post('log-in',{},{Origin:null});assert.equal(missingOrigin.status,400,'A cookie-bound token works when Origin and Referer are absent');
  assert.equal((await post('log-in',{}, {Origin:'null'})).status,400,'Opaque origins require the same valid session proof');
  assert.equal((await post('log-in',{}, {Origin:null,'X-CSRF-Token':''})).status,403,'Missing Origin never grants access on its own');
  assert.equal((await post('log-in',{}, {Origin:null,'Sec-Fetch-Site':'cross-site'})).status,403);
  assert.equal((await post('log-in',{}, {Origin:null,Referer:'https://evil.test/page'})).status,403);
  assert.equal((await post('log-in',{}, {'Content-Type':'text/plain'})).status,403);
  assert.equal((await post('log-in',{}, {'Content-Type':'Application/JSON; charset=utf-8'})).status,400);
  assert.equal((await post('log-in',null)).status,400,'Malformed JSON shapes return a validation error');
  const encodedRoute=await fetch(base+'/api/%61uth/session');assert.equal(encodedRoute.status,404,'Unsupported encoded routes cannot leave a request hanging');
  assert.equal((await post('sign-up',{email:'bad',password:'short'})).status,400);
  const signup=await post('sign-up',{email:' SAMPLE@example.test ',password:' unchanged password ',role:'admin'});
  assert.equal(signup.status,200);const signupBody=await signup.text();assert.ok(!signupBody.includes('private-access'));assert.deepEqual(JSON.parse(signupBody),{user});assert.equal(lastPassword,' unchanged password ','Passwords are never trimmed');
  const sessionCookie=cookie(signup);assert.match(signup.headers.getSetCookie()[0],/HttpOnly; SameSite=Lax/);assert.ok(!sessionCookie.includes('private-access'));
  const loggedIn=await fetch(base+'/api/auth/session',{headers:{Cookie:sessionCookie}});assert.deepEqual((await loggedIn.json()).user,user);
  mode='refresh';const refreshed=await fetch(base+'/api/auth/session',{headers:{Cookie:sessionCookie}});assert.deepEqual((await refreshed.json()).user,user,'Expired access tokens refresh on the server');
  const badLogin=await post('log-in',{email:user.email,password:'wrong'});assert.equal(badLogin.status,400);assert.match((await badLogin.json()).error,/don’t match/);
  const out=await post('log-out',{}, {Cookie:sessionCookie});assert.equal(out.status,200);assert.ok(out.headers.getSetCookie().some(value=>value.includes('Max-Age=0')));
  const after=await fetch(base+'/api/auth/session',{headers:{Cookie:sessionCookie}});assert.equal((await after.json()).user,null);
  const aliasLogin=await post('log-in',{email:user.email,password:'12345678'},{Origin:'http://localhost:4173'});assert.equal(aliasLogin.status,200,'Both local development host aliases are accepted');
  mode='confirm';const confirmation=await post('sign-up',{email:user.email,password:'12345678'});assert.deepEqual(await confirmation.json(),{user:null,confirmationRequired:true});
  const pendingCookie=confirmation.headers.getSetCookie()[0].split(';')[0];
  const callback=await fetch(base+'/auth/callback?code=sample-code',{headers:{Cookie:pendingCookie},redirect:'manual'});assert.equal(callback.status,303);assert.equal(callback.headers.get('location'),'/');assert.ok(cookie(callback));
  const stale=await fetch(base+'/auth/callback?code=sample-code',{headers:{Cookie:pendingCookie},redirect:'manual'});assert.equal(stale.headers.get('location'),'/?auth=confirmation_failed','A callback verifier can only be used once');
  mode='offline';const offline=await post('log-in',{email:user.email,password:'12345678'});assert.equal(offline.status,503);assert.ok(!(await offline.text()).includes(environment.SUPABASE_SECRET_KEY));
  const oversized=await post('log-in',{email:'x'.repeat(9000),password:'12345678'});assert.equal(oversized.status,413);
  for(let i=0;i<15;i++)await post('log-in',{email:'bad',password:'x'});
  assert.equal((await post('log-in',{email:user.email,password:'12345678'})).status,429);
}finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
console.log('Passed account origin/body/rate guards, server-only sessions, password preservation, email confirmation, PKCE callback, refresh and logout checks.');

// Tokens are browser-session-bound, expire, and are never inferred from Origin.
let clock=0;
const integrity=createRequestIntegrity({origin,now:()=>clock,ttl:1000});
const response=()=>({headers:{},getHeader(name){return this.headers[name];},setHeader(name,value){this.headers[name]=value;}});
const firstResponse=response(),firstToken=integrity.issue({headers:{}},firstResponse);
const request={headers:{cookie:firstResponse.headers['Set-Cookie'][0].split(';')[0],'x-csrf-token':firstToken,'content-type':'application/json'}};
assert.equal(integrity.accepts(request),true);
const secondResponse=response(),secondToken=integrity.issue({headers:{}},secondResponse);
assert.equal(integrity.accepts({headers:{...request.headers,'x-csrf-token':secondToken}}),false,'A token from a different browser cannot be substituted');
clock=1001;assert.equal(integrity.accepts(request),false,'Expired tokens are rejected');
const renewed=integrity.issue(request,response());assert.notEqual(renewed,firstToken);
assert.equal(integrity.callbackOrigin({headers:{}}),origin,'Missing headers never create an attacker-controlled callback');
assert.equal(integrity.callbackOrigin({headers:{origin:'https://evil.test'}}),origin);
assert.equal(integrity.callbackOrigin({headers:{referer:'http://localhost:4173/page'}}),'http://localhost:4173');

// Exercise the actual browser adapter, including recovery after a server restart.
const clientSource=await readFile(new URL('./dist/auth-client.js',import.meta.url),'utf8');
let sessionReads=0,postCount=0,rejection='verification',networkFailure=false;
const client=vm.createContext({AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{
  if(url.endsWith('/session')){sessionReads++;return new Response(JSON.stringify({available:true,user:null,csrfToken:(sessionReads%2?'a':'b').repeat(43)}));}
  postCount++;assert.equal(options.credentials,'same-origin');assert.equal(options.headers['Content-Type'],'application/json');assert.match(options.headers['X-CSRF-Token'],/^[ab]{43}$/);
  if(networkFailure)throw new TypeError('offline');
  if(rejection==='verification')return new Response(JSON.stringify({code:'request_verification_failed',error:'Try again'}),{status:403});
  if(rejection==='provider')return new Response(JSON.stringify({error:'Provider rejected signup'}),{status:400});
  return new Response(JSON.stringify({user}));
}});
vm.runInContext(clientSource+';this.client=AuthClient;',client);
await assert.rejects(client.client.signUp(user.email,'unchanged password'),/Try again/);
assert.equal(sessionReads,2);assert.equal(postCount,2,'Verification errors retry once, never in an unbounded loop');
rejection='provider';const readsBefore=sessionReads,postsBefore=postCount;
await assert.rejects(client.client.signUp(user.email,'unchanged password'),/Provider rejected/);
assert.equal(sessionReads,readsBefore);assert.equal(postCount,postsBefore+1,'Provider errors are never automatically replayed');
networkFailure=true;const countBefore=postCount;
await assert.rejects(client.client.signUp(user.email,'unchanged password'),/couldn’t reach/);
assert.equal(postCount,countBefore+1,'An ambiguous network failure must not replay signup');
networkFailure=false;rejection=null;assert.deepEqual(await client.client.logIn(user.email,'unchanged password'),{user});
console.log('Passed missing/opaque Origin protection, browser-bound/expired CSRF tokens and one-time client recovery without replaying provider errors.');
