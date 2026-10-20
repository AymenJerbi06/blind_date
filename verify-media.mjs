import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('./dist/photo-input.js',import.meta.url),'utf8');
let created=0,revoked=0,encodedSize=null;
const canvas={width:0,height:0,getContext:()=>({drawImage(){}}),toDataURL(){encodedSize=[this.width,this.height];return 'data:image/jpeg;base64,AAAA';}};
class TestImage {
  naturalWidth=1280;naturalHeight=720;
  set src(value){if(value)queueMicrotask(()=>this.onload?.());}
}
const context=vm.createContext({assert,setTimeout,clearTimeout,Image:TestImage,URL:{createObjectURL(){created++;return 'blob:test';},revokeObjectURL(){revoked++;}},document:{createElement:()=>canvas}});
vm.runInContext(source,context);
await assert.rejects(vm.runInContext("PhotoInput.prepare({type:'image/jpeg',size:21*1024*1024})",context),/20 MB/);
await assert.rejects(vm.runInContext("PhotoInput.prepare({type:'image/svg+xml',size:100})",context),/JPEG/);
assert.equal(created,0,'Unsupported and oversized inputs are rejected before decoding');
assert.equal(await vm.runInContext("PhotoInput.prepare({type:'image/jpeg',size:1000})",context),'data:image/jpeg;base64,AAAA');
assert.deepEqual(encodedSize,[640,360],'Photos retain aspect ratio inside a 640px bound');
assert.equal(revoked,1,'The source object URL is released');assert.equal(canvas.width,0,'The canvas backing memory is released');
canvas.getContext=()=>null;
await assert.rejects(vm.runInContext("PhotoInput.prepare({type:'image/jpeg',size:1000})",context),/could not prepare/);
assert.equal(revoked,2,'Failure paths release object URLs too');

// The UI owner guard prevents a slow photo from entering a newly opened profile draft.
const screen=await readFile(new URL('./dist/ui/profile.js',import.meta.url),'utf8');
await vm.runInContext(source+screen+`
  (async()=>{
    let finishPhoto,persisted=0;
    PhotoInput.prepare=()=>new Promise(resolve=>finishPhoto=resolve);
    const original={type:'onboarding',draft:{photos:[]},errors:{}};
    modal=original;
    persistDraft=()=>persisted++;
    const pending=addPhoto({type:'image/jpeg',size:10});
    modal={type:'onboarding',draft:{photos:[]},errors:{}};
    finishPhoto('data:image/jpeg;base64,AAAA');await pending;
    assert.equal(modal.draft.photos.length,0,'A photo never moves to a different dialog’s draft');
    assert.equal(persisted,0,'A stale photo completion is not persisted');
    assert.equal(original.photoPending,undefined,'Pending state is cleaned after dismissal');
  })();
`,vm.createContext({assert,modal:null,captureProfileFields(){},renderModal(){},persistDraft(){},toast(){},setTimeout,clearTimeout}));
console.log('Passed photo format/size validation, downscaling, cleanup and stale-dialog ownership checks.');
