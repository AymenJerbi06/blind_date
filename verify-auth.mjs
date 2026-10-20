import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {createAppServer} from './server/application.mjs';
import {createAuthService} from './server/auth.mjs';

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
const post=(route,body={},extra={})=>fetch(base+'/api/auth/'+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
const cookie=response=>response.headers.getSetCookie().find(value=>value.startsWith('bd_session=')).split(';')[0];
try{
  const initial=await fetch(base+'/api/auth/session');assert.deepEqual(await initial.json(),{available:true,user:null});assert.equal(initial.headers.get('cache-control'),'no-store');
  const crossOrigin=await post('sign-up',{email:user.email,password:'12345678'},{Origin:'https://evil.test'});assert.equal(crossOrigin.status,403);assert.equal(providerCalls,0);
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
