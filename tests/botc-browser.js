// Run on a loaded local site in a disposable browser profile.
async function checkBotc() {
 const assert=(v,m)=>{if(!v)throw Error(m);};
 const add=(type,country,answer='')=>{openDocumentForm();$('#document-type').value=type;updateDocumentForm();$('#document-country').value=country;$('#document-country').dispatchEvent(new Event('change'));$('#passport-condition').value=answer;$('#document-form').requestSubmit();assert(!$('#document-dialog').open,'Saved entry');};
 docs=[];setMode('visit');add('passport','FK');
 assert($('#documents').textContent.includes('BOTC passport'),'BOTC label');
 assert(results.GB.category==='free'&&results.FR.category==='free','BOTC travel');
 setMode('live');assert(results.FK.category==='unknown'&&results.GB.category==='conditional','No inferred right of abode');
 openDocumentForm(docs[0].id);$('#passport-condition').value='yes';$('#document-form').requestSubmit();
 assert(docs[0].localStatus===true && results.FK.category==='home','Local status saved');
 openDocumentForm(docs[0].id);assert($('#passport-condition').value==='yes','Local status edit');$('#document-dialog').close();
 const saved=PortpassProfile.stringify(docs,'BOTC',countries);docs=PortpassProfile.parse(saved,countries).documents;render();assert(results.FK.category==='home','BOTC profile');
 add('citizenship','GB');assert(results.GB.category==='home','Separate British citizenship');
 $('#search').value='Gibraltar';$('#search').dispatchEvent(new Event('input'));assert(document.querySelector('[data-country="GI"]'),'Gibraltar in list');
 showCountry('GI');assert($('#country-detail').textContent.includes('residency framework'),'Residence source explanation');$('#country-dialog').close();
 openDocumentForm();$('#document-country').value='GI';$('#document-country').dispatchEvent(new Event('change'));assert(!$('#passport-details').hidden,'BOTC status question');$('#document-country').value='GB';$('#document-country').dispatchEvent(new Event('change'));assert($('#passport-details').hidden && $('#passport-condition').value==='','British citizen selection resets BOTC state');$('#document-dialog').close();
 docs=[];add('citizenship','GI','yes');assert(results.GI.category==='home','BOTC citizenship status');setMode('visit');assert(results.GI.category==='unknown'&&results.GB.category==='unknown','No passport travel from citizenship only');
 assert(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');
 return 'BOTC forms, labels, edit, local status, citizenship isolation, profiles and territory list passed';
}
