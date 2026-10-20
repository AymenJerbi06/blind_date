import {readFile} from 'node:fs/promises';

// Checkout-local configuration; existing process variables take precedence.
// No expansion or shell evaluation is performed.
export async function loadEnvironment(directory, environment=process.env) {
  const values=Object.create(null);
  for(const name of ['.env','.env.local']) {
    let source;
    try {source=await readFile(new URL(name,directory),'utf8');}
    catch(error) {if(error.code==='ENOENT') continue;throw error;}
    for(const line of source.split(/\r?\n/)) {
      const match=line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if(!match) continue;
      let value=match[2];
      if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'"))) value=value.slice(1,-1);
      else value=value.replace(/\s+#.*$/,'').trim();
      values[match[1]]=value;
    }
  }
  for(const [name,value] of Object.entries(values)) if(environment[name]===undefined) environment[name]=value;
  return environment;
}
