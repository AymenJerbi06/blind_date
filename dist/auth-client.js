/* Same-origin account adapter. Provider tokens stay on the server. */
const AuthClient=(()=>{
  async function request(route,body){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15_000);
    try{
      const response=await fetch('/api/auth/'+route,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'Account access is temporarily unavailable. Please try again.');
      return data;
    }catch(error){if(error.name==='TypeError'||error.name==='AbortError')throw new Error('We couldn’t reach your account. Check your connection and try again.');throw error;}
    finally{clearTimeout(timer);}
  }
  return{session:()=>request('session'),signUp:(email,password)=>request('sign-up',{email,password}),logIn:(email,password)=>request('log-in',{email,password}),logOut:()=>request('log-out',{})};
})();
