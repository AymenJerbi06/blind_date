import {loadEnvironment} from '../server/environment.mjs';
import {createSupabaseConnection} from '../server/supabase.mjs';

await loadEnvironment(new URL('../',import.meta.url));
const status=await createSupabaseConnection(process.env).status({refresh:true});
if(status.connected) console.log('Supabase connected: the project Data API accepted the server key.');
else {
  const missing=status.missing?.length?` Missing: ${status.missing.join(', ')}.`:'';
  console.error(`Supabase is not connected (${status.status}).${missing}`);
  process.exitCode=1;
}
