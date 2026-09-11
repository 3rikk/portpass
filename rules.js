/* Pure rules engine: no DOM or network dependencies. */
(function (root) {
  const EU = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' ');
  const SCHENGEN = 'AT BE BG HR CZ DK EE FI FR DE GR HU IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO CH'.split(' ');
  const sources = {
    passport: 'https://github.com/imorte/passport-index-data',
    travel: 'https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-nationals/index_en.htm',
    residence: 'https://europa.eu/youreurope/citizens/residence/residence-rights/index_en.htm'
  };
  const categories = {
    free: { label: 'Visa-free', color: '#91b477', rank: 6 },
    document: { label: 'Document held', color: '#608e7c', rank: 5 },
    arrival: { label: 'Visa on arrival', color: '#d7c981', rank: 4 },
    online: { label: 'eVisa / ETA', color: '#a4bbc6', rank: 3 },
    required: { label: 'Visa required', color: '#dccac0', rank: 2 },
    restricted: { label: 'No admission reported', color: '#b99794', rank: 1 },
    home: { label: 'Citizenship', color: '#365d46', rank: 9 },
    live: { label: 'EU residence rights', color: '#91b477', rank: 8 },
    permit: { label: 'Residence permit held', color: '#608e7c', rank: 7 },
    unknown: { label: 'Not assessed', color: '#e4e8df', rank: 0 }
  };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  function activeDocuments(docs, date = today()) {
    const valid = docs.filter(d => !d.expiry || d.expiry >= date);
    return valid.filter(d => d.type === 'passport' || valid.some(p => p.type === 'passport' && p.country === d.passport));
  }
  function evaluate(destination, docs, mode, matrix, date) {
    const active = activeDocuments(docs, date), passports = active.filter(d => d.type === 'passport');
    const routes = [];
    const add = (category, document, title, conditions, source, days) => routes.push({category, document, title, conditions, source, days});
    for (const p of passports) {
      if (p.country === destination) {
        add('home', p, 'Country of citizenship', 'Travel with the documents required by your country of citizenship. National rules and individual restrictions can still apply.','');
        continue;
      }
      if (EU.includes(p.country) && EU.includes(destination)) {
        add(mode === 'live' ? 'live' : 'free', p, 'EU freedom of movement', 'A valid passport or national ID is required. For residence beyond three months, registration and conditions based on work, study or sufficient resources and health insurance may apply.', sources.residence);
        continue;
      }
      if (mode === 'live') continue;
      const rule = matrix[p.country]?.[destination];
      if (!rule) continue;
      const category = {'visa free':'free','visa on arrival':'arrival','eta':'online','e-visa':'online','visa required':'required','no admission':'restricted'}[rule.status];
      if (!category) continue;
      let conditions = {
        free: 'Tourist entry without a visa reported in the passport dataset. Arrival forms, onward travel, funds and passport-validity requirements may still apply.',
        arrival: 'Apply for a visa at an eligible arrival point. Fees, supporting documents and port restrictions may apply.',
        online: rule.status === 'eta' ? 'An electronic travel authorisation is required before travel. Eligibility and approval must be checked with the destination.' : 'Apply online and obtain the required eVisa before travel. Check eligible ports and permitted activities.',
        required: 'The passport dataset reports that a visa must be obtained before travel. Other exemptions may exist and are not comprehensively covered here.',
        restricted: 'The dataset reports no admission for this passport. Check current official restrictions; another document does not automatically remove them.'
      }[category];
      if (SCHENGEN.includes(destination) && category === 'free') conditions += ' Short stays generally share a limit of 90 days in any 180 days across Schengen, not per country.';
      add(category, p, rule.status === 'eta' ? 'Electronic travel authorisation' : categories[category].label, conditions, sources.passport, rule.days);
    }
    for (const d of active.filter(d => d.type !== 'passport')) {
      const baseline = matrix[d.passport]?.[destination];
      if (baseline?.status === 'no admission') continue;
      if (d.type === 'residence' && d.country === destination) {
        add('permit', d, 'Your residence permit', 'Based on the permit you entered. Residence, re-entry and work permissions depend on its category, validity and conditions. This is not an independent verification of your status.', '');
      } else if (mode === 'visit' && d.type === 'visa' && d.country === destination) {
        add('document', d, 'Your visitor visa', 'Use the passport linked to this visa. Check remaining entries, visa validity, permitted stay and purpose. Holding a visa does not guarantee admission.', '');
      } else if (mode === 'visit' && SCHENGEN.includes(destination) && (d.type === 'schengen' || (d.type === 'residence' && SCHENGEN.includes(d.country)))) {
        add('document', d, 'Schengen short-stay access', 'Up to 90 days in any 180-day period across the other Schengen countries. Carry your valid linked passport and document. A type C visa must cover this territory and have remaining entries and authorised days. This is not a right to live or work here.', sources.travel, 90);
      }
    }
    routes.sort((a,b) => categories[b.category].rank-categories[a.category].rank || (b.days || 0)-(a.days || 0));
    return {category: routes[0]?.category || 'unknown', best: routes[0], routes};
  }
  root.PortpassRules = { EU, SCHENGEN, sources, categories, activeDocuments, evaluate, today };
})(globalThis);
