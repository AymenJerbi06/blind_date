/* Supabase account access with account-scoped local demo data. Counterparts/replies remain simulated. */
const storageKey='blinddate-demo-v1';
const app=document.querySelector('#app'),modalRoot=document.querySelector('#modal-root'),tabRoot=document.querySelector('#tab-root');
const navItems=[['home','Preferences','spark'],['dates','Dates','calendar'],['availability','Availability','clock'],['profile','Profile','user']];
const clone=value=>structuredClone(value);
let identitySequence=0;
const newIdentity=prefix=>`${prefix}-${Date.now().toString(36)}-${++identitySequence}`;
const deckLast=questions.length-1;
const defaultState=AppState.create;
const isMember=()=>Plans.isMember(state); // demo membership: no payment is ever taken
let repository=LocalRepository.create(localStorage,storageKey);
const readState=()=>AppState.hydrate(repository.read(),{deckLast});
let fbErrors={},autoAdvanceTimer=null; // single-choice deck cards advance on tap, like a swipe
let state=readState(),modal=null,lastFocus=null,previousView=null,toastTimer,agreementConsent=false,availabilityErrors={},preferenceErrors={},showAllVenues=false,searchTimer=null,searchToken=0;
let account={loading:true,user:null,screen:'welcome',email:'',error:'',busy:false};
const viewStack=[];
function clearAccountTransientUI(){clearTimeout(toastTimer);const notice=document.querySelector('#toast');if(notice){notice.textContent='';notice.classList.remove('visible');}fbErrors={};availabilityErrors={};preferenceErrors={};agreementConsent=false;lastFocus=null;}
function activateAccount(user){clearAccountTransientUI();const theme=state.theme;clearTimeout(searchTimer);++searchToken;modal=null;modalRoot.innerHTML='';document.body.style.overflow='';app.inert=false;viewStack.length=0;previousView=null;repository=LocalRepository.create(localStorage,EntryFlow.keyForUser(storageKey,user.id));const saved=repository.read();state=AppState.hydrate(saved,{deckLast});if(!saved)state.theme=theme;account={loading:false,user,screen:'welcome',email:'',error:'',busy:false};render();window.scrollTo({top:0,behavior:'instant'});}
async function restoreAccount(){try{const result=await AuthClient.session();if(result.user){activateAccount(result.user);return;}account.loading=false;account.error=result.available?'':'Account access is temporarily unavailable. Please try again later.';}catch(error){account.loading=false;account.error=error.message;}if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('auth')==='confirmation_failed'){account.screen='log-in';account.error='The link could not open your session. If your email is confirmed, log in below.';history.replaceState({},'','/');}render();}
async function submitAccount(form){if(account.busy)return;const email=form.elements.email.value.trim(),password=form.elements.password.value,signup=account.screen==='sign-up';const problem=EntryFlow.credentialError(email,password,signup);const errorNode=form.querySelector('[data-auth-error]');errorNode.hidden=false;errorNode.textContent=problem;if(problem){form.querySelector(!/^\S+@\S+\.\S+$/.test(email)?'[name="email"]':'[name="password"]').focus();return;}account.busy=true;account.email=email;form.setAttribute('aria-busy','true');form.querySelectorAll('input,button').forEach(node=>node.disabled=true);document.querySelectorAll('[data-action="auth-view"]').forEach(node=>node.disabled=true);const submit=form.querySelector('[type="submit"]');submit.textContent=signup?'Creating account…':'Logging in…';try{const result=await(signup?AuthClient.signUp(email,password):AuthClient.logIn(email,password));if(result.user)activateAccount(result.user);else if(result.confirmationRequired){account.screen='confirm';account.error='';render();}else throw new Error('We couldn’t open your account. Please try again.');}catch(error){if(form.isConnected){errorNode.textContent=error.message;errorNode.focus?.();}}finally{account.busy=false;if(form.isConnected){form.setAttribute('aria-busy','false');form.querySelectorAll('input,button').forEach(node=>node.disabled=false);document.querySelectorAll('[data-action="auth-view"]').forEach(node=>node.disabled=false);submit.textContent=signup?'Create account':'Log in';}}}
async function logOut(){if(account.busy)return;persistDraft();account.busy=true;try{await AuthClient.logOut();clearAccountTransientUI();const theme=state.theme;clearTimeout(searchTimer);++searchToken;modal=null;modalRoot.innerHTML='';app.inert=false;document.body.style.overflow='';repository=LocalRepository.create(localStorage,storageKey);state={...defaultState(),theme};account={loading:false,user:null,screen:'welcome',email:'',error:'',busy:false};viewStack.length=0;previousView=null;render();window.scrollTo({top:0,behavior:'instant'});}catch(error){toast(error.message);}finally{account.busy=false;}}
function save(){try{repository.write(state);return true;}catch{toast('This browser could not save your progress.');return false;}}
function applyResult(result,{redraw=true}={}) {
  if(!result.ok){if(result.errors){fbErrors=result.errors;if(redraw)render();}else if(result.error)toast(result.error);return false;}
  try{repository.write(result.state);}catch{toast('This browser could not save that change. Your previous saved state is kept.');return false;}
  state=result.state;if(redraw)render();return true;
}
function changeFeedback(field,value,redraw=true){const result=DateLifecycle.updateFeedback(state,field,value);if(result.ok)delete fbErrors[field];return applyResult(result,{redraw});}
function toast(message){const el=document.querySelector('#toast');if(!el)return;el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);PremiumMotion.enter(el);toastTimer=setTimeout(()=>el.classList.remove('visible'),2600);}
function eventNotice(title,detail,view='home'){state.inbox.push({id:newIdentity('notice'),title,detail,view,read:false,at:Date.now()});state.inbox=state.inbox.slice(-30);save();}
function unreadCount(){return state.inbox.filter(n=>!n.read).length;}
// Display-only: whether the open introduction is waiting on this person. Never changes state.
function yourTurn(){const s=state.session;if(!s)return false;return['found','agreed','declined'].includes(s.phase)||(s.phase==='waiting'&&s.proposal?.author==='partner'&&!s.proposal.youAccepted);}
function navMarkup(){return navItems.map(([view,label,graphic])=>{const active=state.view===view||(view==='profile'&&state.view==='membership'),dot=view==='home'&&yourTurn();return`<button class="nav-button ${active?'active':''}" data-action="navigate" data-view="${view}" ${active?'aria-current="page"':''} ${dot?`aria-label="${label}, your turn"`:''}><span class="nav-icon">${icon(graphic,active)}${dot?'<span class="nav-dot" aria-hidden="true"></span>':''}</span><span>${label}</span></button>`;}).join('');}
function render(){
  agreementConsent=false;
  const entryStage=EntryFlow.stage(account,state.profile);document.body.dataset.entryStage=entryStage;
  if(entryStage!=='app'){
    document.documentElement.dataset.theme=state.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',state.theme==='light'?'#fff8f4':'#211526');
    tabRoot.innerHTML='';app.inert=false;document.body.style.overflow='';
    if(entryStage==='setup'){
      app.innerHTML='';
      if(!modal?.required){const draft=state.drafts.profile;modal={type:'onboarding',required:true,step:draft?.step||0,draft:clone(draft?.draft||state.profile),errors:{}};}
      renderModal();
    }else{modal=null;modalRoot.innerHTML='';app.innerHTML=entryPage();PremiumMotion.enter(app.querySelector('#entry-content'));}
    return;
  }
  const active=document.activeElement,focusId=app.contains(active)?active.id:null,focusData=app.contains(active)&&active.dataset.action?{...active.dataset}:null;
  document.documentElement.dataset.theme=state.theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',state.theme==='light'?'#fff8f4':'#211526');
  const titles={home:'Your preferences',dates:'Your dates',availability:'Your availability',profile:'Your profile',membership:'blinddate+'};
  const pages={home:homePage,dates:datePage,availability:availabilityPage,profile:profilePage,membership:membershipPage};
  app.innerHTML=`<div class="app-shell"><header class="compact-header"><span>${titles[state.view]}</span><span class="compact-brand">blinddate</span></header><div class="topbar">${previousView?`<button class="back-button" data-action="back">${icon('back')}${titles[previousView]}</button>`:`<span class="wordmark">${brand}blinddate<span class="brand-period">.</span></span>`}<div class="top-actions"><button class="icon-button" data-action="notifications" aria-label="Notifications${unreadCount()?', '+unreadCount()+' unread updates':''}">${icon('bell')}${unreadCount()?`<span class="notification-badge">${unreadCount()}</span>`:''}</button><button class="avatar" data-action="open-profile" aria-label="Open profile and settings">${state.profile.name?esc(state.profile.name.charAt(0).toUpperCase()):icon('user')}</button></div></div><main id="page-content" data-view="${state.view}">${(pages[state.view]||homePage)()}</main>${showQuestionNav()?questionNav():''}<footer class="app-footer">Personality first. A real-world hello next.<br><span>Prototype · sample introductions and simulated replies</span></footer></div>`;
  tabRoot.innerHTML=`<nav class="floating-tabs" aria-label="Main navigation">${navMarkup()}</nav>`;
  if(!modal){const target=focusId?document.getElementById(focusId):focusData?[...app.querySelectorAll('[data-action]')].find(el=>el.dataset.action===focusData.action&&el.dataset.value===focusData.value&&el.dataset.group===focusData.group):null;target?.focus({preventScroll:true});}
  updateCountdown();bindQuestionSwipe();PremiumMotion.enter(document.querySelector('#page-content'));
}
function navigate(view,pushed=false,goingBack=false){if(EntryFlow.stage(account,state.profile)!=='app'){render();return;}if(modal)closeModal(false);if(!['home','dates','availability','profile','membership'].includes(view))view='home';if(!goingBack){if(pushed)viewStack.push(state.view);else viewStack.length=0;}previousView=viewStack.at(-1)||null;state.view=view;save();render();window.scrollTo({top:0,behavior:'instant'});document.querySelector('.page-title')?.focus({preventScroll:true});}

function capturePreferenceFields(){app.querySelectorAll('[data-pref-field]').forEach(input=>{const key=input.dataset.prefField;state.deck.answers[key]=['minAge','maxAge','radius'].includes(key)?(input.value===''?'':Number(input.value)):input.value;});}
function savePreferenceDraft(){capturePreferenceFields();const ok=save(),el=app.querySelector('[data-preference-saved]');if(el){el.textContent=ok?'✓ Draft saved here — choose whether to reuse it at the end.':'This draft could not be saved.';el.classList.toggle('saved-status',ok);}}
function advanceQuestion(direction=1){capturePreferenceFields();preferenceErrors={};if(direction>0&&state.deck.step===questionIndex('alignment')&&state.deck.answers.politics==='Similar views'&&state.profile.ownPolitics==='Prefer not to say')preferenceErrors.politics='Add your own view in Profile, or choose Open to different views.';if(direction>0&&state.deck.step===deckLast)preferenceErrors=Dating.preferenceErrors(state.deck.answers,state.profile);if(Object.keys(preferenceErrors).length){render();app.querySelector('.field-error')?.scrollIntoView({block:'center'});return;}state.deck.step=direction<0?Math.max(0,state.deck.step-1):state.deck.step===deckLast?'review':state.deck.step+1;save();render();window.scrollTo({top:0,behavior:'instant'});(document.querySelector('.question-title')||document.querySelector('.page-title'))?.focus({preventScroll:true});}
function bindQuestionSwipe(){
  const card=app.querySelector('[data-swipe-card]'),grip=card?.querySelector('.question-grip');if(!card||!grip)return;
  grip.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();advanceQuestion(1);}if(e.key==='ArrowLeft'){e.preventDefault();advanceQuestion(-1);}});
  card.addEventListener('pointerdown',e=>{if(innerWidth>760||e.button>0||e.target.closest('button,input,select,textarea'))return;const startX=e.clientX,startY=e.clientY;let dx=0,dy=0;const sp=PremiumMotion.spring(0,x=>{card.style.translate=`${x}px 0`;card.style.rotate=`${x/35}deg`;},'snappy');card.setPointerCapture(e.pointerId);const move=ev=>{dx=ev.clientX-startX;dy=ev.clientY-startY;if(Math.abs(dx)>Math.abs(dy)){sp.set(dx*.85);if(ev.cancelable)ev.preventDefault();}};const cleanup=()=>{card.removeEventListener('pointermove',move);card.removeEventListener('pointerup',end);card.removeEventListener('pointercancel',cancel);};const end=()=>{cleanup();if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.2)advanceQuestion(dx<0?1:-1);else sp.to(0,'snappy');};const cancel=()=>{cleanup();sp.to(0,'snappy');};card.addEventListener('pointermove',move);card.addEventListener('pointerup',end);card.addEventListener('pointercancel',cancel);});
}
function chooseType(scope){const errors=Dating.preferenceErrors(state.deck.answers,state.profile);if(Object.keys(errors).length){preferenceErrors=errors;state.deck.step=errors.politics?questionIndex('alignment'):deckLast;render();return;}if(scope==='saved')state.savedPreferences=clone(state.deck.answers);state.session={id:newIdentity('intro'),phase:'planning',scope,preferences:clone(state.deck.answers),availability:clone(state.availability),person:null,proposal:null,suggested:null,passedIds:[],history:[],createdAt:Date.now(),isReschedule:false,marker:Trust.defaultMarker()};state.drafts.proposal=null;if(save())toast(scope==='saved'?'Your type is saved for future blind dates.':'These answers are for this introduction only.');navigate('availability');}
function commitAvailability(){availabilityErrors=Dating.availabilityErrors(state.availabilityDraft,state.profile);if(Object.keys(availabilityErrors).length){render();app.querySelector('.field-error')?.scrollIntoView({block:'center'});return false;}state.availability=clone(state.availabilityDraft);if(state.session?.phase==='planning')state.session.availability=clone(state.availability);return save();}
function runSearch(){
  if(!state.profile.complete){navigate('home');toast('Finish your own profile before searching.');return;}
  if(!state.session){navigate('home');return;}
  if(state.booking){navigate('dates');toast('You already have a confirmed date.');return;}
  if(state.session.phase==='searching')return;
  const preferences=state.session.preferences;
  if(Object.keys(Dating.preferenceErrors(preferences,state.profile)).length){changeType();toast('Review your preferences before searching.');return;}
  if(!commitAvailability())return;
  const s=state.session;s.availability=clone(state.availability);s.phase='searching';s.person=null;s.proposal=null;s.suggested=null;s.createdAt=Date.now();const token=++searchToken;save();navigate('home');const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;searchTimer=setTimeout(()=>finishSearch(token),reduced?0:1100);
}
function finishSearch(token=searchToken){if(token!==searchToken||state.session?.phase!=='searching')return;clearTimeout(searchTimer);const result=Trust.search(state.profile,state.session.preferences,state.session.availability,state.session.passedIds,{member:isMember(),recordOverrides:state.reliabilityOverrides})[0];if(result){state.session.person=clone(result.person);state.session.stretched=!!result.stretched;state.session.suggested=clone(result.plan);state.session.phase='found';eventNotice('A sample introduction is ready',result.plan?'A shared time and place are available. Review before asking for confirmation.':'The personality fit is there. Compare your times and places.');}else state.session.phase='empty';save();render();if(state.view==='home')PremiumMotion.pop(app.querySelector('.mystery-cover'));else toast('Your sample search is ready in Preferences.');}
function cancelSearch(){clearTimeout(searchTimer);++searchToken;if(state.session){state.session.phase='planning';save();render();}}
function changeType(){if(state.session?.isReschedule){withdrawChange();return;}if(state.session)state.deck={step:0,answers:clone(state.session.preferences)};state.session=null;state.drafts.proposal=null;save();navigate('home');}
function introductionStillFits(s){
  if(s?.isReschedule)return true; // The original confirmed date remains valid during a change discussion.
  const fits=s?.person&&Dating.eligible(state.profile,s.stretched?Trust.stretched(s.preferences):s.preferences,s.person);
  if(!fits)toast('Your profile no longer fits this introduction’s requirements. Review your profile or rematch.');
  return !!fits;
}
function sendPlan(plan,note=''){
  const s=state.session;if(!s?.person||!state.profile.complete||!introductionStillFits(s))return false;
  const leakProblem=Trust.leak(note)||(!Trust.notePresets.includes(note)?'Choose a note from the list.':null);if(leakProblem){toast(leakProblem);return false;}
  const errors=Dating.proposalErrors(plan,state.profile,s.person);
  if(Object.keys(errors).length){toast(Object.values(errors).join(' '));return false;}
  const revision=(s.proposal?.revision||0)+1,proposal=Dating.makeProposal(plan,revision,'you',note);if(!applyResult({ok:true,state:{...state,session:{...s,proposal,history:[...s.history,{author:'you',note:note||'Proposed a time, place and bill arrangement.',revision}].slice(-8),phase:'waiting'},drafts:{...state.drafts,proposal:null}}},{redraw:false}))return false;eventNotice('Your demo proposal is ready','Waiting for a simulated reply. No real notification was delivered.');if(modal){modal=null;closeModal(false);}navigate('home');return true;
}
function sampleCounterPlan(){const s=state.session,c=s.person,current=s.proposal;for(const w of c.windows){for(const v of [...c.venueIds,...venues.map(v=>v.id)]){const plan={date:w.date,time:w.start,timestamp:Dating.timestamp(w.date,w.start),venueId:v,billMode:Dating.billOptions(state.profile,c)[0]};if(!Object.keys(Dating.proposalErrors(plan,state.profile,c)).length&&(!current||plan.timestamp!==current.timestamp||plan.venueId!==current.venueId))return plan;}}return null;}
function demoReply(kind,revision){const s=state.session;if(!s?.proposal||s.proposal.revision!==revision||s.phase!=='waiting')return;if(kind==='accept'){const errors=Dating.proposalErrors(s.proposal,state.profile,s.person);if(Object.keys(errors).length){toast('This plan needs a fresh review. '+Object.values(errors).join(' '));return;}s.proposal=Dating.respond(s.proposal,revision,'partner');s.phase=s.proposal.youAccepted?'agreed':'waiting';eventNotice('Your sample date accepted','Both accepted the same proposal. Review the terms before confirming.');}if(kind==='counter'){const plan=sampleCounterPlan();if(!plan){toast('No different valid sample proposal is available.');return;}s.proposal=Dating.makeProposal(plan,revision+1,'partner','Would this day or place work better?');s.history.push({author:'partner',note:s.proposal.note,revision:s.proposal.revision});s.phase='waiting';eventNotice('Your sample date suggested a change','Review their new time, place and bill arrangement.');}if(kind==='decline'){s.phase='declined';eventNotice('The sample plans didn’t align',s.isReschedule?'Your original date is still confirmed.':'You can offer another plan or rematch without a fee.');}save();render();}
function acceptCounter(){const s=state.session;if(!s?.proposal?.partnerAccepted||!introductionStillFits(s))return;const errors=Dating.proposalErrors(s.proposal,state.profile,s.person);if(Object.keys(errors).length){toast(Object.values(errors).join(' '));return;}s.proposal=Dating.respond(s.proposal,s.proposal.revision,'you');s.phase='agreed';save();render();eventNotice('You both accepted this plan','Review and confirm your demo date.');}
function confirmAgreement(){const s=state.session;if(!s||!introductionStillFits(s)||!Dating.canConfirm(s.proposal,state.profile,s.person,agreementConsent)){toast('Both people must accept this exact plan, and you must accept the terms.');return;}if(s.isReschedule&&state.booking?.matchId!==s.person.id){toast('The original date is no longer available to change.');return;}const markerProblem=Object.values(Trust.markerErrors(s.marker||{}))[0];if(markerProblem){toast(markerProblem);app.querySelector('.marker-builder')?.scrollIntoView({block:'center'});return;}const next={...state,booking:{id:s.isReschedule?DateLifecycle.bookingId(state.booking):'date-'+s.id,venueId:s.proposal.venueId,timestamp:s.proposal.timestamp,matchId:s.person.id,billMode:s.proposal.billMode,proposalRevision:s.proposal.revision,createdAt:Date.now(),marker:Trust.normalizeMarker(s.marker),checkin:'none'},feedback:null,dateClock:'auto',session:null,drafts:{...state.drafts,proposal:null},deck:{step:0,answers:Dating.defaultPreferences()}};if(!applyResult({ok:true,state:next},{redraw:false}))return;clearTimeout(searchTimer);++searchToken;eventNotice('Your demo date is confirmed',`${dateLabel(state.booking.timestamp)} · ${timeLabel(state.booking.timestamp)} · ${Dating.billText(state.booking.billMode)}`,'dates');navigate('dates');toast('Demo date confirmed. Both accepted the same plan.');PremiumMotion.pop(app.querySelector('.success-pill'));}
function rematch(){const s=state.session;if(!s)return;if(s.isReschedule||state.booking){withdrawChange();return;}if(s.person&&!s.passedIds.includes(s.person.id))s.passedIds.push(s.person.id);s.phase='planning';s.person=null;s.proposal=null;s.suggested=null;state.drafts.proposal=null;save();runSearch();}
function requestChange(){if(!state.booking)return;if(!state.profile.complete){navigate('home');toast('Finish the enriched profile before proposing changes. Your date is kept.');return;}if(state.session?.isReschedule){navigate('home');return;}state.session={id:newIdentity('change'),phase:'found',scope:'once',preferences:clone(state.savedPreferences||Dating.defaultPreferences()),availability:clone(state.availability),person:Dating.person(state.booking.matchId),proposal:null,suggested:null,passedIds:[],history:[],createdAt:Date.now(),isReschedule:true,marker:clone(state.booking.marker||Trust.defaultMarker())};save();navigate('home');openProposal();}
function withdrawChange(){state.session=null;state.drafts.proposal=null;save();navigate('dates');toast('Your original date is kept.');}
function updateCountdown(){const el=document.querySelector('[data-countdown]');if(!el||!state.booking)return;const seconds=Math.max(0,Math.floor((state.booking.timestamp-Date.now())/1000));el.textContent=seconds?`${Math.floor(seconds/86400)}d ${String(Math.floor(seconds%86400/3600)).padStart(2,'0')}h ${String(Math.floor(seconds%3600/60)).padStart(2,'0')}m`:'Time for hello.';}
async function shareDate(){const b=state.booking;if(!b)return;const v=venueById(b.venueId),details=`blinddate · DEMO ONLY, not a reservation\n${v.name}, ${v.area}, Vancouver (fictional venue)\n${dateLabel(b.timestamp,{weekday:'long',month:'long',day:'numeric',year:'numeric'})} at ${timeLabel(b.timestamp)} PT\n${Dating.billText(b.billMode)}\nFree cancellation until ${dateLabel(b.timestamp-86400000)} at ${timeLabel(b.timestamp-86400000)} PT.`;try{await navigator.clipboard.writeText(details);toast('Demo date details copied.');}catch{openModal('copy',{details});}}

async function handleAction(action,target){
  if(!EntryFlow.allows(EntryFlow.stage(account,state.profile),action))return;
  switch(action){
    case'auth-view':if(account.busy)break;account.screen=['welcome','sign-up','log-in'].includes(target.dataset.view)?target.dataset.view:'welcome';account.error='';render();window.scrollTo({top:0,behavior:'instant'});app.querySelector('h1')?.focus({preventScroll:true});break;
    case'auth-password':{const input=document.querySelector('#account-password');if(!input)break;input.type=input.type==='password'?'text':'password';target.textContent=input.type==='password'?'Show':'Hide';target.setAttribute('aria-pressed',String(input.type==='text'));target.setAttribute('aria-label',input.type==='password'?'Show password':'Hide password');break;}
    case'auth-retry':account.loading=true;account.error='';render();restoreAccount();break;
    case'auth-log-out':await logOut();break;
    case'navigate':navigate(target.dataset.view);break;
    case'open-profile':if(state.view!=='profile')navigate('profile',true);break;
    case'membership':navigate('membership',true);break;
    case'back':navigate(viewStack.pop()||'home',false,true);break;
    case'theme':state.theme=target.dataset.value==='dark'?'dark':'light';save();render();break;
    case'onboarding':startProfile(false,target.dataset.profileStep);break;
    case'profile-bill':startProfile(true);break;
    case'onboarding-back':captureProfileFields();modal.step=Math.max(0,modal.step-1);persistDraft();renderModal(true);break;
    case'onboarding-next':{captureProfileFields();const invalid=modal.step===Dating.profileSteps-1?Dating.firstProfileError(modal.draft):null;if(invalid)modal.step=invalid.step;modal.errors=invalid?.errors||Dating.profileErrors(modal.draft,modal.step);if(Object.keys(modal.errors).length){renderModal();modalRoot.querySelector('#profile-'+Object.keys(modal.errors)[0])?.focus();break;}if(modal.step<Dating.profileSteps-1){modal.step++;persistDraft();renderModal(true);}else{if(!applyResult({ok:true,state:{...state,profile:{...modal.draft,verification:state.profile.verification,schema:2,name:modal.draft.name.trim().replace(/\s+/g,' '),work:modal.draft.work.trim(),complete:true},drafts:{...state.drafts,profile:null}}},{redraw:false}))break;modal=null;closeModal(false);render();window.scrollTo({top:0,behavior:'instant'});document.querySelector('.page-title')?.focus({preventScroll:true});if(!state.seenTour)openModal('tour');else toast('Your profile is saved. Now explore who you’d like to meet.');}break;}
    case'profile-choice':{captureProfileFields();const key=target.dataset.group,value=target.dataset.value;if(target.dataset.multi)modal.draft[key]=modal.draft[key].includes(value)?modal.draft[key].filter(v=>v!==value):[...modal.draft[key],value];else modal.draft[key]=value;delete modal.errors[key];persistDraft();renderModal();break;}
    case'preference-choice':{capturePreferenceFields();const key=target.dataset.group,value=target.dataset.value;if(target.dataset.multi)state.deck.answers[key]=state.deck.answers[key].includes(value)?state.deck.answers[key].filter(v=>v!==value):[...state.deck.answers[key],value];else state.deck.answers[key]=value;save();render();
      if(!target.dataset.multi&&questions[state.deck.step]?.options){clearTimeout(autoAdvanceTimer);const step=state.deck.step;autoAdvanceTimer=setTimeout(()=>{if(state.view==='home'&&!state.session&&state.deck.step===step&&!modal)advanceQuestion(1);},380);}
      break;}
    case'preference-open':state.deck.answers[target.dataset.group]=[];save();render();break;
    case'question-next':advanceQuestion(1);break;
    case'question-back':clearTimeout(autoAdvanceTimer);advanceQuestion(-1);break;
    case'edit-questions':state.deck.step=0;preferenceErrors={};save();render();break;
    case'edit-question':{const step=Math.max(0,Math.min(questions.length-1,+target.dataset.value||0));state.deck.step=step;preferenceErrors={};save();render();window.scrollTo({top:0,behavior:'instant'});break;}
    case'use-saved':if(state.savedPreferences){state.deck={step:'review',answers:clone(state.savedPreferences)};save();render();}break;
    case'save-type':chooseType('saved');break;
    case'explore-once':chooseType('once');break;
    case'change-type':changeType();break;
    case'availability-day':{const date=target.dataset.value,i=state.availabilityDraft.windows.findIndex(w=>w.date===date);if(i>=0)state.availabilityDraft.windows.splice(i,1);else state.availabilityDraft.windows.push({date,start:'18:00',end:'21:00'});state.availabilityDraft.windows.sort((a,b)=>a.date.localeCompare(b.date));availabilityErrors={};save();render();break;}
    case'availability-remove':state.availabilityDraft.windows.splice(+target.dataset.value,1);availabilityErrors={};save();render();break;
    case'availability-venue':{const ids=state.availabilityDraft.venueIds,id=target.dataset.value;state.availabilityDraft.venueIds=ids.includes(id)?ids.filter(v=>v!==id):[...ids,id];delete availabilityErrors.venues;save();render();break;}
    case'show-venues':showAllVenues=!showAllVenues;render();break;
    case'save-availability':if(commitAvailability()){render();toast('Availability saved. Your confirmed date, if any, is unchanged.');}break;
    case'search':runSearch();break;
    case'finish-search':finishSearch();break;
    case'cancel-search':cancelSearch();break;
    case'send-overlap':if(state.session?.suggested)sendPlan(state.session.suggested);break;
    case'send-my-plan':{const s=state.session,plan=Dating.planFromChoice(s.availability,state.profile,s.person);if(plan)sendPlan(plan,'Would you be open to this time and place?');else{toast('Choose a future place and time that fits both dietary needs.');openProposal();}break;}
    case'adopt-their-plan':{const s=state.session,plan=Dating.planFromChoice(s.availability,state.profile,s.person,true);if(plan)sendPlan(plan,'I can make your preferred plan. Shall we confirm?');else{toast('Their current places or times need an adjustment. Offer another plan.');openProposal();}break;}
    case'edit-proposal':openProposal();break;
    case'send-proposal':{captureProposalFields();const s=state.session;if((s.proposal?.revision||0)!==modal.baseRevision){modal.errors={plan:'A new reply arrived. Close this draft and review the current plan.'};renderModal();break;}const p={...modal.draft,timestamp:Dating.timestamp(modal.draft.date,modal.draft.time)};const errors=Dating.proposalErrors(p,state.profile,s.person);if(Object.keys(errors).length){modal.errors={plan:Object.values(errors).join(' ')};renderModal();break;}sendPlan(p,p.note);break;}
    case'demo-accept':demoReply('accept',+target.dataset.revision);break;
    case'demo-counter':demoReply('counter',+target.dataset.revision);break;
    case'demo-decline':demoReply('decline',+target.dataset.revision);break;
    case'accept-counter':acceptCounter();break;
    case'confirm-agreement':confirmAgreement();break;
    case'rematch':rematch();break;
    case'request-change':requestChange();break;
    case'withdraw-change':withdrawChange();break;
    case'view-introduction':closeModal(false);navigate('home');break;
    case'notifications':openModal('notifications');break;
    case'open-notice':{const n=state.inbox.find(n=>n.id===target.dataset.value);if(n){n.read=true;save();closeModal(false);navigate(n.view);}break;}
    case'why':if(state.session?.person)openModal('why');break;
    case'safety':openModal('safety');break;
    case'report':openModal('report');break;
    case'demo-report':openModal('report-receipt');break;
    case'cancel':if(state.booking)openModal('cancel',{reason:''});break;
    case'confirm-cancel':{if(!modal?.reason||!state.booking)break;const result=DateLifecycle.cancel(state,modal.reason);if(!applyResult(result,{redraw:false}))break;modal=null;closeModal(false);render();toast(result.waived?'Cancelled. Your yearly free late cancellation covered the fee.':'Demo date cancelled. No actual charge.');break;}
    case'share':await shareDate();break;
    case'tour-close':state.seenTour=true;save();dismissModal();break;
    case'tour-offer':state.seenTour=true;state.plan='monthly';save();closeModal(false);navigate('membership',true);break;
    case'unlock-to-plus':closeModal(false);navigate('membership',true);break;
    case'billing':state.plan=target.dataset.value==='annual'?'annual':'monthly';save();render();break;
    case'select-plan':openModal('plan-preview');break;
    case'confirm-plan':if(!applyResult({ok:true,state:{...state,previewPlan:state.plan}},{redraw:false}))break;modal=null;closeModal(false);render();toast('Demo membership active. No payment was taken.');break;
    case'reset':openModal('reset');break;
    case'confirm-reset':clearTimeout(searchTimer);++searchToken;if(!applyResult({ok:true,state:defaultState()},{redraw:false}))break;viewStack.length=0;previousView=null;modal=null;closeModal(false);render();window.scrollTo({top:0,behavior:'instant'});toast('Demo reset.');break;
    case'close-modal':dismissModal();break;
    case'toggle-stretch':if(!isMember()){navigate('membership',true);toast('Stretching your range is a blinddate+ feature.');break;}state.deck.answers.stretch=!state.deck.answers.stretch;save();render();break;
    case'unlock-trust':if(state.session?.person?.id===target.dataset.value)openModal('unlock',{personId:target.dataset.value,introductionKey:DateLifecycle.introductionKey(state.session)});break;
    case'confirm-unlock':{const key=DateLifecycle.introductionKey(state.session);if(!key||modal?.introductionKey!==key){toast('This introduction changed. Review its current record.');break;}if(!applyResult({ok:true,state:{...state,unlocks:[...new Set([...state.unlocks,key])].slice(-50)}},{redraw:false}))break;modal=null;closeModal(false);render();toast('Record unlocked for this introduction. No payment was taken.');break;}
    case'end-membership':state.previewPlan=null;save();render();toast('Demo membership ended.');break;
    case'verify':openModal('verify',{idDone:false,selfieDone:false});break;
    case'verify-submit':if(!(modal?.idDone&&modal.selfieDone))break;if(!applyResult({ok:true,state:{...state,profile:{...state.profile,verification:'verified-demo'}}},{redraw:false}))break;modal=null;closeModal(false);render();toast('Verified (demo). No images were stored.');break;
    case'photo-remove':if(modal?.type==='onboarding'){captureProfileFields();modal.draft.photos.splice(+target.dataset.value,1);persistDraft();renderModal();}break;
    case'date-clock':if(!['auto','upcoming','during','after'].includes(target.dataset.value))break;state.dateClock=target.dataset.value;save();render();window.scrollTo({top:0,behavior:'instant'});break;
    case'checkin-ok':if(state.booking&&datePhase(state.booking)==='during')applyResult({ok:true,state:{...state,booking:{...state.booking,checkin:'ok'}}});break;
    case'checkin-help':if(state.booking){applyResult({ok:true,state:{...state,booking:{...state.booking,checkin:'help'}}},{redraw:false});openModal('help');}break;
    case'share-trusted':await shareTrusted(modal?.type==='help');break;
    case'fb-showed':changeFeedback('showed',target.dataset.value);break;
    case'fb-star':changeFeedback('stars',Number(target.dataset.value));break;
    case'fb-tag':changeFeedback('tag',target.dataset.value);break;
    case'fb-fake':changeFeedback('fake');break;
    case'fb-again':changeFeedback('again',target.dataset.value);break;
    case'fb-submit':{const result=DateLifecycle.submitFeedback(state);if(applyResult(result)){window.scrollTo({top:0,behavior:'instant'});if(result.outcome==='no-show')toast('Demo no-show report saved locally. No report was sent.');else if(result.outcome==='passed')toast('Your answers are private. Nothing was shared.');else if(state.feedback?.fake)toast('Demo report noted privately. No safety team is connected.');}break;}
    case'fb-their':if(applyResult(DateLifecycle.partnerDecision(state,target.dataset.dateId,target.dataset.value)))window.scrollTo({top:0,behavior:'instant'});break;
    case'fb-finish':if(applyResult(DateLifecycle.finish(state))){fbErrors={};window.scrollTo({top:0,behavior:'instant'});}break;
  }
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(target&&!target.disabled)handleAction(target.dataset.action,target);});
document.addEventListener('submit',event=>{if(event.target.matches('.account-form')){event.preventDefault();submitAccount(event.target);}});
document.addEventListener('input',event=>{const el=event.target;if(el.matches('[data-trusted-field]')){state.trusted[el.dataset.trustedField]=el.value.slice(0,el.dataset.trustedField==='name'?40:20);save();return;}if(el.matches('[data-fb-field]')&&state.booking){changeFeedback(el.dataset.fbField,el.value,false);return;}if(el.matches('[data-profile-field]')&&modal?.type==='onboarding'){captureProfileFields();persistDraft();}if(el.matches('[data-pref-field]')){savePreferenceDraft();if(el.dataset.prefField==='radius')app.querySelector('#radius-value').textContent=el.value;}if(el.matches('[data-window-field]')){const w=state.availabilityDraft.windows[+el.dataset.windowIndex];if(w){w[el.dataset.windowField]=el.value;const ok=save(),status=app.querySelector('[data-availability-saved]');if(status){status.textContent=ok?'✓ Availability draft saved':'Draft could not be saved';status.classList.toggle('saved-status',ok);}}}if(el.matches('[data-proposal-field]')&&modal?.type==='proposal')persistDraft();});
document.addEventListener('change',event=>{const el=event.target;if(el.matches('[data-photo-input]')){addPhoto(el.files?.[0]);el.value='';return;}if(el.matches('[data-verify]')&&modal?.type==='verify'){if(el.files?.length)modal[el.dataset.verify]=true;el.value='';renderModal();return;}if(el.matches('[data-marker-field]')&&state.session){state.session.marker={...Trust.normalizeMarker(state.session.marker),[el.dataset.markerField]:el.value};save();const preview=app.querySelector('[data-marker-preview]');if(preview)preview.textContent=Trust.markerText(state.session.marker)||'Choose a colour and what you’ll wear.';app.querySelector('.car-fields')?.toggleAttribute('hidden',state.session.marker.arrival!=='by car');return;}if(el.matches('[data-profile-field]')&&modal?.type==='onboarding'){captureProfileFields();persistDraft();if(el.dataset.profileField==='gender')renderModal();}if(el.matches('[data-pref-field]'))savePreferenceDraft();if(el.id==='agreement-consent'){agreementConsent=el.checked;const btn=app.querySelector('[data-action="confirm-agreement"]');if(btn)btn.disabled=!agreementConsent;}if(el.id==='cancel-reason'&&modal?.type==='cancel'){modal.reason=el.value;renderModal();}});
modalRoot.addEventListener('click',event=>{if(event.target.classList.contains('dialog-backdrop'))dismissModal();});
document.addEventListener('keydown',event=>{if(!modal)return;if(event.key==='Escape'){closeModal();return;}if(event.key==='Enter'&&event.target.matches('input:not([type="checkbox"]):not([type="range"]):not([type="time"]):not([type="date"]):not([type="file"])')&&modal.type==='onboarding'){event.preventDefault();modalRoot.querySelector('[data-action="onboarding-next"]')?.click();}if(event.key==='Tab'){const nodes=[...modalRoot.querySelectorAll('button:not([disabled]),input,select,textarea,summary,[tabindex="0"]'),...tabRoot.querySelectorAll('button')].filter(el=>el.getClientRects().length&&!el.closest('details:not([open]) > :not(summary)'));const first=nodes[0],last=nodes.at(-1);if(!first)return;if(event.shiftKey&&(document.activeElement===first||!nodes.includes(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!nodes.includes(document.activeElement))){event.preventDefault();first.focus();}}});
window.addEventListener('scroll',()=>document.body.classList.toggle('scrolled',window.scrollY>74),{passive:true});
setInterval(updateCountdown,30000);
render();
if(typeof fetch==='function')restoreAccount();
