/* Portable, versioned plain-text profiles. No network or browser storage. */
(function(root) {
  const MAX_BYTES=2*1024*1024;
  function parse(text,countries) {
    if(typeof text!=='string' || new TextEncoder().encode(text).length>MAX_BYTES)throw Error('Choose a profile smaller than 2 MB.');
    let value;try{value=JSON.parse(text);}catch{throw Error('This is not a readable Portpass profile.');}
    if(!value || value.format!=='portpass' || value.version!==1)throw Error('Unsupported profile format or version.');
    if(typeof value.name!=='string' || value.name.length>80)throw Error('Profile names must be at most 80 characters.');
    if(!Array.isArray(value.documents) || value.documents.length>500)throw Error('Profiles may contain up to 500 wallet entries.');
    const ids=new Set(),unique=new Set();
    const code=v=>typeof v==='string' && /^[A-Z]{2}$/.test(v) && (!countries || countries.includes(v));
    const documents=value.documents.map((d,i)=>{
      const fail=message=>{throw Error(`Entry ${i+1}: ${message}`);};
      if(!d || !['passport','citizenship','residence','visa','schengen'].includes(d.type) || !code(d.country))fail('unrecognised type or country.');
      if(typeof d.id!=='string' || !d.id.length || d.id.length>128 || ids.has(d.id))fail('missing or duplicate entry identifier.');ids.add(d.id);
      const out={id:d.id,type:d.type,country:d.country};
      if(!['passport','citizenship'].includes(d.type)){if(!code(d.passport))fail('invalid linked passport country.');out.passport=d.passport;}
      if(!['visa','schengen'].includes(d.type)){
        const key=[d.type,d.country,out.passport||''].join(':');if(unique.has(key))fail('duplicate wallet entry.');unique.add(key);
      }
      if(d.type!=='citizenship')for(const key of ['expiry','validFrom']){
        if(d[key]!==undefined){if(typeof d[key]!=='string'||(d[key] && root.PortpassVisaTime.day(d[key])===null))fail('invalid calendar date.');out[key]=d[key];}
      }
      if(d.type==='passport')for(const key of ['biometric','nationalId','sarPassport'])if(d[key]!==undefined){if(typeof d[key]!=='boolean')fail('invalid passport condition.');out[key]=d[key];}
      if(root.PortpassVisaTime.isVisa(d)) {
        if(d.type==='schengen' && !root.PortpassRules.SCHENGEN.includes(d.country))fail('issuer is not a Schengen country.');
        for(const key of ['entryDate','admittedUntil','stayUnit','stayBasis'])if(d[key]!==undefined){if(typeof d[key]!=='string')fail('invalid visa timing.');out[key]=d[key];}
        if(d.stayDuration!==undefined)out.stayDuration=d.stayDuration;
        if(d.historyComplete!==undefined){if(typeof d.historyComplete!=='boolean')fail('invalid history confirmation.');out.historyComplete=d.historyComplete;}
        if(d.visits!==undefined){
          if(!Array.isArray(d.visits)||d.visits.length>1000)fail('too many or invalid previous visits.');
          out.visits=d.visits.map(v=>{if(!v||typeof v.entry!=='string'||typeof v.exit!=='string')fail('invalid previous visit.');return {entry:v.entry,exit:v.exit};});
        }
        const error=root.PortpassVisaTime.validate(out);if(error)fail(error);
      }
      return out;
    });
    return {format:'portpass',version:1,name:value.name.trim(),documents};
  }
  function filename(name) {
    const clean=String(name||'').trim().replace(/\.portpass$/i,'').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,'-').replace(/[. ]+$/g,'').slice(0,80);
    return (clean||'profile')+'.portpass';
  }
  function stringify(documents,name='',countries) {
    const profile=parse(JSON.stringify({format:'portpass',version:1,name:name.trim(),documents}),countries);
    return JSON.stringify(profile,null,2)+'\n';
  }
  root.PortpassProfile={parse,stringify,filename,MAX_BYTES};
})(globalThis);
