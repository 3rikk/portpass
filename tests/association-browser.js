// Run on a loaded local site in a disposable browser profile.
async function checkAssociation() {
 const assert=(v,m)=>{if(!v)throw Error(m);};
 docs=[];setMode('live');
 openDocumentForm();$('#document-country').value='TR';$('#document-country').dispatchEvent(new Event('change'));$('#document-form').requestSubmit();
 assert(results.DE.category==='conditional','Passport alone is conditional');
 openDocumentForm();$('#document-type').value='residence';updateDocumentForm();$('#document-country').value='DE';$('#document-country').dispatchEvent(new Event('change'));
 assert(!$('#association-fields').hidden,'EU residence association fields');
 $('#association-route').value='worker1';$('#association-route').dispatchEvent(new Event('change'));
 assert($('#association-conditions').textContent.includes('same employer'),'Work-history condition visible');
 $('#association-confirmed').value='yes';$('#document-form').requestSubmit();
 assert(docs[1].associationRoute==='worker1' && results.DE.category==='live','Confirmed stage saves');
 assert(results.FR.category!=='live','Rights stay in host country');
 assert($('#documents').textContent.includes('Turkish association'),'Wallet label');
 openDocumentForm(docs[1].id);assert($('#association-route').value==='worker1'&&$('#association-confirmed').value==='yes','Edit restores stage');
 $('#association-route').value='worker4';$('#association-route').dispatchEvent(new Event('change'));assert($('#association-confirmed').value==='','Changing stage clears confirmation');
 $('#association-confirmed').value='yes';$('#document-form').requestSubmit();
 const profile=PortpassProfile.stringify(docs,'Turkish rights',countries);docs=PortpassProfile.parse(profile,countries).documents;render();assert(results.DE.category==='live','Profile preserves stage');
 showCountry('DE');assert($('#country-detail').textContent.includes('only in this host country'),'Country scope explained');$('#country-dialog').close();
 setMode('visit');assert(!results.DE.routes.some(r=>r.title.startsWith('Turkish association ·')),'No association visitor waiver');
 openDocumentForm(docs[1].id);$('#document-country').value='GB';$('#document-country').dispatchEvent(new Event('change'));assert($('#association-route').value===''&&$('#association-confirmed').value==='','Country change clears stage');
 assert(![...$('#association-route').options].some(o=>o.value==='worker4'),'UK excludes EU worker stages');
 $('#association-route').value='ukBusiness';$('#association-route').dispatchEvent(new Event('change'));assert($('#association-conditions').textContent.includes('existing ECAA'),'UK requires legacy permission');
 $('#document-country').value='CH';$('#document-country').dispatchEvent(new Event('change'));assert($('#association-fields').hidden,'No Swiss association scheme');$('#document-dialog').close();
 assert(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');
 return 'Association form stages, confirmation resets, host-only results, profiles and UK restrictions passed';
}
