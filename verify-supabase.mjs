import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {once} from 'node:events';
import {loadEnvironment} from './server/environment.mjs';
import {createSupabaseConnection} from './server/supabase.mjs';
import {createAppServer} from './server/application.mjs';

const environment={SUPABASE_URL:'https://exampleproject.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_unit_test'};
let calls=0,clock=0;
const connection=createSupabaseConnection(environment,{now:()=>clock,fetchImpl:async(url,options)=>{
  calls++;
  assert.equal(String(url),'https://exampleproject.supabase.co/rest/v1/');
  assert.equal(options.headers.apikey,environment.SUPABASE_SECRET_KEY);
  assert.equal(options.headers.Authorization,undefined,'Opaque API keys must not be treated as JWTs');
  assert.equal(options.redirect,'error','Never forward the key to a redirect target');
  return new Response('{}',{status:200});
}});
assert.deepEqual(await connection.status(),{configured:true,connected:true,status:'connected'});
assert.equal(JSON.stringify(await connection.status()).includes(environment.SUPABASE_SECRET_KEY),false);
assert.equal(calls,1,'Status uses a short cache');
clock=30_001;
await Promise.all([connection.status(),connection.status(),connection.status()]);
assert.equal(calls,2,'Concurrent probes share one upstream request');
await connection.status({refresh:true});assert.equal(calls,3);

const noNetwork=async()=>{throw new Error('Invalid configuration attempted a network request');};
assert.deepEqual((await createSupabaseConnection({}, {fetchImpl:noNetwork}).status()).missing,['SUPABASE_URL','SUPABASE_SECRET_KEY']);
for(const url of ['http://exampleproject.supabase.co','https://supabase.co.evil.test','https://exampleproject.supabase.co.evil.test','https://user:pass@exampleproject.supabase.co','https://exampleproject.supabase.co/path','https://exampleproject.supabase.co?key=bad','https://exampleproject.supabase.co:444','https://evil.test','not a URL']) {
  assert.equal((await createSupabaseConnection({...environment,SUPABASE_URL:url},{fetchImpl:noNetwork}).status()).status,'invalid_project_url');
}
assert.equal((await createSupabaseConnection({...environment,SUPABASE_SECRET_KEY:'not-a-secret-key'},{fetchImpl:noNetwork}).status()).status,'invalid_secret_key');
for(const httpStatus of [401,403,500]) {
  const result=await createSupabaseConnection(environment,{fetchImpl:async()=>new Response('private upstream details',{status:httpStatus})}).status();
  assert.equal(result.connected,false);
  assert.equal(result.status,httpStatus===500?'unavailable':'authentication_failed');
  assert.equal(JSON.stringify(result).includes('private upstream'),false);
}
for(const name of ['TimeoutError','Error']) {
  const result=await createSupabaseConnection(environment,{fetchImpl:async()=>{const error=new Error(environment.SUPABASE_SECRET_KEY);error.name=name;throw error;}}).status();
  assert.equal(result.status,name==='TimeoutError'?'timeout':'unreachable');
  assert.equal(JSON.stringify(result).includes(environment.SUPABASE_SECRET_KEY),false,'Exceptions must not expose request credentials');
}

const directory=await mkdtemp(path.join(tmpdir(),'blinddate-env-test-'));
try {
  await writeFile(path.join(directory,'.env'),'SUPABASE_URL=https://base.supabase.co\nSUPABASE_SECRET_KEY=from-base\nPLAIN=value # comment\n');
  await writeFile(path.join(directory,'.env.local'),'SUPABASE_URL="https://local.supabase.co"\nexport SUPABASE_SECRET_KEY=from-local\nQUOTED=\'literal # text\'\nEXPANSION=$(do-not-run)\n');
  const loaded=await loadEnvironment(pathToFileURL(directory+path.sep),{SUPABASE_SECRET_KEY:'from-process'});
  assert.equal(loaded.SUPABASE_URL,'https://local.supabase.co');
  assert.equal(loaded.SUPABASE_SECRET_KEY,'from-process');
  assert.equal(loaded.PLAIN,'value');assert.equal(loaded.QUOTED,'literal # text');assert.equal(loaded.EXPANSION,'$(do-not-run)');
} finally {
  assert.equal(path.dirname(path.resolve(directory)),path.resolve(tmpdir()));
  assert.ok(path.basename(directory).startsWith('blinddate-env-test-'));
  await rm(directory,{recursive:true,force:true});
}

let health={configured:false,connected:false,status:'not_configured',missing:['SUPABASE_URL']};
const app=createAppServer({supabase:{status:async()=>health}});
app.listen(0,'127.0.0.1');await once(app,'listening');
const origin=`http://127.0.0.1:${app.address().port}`;
try {
  const home=await fetch(origin);assert.equal(home.status,200);assert.match(await home.text(),/blinddate/);
  const missing=await fetch(origin+'/api/health/supabase');assert.equal(missing.status,503);assert.equal(missing.headers.get('cache-control'),'no-store');assert.deepEqual(await missing.json(),health);
  health={configured:true,connected:true,status:'connected'};
  const connected=await fetch(origin+'/api/health/supabase');assert.equal(connected.status,200);assert.deepEqual(await connected.json(),health);
  for(const name of ['.env.local','server/supabase.mjs','.openai/hosting.json']) assert.equal((await fetch(origin+'/'+name)).status,404,'Only dist is served');
  assert.equal((await fetch(origin+'/%2e%2e%2f.env.local')).status,403);
  assert.equal((await fetch(origin+'/api/health/supabase',{method:'POST'})).status,405);
  assert.equal((await fetch(origin,{method:'POST'})).status,405);
  assert.equal(await (await fetch(origin,{method:'HEAD'})).text(),'');
} finally {app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
console.log('Passed Supabase configuration, credential isolation/redaction, host/redirect guards, status caching and HTTP boundary checks.');
