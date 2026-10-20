/* Trust and safety rules: contact-leak filter, recognition notes, reliability, stretch search.
   Pure functions so verify.mjs can test them. All people and records here are fictional fixtures. */
const Trust = (() => {
  // ---- Contact-leak filter ---------------------------------------------------------------
  // Anything two people send each other before a mutual reveal goes through this filter.
  // It is deliberately strict: a false "no" costs a rephrase; a leak lets people skip the app.
  const leet = {'0':'o','1':'i','!':'i','|':'l','3':'e','4':'a','@':'a','5':'s','$':'s','7':'t','8':'b','9':'g'};
  const longWords = ['insta','instagram','tiktok','snapchat','snap','whatsapp','telegram','signal','facebook','messenger','twitter','threads','onlyfans','discord','wechat','weibo','linkedin','youtube','twitch','reddit','tinder','hinge','bumble','venmo','cashapp','paypal','interac','etransfer','gmail','hotmail','outlook','icloud','email','phone','number','handle','username','profile','follow','subscribe','promo','discount','coupon','website','link'];
  const shortWords = ['ig','sc','fb','wa','tt','yt','dm','pm','tg','kik','x','insta','snap','cell','mob','tel'];
  const phrases = [/\b(text|call|message|msg|dm|add|find|follow|hit)\s+me\b/, /\bmy\s+(ig|insta|snap|number|cell|phone|handle|page|account|socials?)\b/, /\b(dot|d0t)\s*(com|ca|net|org|io|me)\b/, /\bat\s+sign\b/, /\bcheck\s+out\b/, /\buse\s+code\b/];
  const numberWords = /\b(zero|oh|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g;
  function normalize(text){return String(text).normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[0-9!|@$]/g,c=>leet[c]||c);}
  function leak(text) {
    const raw = String(text ?? '');
    if (!raw.trim()) return null;
    if (/@/.test(raw)) return 'No @ handles or emails, please.';
    if (/(https?:|www\.|\b[a-z0-9-]+\s*\.\s*(com|ca|net|org|io|me|co|app|gg|ly|tv|link|xyz|info|bio|page)\b)/i.test(raw)) return 'No links or web addresses.';
    if ((raw.match(/\d/g) || []).length >= 3) return 'No phone numbers or long numbers.';
    const n = normalize(raw), words = n.match(/[a-z]+/g) || [];
    if ((n.match(numberWords) || []).length >= 3) return 'No numbers spelled out in words.';
    if (phrases.some(re => re.test(n))) return 'No ways to contact each other outside the app.';
    if (words.some(w => shortWords.includes(w))) return 'No social media or contact apps.';
    const squashed = words.join('');
    if (longWords.some(k => squashed.includes(k))) return 'No social media, contact details or ads.';
    // Hidden messages: first (or last) letters of each word spelling a platform or handle hint.
    const initials = words.map(w => w[0]).join(''), finals = words.map(w => w.at(-1)).join('');
    if (words.length >= 3 && [...longWords, 'ig', 'snap', 'insta'].some(k => k.length >= 3 && (initials.includes(k) || finals.includes(k)))) return 'That message looks like it hides a hidden word.';
    // Lots of single letters in a row ("i n s t a") are spelling something.
    if ((raw.match(/\b[a-z]\b/gi) || []).length >= 5) return 'No spelled-out letters, please.';
    return null;
  }

  // ---- Proposal notes are picked from preset phrases (no free text before the reveal) ----------
  const notePresets = ['','Would this time work for you?','I’m flexible on the place.','I’m flexible on the time.','Could we try a little earlier?','Could we try a little later?','This place has great vegetarian options.','Looking forward to it!','Would you be open to this time and place?','I can make your preferred plan. Shall we confirm?','Would this day or place work better?'];
  const publicNote = value => notePresets.includes(value) ? value : '';

  // ---- "How you’ll find me": structured only, so nothing can be smuggled in -------------------
  const colours = ['black','white','grey','navy','blue','green','red','burgundy','pink','yellow','orange','brown','beige','purple'];
  const tops = ['T-shirt','shirt','sweater','hoodie','jacket','coat','dress','blouse'];
  const extras = ['','glasses','a hat','a scarf','a tote bag','a backpack','holding a book','holding a coffee'];
  const arrivals = ['','on foot','by transit','by bike','by car'];
  const carTypes = ['sedan','SUV','hatchback','pickup','coupe'];
  const defaultMarker = () => ({colour:'', top:'', extra:'', arrival:'', carColour:'', carType:''});
  function normalizeMarker(m = {}) {
    const pick = (v, list) => list.includes(v) ? v : '';
    return {colour:pick(m.colour, colours), top:pick(m.top, tops), extra:pick(m.extra, extras), arrival:pick(m.arrival, arrivals), carColour:pick(m.carColour, colours), carType:pick(m.carType, carTypes)};
  }
  function markerErrors(m) {
    const e = {}, x = normalizeMarker(m);
    if (!x.colour || !x.top) e.marker = 'Choose a colour and what you’ll be wearing.';
    if (x.arrival === 'by car' && (!x.carColour || !x.carType)) e.car = 'Choose your car’s colour and type, or pick another way to arrive.';
    return e;
  }
  function markerText(m) {
    const x = normalizeMarker(m);
    if (!x.colour || !x.top) return '';
    const article = /^[aeiou]/.test(x.colour) ? 'an' : 'a';
    let text = `Wearing ${article} ${x.colour} ${x.top}`;
    if (x.extra) text += x.extra.startsWith('holding') ? `, ${x.extra}` : ` with ${x.extra}`;
    if (x.arrival === 'by car') text += x.carColour && x.carType ? `, arriving in a ${x.carColour} ${x.carType}` : ', arriving by car (add its colour and type)';
    else if (x.arrival) text += `, arriving ${x.arrival}`;
    return text + '.';
  }

  // ---- After the date ---------------------------------------------------------------------
  const goodTags = ['Matched their description','On time','Respectful','Great conversation','Felt safe'];
  const badTags = ['Not as described','Rude or disrespectful','Very late','Made me uncomfortable'];
  function feedbackErrors(f) {
    const e = {};
    if (!['yes','no'].includes(f.showed)) e.showed = 'Tell us whether they showed up.';
    if (f.showed === 'yes') {
      if (!(Number.isInteger(f.stars) && f.stars >= 1 && f.stars <= 5)) e.stars = 'Rate the date from 1 to 5 stars.';
      if (!['yes','no'].includes(f.again)) e.again = 'Choose whether you’d like to see them again.';
      if (f.again === 'yes' && contactErrors(f.contact)) e.contact = contactErrors(f.contact);
    }
    if (typeof f.note === 'string' && f.note.length > 300) e.note = 'Keep the note under 300 characters.';
    return e;
  }
  // Contact details are only exchanged after BOTH say yes, so here they are required, not blocked.
  function contactErrors(c) {
    const v = String(c ?? '').trim();
    if (!v) return 'Add the contact you want to share if it’s mutual.';
    if (/^@[a-z0-9._]{2,30}$/i.test(v)) return null;
    if (/^\+?[\d\s().-]{10,18}$/.test(v) && (v.match(/\d/g) || []).length >= 10) return null;
    return 'Use a phone number or an @handle.';
  }
  const revealed = (you, them) => you === 'yes' && them === 'yes';

  // ---- Reliability ------------------------------------------------------------------------
  // Fictional records for the sample people: ratings, show-up record and verification.
  const records = {
    '021':{name:'Maya',rating:4.8,dates:9,noShows:0,lateCancels:0,verified:true,tags:['Great conversation','On time','Matched their description'],contact:'@maya.sample',marker:{colour:'green',top:'jacket',extra:'a tote bag',arrival:'on foot'}},
    '032':{name:'Daniel',rating:4.6,dates:6,noShows:0,lateCancels:1,verified:true,tags:['Respectful','On time'],contact:'@daniel.sample',marker:{colour:'navy',top:'sweater',extra:'glasses',arrival:'by transit'}},
    '048':{name:'Robin',rating:4.4,dates:5,noShows:1,lateCancels:0,verified:false,tags:['Great conversation'],contact:'@robin.sample',marker:{colour:'yellow',top:'shirt',extra:'a hat',arrival:'by bike'}},
    '055':{name:'Sofia',rating:4.9,dates:11,noShows:0,lateCancels:0,verified:true,tags:['Felt safe','Great conversation','Matched their description'],contact:'@sofia.sample',marker:{colour:'red',top:'dress',extra:'',arrival:'by transit'}},
    '063':{name:'Marcus',rating:4.2,dates:7,noShows:2,lateCancels:1,verified:true,tags:['Respectful','Very late'],contact:'@marcus.sample',marker:{colour:'black',top:'coat',extra:'a scarf',arrival:'by car',carColour:'grey',carType:'SUV'}},
    '071':{name:'Layla',rating:4.9,dates:4,noShows:0,lateCancels:0,verified:true,tags:['Matched their description','Respectful'],contact:'@layla.sample',marker:{colour:'beige',top:'coat',extra:'holding a book',arrival:'by transit'}},
    '084':{name:'Omar',rating:4.7,dates:8,noShows:0,lateCancels:0,verified:true,tags:['On time','Felt safe'],contact:'@omar.sample',marker:{colour:'white',top:'shirt',extra:'',arrival:'by car',carColour:'black',carType:'sedan'}},
    '092':{name:'Hannah',rating:4.5,dates:10,noShows:1,lateCancels:2,verified:false,tags:['Great conversation'],contact:'@hannah.sample',marker:{colour:'burgundy',top:'sweater',extra:'glasses',arrival:'on foot'}},
    '105':{name:'Arjun',rating:4.8,dates:5,noShows:0,lateCancels:0,verified:true,tags:['Respectful','Great conversation'],contact:'@arjun.sample',marker:{colour:'grey',top:'hoodie',extra:'a backpack',arrival:'by transit'}},
    '117':{name:'Grace',rating:4.7,dates:6,noShows:0,lateCancels:1,verified:true,tags:['On time','Felt safe'],contact:'@grace.sample',marker:{colour:'pink',top:'blouse',extra:'holding a coffee',arrival:'on foot'}},
  };
  const record = (id, overrides = {}) => {
    const base = records[id];
    if (!base) return null;
    const safeCount = value => Number.isFinite(value) ? Math.min(100000, Math.max(0, Math.trunc(value))) : 0;
    const delta = overrides[id] || {};
    return {...base, dates: base.dates + safeCount(delta.dates), noShows: base.noShows + safeCount(delta.noShows), lateCancels: base.lateCancels + safeCount(delta.lateCancels), tags: [...base.tags], marker: {...base.marker}};
  };
  // Lower priority for people with no-shows and late cancellations; a strong rating helps a little.
  const reliabilityPenalty = (id, overrides = {}) => { const r = record(id, overrides); return r ? r.noShows * 6 + r.lateCancels * 2 - Math.round((r.rating - 4) * 2) : 0; };

  // ---- Search with optional "slightly outside my preferences" (blinddate+) --------------------
  function stretched(prefs) {
    return {...prefs, minAge: Math.max(18, prefs.minAge - 3), maxAge: Math.min(100, prefs.maxAge + 3), radius: Math.min(50, prefs.radius + 10)};
  }
  function search(profile, prefs, availability, excluded = [], {member = false, now = Date.now(), recordOverrides = {}} = {}) {
    const rank = list => list.map(r => ({...r, score: r.score - reliabilityPenalty(r.person.id, recordOverrides)})).sort((a, b) => (!!b.plan - !!a.plan) || b.score - a.score || a.person.km - b.person.km);
    const strict = rank(Dating.search(profile, prefs, availability, excluded, now)).map(r => ({...r, stretched: false}));
    if (strict.length || !(member && prefs.stretch)) return strict;
    // Only age and distance stretch. Deal-breakers (faith, background, drinking, etc.) never do.
    return rank(Dating.search(profile, stretched(prefs), availability, excluded, now)).map(r => ({...r, stretched: true}));
  }

  return {leak, publicNote, notePresets, colours, tops, extras, arrivals, carTypes, defaultMarker, normalizeMarker, markerErrors, markerText, goodTags, badTags, feedbackErrors, contactErrors, revealed, record, reliabilityPenalty, stretched, search};
})();
