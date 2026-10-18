/* blinddate: a browser-local product prototype. No accounts, charges, bookings, or reports are sent. */
const icons = {
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  spark:'<path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6L12 2Z"/><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5L20 2Z"/>',
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18m-12 4h.01M12 15h.01M16 15h.01"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  crown:'<path d="m3 6 4 4 5-7 5 7 4-4-2 13H5L3 6Zm3 10h12"/>',
  shield:'<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Z"/><path d="m8 12 3 3 5-6"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-12 9h12m-8 4h4"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  leaf:'<path d="M20 3C9 2 2 9 6 16s16 3 14-13Z"/><path d="M4 21 16 9"/>',
  coffee:'<path d="M4 8h12v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm12 1h2a4 4 0 0 1 0 8h-2M7 2v2m5-2v2"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="3" fill="currentColor" stroke="none"/>',
  flower:'<path d="M12 12c-8-9-12 0-4 2-5 8 5 11 5 3 9 4 12-6 4-6 4-9-7-11-5 1Z"/><circle cx="12" cy="12" r="2"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-2-4"/>',
  logout:'<path d="M9 3H4v18h5m5-15 6 6-6 6m-5-6h11"/>',
  edit:'<path d="m16 3 5 5L9 20l-6 1 1-6L16 3Zm-2 2 5 5"/>',
  star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>',
  flag:'<path d="M4 22V3m0 1c6-4 10 4 16 0v12c-6 4-10-4-16 0"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  mountain:'<path d="m2 20 7-14 5 9 3-5 5 10H2Zm4-8 3 2 2-2"/>',
  smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14a4 4 0 0 0 8 0M8 8h.01M16 8h.01"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const brand = `<svg class="brand-heart" viewBox="0 0 35 35" aria-hidden="true"><path d="M17.5 29S3 20.1 3 11.9C3 4.3 13 1.5 17.5 8.4 22 1.5 32 4.3 32 11.9 32 20.1 17.5 29 17.5 29Z" fill="currentColor"/><path d="m5 14 24 5" fill="none" stroke="#fffdf9" stroke-width="3.5"/></svg>`;

// Fictional fixtures, never live people or venue data.
const candidates = [
  {id:'021',gender:'Woman',age:26,km:8,smoking:false,intent:'A long-term relationship',interests:['Outdoors','Animals','Slow Sundays','Cooking'],values:['Kindness','Curiosity','Family']},
  {id:'032',gender:'Man',age:27,km:12,smoking:false,intent:'A long-term relationship',interests:['Arts & culture','Coffee','Animals','Outdoors'],values:['Kindness','Honesty','Curiosity']},
  {id:'048',gender:'Non-binary',age:28,km:18,smoking:false,intent:'A long-term relationship',interests:['Live music','Cooking','Slow Sundays','Travel'],values:['Honesty','Ambition','Curiosity']},
  {id:'055',gender:'Woman',age:24,km:10,smoking:false,intent:'Open to exploring',interests:['Live music','Travel','Coffee','Arts & culture'],values:['Humour','Kindness','Ambition']},
  {id:'063',gender:'Man',age:30,km:15,smoking:false,intent:'Open to exploring',interests:['Fitness','Cooking','Travel','Animals'],values:['Honesty','Family','Kindness']},
];
const venues = [
  {id:'juniper',name:'Juniper & Co.',area:'Mount Pleasant',type:'Seasonal · Cozy & intimate',price:28,rating:'4.8',reviews:214,travel:'18 min for you · 15 min for them',photo:'restaurant.jpg',tags:['Vegetarian','Gluten-free'],description:'Warm lighting, seasonal plates, and a corner table made for a good conversation.'},
  {id:'olive',name:'Olive & Oak',area:'Kitsilano',type:'Mediterranean · Relaxed',price:32,rating:'4.7',reviews:186,travel:'24 min for you · 20 min for them',photo:'bistro.jpg',tags:['Vegetarian','Gluten-free'],description:'A relaxed neighborhood bistro with shareable plates and plenty of natural light.'},
  {id:'sunday',name:'Sunday Social',area:'Main Street',type:'Café · Easygoing',price:16,rating:'4.8',reviews:302,travel:'16 min for you · 17 min for them',photo:'cafe.jpg',tags:['Vegetarian'],description:'Coffee, a little something sweet, and a low-pressure way to meet.'},
  {id:'fig',name:'The Little Fig',area:'Fairview',type:'Plant-based · Thoughtful',price:25,rating:'4.6',reviews:128,travel:'22 min for you · 19 min for them',photo:'bistro.jpg',tags:['Vegetarian','Gluten-free'],description:'Bright, plant-forward dishes in a friendly, welcoming dining room.'},
  {id:'common',name:'Common Ground',area:'Commercial Drive',type:'Coffee & small plates · Casual',price:19,rating:'4.7',reviews:241,travel:'20 min for you · 23 min for them',photo:'cafe.jpg',tags:['Vegetarian'],description:'An unhurried café for that first hello, with food if you decide to stay.'},
];
const interestOptions = ['Outdoors','Animals','Slow Sundays','Cooking','Travel','Fitness','Arts & culture','Live music','Coffee'];
const valueOptions = ['Kindness','Curiosity','Honesty','Humour','Ambition','Family'];
