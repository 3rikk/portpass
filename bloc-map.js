/* A public membership map, independent of the visitor's wallet and results. */
(function (root) {
  const R = root.PortpassRules;
  const fromRule = (id, label, note) => {
    const rule = R.SETTLEMENT_BLOCS.find(bloc => bloc.id === id);
    return {id, label, members:[...new Set([...rule.members, ...rule.destinations])], source:rule.source, note:note || rule.conditions};
  };
  const catalogue = [
    {id:'eea', label:'EU / EEA', members:[...R.EEA,'AX'], source:R.sources.eea, note:'EU and EEA free movement has residence conditions and registration requirements. Liechtenstein applies residence quotas. Åland is included as Finnish territory.'},
    fromRule('mercosur','MERCOSUR Residence Agreement'),
    fromRule('csme','CARICOM · CSME'),
    fromRule('caricomEnhanced','CARICOM · enhanced free movement'),
    fromRule('gcc','Gulf Cooperation Council'),
    {...fromRule('nordic','Nordic Passport Union'), members:[...fromRule('nordic').members,'GL']},
    {id:'cta', label:'Common Travel Area', members:['GB','IE','GG','JE','IM'], source:R.sources.cta, note:'British and Irish citizens have CTA immigration rights. Crown Dependency housing, population and employment controls still apply. These territories are not separate passport nationalities.'},
    {id:'ttta', label:'Trans-Tasman Travel Arrangement', members:['AU','NZ'], source:R.sources.australia, note:'Australia and New Zealand have reciprocal arrangements with different visa and admission conditions. New Zealand citizens need a granted Australian Special Category visa; Australian citizens normally receive a resident visa on arrival in New Zealand.'},
    {id:'cofa', label:'Compacts of Free Association', members:['US','FM','MH','PW'], source:fromRule('cofaUS').source, note:'Three separate bilateral Compacts connect the US with Micronesia, the Marshall Islands and Palau. There is no all-to-all residence union between the Pacific states. Citizenship acquisition, admission and destination-specific residence rules require checking.'},
    fromRule('eaeu','Eurasian Economic Union'),
    fromRule('indiaNepal','India–Nepal'),
    fromRule('eac','East African Community'),
    fromRule('oecs','OECS Economic Union'),
    fromRule('benelux','Benelux Union'),
    fromRule('can','Andean Community'),
    fromRule('ecowas','ECOWAS'),
    fromRule('ca4','Central America Four'),
    fromRule('pacificAlliance','Pacific Alliance'),
    fromRule('cplp','Portuguese Language Countries · CPLP'),
    fromRule('asean','ASEAN'),
    fromRule('apec','APEC · business travel'),
    fromRule('africanPassport','African Union · passport initiative'),
    {id:'swiss', label:'EU–Switzerland agreement', members:[...R.EU,'CH','AX'], source:R.sources.swiss, note:'The agreement connects Switzerland with EU countries, with work, study or resources/insurance conditions and local residence procedures. Membership colouring shows the agreement’s geographic scope, not unconditional residence.'},
    {id:'efta', label:'EFTA Convention', members:R.EFTA, source:R.sources.efta, note:'EFTA arrangements cover Iceland, Liechtenstein, Norway and Switzerland. Residence conditions apply, including Liechtenstein’s quotas.'}
  ];
  // Stable colours across filters and themes. Names remain available for every swatch.
  const colours = ['#3478c4','#df6c32','#9768bb','#cf405c','#159987','#ca9c22',
    '#5566bd','#43a9be','#b94f96','#7c9136','#df8658','#5a9c63',
    '#8460d3','#b87c32','#ca5e79','#657d9b','#a74443','#469fa2',
    '#9b873d','#418761','#ad6c9c','#877461','#6652a3','#3c8092'];
  catalogue.forEach((bloc,i) => {bloc.colour=colours[i];});
  const memberships = country => catalogue.filter(bloc => bloc.members.includes(country));
  // Approximate marker positions for places omitted from Natural Earth's small-scale map.
  const points = {
    AG:[-61.8,17.1], AX:[20,60.2], BB:[-59.6,13.2], BH:[50.6,26], CV:[-24,16],
    DM:[-61.4,15.4], FM:[158.2,6.9], FO:[-6.8,62], GD:[-61.7,12.1], GG:[-2.6,49.5],
    HK:[114.2,22.3], IM:[-4.5,54.2], JE:[-2.1,49.2], KM:[43.3,-11.7], KN:[-62.7,17.3],
    LC:[-61,13.9], LI:[9.6,47.2], MH:[171.2,7.1], MT:[14.4,35.9], MU:[57.6,-20.2],
    PW:[134.5,7.5], SC:[55.5,-4.6], SG:[103.8,1.4], ST:[6.6,0.3], VC:[-61.2,13.2]
  };
  function init({features, name, flag, escapeHTML:esc}) {
    const $ = selector => document.querySelector(selector);
    const svg=d3.select('#bloc-map'), defs=svg.append('defs'), g=svg.append('g');
    const projection=d3.geoNaturalEarth1().fitExtent([[18,18],[982,500]],{type:'FeatureCollection',features:features.filter(f=>f.properties.code!=='AQ')});
    const path=d3.geoPath(projection);
    let active=false, selected=null;
    const patternIds=new Map();
    function fill(blocs) {
      if (!blocs.length) return 'var(--bloc-neutral)';
      if (blocs.length===1) return blocs[0].colour;
      const key=blocs.map(b=>b.id).join('-');
      if (!patternIds.has(key)) {
        const id='bloc-overlap-'+key;
        const stripeWidth=6, size=blocs.length*stripeWidth;
        const pattern=defs.append('pattern').attr('id',id).attr('patternUnits','userSpaceOnUse')
          .attr('width',size).attr('height',size).attr('patternTransform','rotate(40)');
        // Adjacent full-height bands form continuous diagonal stripes. Dashed
        // strokes produce a chequerboard as the SVG pattern repeats.
        blocs.forEach((bloc,i)=>pattern.append('rect').attr('x',i*stripeWidth).attr('width',stripeWidth)
          .attr('height',size).attr('fill',bloc.colour));
        patternIds.set(key,id);
      }
      return `url(#${patternIds.get(key)})`;
    }
    const visibleMemberships=code=>memberships(code).filter(bloc=>!selected||bloc.id===selected);
    function showCountry(code) {
      const blocs=memberships(code);
      $('#bloc-detail').innerHTML=`<div class="dialog-heading"><div><span class="detail-flag">${flag(code)}</span><h2 id="bloc-detail-title">${esc(name(code))}</h2></div><button class="close" data-close="bloc-detail-dialog" aria-label="Close">×</button></div><p>${blocs.length ? 'Supported agreements and initiatives covering this country or territory.' : 'No settlement bloc is mapped here in the current coverage.'}</p>${blocs.map(bloc=>`<article class="route"><h3><span class="bloc-swatch" style="--bloc-colour:${bloc.colour}"></span>${esc(bloc.label)}</h3><p>${esc(bloc.note)}</p><a href="${esc(bloc.source)}" target="_blank" rel="noopener">Official source ↗</a></article>`).join('')}`;
      $('#bloc-detail-dialog').showModal();
    }
    function tooltip(event, code) {
      const blocs=memberships(code);
      const tip=$('#bloc-tooltip'), container=$('#bloc-map-container').getBoundingClientRect();
      tip.textContent=name(code)+(blocs.length?' · '+blocs.map(b=>b.label).join(' · '):' · No mapped bloc');
      tip.style.display='block';
      const rect=event.currentTarget.getBoundingClientRect();
      const x=(event.clientX??rect.x+rect.width/2)-container.left;
      const y=(event.clientY??rect.y+rect.height/2)-container.top;
      tip.style.left=Math.max(8,Math.min(x+12,container.width-tip.offsetWidth-8))+'px';
      tip.style.top=Math.max(8,Math.min(y+12,container.height-tip.offsetHeight-8))+'px';
    }
    const hideTooltip=()=>{$('#bloc-tooltip').style.display='none';};
    const bind=selection=>selection.attr('role','button').attr('tabindex',0)
      .on('click',(_,f)=>showCountry(f.properties.code))
      .on('keydown',(event,f)=>{if(['Enter',' '].includes(event.key)){event.preventDefault();showCountry(f.properties.code);}})
      .on('mousemove',(event,f)=>tooltip(event,f.properties.code)).on('focus',(event,f)=>tooltip(event,f.properties.code))
      .on('mouseleave',hideTooltip).on('blur',hideTooltip);
    g.append('path').datum(d3.geoGraticule10()).attr('class','graticule').attr('d',path);
    const countries=bind(g.selectAll('.bloc-country').data(features.filter(f=>f.properties.code!=='AQ')).join('path')
      .attr('class','country bloc-country').attr('d',path).attr('data-country',f=>f.properties.code));
    const mapped=new Set(features.map(f=>f.properties.code));
    const markers=Object.entries(points).filter(([code])=>!mapped.has(code)).map(([code,coordinates])=>({properties:{code},coordinates}));
    const dots=bind(g.selectAll('.bloc-marker').data(markers).join('circle').attr('class','country bloc-marker')
      .attr('data-country',f=>f.properties.code).attr('cx',f=>projection(f.coordinates)[0]).attr('cy',f=>projection(f.coordinates)[1]).attr('r',3.5));
    const zoom=d3.zoom().scaleExtent([1,12]).translateExtent([[0,0],[1000,520]]).on('zoom',event=>{
      g.attr('transform',event.transform);dots.attr('r',3.5/Math.sqrt(event.transform.k));hideTooltip();
    });
    svg.call(zoom).on('dblclick.zoom',null);
    $('#bloc-zoom-in').onclick=()=>svg.call(zoom.scaleBy,1.5);
    $('#bloc-zoom-out').onclick=()=>svg.call(zoom.scaleBy,1/1.5);
    $('#bloc-reset').onclick=()=>svg.call(zoom.transform,d3.zoomIdentity);
    $('#bloc-key').innerHTML=catalogue.map(bloc=>`<button class="bloc-key-item" data-bloc="${bloc.id}" aria-pressed="false"><span class="bloc-swatch" style="--bloc-colour:${bloc.colour}"></span><span>${esc(bloc.label)}</span><small>${bloc.members.length}</small></button>`).join('');
    $('#bloc-key').addEventListener('click',event=>{const button=event.target.closest('[data-bloc]');if(button)select(selected===button.dataset.bloc?null:button.dataset.bloc);});
    $('#bloc-show-all').onclick=()=>select(null);
    function select(id) {
      selected=id;
      for (const shapes of [countries,dots]) shapes
        .attr('fill',f=>fill(visibleMemberships(f.properties.code)))
        .attr('stroke-dasharray',f=>visibleMemberships(f.properties.code).length>1?'3 2':null)
        .attr('aria-label',f=>`${name(f.properties.code)}: ${memberships(f.properties.code).map(b=>b.label).join(', ') || 'No mapped bloc'}`);
      $('#bloc-key').querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bloc===id)));
      $('#bloc-show-all').setAttribute('aria-pressed',String(!id));
      const bloc=catalogue.find(b=>b.id===id);
      $('#bloc-selection').innerHTML=bloc
        ? `<h3>${esc(bloc.label)}</h3><p>${esc(bloc.note)}</p><div class="bloc-members">${[...bloc.members].sort((a,b)=>name(a).localeCompare(name(b))).map(code=>`<button data-member="${code}">${flag(code)} ${esc(name(code))}</button>`).join('')}</div>`
        : `<p>Showing all ${catalogue.length} supported blocs and agreement groups. Solid colours indicate one bloc; dashed patterns combine every overlapping bloc’s colour. Uncoloured countries have no mapped membership.</p>`;
      hideTooltip();
    }
    $('#bloc-selection').addEventListener('click',event=>{const button=event.target.closest('[data-member]');if(button)showCountry(button.dataset.member);});
    function toggle(value) {
      active=value;document.body.classList.toggle('show-bloc-map',active);
      $('#bloc-view').hidden=!active;
      $('#bloc-map-button').setAttribute('aria-expanded',String(active));
      $('#bloc-map-button strong').textContent=active?'Your travel & residence map':'Settlement blocs';
      $('#bloc-map-button small').textContent=active?'Return to your saved documents and destinations':'Explore all supported blocs on a map';
      hideTooltip();$('#tooltip').style.display='none';
      if(active){$('#bloc-map-title').focus({preventScroll:true});$('#bloc-view').scrollIntoView({block:'start',behavior:'instant'});}
      else $('#bloc-map-button').focus({preventScroll:true});
    }
    $('#bloc-map-button').onclick=()=>toggle(!active);
    $('#bloc-back').onclick=()=>toggle(false);
    select(null);$('#bloc-map-button').disabled=false;
  }
  root.PortpassBlocMap={catalogue,memberships,init};
})(globalThis);
