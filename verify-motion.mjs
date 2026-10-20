import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

function target() {
  const listeners=new Map();
  return {
    addEventListener(type,callback,options={}){if(!listeners.has(type))listeners.set(type,new Map());listeners.get(type).set(callback,options);},
    removeEventListener(type,callback){listeners.get(type)?.delete(callback);},
    dispatch(type,event){for(const [callback,options] of [...(listeners.get(type)||[])]){callback(event);if(options.once)listeners.get(type).delete(callback);}},
    count:type=>listeners.get(type)?.size||0,
  };
}
const document=target(),window=target();
vm.runInNewContext(await readFile(new URL('./dist/spring.js',import.meta.url),'utf8'),{document,window,performance:{now:()=>0},requestAnimationFrame:()=>1,setInterval(){}});
for(let i=0;i<100;i++){
  const button={style:{},offsetWidth:100};
  document.dispatch('pointerdown',{target:{closest:()=>button}});
  window.dispatch('pointerup',{});
}
assert.equal(window.count('pointerup'),0);
assert.equal(window.count('pointercancel'),0,'Completed taps must not accumulate opposite-event listeners retaining old buttons');
const button={style:{},offsetWidth:100};
document.dispatch('pointerdown',{target:{closest:()=>button}});window.dispatch('pointercancel',{});
assert.equal(window.count('pointerup'),0,'A cancelled tap must clean up its pointerup listener too');
console.log('Passed spring press listener cleanup after 100 taps and pointer cancellation.');
