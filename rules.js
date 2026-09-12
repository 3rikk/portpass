/* Pure rules engine: no DOM or network dependencies. */
(function (root) {
  const EU = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' ');
  const EEA = [...EU, 'IS', 'LI', 'NO'];
  const EFTA = ['IS', 'LI', 'NO', 'CH'];
  const REVIEWED = '2026-09-12';
  const SCHENGEN = 'AT BE BG HR CZ DK EE FI FR DE GR HU IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO CH'.split(' ');
  const BOTC_TERRITORIES = ['GI','FK','BM','KY'];
  const EXTRA_DESTINATIONS = ['GL',...BOTC_TERRITORIES];
  const passportCodes = matrix => [...new Set([...Object.keys(matrix),...BOTC_TERRITORIES])];
  const NORDIC = ['DK','FI','IS','NO','SE'];
  const destinationCodes = matrix => [...new Set([...Object.keys(matrix), ...EXTRA_DESTINATIONS])];
  const sources = {
    associationWorker: 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A61995CJ0386',
    associationFamily: 'https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A62003CJ0373',
    associationChild: 'https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A61997CJ0210',
    associationNL: 'https://ind.nl/en/turkish-citizens-and-living-in-the-netherlands',
    associationUK: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-ecaa-extension-of-stay',
    botc: 'https://www.gov.uk/government/publications/british-overseas-territories-citizens/british-overseas-territories-citizens-accessible-version',
    botcEta: 'https://www.gov.uk/eta/when-not-need-eta',
    gibraltar: 'https://www.gibraltar.gov.gi/press-releases/technical-notice-reminder-concerning-visa-arrangements-5582026-12201',
    gibraltarUK: 'https://www.gov.uk/foreign-travel-advice/gibraltar/entry-requirements',
    gibraltarResidence: 'https://www.gibraltar.gov.gi/press-releases/government-launches-new-residency-portal-as-new-residency-regulations-come-into-force-5542026-12197',
    falklands: 'https://www.gov.fk/customs/visitor-permit/',
    falklandsResidence: 'https://www.gov.fk/customs/work-permit/',
    falklandsStatus: 'https://www.customs.gov.fk/news/47-immigration-amendments-2021-faqs',
    bermuda: 'https://www.gov.uk/foreign-travel-advice/bermuda/entry-requirements',
    bermudaResidence: 'https://www2.gov.bm/department/immigration',
    cayman: 'https://www.gov.uk/foreign-travel-advice/cayman-islands/entry-requirements',
    caymanResidence: 'https://otp.gov.ky/web/govky/immigration',
    china: 'https://gb.china-embassy.gov.cn/eng/visa/notice/202602/t20260216_11860580.htm',
    canada: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/entry-requirements-country.html',
    australia: 'https://immi.homeaffairs.gov.au/Visa-subsite/Pages/other-visas/444-special-category-visa.aspx',
    newZealand: 'https://www.immigration.govt.nz/visit/what-you-need-to-visit-new-zealand/australian-citizens-and-permanent-residents-travelling-to-new-zealand/',
    greenland: 'https://www.nyidanmark.dk/en-GB/You-want-to-apply/Short-stay-visa/Visa-to-the-Faroe-Island-or-Greenland',
    albania: 'https://punetejashtme.gov.al/en/regjimi-i-vizave-per-te-huajt/',
    serbia: 'https://www.mfa.rs/en/citizens/travel-serbia/visa-requirements',
    montenegro: 'https://www.gov.me/en/article/visas',
    mexico: 'https://consulmex.sre.gob.mx/denver/index.php/visasparapersonasextranjeras',
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
    associationWorker:'CJEU · Turkish worker rights', associationFamily:'CJEU · Turkish worker family rights',
    associationChild:'CJEU · vocationally trained children', associationNL:'IND · EU–Turkey association rules', associationUK:'UK · ECAA extension rules',
    botc:'HM Passport Office · BOTC status', botcEta:'UK government · ETA exemptions',
    gibraltar:'Gibraltar · July 2026 entry arrangements', gibraltarUK:'GOV.UK · Gibraltar entry', gibraltarResidence:'Gibraltar · residency framework',
    falklands:'Falklands · visitor permits', falklandsResidence:'Falklands · work permits', falklandsStatus:'Falklands · right of abode',
    bermuda:'GOV.UK · Bermuda entry', bermudaResidence:'Bermuda · immigration', cayman:'GOV.UK · Cayman entry', caymanResidence:'Cayman · immigration',
    china:'Chinese embassy · UK and Canada waiver', canada:'Canada · entry requirements',
    australia:'Australia · Special Category visa', newZealand:'Immigration New Zealand',
    greenland:'Danish Immigration Service · Greenland', albania:'Albania · foreign ministry',
    serbia:'Serbia · foreign ministry', montenegro:'Montenegro · government', mexico:'Mexican consulate · entry requirements',
    passport:'Passport dataset · 17 Feb 2026', travel:'EU Schengen guidance', residence:'EU residence guidance',
    cta:'UK government · Common Travel Area', eea:'EFTA · EEA free movement', swiss:'EU–Swiss agreement',
    swissResidence:'Swiss migration authority', efta:'EFTA Convention', liechtenstein:'Liechtenstein migration authority',
    visaWaiver:'EU visa regulation · Annex II', visaPolicy:'European Commission · visa policy',
    nauru:'Council of the EU · visa agreements', brazil:'European Commission · border crossing'
  }).map(([key,label]) => [sources[key], label]));
  // Ordinary citizen passports only. Nauru's waiver is not yet applicable;
  // Vanuatu was removed. Do not infer reciprocal access outside Schengen.
  const VISA_WAIVER = 'AD AE AG AL AR AU BA BB BN BR BS CA CL CO CR DM FM GD GE GT HN IL JP KI KN KR LC MC MD ME MH MK MU MX MY NI NZ PA PE PW PY RS SB SC SG SM SV TL TO TT TV UA GB US UY VA VC VE WS HK MO TW XK'.split(' ');
  const FALKLANDS_VISA_REQUIRED = 'AF AL DZ AO AM AZ BD BY BJ BT BO BA BF BI KH CM CV CF TD CN CO KM CG CI CU CD DJ DM DO EC EG SV GQ ER SZ ET FJ GA GM GE GH GN GW HT HN IN ID IR IQ JM JO KZ KE KP XK KG LA LB LS LR LY MG MW ML MR MD MN ME MA MZ MM NA NP NE NG MK PK PH RU RW ST SN RS SL SO ZA SS LK SD SR SY TJ TZ TH TL TG TT TN TR TM UG UA UZ VU VE VN YE ZM ZW'.split(' ');
  const TERRITORY_RESIDENCE = {
    GI: {source:sources.gibraltarResidence, conditions:'Residence requires approval under Gibraltar’s residency framework unless you hold an applicable local exemption. British citizenship or another territory’s BOTC status does not establish eligibility. Check employment, accommodation and the applicable application category.'},
    FK: {source:sources.falklandsResidence, conditions:'Without local right of abode, living and working requires the appropriate permission. An employer-sponsored work permit is normally applied for from outside the Falklands, with accommodation, medical and criminal-record checks. Visitor permission does not authorise employment.'},
    BM: {source:sources.bermudaResidence, conditions:'Check Bermudian status, a Permanent Resident’s Certificate or the relevant residence/work permission. A BOTC passport alone does not verify Bermudian status. Employment normally requires an approved work permit.'},
    KY: {source:sources.caymanResidence, conditions:'Check the Right to be Caymanian, residence permission or a Residency and Employment Rights Certificate. A BOTC passport alone does not verify Caymanian status. Work permission depends on your immigration category.'}
  };
  const BIOMETRIC = 'AL BA GE MD ME MK RS UA XK'.split(' ');
  function passportRequirement(country) {
    if (BOTC_TERRITORIES.includes(country)) return {key:'localStatus', label:'Do you hold documented local right of abode or unrestricted residence status in this territory?', detail:'Choose this territory only for British Overseas Territories Citizen (BOTC) nationality. For British-citizen nationality choose United Kingdom, regardless of where a passport was issued. Local residence rights require their own status or exemption; BOTC status alone is not confirmation.'};
    if (BIOMETRIC.includes(country)) return {key:'biometric', label:'Is this a biometric passport?', detail:'This visa waiver requires a biometric passport meeting ICAO standards.'};
    if (country === 'TW') return {key:'nationalId', label:'Does your passport include a national identity card number?', detail:'This visa waiver requires a Taiwanese passport containing a national identity card number. Do not enter the number here.'};
    if (country === 'HK' || country === 'MO') return {key:'sarPassport', label:'Is this a Special Administrative Region (SAR) passport?', detail:'This visa waiver requires the corresponding Hong Kong or Macao SAR passport.'};
    return null;
  }
  function movementAgreement(origin, destination) {
    if (destination === 'GL' && NORDIC.includes(origin)) return {
      title:'Nordic citizens in Greenland', source:sources.greenland,
      conditions:'Nordic citizens may enter, reside and work in Greenland without a visa or residence permit. Carry accepted identity documents and check carrier requirements. Greenland is outside EU free movement and Schengen.'
    };
    if (origin === 'NZ' && destination === 'AU') return {
      title:'Trans-Tasman Travel Arrangement (TTTA)', source:sources.australia, visitCategory:'arrival',
      conditions:'New Zealand citizens can apply on arrival for a Special Category visa (subclass 444), allowing residence, work and study. Carry a valid New Zealand passport and meet health and character requirements. This is a temporary visa, not Australian permanent residence; it normally ends on departure and must be granted again on re-entry.'
    };
    if (origin === 'AU' && destination === 'NZ') return {
      title:'Trans-Tasman Travel Arrangement (TTTA)', source:sources.newZealand,
      conditions:'Australian citizens normally receive an Australian Resident Visa on arrival, allowing residence, work and study. Carry a valid Australian passport, complete the New Zealand Traveller Declaration and meet character requirements. No advance visa or NZeTA is required. Check travel conditions before leaving New Zealand to preserve resident status.'
    };
    if ((origin === 'GB' && destination === 'IE') || (origin === 'IE' && destination === 'GB')) return {
      title:'UK–Ireland Common Travel Area', source:sources.cta,
      conditions:'British and Irish citizens may visit, reside, work and study in the other country without an immigration visa or residence permission under the CTA. Carry proof of citizenship and check carrier requirements. These rights do not follow from holding a UK or Irish visa or residence permit; BOTC status alone does not confer these CTA rights.'
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
  // Declared qualifying stages, not a calculation from permit age or nationality.
  const ASSOCIATION_ROUTES = {
    worker1: {label:'Worker · at least 1 qualifying year', turkish:true, source:sources.associationWorker, conditions:'At least one year of lawful, genuine employment with the same employer in this country, with a job still available there: renewal for that employer.'},
    worker3: {label:'Worker · at least 3 qualifying years', turkish:true, source:sources.associationWorker, conditions:'Three years of lawful employment with the same employer in this country: access to another registered job offer in the same occupation, subject to EU-worker priority.'},
    worker4: {label:'Worker · at least 4 qualifying years', turkish:true, source:sources.associationWorker, conditions:'Four years of qualifying lawful employment in this country, with the required employment continuity and earlier employer/occupation restrictions respected: access to any paid employment here.'},
    family3: {label:'Family member · at least 3 qualifying years', source:sources.associationFamily, conditions:'You were authorised to join a Turkish worker belonging to this country’s lawful labour force and completed three qualifying years of legal family residence, normally living together during the initial period. Employment access is subject to EU-worker priority.'},
    family5: {label:'Family member · at least 5 qualifying years', source:sources.associationFamily, conditions:'You were authorised to join a Turkish worker belonging to this country’s lawful labour force, met the initial family-residence conditions and completed five qualifying years of legal residence here. This supports access to any paid employment here.'},
    child: {label:'Child · vocational training completed here', source:sources.associationChild, conditions:'You are the child of a Turkish worker, completed vocational training in this country, and a parent completed at least three years of legal employment here. Article 7 supports responding to any employment offer here, irrespective of the child’s residence duration.'},
    selfEmployedNL: {label:'Netherlands · self-employed application', turkish:true, application:true, source:sources.associationNL, conditions:'Turkish self-employed applicants are exempt from the Dutch points system, but still need an approved application and a business plan demonstrating essential Dutch economic interest. This is not automatic establishment or residence permission.'},
    ukWorker3: {label:'UK · existing ECAA worker, 3 years', turkish:true, application:true, source:sources.associationUK, conditions:'You are in the UK, already hold ECAA worker permission, completed at least three lawful years with the same employer, and will remain employed under a paid contract. Extension requires approval; work remains employer/occupation restricted below four years.'},
    ukWorker4: {label:'UK · existing ECAA worker, 4 years', turkish:true, application:true, source:sources.associationUK, conditions:'You are in the UK with existing ECAA worker permission and four lawful employment years, including three with the same employer and the remainder in the same occupation. Continuing paid employment and extension approval are required.'},
    ukBusiness: {label:'UK · existing ECAA businessperson', turkish:true, application:true, source:sources.associationUK, conditions:'You are in the UK with existing ECAA businessperson permission. Extension requires a genuine viable business, adequate investment, maintenance and supporting evidence. This is not a new business-entry route.'},
    ukFamily: {label:'UK · existing ECAA dependant', application:true, source:sources.associationUK, conditions:'Extension depends on the sponsor’s ECAA position and the partner/child requirements. Partners must already hold ECAA dependant permission in the UK. Separate dependent-child entry-clearance rules are not assessed here.'}
  };
  for (const key of ['worker1','worker3','worker4']) ASSOCIATION_ROUTES[key].conditions += ' You remain part of this country’s lawful labour force and have not lost these rights; the work must be genuine and effective.';
  function associationOptions(country) {
    return Object.entries(ASSOCIATION_ROUTES).filter(([key]) => country === 'GB' ? key.startsWith('uk') : EU.includes(country) && !key.startsWith('uk') && (key !== 'selfEmployedNL' || country === 'NL'));
  }
  function validateAssociation(d) {
    if (d.associationRoute === undefined && d.associationConfirmed === undefined) return null;
    if (d.type !== 'residence' || !associationOptions(d.country).some(([key]) => key === d.associationRoute)) return 'Choose a supported Turkish association route for this residence country.';
    if (d.associationConfirmed !== undefined && typeof d.associationConfirmed !== 'boolean') return 'Association confirmation must be yes, no or unconfirmed.';
    return null;
  }
  function associationAssessment(d, active) {
    if (!d.associationRoute || validateAssociation(d)) return null;
    const rule = ASSOCIATION_ROUTES[d.associationRoute];
    const nationality = !rule.turkish || active.some(p => ['passport','citizenship'].includes(p.type) && p.country === 'TR');
    const confirmed = d.associationConfirmed === true && nationality;
    let conditions = rule.conditions;
    if (!nationality) conditions += ' Turkish nationality is not established by the current wallet; record it before relying on this worker/business route.';
    else if (!confirmed) conditions += d.associationConfirmed === false ? ' You indicated that the qualifying conditions are not met.' : ' Confirm all qualifying conditions in this residence entry before relying on this stage.';
    else conditions += ' You confirmed these conditions; this is based on your declaration, not an official status determination.';
    if (!rule.application) conditions += ' Associated residence rights apply only in this host country. Retention, interruptions, absences and public-policy restrictions require checking; obtain or renew the applicable residence document. No automatic first entry, settlement or residence in another country is granted.';
    if (d.country === 'NL' && d.associationRoute.startsWith('worker')) conditions += ' Dutch rules can be more favourable: check IND guidance on the TWV exemption after three years with the same employer.';
    return {category:confirmed && !rule.application ? 'live' : 'conditional', title:'Turkish association · ' + rule.label, conditions, source:rule.source};
  }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  function activeDocuments(docs, date = today()) {
    const valid = docs.filter(d => d.type === 'citizenship' || (!d.expiry || d.expiry >= date) && (!d.validFrom || d.validFrom <= date));
    return valid.filter(d => ['passport','citizenship'].includes(d.type) || valid.some(p => p.type === 'passport' && p.country === d.passport));
  }
  function evaluate(destination, docs, mode, matrix, date = today()) {
    const active = activeDocuments(docs, date), passports = active.filter(d => d.type === 'passport');
    const routes = [];
    const add = (category, document, title, conditions, source, days, substituted = false) => {
      const timing = !substituted && category === 'document' && root.PortpassVisaTime?.isVisa(document) ? root.PortpassVisaTime.summary(document, docs, matrix, date) : null;
      if (timing) {
        days = timing.limit.unit === 'days' ? timing.limit.value ?? undefined : undefined;
        if (['exhausted','invalid'].includes(timing.state)) {
          category = 'conditional';
          conditions += ' Your recorded visa allowance is used up or the timing details need checking; verify permission before travelling.';
        }
        if (timing.limit.assumed) conditions += ' The displayed stay allowance is assumed; check your issued visa.';
      }
      routes.push({category, document, title, conditions, source, days, timing, reviewed: source && source !== sources.passport ? REVIEWED : undefined});
    };
    if (mode === 'live') for (const citizen of active.filter(d => d.type === 'citizenship' && d.country === destination)) {
      if (BOTC_TERRITORIES.includes(citizen.country)) {
        add(citizen.localStatus === true ? 'home' : 'conditional', citizen, 'BOTC and local residence status', 'BOTC nationality is distinct from local immigration status. ' + (citizen.localStatus === true ? 'You declared documented local right of abode or unrestricted residence status. Carry the evidence; conditions and work rights depend on that status.' : TERRITORY_RESIDENCE[destination].conditions), TERRITORY_RESIDENCE[destination].source);
        continue;
      }
      add('home', citizen, 'Country of citizenship', 'Residence in your country of citizenship. This entry does not represent a passport and does not add travel access or assessed residence routes abroad.', '');
    }
    for (const p of passports) {
      const botc = BOTC_TERRITORIES.includes(p.country);
      const restricted = matrix[p.country]?.[destination]?.status === 'no admission';
      if (botc && p.country === destination && !restricted) {
        if (p.localStatus === true) {
          add('home', p, 'Documented local residence status', 'You declared local right of abode or unrestricted residence status in this territory. Carry proof of that status with your BOTC passport. This does not establish rights in the UK or another territory; work rights depend on your local status.', TERRITORY_RESIDENCE[destination].source);
          continue;
        }
        if (mode === 'visit') add('conditional', p, 'Local entry status needs checking', 'A BOTC passport alone does not verify unrestricted local entry. Check your local status or the visitor requirements before travel.', TERRITORY_RESIDENCE[destination].source);
      }
      if (BOTC_TERRITORIES.includes(destination) && mode === 'live') {
        if (!restricted) add('conditional', p, 'Territory residence approval', TERRITORY_RESIDENCE[destination].conditions, TERRITORY_RESIDENCE[destination].source);
        continue;
      }
      if (botc && destination === 'GB' && !restricted) {
        if (mode === 'live') add('conditional', p, 'UK residence requires separate entitlement', 'BOTC status alone does not give UK right of abode or work rights. Add a British citizenship entry or British citizen passport if you also hold that nationality; otherwise check the appropriate UK immigration permission.', sources.botc);
        else {
          add('free', p, 'BOTC visitor access to the UK', 'BOTC passport holders may visit for up to six months without a visa. Admission remains subject to visitor conditions; this is not residence or work permission.', sources.botc);
          add('free', p, 'BOTC passport ETA exemption', 'A BOTC passport is exempt from the UK ETA requirement. This exemption does not establish UK citizenship or right of abode.', sources.botcEta);
        }
        continue;
      }
      if (mode === 'visit' && !restricted) {
        if (botc && destination === 'CA') {
          add('online', p, 'BOTC travel to Canada', 'For BOTCs connected to this territory, an eTA is required for air travel. Ordinary land/sea arrivals do not need an eTA, except the specified Saint-Pierre-et-Miquelon sea route. Carry a valid passport; visitor admission does not grant residence or work rights.', sources.canada);
          continue;
        }
        if (destination === 'FK' && (botc || Object.hasOwn(matrix,p.country))) {
          const needsVisa = FALKLANDS_VISA_REQUIRED.includes(p.country);
          add(needsVisa ? 'required' : 'free', p, needsVisa ? 'Falkland Islands visa required' : 'Falkland Islands visitor permit on arrival', 'A visitor permit normally allows one calendar month on arrival. Bring onward travel, accommodation, sufficient funds and medical evacuation insurance. Apply ahead for longer visits; employment is prohibited.' + (needsVisa ? ' Your passport nationality also requires a visa before travel.' : ''), sources.falklands);
          continue;
        }
        if (destination === 'GI' && p.country === 'GB') {
          add('free', p, 'British citizen visits to Gibraltar', 'British citizen passport holders may visit for up to 90 days without a visa. Residence and employment require separate eligibility.', sources.gibraltarUK, 90);
          continue;
        }
        if (destination === 'GI' && date >= '2026-07-15') {
          const requirement = !botc && passportRequirement(p.country);
          const eligible = [...EEA,'CH',...VISA_WAIVER,'NR'].includes(p.country);
          const category = botc || (eligible && requirement && p[requirement.key] !== true && p[requirement.key] !== false) ? 'conditional' : eligible && (!requirement || p[requirement.key] === true) ? 'free' : 'required';
          add(category, p, 'Gibraltar short-visit entry arrangements', 'From 15 July 2026 Gibraltar recognises Schengen short-stay visas and applies revised short-visit rules. Check the applicable 90/180-day calculation and passport conditions. BOTC-only holders should verify their nationality class or local exemption with Gibraltar; British-citizen exemptions are not assumed.' + (requirement ? ' ' + requirement.detail : ''), sources.gibraltar, category === 'free' ? 90 : undefined);
          continue;
        }
        if (p.country === 'GB' && ['BM','KY'].includes(destination)) {
          add('free', p, 'British citizen visitor access', destination === 'BM' ? 'Visits are visa-free for up to 180 days in any 12 months. Carry return/onward travel. Obtain a job offer and work permit before entering to work; do not seek work as a tourist.' : 'Visits for tourism or business are visa-free for up to six calendar months. Work, study and residence require separate permission.', destination === 'BM' ? sources.bermuda : sources.cayman, destination === 'BM' ? 180 : undefined);
          continue;
        }
      }
      if (p.country === destination && !botc) {
        add('home', p, 'Country of citizenship', 'Travel with the documents required by your country of citizenship. National rules and individual restrictions can still apply.','');
        continue;
      }
      const agreement = matrix[p.country]?.[destination]?.status === 'no admission' ? null : movementAgreement(p.country, destination);
      if (agreement) {
        const category = mode === 'live' ? (agreement.quota ? 'conditional' : 'live') : (agreement.visitCategory || 'free');
        add(category, p, agreement.title, agreement.conditions, agreement.source);
        continue;
      }
      if (mode === 'live') {
        if (!restricted && p.country === 'TR' && (EU.includes(destination) || destination === 'GB')) {
          add('conditional', p, destination === 'GB' ? 'UK ECAA · existing holders only' : 'EU–Turkey association · qualifying history required', destination === 'GB'
            ? 'Existing ECAA workers, businesspersons and eligible dependants may seek extensions under the UK rules. A Turkish passport alone does not establish an ECAA route. Record existing UK residence permission and the applicable ECAA stage; new dependent-child applications have separate rules.'
            : 'Association rights can arise from qualifying lawful employment or family residence in this country. A Turkish passport alone does not establish them. Edit a residence-permit entry to record your qualifying stage. This does not grant first entry or EU-wide freedom of movement.', destination === 'GB' ? sources.associationUK : sources.associationWorker);
          if (destination === 'NL') add('conditional', p, 'Netherlands · Turkish self-employed application', ASSOCIATION_ROUTES.selfEmployedNL.conditions, sources.associationNL);
        }
        continue;
      }
      if (destination === 'CN' && ['GB','CA'].includes(p.country) && matrix[p.country]?.CN?.status !== 'no admission') {
        const inWindow = date >= '2026-02-17' && date <= '2026-12-31';
        if (inWindow || date > '2026-12-31') {
          add(inWindow ? 'free' : 'conditional', p, inWindow ? 'China ordinary-passport visa waiver' : 'China visa waiver needs rechecking',
            'UK and Canadian ordinary passports qualify for visits of up to 30 days for tourism, business, family/friends, exchanges or transit for entry from 17 February through 31 December 2026 (Beijing time). Other purposes require the appropriate visa.' + (inWindow ? '' : ' This published waiver period has ended; check for an extension or obtain a visa.'), sources.china, inWindow ? 30 : undefined);
          continue;
        }
      }
      if (destination === 'GL' && matrix[p.country]?.GL?.status !== 'no admission') {
        const eligible = botc || [...EEA,'CH',...VISA_WAIVER].includes(p.country);
        const requirement = botc ? null : passportRequirement(p.country);
        const confirmed = !requirement || p[requirement.key] === true;
        const category = !eligible || (requirement && p[requirement.key] === false) ? 'required' : confirmed ? 'free' : 'conditional';
        add(category, p, category === 'free' ? 'Greenland short-visit visa waiver' : 'Greenland entry requirements',
          'Greenland is outside Schengen. Nationals exempt from a Danish visa may visit for up to 90 days; passport-specific waiver conditions still apply. Otherwise obtain a visa explicitly valid for Greenland. A Danish or Schengen visitor visa alone is insufficient. Check any transit visa needed for the journey.' + (requirement ? ' ' + requirement.detail : ''), sources.greenland, category === 'free' ? 90 : undefined);
        continue;
      }
      // A source-backed waiver replaces the dataset baseline for this corridor,
      // but never silently removes a reported nationality-specific restriction.
      if (SCHENGEN.includes(destination) && matrix[p.country]?.[destination]?.status !== 'no admission') {
        if (p.country === 'VU' || p.country === 'NR') {
          add('required', p, 'Schengen visa required', p.country === 'VU'
            ? 'Vanuatu is no longer covered by the EU visa waiver. Obtain a visa unless a separately assessed document exemption applies.'
            : 'The EU waiver for Nauru is conditional on a visa-waiver agreement that is not yet applicable. Obtain a visa unless a separately assessed document exemption applies.', p.country === 'VU' ? sources.visaPolicy : sources.nauru);
          continue;
        }
        if (botc || VISA_WAIVER.includes(p.country)) {
          const requirement = botc ? null : passportRequirement(p.country);
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
      if (botc && !restricted) continue;
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
      if (mode === 'live' && d.country === destination) {
        const association = associationAssessment(d, active);
        if (association) add(association.category, d, association.title, association.conditions, association.source);
      }
      const residence = d.type === 'residence';
      const schengenVisa = d.type === 'schengen' && SCHENGEN.includes(d.country);
      const visa = d.type === 'visa' || schengenVisa;
      const exemption = (title, conditions, source, days, checks = []) => {
        if (checks.some(key => d[key] === false)) return;
        const confirmed = checks.every(key => d[key] === true);
        add(confirmed ? 'document' : 'conditional', d, title, conditions + (confirmed ? '' : ' Confirm the required document conditions in your wallet before relying on this exemption.') + ' Short visits only; no residence or work rights. Carry your valid passport and qualifying document.', source, confirmed ? days : undefined, true);
      };
      if (residence && d.country === 'AU' && destination === 'NZ' && d.permanent !== false) {
        add('conditional', d, 'Australian permanent resident route to New Zealand', 'Requires a current Australian permanent resident or resident return visa, valid return travel conditions and good character. Normally obtain an NZeTA before travel and apply for an Australian Resident Visa on arrival to live, work or study. A temporary Australian permit does not qualify. Confirm permanent status in your wallet and check return conditions.', sources.newZealand);
      }
      if (mode === 'visit') {
        if (date >= '2026-07-15' && destination === 'GI' && (schengenVisa || (residence && SCHENGEN.includes(d.country)))) exemption('Gibraltar access with a Schengen document', 'Gibraltar recognises valid Schengen short-stay visas and qualifying Schengen residence permits under its July 2026 arrangements. Check territory coverage, remaining entries and the applicable 90/180-day stay calculation.', sources.gibraltar, 90);
        if (date >= '2026-07-15' && SCHENGEN.includes(destination) && residence && d.country === 'GI') exemption('Gibraltar resident short-visit access', 'The July 2026 Gibraltar arrangements provide short-visit access for legal Gibraltar residents. Carry the recognised residence document and passport; verify the applicable 90/180-day allowance.', sources.gibraltar, 90);
        if (destination === 'CA' && residence && d.country === 'US') exemption('US green card exemption', 'US lawful permanent residents need neither a visitor visa nor an eTA. A valid passport and green card (or accepted proof of status) are required for air travel; direct land/water arrivals from the US or Saint-Pierre-et-Miquelon can use proof of status alone.', sources.canada, undefined, ['permanent']);
        if (destination === 'MX' && residence && ['US','CA','JP','GB',...SCHENGEN].includes(d.country)) exemption('Permanent resident exemption for Mexico', 'Requires proof of permanent residence, not a temporary residence permit. Admission is for tourism, transit or other non-remunerated visits; the border officer determines the stay.', sources.mexico, undefined, ['permanent']);
        if (destination === 'AL') {
          if (schengenVisa) exemption('Schengen visa exemption for Albania', 'Requires a valid multiple-entry Schengen visa previously used in Schengen. Check the permitted stay and the document-expiry departure deadline with Albania.', sources.albania, undefined, ['multipleEntry','previouslyUsed']);
          else if (residence && SCHENGEN.includes(d.country)) exemption('Schengen residence exemption for Albania', 'Requires a valid Schengen residence permit. Check the permitted stay and the document-expiry departure deadline with Albania.', sources.albania);
          else if ((residence || visa) && [...EU,'US','GB'].includes(d.country)) exemption('Third-country document exemption for Albania', 'Requires a valid EU, US or UK residence permit or multiple-entry visa previously used in the issuing country. Check the permitted stay and document-expiry departure deadline.', sources.albania, undefined, residence ? ['previouslyUsed'] : ['multipleEntry','previouslyUsed']);
        }
        if (destination === 'RS' && ((visa && (schengenVisa || [...EU,'GB','US'].includes(d.country))) || (residence && [...SCHENGEN,...EU,'US'].includes(d.country)))) exemption('Third-country document exemption for Serbia', 'Up to 90 days during six months, within the validity of the qualifying visa or residence permit. National passports only; emergency and convention travel documents are excluded.', sources.serbia, 90);
        if (destination === 'ME' && (residence || visa) && (schengenVisa || [...SCHENGEN,'AU','JP','CA','NZ','IE','US','GB'].includes(d.country))) exemption('Third-country document exemption for Montenegro', 'Up to 30 days, never beyond the expiry of the qualifying visa or residence permit.', sources.montenegro, 30);
        if (destination === 'GL' && residence && SCHENGEN.includes(d.country)) exemption('Schengen residence permit access to Greenland', 'Requires a valid residence permit allowing entry and residence in Denmark. Bring the physical residence card and passport. Greenland has a separate short-visit allowance; a Schengen visitor visa alone does not qualify.', sources.greenland, 90);
      }
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
  root.PortpassRules = { ASSOCIATION_ROUTES, associationOptions, validateAssociation, associationAssessment, BOTC_TERRITORIES, FALKLANDS_VISA_REQUIRED, passportCodes, EXTRA_DESTINATIONS, destinationCodes, EU, EEA, EFTA, SCHENGEN, REVIEWED, VISA_WAIVER, BIOMETRIC, sources, sourceLabels, categories, passportRequirement, movementAgreement, activeDocuments, evaluate, today };
})(globalThis);
