// Rendering for this feature. State changes are handled by app.js and the domain models.
const dateFormatters=new Map();
function formattedDate(stamp,options){
  const key=JSON.stringify(options);let formatter=dateFormatters.get(key);
  if(!formatter){formatter=new Intl.DateTimeFormat('en-CA',{...options,timeZone:Dating.timeZone});if(dateFormatters.size>=24)dateFormatters.clear();dateFormatters.set(key,formatter);}
  return formatter.format(new Date(stamp));
}
const dateLabel=(stamp,options={weekday:'short',month:'short',day:'numeric'})=>formattedDate(stamp,options);
const timeLabel=stamp=>formattedDate(stamp,{hour:'numeric',minute:'2-digit'});
const displayTime=time=>{const n=Dating.minutes(time);if(!Number.isFinite(n))return'Choose a time';const h=Math.floor(n/60);return`${h%12||12}:${String(n%60).padStart(2,'0')} ${h>=12?'PM':'AM'}`;};
const dayLabel=(date,options={weekday:'short',month:'short',day:'numeric'})=>Dating.realDate(date)?dateLabel(Date.parse(date+'T20:00:00Z'),options):'Choose a day';
const venueById=id=>venues.find(v=>v.id===id);
const cancellationFee=Dating.cancellationFee;
function button(label,action,variant='primary',extra='',graphic='arrow'){return`<button class="button ${variant}" data-action="${action}" ${extra}>${label}${graphic?icon(graphic):''}</button>`;}
function pageHeading(kicker,title,description=''){return`<div class="page-heading">${kicker?`<p class="eyebrow">${kicker}</p>`:''}<h1 class="page-title" tabindex="-1">${title}</h1>${description?`<p class="page-description">${description}</p>`:''}</div>`;}
function row(title,subtitle,graphic,action,extra='',category=''){return`<button class="list-row" data-action="${action}" ${extra}><span class="row-icon ${category}">${icon(graphic)}</span><span class="row-copy"><strong>${title}</strong>${subtitle?`<span>${subtitle}</span>`:''}</span>${icon('chevron')}</button>`;}
function sharedChips(tags){return`<div class="shared-chips">${tags.map(t=>`<span>${icon(t==='Animals'?'heart':t==='Outdoors'?'mountain':t==='Coffee'?'coffee':'spark')}${esc(t)}</span>`).join('')}</div>`;}
