/* Entry policy shared by rendering, navigation and action dispatch. */
const EntryFlow=(()=>{
  function stage(account,profile){if(account.loading)return'loading';if(!account.user)return'guest';return profile.complete?'app':'setup';}
  function allows(current,action){if(current==='app')return true;if(current==='loading')return false;if(current==='guest')return['auth-view','auth-password','auth-retry'].includes(action);return['onboarding-next','onboarding-back','profile-choice','photo-remove','auth-log-out'].includes(action);}
  function keyForUser(base,id){if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw new Error('Invalid account identity');return base+':account:'+id;}
  function credentialError(email,password,signup){if(!/^\S+@\S+\.\S+$/.test(email.trim())||email.trim().length>254)return'Enter a valid email address.';if(password.length<(signup?8:1)||password.length>128)return signup?'Use a password with 8–128 characters.':'Enter your password.';return'';}
  return{stage,allows,keyForUser,credentialError};
})();
