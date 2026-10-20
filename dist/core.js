const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const brand = `<svg class="brand-heart" viewBox="0 0 35 35" aria-hidden="true"><path d="M17.5 29S3 20.1 3 11.9C3 4.3 13 1.5 17.5 8.4 22 1.5 32 4.3 32 11.9 32 20.1 17.5 29 17.5 29Z" fill="currentColor"/><path d="m24 7 1.4 3.6L29 12l-3.6 1.4L24 17l-1.4-3.6L19 12l3.6-1.4Z" fill="var(--canvas)"/></svg>`;

// Fictional fixtures, never live people or venue data.
const candidates = [
  {id:'021',gender:'Woman',age:26,km:8,smoking:false,intent:'A long-term relationship',interests:['Outdoors','Animals','Slow Sundays','Cooking'],values:['Kindness','Curiosity','Family']},
  {id:'032',gender:'Man',age:27,km:12,smoking:false,intent:'A long-term relationship',interests:['Arts & culture','Coffee','Animals','Outdoors'],values:['Kindness','Honesty','Curiosity']},
  {id:'048',gender:'Non-binary',age:28,km:18,smoking:false,intent:'A long-term relationship',interests:['Live music','Cooking','Slow Sundays','Travel'],values:['Honesty','Ambition','Curiosity']},
  {id:'055',gender:'Woman',age:24,km:10,smoking:false,intent:'Open to exploring',interests:['Live music','Travel','Coffee','Arts & culture'],values:['Humour','Kindness','Ambition']},
  {id:'063',gender:'Man',age:30,km:15,smoking:false,intent:'Open to exploring',interests:['Fitness','Cooking','Travel','Animals'],values:['Honesty','Family','Kindness']},
  {id:'071',gender:'Woman',age:23,km:6,smoking:false,intent:'A long-term relationship',interests:['Coffee','Travel','Cooking','Arts & culture'],values:['Family','Kindness','Honesty']},
  {id:'084',gender:'Man',age:25,km:9,smoking:false,intent:'A long-term relationship',interests:['Fitness','Outdoors','Coffee','Travel'],values:['Family','Honesty','Ambition']},
  {id:'092',gender:'Woman',age:29,km:14,smoking:false,intent:'Open to exploring',interests:['Live music','Arts & culture','Slow Sundays','Coffee'],values:['Humour','Curiosity','Kindness']},
  {id:'105',gender:'Man',age:24,km:11,smoking:false,intent:'A long-term relationship',interests:['Cooking','Animals','Live music','Slow Sundays'],values:['Kindness','Humour','Curiosity']},
  {id:'117',gender:'Woman',age:27,km:7,smoking:false,intent:'A long-term relationship',interests:['Fitness','Travel','Outdoors','Animals'],values:['Ambition','Family','Honesty']},
];
const venues = [
  {id:'juniper',name:'Juniper & Co.',area:'Mount Pleasant',type:'Seasonal · Cozy & intimate',price:28,rating:'4.8',reviews:214,travel:'18 min for you · 15 min for them',photo:'restaurant.jpg',tags:['Vegetarian','Gluten-free'],description:'Warm lighting, seasonal plates, and a corner table made for a good conversation.'},
  {id:'olive',name:'Olive & Oak',area:'Kitsilano',type:'Mediterranean · Relaxed',price:32,rating:'4.7',reviews:186,travel:'24 min for you · 20 min for them',photo:'bistro.jpg',tags:['Vegetarian','Gluten-free'],description:'A relaxed neighborhood bistro with shareable plates and plenty of natural light.'},
  {id:'sunday',name:'Sunday Social',area:'Main Street',type:'Café · Easygoing',price:16,rating:'4.8',reviews:302,travel:'16 min for you · 17 min for them',photo:'cafe.jpg',tags:['Vegetarian'],description:'Coffee, a little something sweet, and a low-pressure way to meet.'},
  {id:'fig',name:'The Little Fig',area:'Fairview',type:'Plant-based · Thoughtful',price:25,rating:'4.6',reviews:128,travel:'22 min for you · 19 min for them',photo:'bistro.jpg',tags:['Vegan','Vegetarian','Gluten-free'],description:'Bright, plant-forward dishes in a friendly, welcoming dining room.'},
  {id:'common',name:'Common Ground',area:'Commercial Drive',type:'Coffee & small plates · Casual',price:19,rating:'4.7',reviews:241,travel:'20 min for you · 23 min for them',photo:'cafe.jpg',tags:['Vegetarian'],description:'An unhurried café for that first hello, with food if you decide to stay.'},
];
const interestOptions = ['Outdoors','Animals','Slow Sundays','Cooking','Travel','Fitness','Arts & culture','Live music','Coffee'];
const valueOptions = ['Kindness','Curiosity','Honesty','Humour','Ambition','Family'];
