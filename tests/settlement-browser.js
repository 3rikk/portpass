// Run on the loaded site in a disposable browser profile.
async function checkSettlements() {
  const assert=(value,message)=>{if(!value)throw Error(message);};
  const add=country=>{
    openDocumentForm();
    $('#document-country').value=country;
    $('#document-country').dispatchEvent(new Event('change'));
    $('#document-form').requestSubmit();
  };
  docs=[];setMode('live');add('CO');
  showCountry('PE');
  assert($('#country-detail').textContent.includes('Andean Community'),'CAN detail');
  assert($('#country-detail').textContent.includes('MERCOSUR'),'Overlapping MERCOSUR detail');
  assert($('#country-detail').textContent.includes('Check eligibility'),'Applications conditional');
  assert([...$('#country-detail').querySelectorAll('a')].some(a=>a.href.includes('comunidadandina.org')),'CAN source');
  $('#country-dialog').close();
  docs=[];render();add('GB');
  for (const destination of ['GG','JE','IM']) assert(results[destination].category==='live','Crown Dependency '+destination);
  $('#search').value='Jersey';$('#search').dispatchEvent(new Event('input'));
  assert($('#destination-list').textContent.includes('Jersey'),'New destination searchable');
  $('#search').value='';$('#search').dispatchEvent(new Event('input'));
  openDocumentForm();
  for(const code of ['FO','AX','GG','JE','IM']) assert(![...$('#document-country').options].some(o=>o.value===code),'No invented passport '+code);
  $('#document-type').value='residence';updateDocumentForm();
  $('#document-country').value='FO';$('#document-country').dispatchEvent(new Event('change'));$('#document-form').requestSubmit();
  assert(docs.some(d=>d.country==='FO'&&d.type==='residence'),'Faroese residence saved');
  docs=[];render();add('SE');
  assert(results.FO.category==='live'&&results.AX.category==='live'&&results.GL.category==='live','Nordic destinations');
  docs=[];render();add('NG');showCountry('GH');
  assert($('#country-detail').textContent.includes('ECOWAS'),'ECOWAS explanation');$('#country-dialog').close();
  docs=[];render();add('ZA');showCountry('DZ');
  assert($('#country-detail').textContent.includes('no general settlement right'),'AU proposal explained');$('#country-dialog').close();
  docs=[];render();add('BB');
  assert(results.BZ.category==='live'&&results.JM.category==='conditional','CARICOM scope');
  const counts=[...document.querySelectorAll('.stat strong')].map(el=>Number(el.textContent));
  assert(counts.reduce((a,b)=>a+b,0)===countries.length,'Counters cover all destinations');
  assert($('#legend').textContent.includes('Check eligibility'),'Conditional legend');
  document.querySelector('[data-filter=rights]').click();
  assert([...document.querySelectorAll('.destination-card')].every(el=>['home','live'].includes(results[el.dataset.country].category)),'Rights filter');
  document.querySelector('[data-filter=all]').click();
  $('#sources-button').click();assert($('#sources-dialog').textContent.includes('All 21 blocs'),'Coverage dialog');$('#sources-dialog').close();
  await $('#share-map').onclick();await $('#share-preview').decode();
  assert(exportFile.type==='image/jpeg'&&exportFile.size>0,'JPEG export');
  assert(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');
  return 'Settlement browser checks passed: overlap, eligibility, sources, territory forms/search, counters, filters, legend and JPEG export.';
}
