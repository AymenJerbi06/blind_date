/* Local prototype domain model. Real accounts and partner delivery are not connected. */
const Dating = (() => {
  const timeZone='America/Vancouver';
  const isoFormatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
  const wallFormatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const educationOptions=['High school','College / trade school','Bachelor’s degree','Master’s degree','Doctorate','Prefer not to say'];
  const energies=['Introvert','Somewhere in between','Extrovert'];
  const activities=['Easygoing','A bit of both','Active'];
  const pets=['Love animals','Comfortable around pets','Prefer pet-free'];
  const politics=['Prefer not to say','Progressive / left','Centrist','Conservative / right','Another view'];
  const intents=['A long-term relationship','Open to exploring'];
  const genders=['Not specified','Man','Woman','Non-binary'];
  const diets=['No restrictions','Halal','Vegetarian','Vegan','Gluten-free'];
  // Tinder-style lifestyle and background answers. Background answers are optional and never shown to a match.
  const drinking=['Never','On special occasions','Socially','Most nights'];
  const workouts=['Every day','Often','Sometimes','Never'];
  const familyPlans=['Want children','Don’t want children','Have children, want more','Have children, don’t want more','Not sure yet'];
  const religions=['Agnostic','Atheist','Buddhist','Catholic','Christian','Hindu','Jewish','Muslim','Sikh','Spiritual','Other','Prefer not to say'];
  const ethnicities=['Arab / Middle Eastern','Black / African descent','East Asian','Hispanic / Latino','Indigenous','Pacific Islander','South Asian','Southeast Asian','White / European','Mixed','Other','Prefer not to say'];
  const languages=['English','French','Arabic','Mandarin','Cantonese','Punjabi','Hindi','Spanish','Tagalog','Korean','Persian','Other'];
  const zodiacs=['Prefer not to say','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const communication=['Prefer not to say','Big-time texter','Phone caller','Video chatter','Better in person'];
  const loveStyles=['Prefer not to say','Thoughtful gestures','Presents','Touch','Compliments','Time together'];
  const wantsKids=['Want children','Have children, want more'],noKids=['Don’t want children','Have children, don’t want more'];
  const openTo=(list,value)=>!list.length||list.includes(value); // an empty list means open to everyone
  const defaultProfile=()=>({schema:2,name:'',age:'',gender:'Not specified',education:'',work:'',energy:'',activity:'',pets:'',selfSmoking:'',ownPolitics:'Prefer not to say',intent:'A long-term relationship',interests:[],values:[],diet:'No restrictions',billPreferences:[],height:'',religion:'Prefer not to say',ethnicity:'Prefer not to say',languages:[],zodiac:'Prefer not to say',drinking:'',workout:'',familyPlans:'',communication:'Prefer not to say',loveStyle:'Prefer not to say',photos:[],verification:'none',complete:false});
  const defaultPreferences=()=>({activity:'Any',energy:'Any',pets:'Any',interests:[],values:[],politics:'Any',smoking:'Any',meet:'Everyone',minAge:18,maxAge:40,radius:40,intent:'Any',drinking:'Any',workout:'Any',family:'Any',height:'Any',religions:[],ethnicities:[],stretch:false});
  const defaultAvailability=()=>({windows:[],venueIds:[]});
  const pick=(value,options,fallback)=>options.includes(value)?value:fallback;
  const unique=(list,options)=>Array.isArray(list)?[...new Set(list.filter(x=>options.includes(x)))]:[];
  function billChoices(profile) {
    const choices=[{id:'own',title:'Split the bill',detail:'We each pay for our own food and drinks.'}];
    if(profile.gender!=='Woman')choices.push({id:'cover',title:'I’ll pay',detail:'I’m happy to pay for both of us.'});
    if(profile.gender!=='Man')choices.push({id:'covered',title:profile.gender==='Woman'?'I accept if he pays':'I’m comfortable being treated',detail:profile.gender==='Woman'?'I’m comfortable with the man paying for both of us.':'I’m happy if my date offers to cover both meals.'});
    return choices;
  }
  function normalizeProfile(raw={}) {
    const p=defaultProfile();
    p.name=typeof raw.name==='string'?raw.name.slice(0,40):'';
    p.age=Number.isInteger(raw.age)?raw.age:'';
    p.gender=pick(raw.gender,genders,'Not specified');
    for(const [key,options] of Object.entries({education:educationOptions,energy:energies,activity:activities,pets,selfSmoking:['Non-smoker','Smoker'],ownPolitics:politics,intent:intents,diet:diets,religion:religions,ethnicity:ethnicities,zodiac:zodiacs,drinking,workout:workouts,familyPlans,communication,loveStyle:loveStyles}))p[key]=pick(raw[key],options,p[key]);
    p.height=Number.isInteger(raw.height)&&raw.height>=120&&raw.height<=230?raw.height:'';
    // Photos stay on this device and are hidden from a match until you both say yes after the date.
    p.photos=Array.isArray(raw.photos)?raw.photos.filter(x=>typeof x==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(x)&&x.length<700000).slice(0,3):[];
    p.verification=raw.verification==='verified-demo'?'verified-demo':'none';p.languages=unique(raw.languages,languages);
    p.work=typeof raw.work==='string'?raw.work.slice(0,80):'';
    p.interests=unique(raw.interests,interestOptions);p.values=unique(raw.values,valueOptions);
    p.billPreferences=unique(raw.billPreferences,billChoices(p).map(c=>c.id));
    p.complete=raw.schema===2&&raw.complete===true&&!firstProfileError(p);
    return p;
  }
  function profileErrors(p,step) {
    const errors={};
    if(step===0){if(typeof p.name!=='string'||!p.name.trim())errors.name='Enter your first name.';if(!Number.isInteger(p.age)||p.age<18||p.age>100)errors.age='Enter an adult age from 18 to 100.';if(!educationOptions.includes(p.education))errors.education='Choose your education, or Prefer not to say.';if(!p.photos?.length)errors.photos='Add at least one photo. It stays hidden until you both say yes after a date.';if(p.height!==''&&!(Number.isInteger(p.height)&&p.height>=120&&p.height<=230))errors.height='Use a height from 120 to 230 cm, or leave it blank.';}
    if(step===1){if(!p.languages?.length)errors.languages='Choose at least one language you speak.';}
    if(step===2){for(const [key,values] of Object.entries({energy:energies,activity:activities,workout:workouts,pets,selfSmoking:['Non-smoker','Smoker'],drinking}))if(!values.includes(p[key]))errors[key]='Choose an answer about yourself.';}
    if(step===3){if(!p.interests?.length)errors.interests='Choose at least one thing you enjoy.';if(!p.values?.length)errors.values='Choose at least one quality you value.';if(!intents.includes(p.intent))errors.intent='Choose what you’re looking for.';if(!familyPlans.includes(p.familyPlans))errors.familyPlans='Choose an answer about family plans.';}
    if(step===4){const allowed=billChoices(p).map(c=>c.id);if(!p.billPreferences?.length||p.billPreferences.some(c=>!allowed.includes(c)))errors.billPreferences='Choose at least one bill arrangement you’re comfortable with.';}
    return errors;
  }
  const profileSteps=5;
  function firstProfileError(p){for(let step=0;step<profileSteps;step++){const errors=profileErrors(p,step);if(Object.keys(errors).length)return{step,errors};}return null;}
  function normalizePreferences(raw={}) {
    const p=defaultPreferences();
    for(const [key,values] of Object.entries({activity:['Any',...activities],energy:['Any',...energies],pets:['Any','Love animals','Prefer pet-free'],politics:['Any','Similar views'],smoking:['Any','Non-smoker only'],meet:['Everyone','Man','Woman','Non-binary'],intent:['Any',...intents],drinking:['Any','Non-drinker only','No heavy drinking'],workout:['Any','Works out often','Works out sometimes or more'],family:['Any','Wants children','Doesn’t want children'],height:['Any','Taller than me','Shorter than me']}))p[key]=pick(raw[key],values,p[key]);
    p.stretch=raw.stretch===true;p.religions=unique(raw.religions,religions.filter(r=>r!=='Prefer not to say'));p.ethnicities=unique(raw.ethnicities,ethnicities.filter(r=>r!=='Prefer not to say'));
    p.interests=unique(raw.interests,interestOptions);p.values=unique(raw.values,valueOptions);
    for(const key of ['minAge','maxAge','radius'])if(typeof raw[key]==='number'||raw[key]==='')p[key]=raw[key];
    return p;
  }
  function preferenceErrors(p,profile) {
    const e={};
    if(!Number.isInteger(p.minAge)||p.minAge<18||p.minAge>100)e.minAge='Use an age from 18 to 100.';
    if(!Number.isInteger(p.maxAge)||p.maxAge<18||p.maxAge>100)e.maxAge='Use an age from 18 to 100.';
    else if(p.minAge>p.maxAge)e.maxAge='The upper age must be at least the lower age.';
    if(!Number.isFinite(p.radius)||p.radius<5||p.radius>50)e.radius='Choose a radius from 5 to 50 km.';
    if(p.politics==='Similar views'&&profile?.ownPolitics==='Prefer not to say')e.politics='Add your own political view in Profile, or stay open to different views.';
    if(p.height!=='Any'&&!Number.isInteger(profile?.height))e.height='Add your own height in Profile to compare, or choose No preference.';
    return e;
  }
  function isoDate(timestamp=Date.now()) {
    const parts=isoFormatter.formatToParts(new Date(timestamp));
    return ['year','month','day'].map(type=>parts.find(p=>p.type===type).value).join('-');
  }
  function dateOffset(days,now=Date.now()){const [y,m,d]=isoDate(now).split('-').map(Number);return isoDate(Date.UTC(y,m-1,d+days,20));}
  function realDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [y,m,d]=value.split('-').map(Number);const day=new Date(Date.UTC(y,m-1,d));return day.getUTCFullYear()===y&&day.getUTCMonth()===m-1&&day.getUTCDate()===d;}
  function minutes(time){if(typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return NaN;const [h,m]=time.split(':').map(Number);return h*60+m;}
  function timeFromMinutes(value){return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}
  function timestamp(date,time) {
    if(!realDate(date)||!Number.isFinite(minutes(time)))return NaN;
    const [y,m,d]=date.split('-').map(Number),[h,min]=time.split(':').map(Number),wall=Date.UTC(y,m-1,d,h,min);
    let stamp=wall+8*3600000;
    for(let i=0;i<3;i++){const parts=wallFormatter.formatToParts(new Date(stamp));const n=k=>+parts.find(p=>p.type===k).value;const delta=wall-Date.UTC(n('year'),n('month')-1,n('day'),n('hour'),n('minute'));if(!delta)return stamp;stamp+=delta;}
    return NaN; // Nonexistent wall times during a spring clock change are not silently moved.
  }
  function normalizeAvailability(raw={}) {
    return{windows:Array.isArray(raw.windows)?raw.windows.slice(0,14).filter(w=>w&&typeof w.date==='string').map(w=>({date:w.date.slice(0,10),start:typeof w.start==='string'?w.start.slice(0,5):'',end:typeof w.end==='string'?w.end.slice(0,5):''})):[],venueIds:unique(raw.venueIds,venues.map(v=>v.id))};
  }
  function venueFits(venue,profile){return !!venue&&(!profile.diet||profile.diet==='No restrictions'||venue.tags.includes(profile.diet));}
  function availabilityErrors(a,profile,now=Date.now()) {
    const e={};
    if(!a.windows.length)e.windows='Choose at least one day and a time range.';
    a.windows.forEach((w,i)=>{const start=minutes(w.start),end=minutes(w.end),stamp=timestamp(w.date,w.start);if(!realDate(w.date)||!Number.isFinite(stamp)||stamp<=now)e['window-'+i]='Choose a real future day and time.';else if(!Number.isFinite(end)||end-start<60)e['window-'+i]='Keep at least one hour free, with the end after the start on the same day.';});
    if(new Set(a.windows.map(w=>w.date)).size!==a.windows.length)e.windows='Use one time range per day.';
    if(!a.venueIds.length)e.venues='Choose at least one place you’d be happy to meet.';
    else if(a.venueIds.some(id=>!venueFits(venues.find(v=>v.id===id),profile)))e.venues='Some places no longer fit your dietary preferences. Choose a place that does.';
    return e;
  }
  function billOptions(you,person){const options=[];if(you.billPreferences.includes('own')&&person.billPreferences.includes('own'))options.push('own');if(you.billPreferences.includes('cover')&&person.billPreferences.includes('covered'))options.push('you-cover');if(you.billPreferences.includes('covered')&&person.billPreferences.includes('cover'))options.push('date-covers');return options;}
  function billText(mode){return({own:'Each pays for their own food and drinks','you-cover':'You’ve offered to cover both meals','date-covers':'Your date has offered to cover both meals'})[mode]||'Bill arrangement not agreed yet';}
  const traits={
    '021':{height:168,religion:'Spiritual',ethnicity:'White / European',languages:['English','French'],drinking:'Socially',workout:'Often',familyPlans:'Want children',communication:'Better in person',loveStyle:'Time together',zodiac:'Leo',energy:'Somewhere in between',activity:'Active',pets:'Love animals',education:'Bachelor’s degree',ownPolitics:'Progressive / left',diet:'No restrictions',billPreferences:['own','covered'],days:[5,6],start:'18:00',end:'21:00',venueIds:['juniper','olive']},
    '032':{height:183,religion:'Agnostic',ethnicity:'East Asian',languages:['English','Mandarin'],drinking:'On special occasions',workout:'Sometimes',familyPlans:'Not sure yet',communication:'Big-time texter',loveStyle:'Thoughtful gestures',zodiac:'Virgo',energy:'Introvert',activity:'A bit of both',pets:'Love animals',education:'Master’s degree',ownPolitics:'Centrist',diet:'No restrictions',billPreferences:['own','cover'],days:[6,9],start:'12:00',end:'15:00',venueIds:['sunday','common']},
    '048':{height:175,religion:'Atheist',ethnicity:'Mixed',languages:['English','Spanish'],drinking:'Socially',workout:'Sometimes',familyPlans:'Don’t want children',communication:'Video chatter',loveStyle:'Compliments',zodiac:'Gemini',energy:'Extrovert',activity:'A bit of both',pets:'Comfortable around pets',education:'College / trade school',ownPolitics:'Progressive / left',diet:'Vegetarian',billPreferences:['own','cover','covered'],days:[7,9],start:'17:00',end:'20:00',venueIds:['fig','olive']},
    '055':{height:162,religion:'Catholic',ethnicity:'Hispanic / Latino',languages:['English','Spanish'],drinking:'Socially',workout:'Every day',familyPlans:'Want children',communication:'Phone caller',loveStyle:'Touch',zodiac:'Sagittarius',energy:'Extrovert',activity:'Active',pets:'Comfortable around pets',education:'Bachelor’s degree',ownPolitics:'Progressive / left',diet:'No restrictions',billPreferences:['own','covered'],days:[5,7],start:'19:00',end:'22:00',venueIds:['sunday','common']},
    '063':{height:178,religion:'Christian',ethnicity:'Black / African descent',languages:['English','French'],drinking:'Never',workout:'Every day',familyPlans:'Have children, want more',communication:'Better in person',loveStyle:'Thoughtful gestures',zodiac:'Capricorn',energy:'Somewhere in between',activity:'Active',pets:'Love animals',education:'College / trade school',ownPolitics:'Centrist',diet:'Gluten-free',billPreferences:['own','cover'],days:[9,10],start:'18:00',end:'21:00',venueIds:['juniper','fig']},
    '071':{height:160,religion:'Muslim',ethnicity:'Arab / Middle Eastern',languages:['English','Arabic','French'],drinking:'Never',workout:'Sometimes',familyPlans:'Want children',communication:'Big-time texter',loveStyle:'Time together',zodiac:'Pisces',energy:'Somewhere in between',activity:'A bit of both',pets:'Comfortable around pets',education:'Bachelor’s degree',ownPolitics:'Centrist',diet:'No restrictions',billPreferences:['own','covered'],days:[5,8],start:'18:00',end:'21:00',venueIds:['juniper','sunday'],seeking:{religions:['Muslim'],drinking:'Non-drinker only'}},
    '084':{height:180,religion:'Muslim',ethnicity:'South Asian',languages:['English','Hindi'],drinking:'Never',workout:'Every day',familyPlans:'Want children',communication:'Phone caller',loveStyle:'Thoughtful gestures',zodiac:'Aries',energy:'Extrovert',activity:'Active',pets:'Love animals',education:'Bachelor’s degree',ownPolitics:'Prefer not to say',diet:'No restrictions',billPreferences:['own','cover'],days:[6,8],start:'17:30',end:'20:30',venueIds:['olive','juniper'],seeking:{religions:['Muslim']}},
    '092':{height:171,religion:'Jewish',ethnicity:'White / European',languages:['English','French'],drinking:'Socially',workout:'Often',familyPlans:'Not sure yet',communication:'Better in person',loveStyle:'Compliments',zodiac:'Libra',energy:'Introvert',activity:'Easygoing',pets:'Love animals',education:'Master’s degree',ownPolitics:'Progressive / left',diet:'Vegetarian',billPreferences:['own','covered'],days:[5,9],start:'19:00',end:'22:00',venueIds:['fig','olive'],seeking:{height:'Taller than me'}},
    '105':{height:174,religion:'Sikh',ethnicity:'South Asian',languages:['English','Punjabi'],drinking:'On special occasions',workout:'Often',familyPlans:'Want children',communication:'Video chatter',loveStyle:'Presents',zodiac:'Taurus',energy:'Somewhere in between',activity:'A bit of both',pets:'Love animals',education:'College / trade school',ownPolitics:'Centrist',diet:'Vegetarian',billPreferences:['own','cover'],days:[7,10],start:'18:00',end:'21:00',venueIds:['fig','common']},
    '117':{height:165,religion:'Buddhist',ethnicity:'Southeast Asian',languages:['English','Tagalog'],drinking:'Socially',workout:'Every day',familyPlans:'Want children',communication:'Big-time texter',loveStyle:'Touch',zodiac:'Aquarius',energy:'Extrovert',activity:'Active',pets:'Love animals',education:'Bachelor’s degree',ownPolitics:'Centrist',diet:'No restrictions',billPreferences:['own','covered'],days:[5,6],start:'12:00',end:'15:00',venueIds:['sunday','juniper'],seeking:{workout:'Works out sometimes or more'}},
  };
  function person(id,now=Date.now()){const raw=candidates.find(c=>c.id===id);if(!raw)return null;const t=traits[id];return{...raw,...t,billPreferences:[...t.billPreferences],venueIds:[...t.venueIds],windows:t.days.map(day=>({date:dateOffset(day,now),start:t.start,end:t.end})),seeking:{minAge:18,maxAge:55,meet:'Everyone',radius:50,...(t.seeking||{})}};}
  function sharedPlan(availability,other,profile,now=Date.now()) {
    const venueId=availability.venueIds.find(id=>other.venueIds.includes(id)&&venueFits(venues.find(v=>v.id===id),profile)&&venueFits(venues.find(v=>v.id===id),other));
    const billMode=billOptions(profile,other)[0];if(!venueId||!billMode)return null;
    const overlaps=[];
    for(const a of availability.windows)for(const b of other.windows){if(a.date!==b.date)continue;const from=Math.max(minutes(a.start),minutes(b.start)),to=Math.min(minutes(a.end),minutes(b.end));if(to-from>=60){const stamp=timestamp(a.date,timeFromMinutes(from));if(Number.isFinite(stamp)&&stamp>now)overlaps.push({date:a.date,time:timeFromMinutes(from),timestamp:stamp,venueId,billMode});}}
    return overlaps.sort((a,b)=>a.timestamp-b.timestamp)[0]||null;
  }
  function preferenceFits(preferences,self,other,distance) {
    const p={...defaultPreferences(),...preferences};
    const nonSmoker=other.selfSmoking==='Non-smoker'||other.smoking===false;
    return (p.meet==='Everyone'||other.gender===p.meet)
      && other.age>=p.minAge && other.age<=p.maxAge && distance<=p.radius
      && (p.intent==='Any'||p.intent===other.intent)
      && (p.energy==='Any'||p.energy===other.energy)
      && (p.activity==='Any'||p.activity===other.activity)
      && (p.pets==='Any'||p.pets===other.pets)
      && (p.smoking!=='Non-smoker only'||nonSmoker)
      && (p.politics!=='Similar views'||(self.ownPolitics!=='Prefer not to say'&&self.ownPolitics===other.ownPolitics))
      && lifestyleFits(p,self,other);
  }
  function eligible(profile,prefs,other) {
    return !!(profile.complete && profile.age>=18 && profile.intent===other.intent
      && billOptions(profile,other).length
      && preferenceFits(prefs,profile,other,other.km)
      && preferenceFits(other.seeking,other,profile,other.km));
  }
  // One person's lifestyle and background requirements, checked against the other person.
  function lifestyleFits(prefs,self,other) {
    const d=prefs.drinking||'Any',w=prefs.workout||'Any',f=prefs.family||'Any',h=prefs.height||'Any';
    if(d==='Non-drinker only'&&other.drinking!=='Never')return false;
    if(d==='No heavy drinking'&&(!other.drinking||other.drinking==='Most nights'))return false;
    if(w==='Works out often'&&!['Every day','Often'].includes(other.workout))return false;
    if(w==='Works out sometimes or more'&&(!other.workout||other.workout==='Never'))return false;
    if(f==='Wants children'&&!wantsKids.includes(other.familyPlans))return false;
    if(f==='Doesn’t want children'&&!noKids.includes(other.familyPlans))return false;
    if(h!=='Any'&&!(Number.isInteger(self.height)&&Number.isInteger(other.height)&&(h==='Taller than me'?other.height>self.height:other.height<self.height)))return false;
    if(!openTo(prefs.religions||[],other.religion))return false;
    if(!openTo(prefs.ethnicities||[],other.ethnicity))return false;
    return true;
  }
  function search(profile,prefs,availability,excluded=[],now=Date.now()) {
    if(firstProfileError(profile)||!profile.complete||Object.keys(preferenceErrors(prefs,profile)).length||Object.keys(availabilityErrors(availability,profile,now)).length)return[];
    return candidates.map(c=>person(c.id,now)).filter(c=>!excluded.includes(c.id)&&eligible(profile,prefs,c)).map(c=>({person:c,plan:sharedPlan(availability,c,profile,now),score:c.interests.filter(t=>prefs.interests.includes(t)).length*3+c.values.filter(t=>prefs.values.includes(t)).length*4+c.interests.filter(t=>profile.interests.includes(t)).length+(c.languages||[]).filter(l=>profile.languages.includes(l)).length*2+(c.communication&&c.communication!=='Prefer not to say'&&c.communication===profile.communication?1:0)+(c.loveStyle&&c.loveStyle!=='Prefer not to say'&&c.loveStyle===profile.loveStyle?1:0)})).sort((a,b)=>(!!b.plan-!!a.plan)||b.score-a.score||a.person.km-b.person.km);
  }
  function planFromChoice(availability,profile,other,preferOther=false,now=Date.now()) {
    const source=preferOther?other:availability;
    const window=source.windows.filter(w=>timestamp(w.date,w.start)>now&&minutes(w.end)-minutes(w.start)>=60).sort((a,b)=>a.date.localeCompare(b.date))[0];
    const venueId=source.venueIds.find(id=>venueFits(venues.find(v=>v.id===id),profile)&&venueFits(venues.find(v=>v.id===id),other));
    const billMode=billOptions(profile,other)[0];
    if(!window||!venueId||!billMode)return null;
    return{date:window.date,time:window.start,timestamp:timestamp(window.date,window.start),venueId,billMode};
  }
  function proposalErrors(plan,profile,other,now=Date.now()) {
    const e={};if(!plan||!other)return{plan:'Choose a plan first.'};
    const stamp=timestamp(plan.date,plan.time);
    if(!Number.isFinite(stamp)||stamp<=now||stamp!==plan.timestamp)e.time='Choose a valid future date and time.';
    const venue=venues.find(v=>v.id===plan.venueId);if(!venueFits(venue,profile)||!venueFits(venue,other))e.venue='Choose a place that fits both dietary preferences.';
    if(!billOptions(profile,other).includes(plan.billMode))e.bill='Review the bill arrangement; it no longer matches both people’s choices.';
    return e;
  }
  function makeProposal(plan,revision=1,author='you',note='') {return{...plan,revision,author,note:String(note).slice(0,240),youAccepted:author==='you',partnerAccepted:author==='partner'};}
  function respond(proposal,revision,actor){if(!proposal||revision!==proposal.revision||!['you','partner'].includes(actor))return null;return{...proposal,[actor==='you'?'youAccepted':'partnerAccepted']:true};}
  function canConfirm(proposal,profile,other,consent,now=Date.now()){return!!(profile.complete&&proposal?.youAccepted&&proposal.partnerAccepted&&consent===true&&!Object.keys(proposalErrors(proposal,profile,other,now)).length);}
  function cancellationFee(booking,reason,now=Date.now()){return now<=booking.timestamp-86400000||['Safety concern','Emergency'].includes(reason)?0:20;}
  return{timeZone,drinking,workouts,familyPlans,religions,ethnicities,languages,zodiacs,communication,loveStyles,profileSteps,preferenceFits,lifestyleFits,educationOptions,energies,activities,pets,politics,intents,genders,diets,defaultProfile,defaultPreferences,defaultAvailability,billChoices,normalizeProfile,profileErrors,firstProfileError,normalizePreferences,preferenceErrors,isoDate,dateOffset,realDate,minutes,timeFromMinutes,timestamp,normalizeAvailability,availabilityErrors,venueFits,billOptions,billText,person,sharedPlan,eligible,search,planFromChoice,proposalErrors,makeProposal,respond,canConfirm,cancellationFee};
})();
