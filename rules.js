/* Pure rules engine: no DOM or network dependencies. */
(function (root) {
  const EU = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' ');
  const EEA = [...EU, 'IS', 'LI', 'NO'];
  const EFTA = ['IS', 'LI', 'NO', 'CH'];
  const REVIEWED = '2026-09-12';
  const SCHENGEN = 'AT BE BG HR CZ DK EE FI FR DE GR HU IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO CH'.split(' ');
  const sources = {
    passport: 'https://github.com/imorte/passport-index-data',
    travel: 'https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-nationals/index_en.htm',
    residence: 'https://europa.eu/youreurope/citizens/residence/residence-rights/index_en.htm',
    cta: 'https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance',
    eea: 'https://www.efta.int/eea/policy-areas/persons',
    swiss: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=legissum%3Aem0025',
    swissResidence: 'https://www.sem.admin.ch/sem/en/home/themen/fza_schweiz-eu-efta/eu-efta_buerger_schweiz/faq.html',
    efta: 'https://www.efta.int/about-efta/legal-documents/efta-convention/short-overview-efta-convention',
    liechtenstein: 'https://www.llv.li/en/national-administration/migration-and-passport-office/residing-in-liechtenstein',
    visaWaiver: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02018R1806-20251230',
    visaPolicy: 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en',
    nauru: 'https://www.consilium.europa.eu/en/infographics/eu-visa-agreements-with-non-eu-countries/',
    brazil: 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing_en'
  };
  const categories = {
    free: { label: 'Visa-free', color: '#91b477', rank: 6 },
    document: { label: 'Document held', color: '#608e7c', rank: 5 },
    arrival: { label: 'Visa on arrival', color: '#d7c981', rank: 4 },
    online: { label: 'eVisa / ETA', color: '#a4bbc6', rank: 3 },
    required: { label: 'Visa required', color: '#dccac0', rank: 2 },
    restricted: { label: 'No admission reported', color: '#b99794', rank: 1 },
    home: { label: 'Citizenship', color: '#365d46', rank: 9 },
    live: { label: 'Treaty residence rights', color: '#91b477', rank: 8 },
    permit: { label: 'Residence permit held', color: '#608e7c', rank: 7 },
    conditional: { label: 'Check eligibility', color: '#c7b8d8', rank: 2.5 },
    unknown: { label: 'Not assessed', color: '#e4e8df', rank: 0 }
  };
  const sourceLabels = Object.fromEntries(Object.entries({
    passport:'Passport dataset · 17 Feb 2026', travel:'EU Schengen guidance', residence:'EU residence guidance',
    cta:'UK government · Common Travel Area', eea:'EFTA · EEA free movement', swiss:'EU–Swiss agreement',
    swissResidence:'Swiss migration authority', efta:'EFTA Convention', liechtenstein:'Liechtenstein migration authority',
    visaWaiver:'EU visa regulation · Annex II', visaPolicy:'European Commission · visa policy',
    nauru:'Council of the EU · visa agreements', brazil:'European Commission · border crossing'
  }).map(([key,label]) => [sources[key], label]));
  // Ordinary citizen passports only. Nauru's waiver is not yet applicable;
  // Vanuatu was removed. Do not infer reciprocal access outside Schengen.
  const VISA_WAIVER = 'AD AE AG AL AR AU BA BB BN BR BS CA CL CO CR DM FM GD GE GT HN IL JP KI KN KR LC MC MD ME MH MK MU MX MY NI NZ PA PE PW PY RS SB SC SG SM SV TL TO TT TV UA GB US UY VA VC VE WS HK MO TW XK'.split(' ');
  const BIOMETRIC = 'AL BA GE MD ME MK RS UA XK'.split(' ');
  function passportRequirement(country) {
    if (BIOMETRIC.includes(country)) return {key:'biometric', label:'Is this a biometric passport?', detail:'This visa waiver requires a biometric passport meeting ICAO standards.'};
    if (country === 'TW') return {key:'nationalId', label:'Does your passport include a national identity card number?', detail:'This visa waiver requires a Taiwanese passport containing a national identity card number. Do not enter the number here.'};
    if (country === 'HK' || country === 'MO') return {key:'sarPassport', label:'Is this a Special Administrative Region (SAR) passport?', detail:'This visa waiver requires the corresponding Hong Kong or Macao SAR passport.'};
    return null;
  }
  function movementAgreement(origin, destination) {
    if ((origin === 'GB' && destination === 'IE') || (origin === 'IE' && destination === 'GB')) return {
      title:'UK–Ireland Common Travel Area', source:sources.cta,
      conditions:'British and Irish citizens may visit, reside, work and study in the other country without an immigration visa or residence permission under the CTA. Carry proof of citizenship and check carrier requirements. These rights do not follow from holding a UK or Irish visa or residence permit; other British nationality classes are not assessed.'
    };
    if (destination === 'LI' && (EEA.includes(origin) || origin === 'CH')) return {
      title:'Liechtenstein residence quotas', source:sources.liechtenstein, quota:true,
      conditions:'Tourist visits of up to three months do not require a residence permit. Living here requires prior residence approval under Liechtenstein’s quota system, including for EEA and Swiss citizens. EEA applicants may have access to a permit lottery; Swiss applicants use the government allocation. Approval is not established by this passport.'
    };
    if (EEA.includes(origin) && EEA.includes(destination)) return {
      title:EU.includes(origin) && EU.includes(destination) ? 'EU freedom of movement' : 'EEA freedom of movement',
      source:EU.includes(origin) && EU.includes(destination) ? sources.residence : sources.eea,
      conditions:'Carry a valid passport or accepted national ID. Citizenship supports entry and residence under free-movement rules. Longer residence requires the applicable work, self-employment, study or sufficient-resources and health-insurance conditions; registration may be required. National restrictions and professional-qualification rules can still apply.'
    };
    if ((origin === 'CH' && EU.includes(destination)) || (EU.includes(origin) && destination === 'CH')) return {
      title:'EU–Switzerland free movement', source:destination === 'CH' ? sources.swissResidence : sources.swiss,
      conditions:'EU and Swiss citizens have reciprocal entry and residence rights under the agreement. Carry a valid passport or accepted ID. Residence depends on employment, self-employment or the applicable study/resources and insurance conditions. Register and obtain the required residence document; in Switzerland register before starting work. Holding an EU or Swiss residence permit alone does not grant these citizenship rights.'
    };
    if (EFTA.includes(origin) && EFTA.includes(destination)) return {
      title:'EFTA free movement', source:sources.efta,
      conditions:'EFTA citizenship supports entry and residence under the EFTA Convention. Carry a valid passport or accepted ID. Work, self-employment, study or sufficient-resources and insurance conditions apply, with local registration and residence-document requirements. A residence permit alone does not confer EFTA citizenship rights.'
    };
    return null;
  }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  function activeDocuments(docs, date = today()) {
    const valid = docs.filter(d => !d.expiry || d.expiry >= date);
    return valid.filter(d => d.type === 'passport' || valid.some(p => p.type === 'passport' && p.country === d.passport));
  }
  function evaluate(destination, docs, mode, matrix, date) {
    const active = activeDocuments(docs, date), passports = active.filter(d => d.type === 'passport');
    const routes = [];
    const add = (category, document, title, conditions, source, days) => routes.push({category, document, title, conditions, source, days, reviewed: source && source !== sources.passport ? REVIEWED : undefined});
    for (const p of passports) {
      if (p.country === destination) {
        add('home', p, 'Country of citizenship', 'Travel with the documents required by your country of citizenship. National rules and individual restrictions can still apply.','');
        continue;
      }
      const agreement = movementAgreement(p.country, destination);
      if (agreement) {
        const category = mode === 'live' ? (agreement.quota ? 'conditional' : 'live') : 'free';
        add(category, p, agreement.title, agreement.conditions, agreement.source);
        continue;
      }
      if (mode === 'live') continue;
      // A source-backed waiver replaces the dataset baseline for this corridor,
      // but never silently removes a reported nationality-specific restriction.
      if (SCHENGEN.includes(destination) && matrix[p.country]?.[destination]?.status !== 'no admission') {
        if (p.country === 'VU' || p.country === 'NR') {
          add('required', p, 'Schengen visa required', p.country === 'VU'
            ? 'Vanuatu is no longer covered by the EU visa waiver. Obtain a visa unless a separately assessed document exemption applies.'
            : 'The EU waiver for Nauru is conditional on a visa-waiver agreement that is not yet applicable. Obtain a visa unless a separately assessed document exemption applies.', p.country === 'VU' ? sources.visaPolicy : sources.nauru);
          continue;
        }
        if (VISA_WAIVER.includes(p.country)) {
          const requirement = passportRequirement(p.country);
          const confirmed = !requirement || p[requirement.key] === true;
          const denied = requirement && p[requirement.key] === false;
          const category = confirmed ? 'free' : denied ? 'required' : 'conditional';
          const stay = p.country === 'BR' && EU.includes(destination)
            ? 'The EU–Brazil ordinary-passport agreement uses a special three-month/six-month calculation from first entry; check the applicable calculation with the destination.'
            : 'Short stays share a maximum of 90 days in any rolling 180-day period across Schengen, not per destination.';
          const conditions = (requirement ? requirement.detail + (confirmed ? ' You confirmed this condition. ' : denied ? ' You indicated this condition is not met; a visa is required unless another exemption applies. ' : ' Confirm this in your passport details before treating the route as visa-free. ') : '')
            + stay + ' This is short-visit access, not residence or work permission. Ordinary passports only; check passport validity, purpose, funds, return travel and any travel-authorisation requirements in force on your travel date.';
          add(category, p, confirmed ? 'EU / Schengen visa waiver' : denied ? 'Passport does not meet visa-waiver conditions' : 'Visa waiver — passport check needed', conditions, p.country === 'BR' && EU.includes(destination) ? sources.brazil : sources.visaWaiver, confirmed && p.country !== 'BR' ? 90 : undefined);
          continue;
        }
      }
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
  root.PortpassRules = { EU, EEA, EFTA, SCHENGEN, REVIEWED, VISA_WAIVER, BIOMETRIC, sources, sourceLabels, categories, passportRequirement, movementAgreement, activeDocuments, evaluate, today };
})(globalThis);
