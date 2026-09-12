'use strict';
const VT = PortpassVisaTime;
let editingDocumentId = null, focusedVisaId = null;
const visaDate = value => value ? new Intl.DateTimeFormat('en',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z')) : '';
const visaAllowanceLabel = t => t.limit.value === null ? 'Allowance not known' : `${t.limit.value} ${t.limit.unit}`;
function visaHeadline(t) {
  if(t.error)return 'Check visa details';
  if(t.state==='unlinked')return 'No active linked passport';
  if(t.state==='future')return `Valid from ${visaDate(t.starts)}`;
  if(t.remaining!==null)return `${t.remaining} ${t.remaining===1?'day':'days'} left${t.estimated?' · estimate':''}`;
  if(t.state==='expired')return 'Entry visa expired';
  if(t.state==='exhausted')return 'Recorded allowance used up';
  return `${visaAllowanceLabel(t)}${t.limit.assumed?' · assumed':''}`;
}
function visaExpiryText(t) {
  return t.expiryDays===null ? 'Visa expiry not entered' : t.expiryDays<0 ? `Visa expired ${-t.expiryDays} days ago` : t.expiryDays===0 ? 'Visa expires today' : `Visa expires in ${t.expiryDays} days · ${visaDate(t.expiry)}`;
}
function visaScopeName(d) {return d.type==='schengen' ? 'Schengen · shared across 29 countries' : name(d.country);}
function visaTimingMarkup(d, compact=false) {
  const t=VT.summary(d,docs,matrix);if(!t)return '';
  const badge=t.limit.value===null?'Unknown allowance':t.limit.assumed?'Assumed allowance':'Entered allowance';
  const total=t.limit.unit==='days'?t.limit.value:null;
  return `<div class="visa-timing ${t.urgency}"><strong>${escapeHTML(visaHeadline(t))}</strong><span class="assumption-tag" title="${escapeHTML(t.limit.basis)}">${badge}</span><small>${escapeHTML(visaExpiryText(t))}</small>${!compact&&t.remaining>0?`<small>${t.estimated?'Estimated':'Recorded'} last day: ${visaDate(t.leaveBy)} · includes today</small>`:''}${!compact&&total!==null&&t.started&&t.historyReady?`<progress max="${total}" value="${Math.min(total,t.used)}" aria-label="${t.used} of ${total} days used"></progress><small>${t.used} days logged${t.basis==='rolling'?' in the last 180 days':''}</small>`:''}${!compact?`<small>${escapeHTML(t.error || (!t.historyReady?'Confirm complete visit history for a remaining-stay estimate.':!t.started?'Add your arrival date to track days used.':t.limit.basis))}</small>`:''}</div>`;
}
function visaDetailsMarkup(code) {
  const visas=docs.filter(d=>VT.covers(d,code));
  if(!visas.length)return '';
  return `<section class="country-visa-times"><h3>Your visa clocks</h3>${visas.map(d=>{
    const t=VT.summary(d,docs,matrix);
    return `<article class="visa-detail"><div class="section-heading"><h3>${escapeHTML(visaScopeName(d))}</h3><button class="text-button" data-edit="${escapeHTML(d.id)}">Edit timing</button></div><p>Linked to your ${escapeHTML(name(d.passport))} passport${d.type==='schengen'?' · one allowance across the bloc, not per country':''}.</p>${visaTimingMarkup(d)}<p>${escapeHTML(t.limit.basis)}${t.limit.assumed?'. This is an assumption, not a verified grant.':''}</p>${t.limit.source?`<a href="${t.limit.source}" target="_blank" rel="noopener">Duration source ↗</a>`:''}<p class="form-note">Visa validity and permission to stay are separate. The clock uses your entries; unrecorded trips, entry limits and border decisions can change the result.${d.type==='schengen'?' Include all short visits to Schengen, even on another passport or visa. Do not count residence-authorised days in your country of residence.':''}</p></article>`;
  }).join('')}</section>`;
}
function showMapTooltip(e, feature) {
  const code=feature.properties.code, box=$('#map-container').getBoundingClientRect(),tip=$('#tooltip');
  const visas=docs.filter(d=>VT.covers(d,code));
  tip.innerHTML=`<strong>${escapeHTML(feature.properties.label)}</strong><div>${C[results[code]?.category||'unknown'].label}</div>${visas.slice(0,2).map(d=>{const t=VT.summary(d,docs,matrix);return `<div class="tooltip-clock"><b>${escapeHTML(visaHeadline(t))}</b><span>${escapeHTML(visaExpiryText(t))}</span>${d.type==='schengen'?'<span>Shared Schengen clock</span>':''}${t.remaining!==null?'<span>Includes today · open for details</span>':''}</div>`;}).join('')}${visas.length>2?`<span>Open for ${visas.length} visa clocks</span>`:''}`;
  tip.style.display='block';
  const target=e.currentTarget?.getBoundingClientRect();
  const x=Number.isFinite(e.clientX)?e.clientX:(target?.left||box.left)+(target?.width||0)/2;
  const y=Number.isFinite(e.clientY)?e.clientY:target?.top||box.top;
  const size=tip.getBoundingClientRect();
  tip.style.left=`${Math.max(8,Math.min(x-box.left+12,box.width-size.width-8))}px`;
  tip.style.top=`${Math.max(8,Math.min(y-box.top-size.height-12,box.height-size.height-8))}px`;
}
function updateVisaFocus() {
  const selected=docs.find(d=>d.id===focusedVisaId&&VT.isVisa(d));
  if(!selected)focusedVisaId=null;
  mapPaths?.attr('opacity',f=>!selected||VT.covers(selected,f.properties.code)?1:.25)
    .classed('visa-focus',f=>!!selected&&VT.covers(selected,f.properties.code));
  document.querySelectorAll('[data-visa-focus]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.visaFocus===focusedVisaId)));
}
function renderVisaClocks() {
  const visas=docs.filter(VT.isVisa),rail=$('#visa-clocks');
  rail.hidden=!visas.length||mode!=='visit';
  if(mode!=='visit')focusedVisaId=null;
  rail.innerHTML=visas.length?`<div class="section-heading"><h3>Visa clocks</h3><span>Choose a clock to highlight its countries</span></div><div class="visa-clock-list">${visas.map(d=>{
    const t=VT.summary(d,docs,matrix);
    return `<button class="visa-clock ${t.urgency}" data-visa-focus="${escapeHTML(d.id)}" aria-pressed="${focusedVisaId===d.id}"><span>${escapeHTML(visaScopeName(d))}</span><strong>${escapeHTML(visaHeadline(t))}</strong><small>${escapeHTML(visaExpiryText(t))}</small><small>${escapeHTML(name(d.passport))} passport${focusedVisaId===d.id?' · click to clear highlight':''}</small></button>`;
  }).join('')}</div>`:'';
  updateVisaFocus();
}
function addVisaVisitRow(visit={}) {
  const row=document.createElement('div');row.className='visa-visit-row';
  row.innerHTML=`<label>Arrived<input type="date" class="visit-entry" value="${escapeHTML(visit.entry||'')}" required></label><label>Left<input type="date" class="visit-exit" value="${escapeHTML(visit.exit||'')}" required></label><button type="button" class="text-button" aria-label="Remove previous visit">Remove</button>`;
  row.querySelector('button').onclick=()=>{row.remove();updateVisaAssumption();};
  $('#visa-visits').append(row);
}
function draftVisa() {
  const d={type:$('#document-type').value,country:$('#document-country').value,passport:$('#linked-passport').value,
    expiry:$('#document-expiry').value,validFrom:$('#visa-valid-from').value,entryDate:$('#visa-entry-date').value,
    admittedUntil:$('#visa-admitted-until').value,stayUnit:$('#visa-stay-unit').value,stayBasis:$('#visa-stay-basis').value,
    historyComplete:$('#visa-history-complete').checked,
    visits:[...document.querySelectorAll('.visa-visit-row')].map(row=>({entry:row.querySelector('.visit-entry').value,exit:row.querySelector('.visit-exit').value}))};
  if($('#visa-stay-duration').value!=='')d.stayDuration=Number($('#visa-stay-duration').value);
  return d;
}
function updateVisaAssumption() {
  if(!VT.isVisa({type:$('#document-type').value}))return;
  const d=draftVisa(),limit=VT.allowance(d,matrix);
  if(d.stayDuration===undefined)$('#visa-stay-unit').value=limit.unit;
  const element=$('#visa-duration-hint');
  element.textContent=limit.value===null?limit.basis:`${limit.assumed?'Assumed':'Entered'}: ${limit.value} ${limit.unit}. ${limit.basis}.`;
  element.classList.toggle('is-assumed',limit.assumed);
  $('#visa-stay-duration').placeholder=limit.assumed?String(limit.value):'Enter issued allowance';
}
function updateVisaFields() {
  const type=$('#document-type').value,isVisa=VT.isVisa({type}),schengen=type==='schengen';
  $('#visa-fields').hidden=!isVisa;
  $('#visa-fields').querySelectorAll('input,select,button').forEach(el=>el.disabled=!isVisa);
  $('#visa-stay-unit option[value="months"]').disabled=schengen;
  if(schengen)$('#visa-stay-unit').value='days';
  $('#visa-stay-duration').max=schengen?'90':'3650';
  $('#visa-stay-basis').innerHTML=schengen?'<option value="rolling">Shared limit per rolling 180 days</option><option value="total">Total days authorised on this visa</option>':'<option value="perVisit">Per visit</option><option value="total">Total across visits on this visa</option>';
  $('#visa-history-label').textContent=schengen?'I have recorded all my Schengen short visits in this wallet, including on other visas or passports.':'I have recorded all previous visits on this visa.';
  $('#visa-history-help').textContent=schengen?'One clock covers all 29 Schengen countries. Add earlier trips on this or other Schengen visas in your wallet, including expired visas. Residence-authorised stays in the residence country are excluded. Entry and exit days both count.':'Previous visits are used for a total visa allowance. For a per-visit allowance, the clock starts from your arrival date.';
  updateVisaAssumption();
}
function openDocumentForm(id=null) {
  if(!matrix)return;
  const d=docs.find(doc=>doc.id===id);editingDocumentId=d?.id||null;
  delete $('#visa-stay-basis').dataset.chosen;
  $('#document-form').reset();$('#visa-visits').innerHTML='';$('#form-error').textContent='';
  if(d){$('#document-type').value=d.type;$('#document-country').value=d.country;}
  updateDocumentForm();
  if(d) {
    $('#document-country').value=d.country;updatePassportDetails();
    $('#linked-passport').value=d.passport||'';
    if(d.passport&&!$('#linked-passport').value){const option=new Option(`${name(d.passport)} passport (not active)`,d.passport);$('#linked-passport').add(option);$('#linked-passport').value=d.passport;}
    $('#document-expiry').value=d.expiry||'';
    const requirement=R.passportRequirement(d.country);
    if(requirement)$('#passport-condition').value=d[requirement.key]===true?'yes':d[requirement.key]===false?'no':'';
    if(VT.isVisa(d)) {
      $('#visa-stay-duration').value=d.stayDuration??'';$('#visa-stay-unit').value=d.stayUnit||'days';
      $('#visa-stay-basis').value=d.stayBasis||(d.type==='schengen'?(d.stayDuration&&d.stayDuration<90?'total':'rolling'):'perVisit');
      $('#visa-valid-from').value=d.validFrom||'';$('#visa-entry-date').value=d.entryDate||'';$('#visa-admitted-until').value=d.admittedUntil||'';
      $('#visa-history-complete').checked=d.historyComplete===true;(Array.isArray(d.visits)?d.visits:[]).filter(v=>v&&typeof v==='object').forEach(addVisaVisitRow);
    }
  }
  $('#document-dialog h2').textContent=d?'Edit document':'Add a document';
  $('#document-form button[type="submit"]').innerHTML=d?'Save changes <span>✓</span>':'Add to my wallet <span>＋</span>';
  updateVisaAssumption();
  if($('#country-dialog').open)$('#country-dialog').close();
  $('#document-dialog').showModal();
}
