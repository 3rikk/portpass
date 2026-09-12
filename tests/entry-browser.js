// Run on a loaded local site in a disposable browser profile.
async function checkEntryRules() {
 const assert=(value,message)=>{if(!value)throw Error(message);};
 const add=(type,country,fields={})=>{
  openDocumentForm();$('#document-type').value=type;updateDocumentForm();$('#document-country').value=country;$('#document-country').dispatchEvent(new Event('change'));
  for(const [key,value] of Object.entries(fields))$('#document-'+key).value=value;
  $('#document-form').requestSubmit();assert(!$('#document-dialog').open,'Document saved');
 };
 docs=[];setMode('visit');add('passport','IN');add('residence','US',{permanent:'yes'});
 assert(docs[1].permanent===true && results.CA.category==='document','Green card Canada route');
 assert($('#documents').textContent.includes('green card'),'Green card wallet label');
 openDocumentForm(docs[1].id);assert($('#document-permanent').value==='yes','Edit preserves permanent residence');$('#document-dialog').close();
 add('schengen','DE',{multipleEntry:'yes',previouslyUsed:'yes'});
 assert(results.AL.category==='document','Used multiple-entry visa in Albania');
 openDocumentForm(docs[2].id);assert($('#document-multipleEntry').value==='yes'&&$('#document-previouslyUsed').value==='yes','Edit visa conditions');$('#document-dialog').close();
 const saved=PortpassProfile.stringify(docs,'Travel',countries);docs=PortpassProfile.parse(saved,countries).documents;render();assert(results.AL.category==='document'&&results.CA.category==='document','Profile preserves routes');
 assert(countries.includes('GL') && results.GL.category==='required','Greenland assessed separately');
 add('residence','DE');assert(results.GL.category==='document','Greenland accepts eligible residence permit');
 $('#search').value='Greenland';$('#search').dispatchEvent(new Event('input'));assert(document.querySelector('[data-country="GL"]'),'Greenland searchable');
 showCountry('GL');assert($('#country-detail').textContent.includes('Schengen residence permit access'),'Greenland detail');$('#country-dialog').close();
 assert(mapPaths.filter(f=>f.properties.code==='GL').attr('fill')===categoryColor('document'),'Greenland map color');
 openDocumentForm();assert(![...$('#document-country').options].some(o=>o.value==='GL'),'No invented Greenland passport');$('#document-dialog').close();
 docs=[];setMode('visit');add('passport','GB');assert(results.CN.category==='free'&&results.CN.best.days===30,'UK China waiver');
 docs=[];add('passport','NZ');setMode('live');assert(results.AU.category==='live','TTTA residence');
 const counts=[...document.querySelectorAll('.stat strong')].map(el=>Number(el.textContent));assert(counts.reduce((a,b)=>a+b)===countries.length,'All destinations counted');
 assert(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');
 return 'Entry-rule forms, edit, profiles, Greenland list/map, China, TTTA and counters passed';
}
