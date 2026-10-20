// Server-only adapter. Never import this file into dist/ or return its config.
export function createSupabaseConnection(environment, {fetchImpl=fetch,now=Date.now,cacheMs=30_000,timeoutMs=8_000}={}) {
  const projectUrl=environment.SUPABASE_URL?.trim();
  const secretKey=environment.SUPABASE_SECRET_KEY?.trim();
  const missing=['SUPABASE_URL','SUPABASE_SECRET_KEY'].filter(name=>!environment[name]?.trim());
  let baseUrl;
  if(!missing.length) {
    try {
      baseUrl=new URL(projectUrl);
      // A key is sent only to the supplied project's official HTTPS endpoint.
      if(baseUrl.protocol!=='https:'||!/^([a-z0-9][a-z0-9-]*)\.supabase\.co$/.test(baseUrl.hostname)||baseUrl.port||baseUrl.username||baseUrl.password||baseUrl.pathname!=='/'||baseUrl.search||baseUrl.hash) baseUrl=null;
    } catch {baseUrl=null;}
  }
  let cached=null,expires=0,pending=null;
  const result=(connected,status)=>({configured:true,connected,status});

  async function probe() {
    try {
      const response=await fetchImpl(new URL('/rest/v1/',baseUrl),{
        method:'GET',
        headers:{apikey:secretKey,Accept:'application/openapi+json'},
        redirect:'error',
        signal:AbortSignal.timeout(timeoutMs),
      });
      // The API description isn't exposed, logged, or needed by the client.
      if(response.body) await response.body.cancel();
      if(response.status===200) return result(true,'connected');
      if(response.status===401||response.status===403) return result(false,'authentication_failed');
      return result(false,'unavailable');
    } catch(error) {
      // Network exceptions can include request details; return fixed codes only.
      return result(false,error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'unreachable');
    }
  }

  async function status({refresh=false}={}) {
    if(missing.length) return {configured:false,connected:false,status:'not_configured',missing:[...missing]};
    if(!baseUrl) return {configured:false,connected:false,status:'invalid_project_url'};
    if(!/^sb_secret_[A-Za-z0-9_-]+$/.test(secretKey)) return {configured:false,connected:false,status:'invalid_secret_key'};
    if(!refresh&&cached&&now()<expires) return {...cached};
    if(!pending) pending=probe().then(value=>{cached=value;expires=now()+cacheMs;return value;}).finally(()=>{pending=null;});
    return {...await pending};
  }
  return Object.freeze({status});
}
