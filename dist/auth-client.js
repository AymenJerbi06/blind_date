/* Same-origin account adapter. Provider tokens stay on the server. */
const AuthClient=(()=>{
  let csrfToken=null,preparing=null;
  async function prepare(){if(!preparing)preparing=request('session').finally(()=>{preparing=null;});return preparing;}
  async function request(route,body,retried=false){
    if(body&&!csrfToken)await prepare();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15_000);
    try{
      const response=await fetch('/api/auth/'+route,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal,...(body?{headers:{'Content-Type':'application/json','X-CSRF-Token':csrfToken},body:JSON.stringify(body)}:{})});
      const data=await response.json().catch(()=>({}));
      if(response.status===403&&data.code==='request_verification_failed'&&body&&!retried){clearTimeout(timer);csrfToken=null;await prepare();return request(route,body,true);}
      if(!response.ok)throw new Error(data.error||'Account access is temporarily unavailable. Please try again.');
      if(route==='session'){if(typeof data.csrfToken!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(data.csrfToken))throw new Error('Refresh the app to load the latest account service.');csrfToken=data.csrfToken;}
      return data;
    }catch(error){if(error.name==='TypeError'||error.name==='AbortError')throw new Error('We couldn’t reach your account. Check your connection and try again.');throw error;}
    finally{clearTimeout(timer);}
  }
  return{session:()=>request('session'),signUp:(email,password)=>request('sign-up',{email,password}),logIn:(email,password)=>request('log-in',{email,password}),logOut:()=>request('log-out',{})};
})();
