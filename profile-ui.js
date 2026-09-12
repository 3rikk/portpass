'use strict';
let pendingProfile=null,profileRead=0;
const PP=PortpassProfile;
$('#advanced-button').onclick=()=>{
  pendingProfile=null;profileRead++;$('#profile-file').value='';
  $('#profile-preview').hidden=$('#restore-profile').hidden=true;$('#profile-status').textContent='';
  $('#save-profile').disabled=!matrix;$('#profile-file').disabled=!matrix;
  $('#profile-dialog').showModal();
};
$('#profile-dialog').addEventListener('close',()=>{profileRead++;pendingProfile=null;});
$('#save-profile').onclick=()=>{
  try {
    const profileName=$('#profile-name').value.trim();
    const text=PP.stringify(docs,profileName,countries);
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=PP.filename(profileName);document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('#profile-status').textContent=`Download requested: ${PP.filename(profileName)}`;
  } catch(error){$('#profile-status').textContent=error.message;}
};
$('#profile-file').onchange=async()=>{
  const generation=++profileRead;pendingProfile=null;
  $('#profile-preview').hidden=$('#restore-profile').hidden=true;
  const file=$('#profile-file').files[0];if(!file){$('#profile-status').textContent='';return;}
  $('#profile-status').textContent='Reading profile on this device…';
  try {
    if(file.size>PP.MAX_BYTES)throw Error('Choose a profile smaller than 2 MB.');
    const text=await file.text();if(generation!==profileRead)return;
    const parsed=PP.parse(text,countries);pendingProfile=parsed;
    $('#profile-preview').textContent=`${parsed.name||'profile'} · ${parsed.documents.length} wallet ${parsed.documents.length===1?'entry':'entries'}. This will replace your ${docs.length} current ${docs.length===1?'entry':'entries'}.`;
    $('#profile-preview').hidden=$('#restore-profile').hidden=false;
    $('#profile-status').textContent='Profile checked. Ready to restore.';
  } catch(error){if(generation===profileRead)$('#profile-status').textContent=error.message;}
};
$('#restore-profile').onclick=()=>{
  if(!pendingProfile)return;
  try {
    // Write first: a storage failure leaves the existing in-memory wallet intact.
    localStorage.setItem('portpass-wallet-v1',JSON.stringify(pendingProfile.documents));
    docs=pendingProfile.documents;$('#profile-name').value=pendingProfile.name;
    pendingProfile=null;focusedVisaId=null;filter='all';query='';limit=12;$('#search').value='';
    render();$('#tooltip').style.display='none';
    $('#profile-preview').hidden=$('#restore-profile').hidden=true;$('#profile-file').value='';
    $('#profile-status').textContent=`Restored ${docs.length} wallet ${docs.length===1?'entry':'entries'} on this device.`;
  } catch(error){$('#profile-status').textContent='Could not restore this profile. Check that browser storage is available.';}
};
