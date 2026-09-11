'use strict';
const $ = s => document.querySelector(s);
const R = PortpassRules, C = R.categories;
const names = new Intl.DisplayNames(['en'], {type:'region'});
const name = code => { try {return names.of(code);} catch {return code;} };
const flag = code => /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map(c => c.charCodeAt(0)+127397)) : '◌';
const escapeHTML = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const typeNames = {passport:'Passport', residence:'Residence permit', visa:'Visitor visa', schengen:'Schengen visa · Type C'};
let docs = [], mode = 'visit', filter = 'all', query = '', limit = 12, matrix, countries, results, geo, mapPaths, zoom, svg;
try { const saved=JSON.parse(localStorage.getItem('portpass-wallet-v1') || '[]'); if(Array.isArray(saved)) docs=saved.filter(d => d && typeof d.id==='string' && typeNames[d.type] && /^[A-Z]{2}$/.test(d.country) && (!d.expiry || /^\d{4}-\d{2}-\d{2}$/.test(d.expiry)) && (d.type==='passport' || /^[A-Z]{2}$/.test(d.passport))); } catch {}
const documentName = d => `${name(d.country)} ${typeNames[d.type].toLowerCase()}`;
const save = () => {try {localStorage.setItem('portpass-wallet-v1', JSON.stringify(docs));} catch {}};
const badge = category => `<span class="badge" style="background:${C[category].color}33">${C[category].label}</span>`;
function renderWallet() {
  const active=R.activeDocuments(docs);
  $('#document-count').textContent=docs.length;
  $('#documents').innerHTML=docs.map(d=>`<div class="document ${d.type}"><span class="doc-symbol">${flag(d.country)}</span><div><strong>${escapeHTML(name(d.country))}</strong><small>${typeNames[d.type]}</small>${!active.includes(d)?'<small style="color:#a55b48">Expired or no active passport</small>':''}</div><button class="remove" data-remove="${escapeHTML(d.id)}" aria-label="Remove ${escapeHTML(documentName(d))}">×</button></div>`).join('');
}
function groups() {return mode==='visit' ? [{key:'easy',label:'Visa-free / document held',cats:['free','home','document','permit']},{key:'apply',label:'Arrival or online application',cats:['arrival','online']},{key:'required',label:'Visa required / restricted',cats:['required','restricted']}] : [{key:'rights',label:'Citizenship / EU rights',cats:['home','live']},{key:'permits',label:'Residence permit held',cats:['permit']},{key:'unknown',label:'Not assessed',cats:['unknown']}];}
function render() {
  if (!matrix) return;
  results=Object.fromEntries(countries.map(code=>[code,R.evaluate(code,docs,mode,matrix)]));
  renderWallet();
  const gs=groups();
  $('#stats').innerHTML=gs.map((g,i)=>`<div class="stat"><div class="stat-top">${g.label}<span class="stat-icon">${['↗','◷','⌁'][i]}</span></div><strong>${countries.filter(c=>g.cats.includes(results[c].category)).length}</strong><small>destinations</small></div>`).join('');
  $('#map-title').textContent=mode==='visit'?'Your travel possibilities':'Your residence possibilities';
  $('#map-subtitle').textContent=docs.length?'Select a country to explore':'Add a passport to reveal your possibilities';
  $('#results-heading').textContent=mode==='visit'?'Find your next somewhere.':'Find a place to put down roots.';
  const cats=mode==='visit'?['home','free','document','permit','arrival','online','required','restricted','unknown'].filter(c=>['free','document','arrival','online','required','unknown'].includes(c)||Object.values(results).some(r=>r.category===c)):['home','live','permit','unknown'];
  $('#legend').innerHTML=cats.map(c=>`<span><i class="dot" style="background:${C[c].color}"></i>${C[c].label}</span>`).join('');
  $('#filters').innerHTML=[{key:'all',label:'All destinations'},...gs].map(g=>`<button data-filter="${g.key}" class="${filter===g.key?'active':''}" aria-pressed="${filter===g.key}">${g.label}</button>`).join('');
  mapPaths?.attr('fill',f=>C[results[f.properties.code]?.category || 'unknown'].color);
  renderDestinations();
}
function renderDestinations() {
  const grouping=groups().find(g=>g.key===filter);
  const available=countries.filter(c=>(!grouping||grouping.cats.includes(results[c].category))&&(name(c).toLowerCase().includes(query)||c.toLowerCase()===query));
  available.sort((a,b)=>C[results[b].category].rank-C[results[a].category].rank || name(a).localeCompare(name(b)));
  $('#destination-list').innerHTML=available.slice(0,limit).map(code=>{
    const result=results[code];
    const caption=result.best ? (result.best.days ? `Up to ${result.best.days} days · ` : '')+documentName(result.best.document) : mode==='live'?'No residence route assessed':'Add a passport to see entry rules';
    return `<button class="destination-card" data-country="${code}"><div class="card-top"><span class="flag">${flag(code)}</span>${escapeHTML(name(code))}<span class="arrow">↗</span></div>${badge(result.category)}<small>${escapeHTML(caption)}</small></button>`;
  }).join('') || '<p class="empty">No destinations match this search. Try another name or filter.</p>';
  $('#show-more').hidden=available.length<=limit;
  $('#show-more').textContent=`Show more destinations (${available.length-limit} remaining) ↓`;
}
function showCountry(code, fallback) {
  const result=results[code] || {category:'unknown',routes:[]};
  $('#country-detail').innerHTML=`<div class="dialog-heading"><div><span class="detail-flag">${flag(code)}</span><h2>${escapeHTML(fallback || name(code))}</h2></div><button class="close" data-close="country-dialog" aria-label="Close">×</button></div>${badge(result.category)}<p>${mode==='visit'?'Your routes for a short visit.':'Your assessed residence routes.'} ${result.routes.length>1?'The strongest route is shown first.':''}</p>${result.routes.map(route=>`<article class="route"><h3>${escapeHTML(route.title)}${route.days?` · up to ${route.days} days`:''}</h3><p><strong>Using ${escapeHTML(documentName(route.document))}</strong></p><p>${escapeHTML(route.conditions)}</p>${route.source?`<a href="${route.source}" target="_blank" rel="noopener">${route.source===R.sources.passport?'Passport dataset · 17 Feb 2026':'Official EU guidance · reviewed 12 Sep 2026'} ↗</a>`:'<p>Based on your declared document; check its issuing authority.</p>'}</article>`).join('') || `<div class="route"><h3>${mode==='live'?'No residence rule assessed':'No entry route assessed'}</h3><p>${docs.length?'This destination or document combination is not covered. This does not mean you are ineligible.':'Add a valid passport to start exploring.'}</p></div>`}<p class="detail-note">Rules describe general routes, not a guarantee of admission. Confirm current entry rules, document validity and allowed activities with the destination’s authorities.</p>`;
  $('#country-dialog').showModal();
}
function drawMap() {
  svg=d3.select('#world-map');
  const projection=d3.geoNaturalEarth1().fitExtent([[18,18],[982,500]],{type:'FeatureCollection',features:geo.features.filter(f=>f.properties.code!=='AQ')});
  const path=d3.geoPath(projection), g=svg.append('g');
  g.append('path').datum(d3.geoGraticule10()).attr('class','graticule').attr('d',path);
  mapPaths=g.selectAll('.country').data(geo.features.filter(f=>f.properties.code!=='AQ')).join('path').attr('class','country').attr('d',path).attr('fill',C.unknown.color).attr('role','button').attr('tabindex',0).attr('aria-label',f=>`Explore ${f.properties.label}`)
    .on('click',(_,f)=>showCountry(f.properties.code,f.properties.label))
    .on('keydown',(e,f)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showCountry(f.properties.code,f.properties.label);}})
    .on('mousemove',(e,f)=>{const box=$('#map-container').getBoundingClientRect(), tip=$('#tooltip');tip.textContent=`${f.properties.label} · ${C[results[f.properties.code]?.category||'unknown'].label}`;tip.style.display='block';tip.style.left=`${Math.max(8,Math.min(e.clientX-box.left+12,box.width-205))}px`;tip.style.top=`${Math.max(8,e.clientY-box.top-42)}px`;})
    .on('mouseleave',()=>{$('#tooltip').style.display='none';});
  zoom=d3.zoom().scaleExtent([1,7]).translateExtent([[0,0],[1000,520]]).on('zoom',e=>{g.attr('transform',e.transform);$('#tooltip').style.display='none';});svg.call(zoom).on('dblclick.zoom',null);
  $('#zoom-in').onclick=()=>svg.call(zoom.scaleBy,1.5);$('#zoom-out').onclick=()=>svg.call(zoom.scaleBy,1/1.5);$('#reset-map').onclick=()=>svg.call(zoom.transform,d3.zoomIdentity);
}
function updateDocumentForm() {
  const type=$('#document-type').value, selection=$('#document-country').value;
  const options=type==='schengen'?countries.filter(c=>R.SCHENGEN.includes(c)):countries;
  $('#document-country').innerHTML=options.map(c=>`<option value="${c}">${escapeHTML(name(c))}</option>`).join('');
  if(options.includes(selection))$('#document-country').value=selection;
  $('#linked-label').hidden=type==='passport';
  $('#linked-passport').innerHTML=docs.filter(d=>d.type==='passport'&&(!d.expiry||d.expiry>=R.today())).map(d=>`<option value="${d.country}">${escapeHTML(name(d.country))} passport</option>`).join('');
  $('#linked-passport').required=type!=='passport';
}
function setMode(value) {mode=value;filter='all';limit=12;document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});render();}
document.addEventListener('click',e=>{
  const close=e.target.closest('[data-close]');if(close)$('#'+close.dataset.close).close();
  const remove=e.target.closest('[data-remove]');if(remove){docs=docs.filter(d=>d.id!==remove.dataset.remove);save();render();}
  const country=e.target.closest('[data-country]');if(country)showCountry(country.dataset.country);
  const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;limit=12;render();}
  const m=e.target.closest('[data-mode]');if(m)setMode(m.dataset.mode);
});
for(const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#add-document').onclick=()=>{if(!matrix)return;$('#document-form').reset();$('#form-error').textContent='';updateDocumentForm();$('#document-dialog').showModal();};
$('#document-type').onchange=updateDocumentForm;
$('#document-form').onsubmit=e=>{
  e.preventDefault();const type=$('#document-type').value,country=$('#document-country').value,expiry=$('#document-expiry').value,passport=$('#linked-passport').value;
  if(type!=='passport'&&!passport){$('#form-error').textContent='Add a valid passport first so we can link this document to it.';return;}
  if(docs.some(d=>d.type===type&&d.country===country&&(type==='passport'||d.passport===passport))){$('#form-error').textContent='This document is already in your wallet. Remove it first to update it.';return;}
  docs.push({id:crypto.randomUUID(),type,country,expiry,...(type==='passport'?{}:{passport})});save();render();$('#document-dialog').close();
};
$('#search').oninput=e=>{query=e.target.value.trim().toLowerCase();limit=12;if(matrix)renderDestinations();};
$('#show-more').onclick=()=>{limit+=24;renderDestinations();};
$('#explore-live').onclick=()=>setMode('live');
$('#sources-button').onclick=$('#coverage-button').onclick=()=>$('#sources-dialog').showModal();
async function init(){
  $('#stats').innerHTML='<p class="muted">Loading your world…</p>';
  try{
    const fetchJSON=async url=>{const response=await fetch(url);if(!response.ok)throw Error(`Could not load ${url}`);return response.json();};
    [matrix,geo]=await Promise.all([fetchJSON('data/passports.json'),fetchJSON('data/world.geojson')]);
    countries=Object.keys(matrix).sort((a,b)=>name(a).localeCompare(name(b)));
    docs=docs.filter(d=>countries.includes(d.country));
    geo.features.forEach(f=>{const p=f.properties;p.code=p.ISO_A2_EH!=='-99'?p.ISO_A2_EH:p.ISO_A2;p.label=/^[A-Z]{2}$/.test(p.code)?name(p.code):p.NAME;});
    drawMap();render();
  }catch(error){$('#stats').innerHTML='<p class="empty">We couldn’t load the map data. Serve this folder over HTTP and refresh to try again.</p>';$('#map-subtitle').textContent='Data unavailable';console.error(error);}
}
init();
