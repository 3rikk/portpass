'use strict';
const $ = s => document.querySelector(s);
const R = PortpassRules, C = R.categories;
const names = new Intl.DisplayNames(['en'], {type:'region'});
const name = code => { try {return names.of(code);} catch {return code;} };
const flag = code => /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map(c => c.charCodeAt(0)+127397)) : '◌';
const escapeHTML = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const typeNames = {citizenship:'Citizenship · no passport', passport:'Passport', residence:'Residence permit', visa:'Visitor visa', schengen:'Schengen visa · Type C'};
let docs = [], mode = 'visit', filter = 'all', query = '', limit = 12, matrix, countries, results, geo, mapPaths, zoom, svg;
try { const saved=JSON.parse(localStorage.getItem('portpass-wallet-v1') || '[]'); if(Array.isArray(saved)) docs=saved.filter(d => d && typeof d.id==='string' && typeNames[d.type] && /^[A-Z]{2}$/.test(d.country) && (!d.expiry || /^\d{4}-\d{2}-\d{2}$/.test(d.expiry)) && (['passport','citizenship'].includes(d.type) || /^[A-Z]{2}$/.test(d.passport))); } catch {}
const passportDetail = d => {
  if(R.BOTC_TERRITORIES.includes(d.country)&&['passport','citizenship'].includes(d.type))return d.localStatus===true?'Local residence status confirmed':d.localStatus===false?'No local residence status declared':'Local residence status unconfirmed';
  const requirement=d.type==='passport' ? R.passportRequirement(d.country) : null;
  return requirement ? (d[requirement.key]===true ? 'Visa-waiver passport condition confirmed' : d[requirement.key]===false ? 'Visa-waiver passport condition not met' : 'Visa-waiver passport condition unconfirmed') : '';
};
const documentTypeName = d => R.BOTC_TERRITORIES.includes(d.country)&&['passport','citizenship'].includes(d.type)?(d.type==='passport'?'BOTC passport':'BOTC status · no passport'):typeNames[d.type];
const documentName = d => `${name(d.country)} ${documentTypeName(d).toLowerCase()}`;
const save = () => {try {localStorage.setItem('portpass-wallet-v1', JSON.stringify(docs));} catch {}};
const categoryColor = category => `var(--category-${category}, ${C[category].color})`;
const badge = category => `<span class="badge" style="--badge-color:${categoryColor(category)}">${C[category].label}</span>`;
function renderWallet() {
  const active=R.activeDocuments(docs);
  $('#document-count').textContent=docs.length;
  $('#documents').innerHTML=docs.map(d=>`<div class="document ${d.type}"><span class="doc-symbol">${flag(d.country)}</span><div><strong>${escapeHTML(name(d.country))}</strong><small>${d.type==='residence'&&d.permanent===true?(d.country==='US'?'Permanent residence · green card':'Permanent residence'):documentTypeName(d)}</small>${passportDetail(d)?`<small>${passportDetail(d)}</small>`:''}${!active.includes(d)?'<small class="document-warning">Expired, not yet valid, or no active passport</small>':''}${d.type==='residence'&&R.ASSOCIATION_ROUTES[d.associationRoute]?`<small>Turkish association · ${escapeHTML(R.ASSOCIATION_ROUTES[d.associationRoute].label)}</small>`:''}${VT.isVisa(d)?visaTimingMarkup(d,true):''}</div><button class="edit-document" data-edit="${escapeHTML(d.id)}" aria-label="Edit ${escapeHTML(documentName(d))}">Edit</button><button class="remove" data-remove="${escapeHTML(d.id)}" aria-label="Remove ${escapeHTML(documentName(d))}">×</button></div>`).join('');
}
function groups() {return mode==='visit' ? [{key:'easy',label:'Visa-free / document held',cats:['free','home','document','permit']},{key:'apply',label:'Application / eligibility check',cats:['arrival','online','conditional']},{key:'required',label:'Visa required / restricted',cats:['required','restricted']}] : [{key:'rights',label:'Citizenship / treaty rights',cats:['home','live']},{key:'permits',label:'Residence permit held',cats:['permit']},{key:'unknown',label:'Approval / not assessed',cats:['conditional','unknown']}];}
function render() {
  if (!matrix) return;
  results=Object.fromEntries(countries.map(code=>[code,R.evaluate(code,docs,mode,matrix)]));
  renderWallet();
  const living = mode === 'live';
  $('.wallet-bottom .tiny-label').textContent = living ? 'TRAVEL OPTIONS' : 'RESIDENCE OPTIONS';
  $('.wallet-bottom h3').innerHTML = living ? 'Visiting abroad' : 'Living abroad';
  $('.wallet-bottom p').textContent = living
    ? 'Discover places to visit with the documents you already hold.'
    : 'Discover residence options with the documents you already hold.';
  $('#explore-other-mode').innerHTML = `${living ? 'Explore travel possibilities' : 'Explore living abroad'} <span aria-hidden="true">↗</span>`;
  const gs=groups();
  $('#stats').innerHTML=gs.map((g,i)=>`<div class="stat"><div class="stat-top">${g.label}<span class="stat-icon">${['↗','◷','⌁'][i]}</span></div><strong>${countries.filter(c=>g.cats.includes(results[c].category)).length}</strong><small>destinations</small></div>`).join('');
  $('#map-title').textContent=mode==='visit'?'Your travel possibilities':'Your residence possibilities';
  $('#map-subtitle').textContent=docs.length?'Select a country to explore':'Add a passport to reveal your possibilities';
  $('#results-heading').textContent=mode==='visit'?'Explore destinations.':'Explore residence options.';
  const cats=mode==='visit'?['home','free','document','permit','arrival','online','required','restricted','conditional','unknown'].filter(c=>['free','document','arrival','online','required','unknown'].includes(c)||Object.values(results).some(r=>r.category===c)):[ 'home','live','permit','conditional','unknown'];
  $('#legend').innerHTML=cats.map(c=>`<span><i class="dot" style="background:${categoryColor(c)}"></i>${C[c].label}</span>`).join('');
  $('#filters').innerHTML=[{key:'all',label:'All destinations'},...gs].map(g=>`<button data-filter="${g.key}" class="${filter===g.key?'active':''}" aria-pressed="${filter===g.key}">${g.label}</button>`).join('');
  mapPaths?.attr('fill',f=>categoryColor(results[f.properties.code]?.category || 'unknown'));
  renderDestinations();
  renderVisaClocks();
}
function renderDestinations() {
  const grouping=groups().find(g=>g.key===filter);
  const available=countries.filter(c=>(!grouping||grouping.cats.includes(results[c].category))&&(name(c).toLowerCase().includes(query)||c.toLowerCase()===query));
  available.sort((a,b)=>C[results[b].category].rank-C[results[a].category].rank || name(a).localeCompare(name(b)));
  $('#destination-list').innerHTML=available.slice(0,limit).map(code=>{
    const result=results[code];
    const caption=result.best ? (result.category==='conditional' ? 'Eligibility needs confirmation · ' : result.best.days ? `Up to ${result.best.days} days · ` : '')+documentName(result.best.document) : mode==='live'?'No residence route assessed':'Add a passport to see entry rules';
    return `<button class="destination-card" data-country="${code}"><div class="card-top"><span class="flag">${flag(code)}</span>${escapeHTML(name(code))}<span class="arrow">↗</span></div>${badge(result.category)}<small>${escapeHTML(caption)}</small></button>`;
  }).join('') || '<p class="empty">No destinations match this search. Try another name or filter.</p>';
  $('#show-more').hidden=available.length<=limit;
  $('#show-all').hidden=available.length<=limit;
  $('#show-more').textContent=`Show more destinations (${available.length-limit} remaining) ↓`;
}
function showCountry(code, fallback) {
  const result=results[code] || {category:'unknown',routes:[]};
  $('#country-detail').innerHTML=`<div class="dialog-heading"><div><span class="detail-flag">${flag(code)}</span><h2>${escapeHTML(fallback || name(code))}</h2></div><button class="close" data-close="country-dialog" aria-label="Close">×</button></div>${badge(result.category)}<p>${mode==='visit'?'Your routes for a short visit.':'Your assessed residence routes.'} ${result.routes.length>1?'The strongest route is shown first.':''}</p>${result.routes.map(route=>`<article class="route"><h3>${escapeHTML(route.title)}${route.days?` · up to ${route.days} days`:''}</h3><p><strong>Using ${escapeHTML(documentName(route.document))}</strong></p><p>${escapeHTML(route.conditions)}</p>${route.source?`<a href="${route.source}" target="_blank" rel="noopener">${escapeHTML(R.sourceLabels[route.source] || 'Official guidance')}${route.reviewed ? ` · reviewed ${route.reviewed}` : ''} ↗</a>`:'<p>Based on your declared document; check its issuing authority.</p>'}</article>`).join('') || `<div class="route"><h3>${mode==='live'?'No residence rule assessed':'No entry route assessed'}</h3><p>${docs.length?'This destination or document combination is not covered. This does not mean you are ineligible.':'Add a valid passport to start exploring.'}</p></div>`}<p class="detail-note">Rules describe general routes, not a guarantee of admission. Confirm current entry rules, document validity and allowed activities with the destination’s authorities.</p>`;
  $('#country-detail').insertAdjacentHTML('beforeend',visaDetailsMarkup(code));
  $('#country-dialog').showModal();
}
function drawMap() {
  svg=d3.select('#world-map');
  const projection=d3.geoNaturalEarth1().fitExtent([[18,18],[982,500]],{type:'FeatureCollection',features:geo.features.filter(f=>f.properties.code!=='AQ')});
  const path=d3.geoPath(projection), g=svg.append('g');
  g.append('path').datum(d3.geoGraticule10()).attr('class','graticule').attr('d',path);
  mapPaths=g.selectAll('.country').data(geo.features.filter(f=>f.properties.code!=='AQ')).join('path').attr('class','country').attr('d',path).attr('fill',categoryColor('unknown')).attr('role','button').attr('tabindex',0).attr('aria-label',f=>`Explore ${f.properties.label}`)
    .on('click',(_,f)=>showCountry(f.properties.code,f.properties.label))
    .on('keydown',(e,f)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showCountry(f.properties.code,f.properties.label);}})
    .on('mousemove',showMapTooltip)
    .on('focus',showMapTooltip)
    .on('blur',()=>{$('#tooltip').style.display='none';})
    .on('mouseleave',()=>{$('#tooltip').style.display='none';});
  zoom=d3.zoom().scaleExtent([1,7]).translateExtent([[0,0],[1000,520]]).on('zoom',e=>{g.attr('transform',e.transform);$('#tooltip').style.display='none';});svg.call(zoom).on('dblclick.zoom',null);
  $('#zoom-in').onclick=()=>svg.call(zoom.scaleBy,1.5);$('#zoom-out').onclick=()=>svg.call(zoom.scaleBy,1/1.5);$('#reset-map').onclick=()=>svg.call(zoom.transform,d3.zoomIdentity);
}
function updatePassportDetails() {
  const requirement = ($('#document-type').value === 'passport' || ($('#document-type').value === 'citizenship' && R.BOTC_TERRITORIES.includes($('#document-country').value))) ? R.passportRequirement($('#document-country').value) : null;
  $('#passport-details').hidden = !requirement;
  $('#passport-condition').value = '';
  if (requirement) {
    $('#passport-condition-label').textContent = requirement.label;
    $('#passport-condition-note').textContent = requirement.detail;
  }
}
function updateAssociationConditions() {
  const rule=R.ASSOCIATION_ROUTES[$('#association-route').value];
  $('#association-conditions').textContent=rule?(rule.turkish?'Requires Turkish nationality. ':'')+rule.conditions:'';
  $('#association-confirmation-label').hidden=!rule;
}
function updateAssociationFields() {
  const options=$('#document-type').value==='residence'?R.associationOptions($('#document-country').value):[];
  $('#association-fields').hidden=!options.length;
  $('#association-route').innerHTML='<option value="">Not recorded</option>'+options.map(([key,rule])=>`<option value="${key}">${escapeHTML(rule.label)}</option>`).join('');
  $('#association-confirmed').value='';
  updateAssociationConditions();
}
function updateDocumentConditions() {
  const type=$('#document-type').value, country=$('#document-country').value;
  const usResidence=type==='residence' && country==='US';
  const schengenVisa=VT.isVisa({type}) && R.SCHENGEN.includes(country);
  $('#permanent-label').hidden=!usResidence;
  $('#multiple-entry-label').hidden=!schengenVisa;
  $('#previously-used-label').hidden=!schengenVisa;
  $('#document-conditions').hidden=!usResidence && !schengenVisa;
}
function updateDocumentForm() {
  const type=$('#document-type').value, selection=$('#document-country').value;
  const options=type==='schengen'?countries.filter(c=>R.SCHENGEN.includes(c)):['passport','citizenship'].includes(type)?R.passportCodes(matrix).sort((a,b)=>name(a).localeCompare(name(b))):countries;
  $('#document-country').innerHTML=options.map(c=>`<option value="${c}">${escapeHTML(name(c))}${["passport","citizenship"].includes(type)?R.BOTC_TERRITORIES.includes(c)?" · BOTC":c==="GB"?" · British citizen":"":""}</option>`).join('');
  if(options.includes(selection))$('#document-country').value=selection;
  const standalone=['passport','citizenship'].includes(type);
  $('#linked-label').hidden=standalone;
  $('#linked-passport').disabled=standalone;
  $('#document-expiry').closest('label').hidden=type==='citizenship';
  $('#document-expiry').disabled=type==='citizenship';
  $('#citizenship-note').hidden=type!=='citizenship';
  $('#citizenship-note').textContent='Records nationality without adding passport travel access. BOTC status requires separate local residence confirmation; it does not automatically grant UK or territorial residence rights.';
  $('#country-label-text').textContent=type==='citizenship'?'Country of citizenship':type==='visa'?'Destination / territory covered':'Issuing country';
  $('#linked-passport').innerHTML=docs.filter(d=>d.type==='passport'&&(!d.expiry||d.expiry>=R.today())).map(d=>`<option value="${d.country}">${escapeHTML(name(d.country))} passport</option>`).join('');
  $('#linked-passport').required=!standalone;
  updateDocumentConditions();
  for(const key of ['permanent','multipleEntry','previouslyUsed'])$('#document-'+key).value='';
  updatePassportDetails();
  updateAssociationFields();
  updateVisaFields();
}
function setMode(value) {mode=value;filter='all';limit=12;document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});render();}
document.addEventListener('click',e=>{
  const close=e.target.closest('[data-close]');if(close)$('#'+close.dataset.close).close();
  const remove=e.target.closest('[data-remove]');if(remove){docs=docs.filter(d=>d.id!==remove.dataset.remove);save();render();}
  const country=e.target.closest('#destination-list .destination-card[data-country]');if(country)showCountry(country.dataset.country);
  const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;limit=12;render();}
  const edit=e.target.closest('[data-edit]');if(edit)openDocumentForm(edit.dataset.edit);
  const focus=e.target.closest('[data-visa-focus]');if(focus){focusedVisaId=focusedVisaId===focus.dataset.visaFocus?null:focus.dataset.visaFocus;renderVisaClocks();}
  const m=e.target.closest('[data-mode]');if(m)setMode(m.dataset.mode);
});
for(const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#add-document').onclick=()=>openDocumentForm();
$('#document-type').onchange=()=>{updateDocumentForm();};
$('#document-country').onchange=()=>{
  for(const key of ['permanent','multipleEntry','previouslyUsed'])$('#document-'+key).value='';
  updatePassportDetails();updateDocumentConditions();updateAssociationFields();updateVisaAssumption();
};
$('#linked-passport').onchange=()=>{$('#association-confirmed').value='';updateVisaAssumption();};
$('#association-route').onchange=()=>{$('#association-confirmed').value='';updateAssociationConditions();};
$('#visa-stay-duration').oninput=()=>{
  if($('#document-type').value==='schengen' && !$('#visa-stay-basis').dataset.chosen) {
    $('#visa-stay-basis').value=Number($('#visa-stay-duration').value)>0 && Number($('#visa-stay-duration').value)<90?'total':'rolling';
  }
  updateVisaAssumption();
};
$('#visa-stay-unit').onchange=updateVisaAssumption;
$('#visa-stay-basis').onchange=()=>{$('#visa-stay-basis').dataset.chosen='true';};
$('#add-visa-visit').onclick=()=>addVisaVisitRow();
$('#document-form').onsubmit=e=>{
  e.preventDefault();const type=$('#document-type').value,country=$('#document-country').value,expiry=$('#document-expiry').value,passport=$('#linked-passport').value;
  if(!['passport','citizenship'].includes(type)&&!passport){$('#form-error').textContent='Add a valid passport first so we can link this document to it.';return;}
  if(!VT.isVisa({type}) && docs.some(d=>d.id!==editingDocumentId&&d.type===type&&d.country===country&&(['passport','citizenship'].includes(type)||d.passport===passport))){$('#form-error').textContent='This document is already in your wallet. Use its Edit button to update it.';return;}
  const requirement=type==='passport'||(type==='citizenship'&&R.BOTC_TERRITORIES.includes(country))?R.passportRequirement(country):null;
  const confirmation=$('#passport-condition').value;
  const document={id:editingDocumentId||crypto.randomUUID(),type,country,...(type==='citizenship'?{}:{expiry}),...(['passport','citizenship'].includes(type)?{}:{passport}),...(requirement && confirmation!=='' ? {[requirement.key]:confirmation==='yes'} : {})};
  for(const key of type==='residence'?['permanent','previouslyUsed']:VT.isVisa({type})?['multipleEntry','previouslyUsed']:[]) {
    const value=$('#document-'+key).value;
    if(value!=='')document[key]=value==='yes';
  }
  if(type==='residence' && $('#association-route').value) {
    document.associationRoute=$('#association-route').value;
    const value=$('#association-confirmed').value;
    if(value!=='')document.associationConfirmed=value==='yes';
  }
  const associationError=R.validateAssociation(document);if(associationError){$('#form-error').textContent=associationError;return;}
  if(VT.isVisa(document)) {
    Object.assign(document,draftVisa());
    const error=VT.validate(document);if(error){$('#form-error').textContent=error;return;}
  }
  if(editingDocumentId)docs=docs.map(d=>d.id===editingDocumentId?document:d);else docs.push(document);
  save();render();$('#document-dialog').close();editingDocumentId=null;

};
$('#search').oninput=e=>{query=e.target.value.trim().toLowerCase();limit=12;if(matrix)renderDestinations();};
$('#show-more').onclick=()=>{limit+=24;renderDestinations();};
$('#show-all').onclick=()=>{limit=Infinity;renderDestinations();};
$('#explore-other-mode').onclick=()=>setMode(mode === 'live' ? 'visit' : 'live');
$('#sources-button').onclick=$('#coverage-button').onclick=()=>$('#sources-dialog').showModal();
let exportFile, exportUrl, exportGeneration = 0;
function clearMapExport() {
  exportGeneration++;
  if (exportUrl) URL.revokeObjectURL(exportUrl);
  exportFile = exportUrl = null;
  $('#share-preview').removeAttribute('src');
  $('#share-preview').hidden = true;
  $('#download-map').removeAttribute('href');
  $('#download-map').hidden = $('#share-image').hidden = true;
}
$('#share-dialog').addEventListener('close', clearMapExport);
$('#share-map').onclick = async () => {
  if (!results) return;
  clearMapExport();
  const generation = exportGeneration;
  $('#share-status').textContent = 'Creating your map…';
  $('#share-dialog').showModal();
  $('#share-map').disabled = true;
  try {
    const active = R.activeDocuments(docs);
    const categories = [...$('#legend').children].map(el => Object.keys(C).find(key => C[key].label === el.textContent));
    const file = await PortpassMapExport.create({
      features: geo.features, results, mode, categories,
      wallet: docs.map(d => ({
        title: `${flag(d.country)} ${name(d.country)}`,
        detail: typeNames[d.type] + (d.passport ? ` · ${name(d.passport)} passport` : '') + (passportDetail(d) ? ` · ${passportDetail(d)}` : '') + (VT.isVisa(d) ? ` · ${visaHeadline(VT.summary(d,docs,matrix))} · ${visaExpiryText(VT.summary(d,docs,matrix))}` : ''),
        inactive: !active.includes(d)
      })),
      counters: groups().map(g => ({label: g.label, count: countries.filter(c => g.cats.includes(results[c].category)).length}))
    });
    if (generation !== exportGeneration) return;
    exportFile = file; exportUrl = URL.createObjectURL(file);
    $('#share-preview').src = exportUrl; $('#share-preview').hidden = false;
    $('#download-map').href = exportUrl; $('#download-map').download = file.name; $('#download-map').hidden = false;
    let canShare = false;
    try { canShare = !!navigator.share && !!navigator.canShare?.({files: [file]}); } catch {}
    $('#share-image').hidden = !canShare;
    $('#share-image').disabled = false;
    $('#share-status').textContent = 'Your JPEG is ready.';
  } catch (error) {
    if (generation === exportGeneration) $('#share-status').textContent = 'Could not create your map. Close this window and try again.';
    console.error(error);
  } finally {
    $('#share-map').disabled = false;
  }
};
$('#share-image').onclick = async () => {
  if (!exportFile) return;
  $('#share-image').disabled = true;
  try {
    // Keep this call directly in the click handler for native share activation.
    await navigator.share({files: [exportFile], title: 'My Portpass map'});
    $('#share-status').textContent = 'Map shared.';
  } catch (error) {
    $('#share-status').textContent = error.name === 'AbortError'
      ? 'Sharing cancelled. Your JPEG is still ready to download.'
      : 'Sharing is unavailable. Use Download JPEG to save your map.';
  } finally {
    $('#share-image').disabled = false;
  }
};
async function init(){
  $('#stats').innerHTML='<p class="muted">Loading your world…</p>';
  try{
    const fetchJSON=async url=>{const response=await fetch(url);if(!response.ok)throw Error(`Could not load ${url}`);return response.json();};
    [matrix,geo]=await Promise.all([fetchJSON('data/passports.json'),fetchJSON('data/world.geojson')]);
    countries=R.destinationCodes(matrix).sort((a,b)=>name(a).localeCompare(name(b)));
    docs=docs.filter(d=>countries.includes(d.country));
    geo.features.forEach(f=>{const p=f.properties;p.code=p.ISO_A2_EH!=='-99'?p.ISO_A2_EH:p.ISO_A2;p.label=/^[A-Z]{2}$/.test(p.code)?name(p.code):p.NAME;});
    drawMap();render();$('#share-map').disabled=false;
    PortpassBlocMap.init({features:geo.features, name, flag, escapeHTML});
  }catch(error){$('#stats').innerHTML='<p class="empty">We couldn’t load the map data. Serve this folder over HTTP and refresh to try again.</p>';$('#map-subtitle').textContent='Data unavailable';console.error(error);}
}
let lastVisaDate=R.today();
function refreshVisaDay(){const date=R.today();if(date!==lastVisaDate){lastVisaDate=date;render();$('#tooltip').style.display='none';}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshVisaDay();});
setInterval(refreshVisaDay,60000);
init();
