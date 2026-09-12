// Browser integration checks; run after the local site has loaded.
async function checkVisaClocks() {
  const assert=(value,message)=>{if(!value)throw Error(message);};
  const field=(id,value)=>{const el=document.querySelector(id);el.value=value;el.dispatchEvent(new Event(el.type==='number'?'input':'change'));};
  docs=[];render();
  openDocumentForm();field('#document-country','IN');$('#document-form').requestSubmit();
  assert(docs.length===1,'Passport saved');
  openDocumentForm();field('#document-type','schengen');field('#document-country','FR');
  assert($('#visa-duration-hint').textContent.includes('Assumed: 90 days'),'Schengen assumed limit');
  field('#visa-entry-date',VT.iso(VT.day(R.today())-11));$('#visa-history-complete').checked=true;
  $('#document-form').requestSubmit();
  assert(docs.length===2,'Visa saved: '+$('#form-error').textContent);
  assert($('#visa-clocks').textContent.includes('79 days left'),'Clock remaining');
  const v=docs[1];assert(VT.summary(v,docs,matrix).covers('IT'),'Bloc scope');
  $('[data-visa-focus]').click();assert(focusedVisaId===v.id,'Selected clock');
  assert(mapPaths.filter(f=>f.properties.code==='FR').attr('opacity')==='1','France highlighted');
  assert(mapPaths.filter(f=>f.properties.code==='US').attr('opacity')==='0.25','US dimmed');
  const france=mapPaths.filter(f=>f.properties.code==='FR').node();
  france.dispatchEvent(new MouseEvent('mousemove',{clientX:700,clientY:500,bubbles:true}));
  assert($('#tooltip').textContent.includes('79 days left'),'Hover countdown');
  showCountry('DE');assert($('#country-detail').textContent.includes('Shared') || $('#country-detail').textContent.includes('one allowance'),'Country visa detail');
  $('#country-detail [data-edit]').click();assert($('#document-dialog').open,'Edit from detail');
  field('#visa-stay-duration','30');$('#document-form').requestSubmit();
  assert(docs.length===2 && docs[1].stayDuration===30,'Edited in place');
  assert($('#visa-clocks').textContent.includes('19 days left'),'Updated countdown');
  assert(JSON.parse(localStorage.getItem('portpass-wallet-v1'))[1].entryDate===docs[1].entryDate,'Timing persisted locally');
  openDocumentForm(v.id);addVisaVisitRow({entry:VT.iso(VT.day(R.today())-25),exit:VT.iso(VT.day(R.today())-21)});$('#document-form').requestSubmit();
  assert(VT.summary(docs[1],docs,matrix).remaining===14,'Previous visits counted');
  setMode('live');assert($('#visa-clocks').hidden && focusedVisaId===null,'Live clears highlight');setMode('visit');
  openDocumentForm();field('#document-type','visa');field('#document-country','US');
  assert($('#visa-duration-hint').textContent.includes('I-94'),'US deadline guidance');
  field('#visa-entry-date',R.today());field('#visa-admitted-until',VT.iso(VT.day(R.today())+20));$('#document-form').requestSubmit();
  assert(docs.length===3 && VT.summary(docs[2],docs,matrix).remaining===21,'Admission clock');
  assert(document.documentElement.scrollWidth<=window.innerWidth,'No page horizontal overflow');
  await $('#share-map').onclick();await $('#share-preview').decode();
  assert(exportFile?.type==='image/jpeg','Share still renders');
  return {checks:'Wallet add/edit, assumptions, arrival/history, map hover/highlight, bloc, local persistence, admission deadline, live mode, overflow and JPEG passed',width:$('#share-preview').naturalWidth,height:$('#share-preview').naturalHeight};
}
