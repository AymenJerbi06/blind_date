import {spawnSync} from 'node:child_process';
import {runtimeFiles} from './runtime-files.mjs';

for(const file of await runtimeFiles()) {
  const check=spawnSync(process.execPath,['--check',file],{stdio:'inherit',windowsHide:true});
  if(check.error) throw check.error;
  if(check.status!==0) process.exit(check.status||1);
}
await import('../verify.mjs');
await import('../verify-architecture.mjs');
await import('../verify-media.mjs');
await import('../verify-motion.mjs');
await import('../verify-supabase.mjs');
await import('../verify-auth.mjs');
