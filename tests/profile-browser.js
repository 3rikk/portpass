// Run in a disposable browser profile on a loaded local site.
async function checkProfiles() {
 const assert=(v,m)=>{if(!v)throw Error(m);};
 docs=[];render();openDocumentForm();$('#document-type').value='citizenship';updateDocumentForm();$('#document-country').value='DE';$('#document-form').requestSubmit();
 assert(docs.length===1 && docs[0].type==='citizenship','Citizenship saves without passport');
 assert(!docs[0].passport && !docs[0].expiry,'No passport or expiry on citizenship');
 assert(results.US.category==='unknown' && results.DE.category==='unknown','No citizenship travel access');
 setMode('live');assert(results.DE.category==='home' && results.FR.category==='unknown','Home residence only');
 openDocumentForm(docs[0].id);assert($('#linked-passport').disabled && $('#document-expiry').disabled,'Citizenship edit form');$('#document-dialog').close();
 $('#advanced-button').click();assert($('#profile-dialog').open,'Advanced opens');
 const oldClick=HTMLAnchorElement.prototype.click;let download;
 HTMLAnchorElement.prototype.click=function(){download={url:this.href,name:this.download};};
 try {
  $('#profile-name').value='';$('#save-profile').click();assert(download.name==='profile.portpass','Default filename');
  $('#profile-name').value='My profile';$('#save-profile').click();assert(download.name==='My profile.portpass','Named download');
 } finally {HTMLAnchorElement.prototype.click=oldClick;}
 // The fixture replaces fetch for map data; read blobs through XMLHttpRequest.
 const saved=await new Promise((resolve,reject)=>{const req=new XMLHttpRequest();req.open('GET',download.url);req.onload=()=>resolve(req.responseText);req.onerror=reject;req.send();});
 assert(JSON.parse(saved).name==='My profile','Downloaded plain text');
 const upload=async(text)=>{const transfer=new DataTransfer();transfer.items.add(new File([text],'profile.portpass',{type:'text/plain'}));$('#profile-file').files=transfer.files;await $('#profile-file').onchange();};
 await upload('broken');assert(pendingProfile===null && docs.length===1,'Invalid import leaves wallet');
 await upload(saved);assert(pendingProfile.documents.length===1 && !$('#restore-profile').hidden,'Import preview');
 docs=[];render();$('#restore-profile').click();assert(docs[0].type==='citizenship' && results.DE.category==='home','Restore redraws');
 assert(JSON.parse(localStorage.getItem('portpass-wallet-v1'))[0].type==='citizenship','Restored profile persists');
 assert(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');
 return 'Citizenship add/edit, travel/residence isolation, named/default downloads, readable file, invalid import, preview, restore and persistence passed';
}
