import {loadEnvironment} from './server/environment.mjs';
import {createSupabaseConnection} from './server/supabase.mjs';
import {createAppServer} from './server/application.mjs';
import {createAuthService} from './server/auth.mjs';

await loadEnvironment(new URL('./',import.meta.url));
const supabase=createSupabaseConnection(process.env);
const port=Number(process.argv[2]||4173);
if(!Number.isInteger(port)||port<1||port>65535) throw new Error('Use a local port from 1 to 65535.');
const origin=process.env.APP_ORIGIN||`http://127.0.0.1:${port}`;
const auth=createAuthService(process.env,{origin});
const server=createAppServer({supabase,auth});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
