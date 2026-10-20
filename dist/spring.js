/* Analytic damped oscillator, following b3ll/Motion's response/damping model.
   UI bindings are local; no third-party runtime or network animation dependency. */
const PremiumMotion = (() => {
  const presets={press:[.16,1],release:[.32,.55],snappy:[.32,.86],smooth:[.45,1],sheet:[.42,.92],bouncy:[.45,.58],toast:[.50,.72]};
  function sample(x,v,target,t,response=.45,z=1) {
    const w=2*Math.PI/response,y=x-target;
    if(Math.abs(z-1)<1e-6){const b=v+w*y,e=Math.exp(-w*t);return {value:target+(y+b*t)*e,velocity:(v-w*b*t)*e};}
    if(z<1){const a=z*w,d=w*Math.sqrt(1-z*z),b=(v+a*y)/d,e=Math.exp(-a*t),c=Math.cos(d*t),s=Math.sin(d*t);return {value:target+e*(y*c+b*s),velocity:e*((-a*y+b*d)*c+(-a*b-y*d)*s)};}
    const d=w*Math.sqrt(z*z-1),r1=-z*w+d,r2=-z*w-d,a=(v-r2*y)/(r1-r2),b=y-a;
    return {value:target+a*Math.exp(r1*t)+b*Math.exp(r2*t),velocity:r1*a*Math.exp(r1*t)+r2*b*Math.exp(r2*t)};
  }
  const active=new Set();let frame=0,last=0,keyboard=false;
  const reduced=()=>keyboard||(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  function tick(now){const dt=last?Math.min((now-last)/1000,1/30):1/60;last=now;
    for(const s of [...active]){try{const next=sample(s.value,s.velocity,s.target,dt,...s.preset);s.value=next.value;s.velocity=next.velocity;s.updated=now;s.update(s.value);const scale=['press','release','bouncy'].includes(s.name);if(Math.abs(s.value-s.target)<(scale ? 0.001 : 0.25)&&Math.abs(s.velocity)<(scale ? 0.01 : 2.5)){active.delete(s);s.value=s.target;s.velocity=0;s.update(s.target);s.done?.();}}catch{active.delete(s);}}
    if(active.size)frame=requestAnimationFrame(tick);else{frame=0;last=0;}
  }
  function spring(value,update,preset='smooth'){
    const s={value,velocity:0,target:value,name:preset,preset:presets[preset],update,updated:0};
    return {get value(){return s.value;},get velocity(){return s.velocity;},freeze(){active.delete(s);s.done=null;return s.value;},set(value,velocity=0){active.delete(s);s.value=value;s.velocity=velocity;s.done=null;update(value);},to(target,name=preset,velocity=s.velocity,done){s.target=target;s.velocity=velocity;s.name=name;s.preset=presets[name];s.done=done;if(reduced()){active.delete(s);s.value=target;s.velocity=0;update(target);done?.();return;}active.add(s);s.updated=performance.now();if(!frame)frame=requestAnimationFrame(tick);}};
  }
  if(typeof window!=='undefined'&&typeof requestAnimationFrame==='function'){
    document.addEventListener('keydown',()=>{keyboard=true;for(const s of [...active]){active.delete(s);s.value=s.target;s.velocity=0;s.update(s.target);s.done?.();}},true);
    setInterval(()=>{const now=performance.now();for(const s of [...active])if(now-s.updated>250){active.delete(s);s.value=s.target;s.velocity=0;try{s.update(s.target);s.done?.();}catch{}}},100);
    const presses=new WeakMap();
    document.addEventListener('pointerdown',e=>{keyboard=false;const el=e.target.closest('button,summary');if(!el||el.disabled||e.pointerType==='keyboard')return;let sp=presses.get(el);if(!sp){sp=spring(1,x=>el.style.scale=x,'release');presses.set(el,sp);}sp.freeze();sp.to(el.offsetWidth<=64?.86:el.offsetWidth>180?.975:.94,'press');const release=()=>{window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);sp.to(1,'release');};window.addEventListener('pointerup',release,{once:true});window.addEventListener('pointercancel',release,{once:true});},true);
  }
  const entrances=new WeakMap();
  function enter(el){if(!el||typeof requestAnimationFrame!=='function')return;entrances.get(el)?.freeze();if(reduced()){el.style.opacity='';el.style.translate='';return;}const sp=spring(16,x=>{el.style.translate=`0 ${x}px`;el.style.opacity=1-x/32;},'smooth');entrances.set(el,sp);sp.to(0,'smooth',0,()=>{el.style.opacity='';el.style.translate='';entrances.delete(el);});}
  const sheets=new WeakMap();
  function sheet(el,dismiss,entering=true){
    if(!el||typeof requestAnimationFrame!=='function')return;
    const sp=spring(entering?el.clientHeight+24:0,x=>{el.style.translate=`0 ${x}px`;if(el.parentElement)el.parentElement.style.backgroundColor=`rgba(36,12,28,${.4*Math.max(0,1-x/el.clientHeight)})`;},'sheet');sheets.set(el,sp);sp.to(0);
    const zone=el.querySelector('.drag-zone');if(!zone)return;
    zone.addEventListener('pointerdown',e=>{
      if(innerWidth>760||reduced())return;
      const origin=sp.freeze(),start=e.clientY;let lastY=e.clientY,lastAt=performance.now(),velocity=0;
      zone.setPointerCapture(e.pointerId);
      const move=ev=>{const now=performance.now(),delta=ev.clientY-start;velocity=(ev.clientY-lastY)/Math.max((now-lastAt)/1000,.001);lastY=ev.clientY;lastAt=now;const y=delta>=0?delta:-rubber(-delta,el.clientHeight);sp.set(origin+y,velocity);};
      const end=()=>{zone.removeEventListener('pointermove',move);zone.removeEventListener('pointerup',end);zone.removeEventListener('pointercancel',cancel);if(performance.now()-lastAt>80)velocity=0;const y=sp.value;if(project(y,velocity)>.45*el.clientHeight&&velocity>=0)sp.to(el.clientHeight+50,'sheet',velocity,dismiss);else sp.to(0,'sheet',velocity);};
      const cancel=()=>{velocity=0;lastY=start;end();};
      zone.addEventListener('pointermove',move);zone.addEventListener('pointerup',end);zone.addEventListener('pointercancel',cancel);
    });
  }
  const rubber=(x,d)=>(1-1/(x*.55/d+1))*d;
  const project=(value,velocity)=>value-velocity/(Math.log(.998)*1000);
  function dismiss(el,done){const sp=sheets.get(el);if(!sp){done();return;}sp.to(el.clientHeight+24,'sheet',sp.velocity,done);}
  function pop(el){if(!el||reduced())return;const sp=spring(.7,x=>el.style.scale=x,'bouncy');sp.to(1,'bouncy',4,()=>el.style.scale='');}
  return {sample,presets,spring,enter,sheet,dismiss,pop,rubber,project};
})();
