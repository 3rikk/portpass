# Agreement coverage

Reviewed 2026-09-13. Rules assume ordinary citizen passports and assess visits separately from residence. Treaty-based residence remains subject to the conditions stated in the country detail. National admission restrictions still require individual checks.

| Rule | Scope and boundary | Official source |
| --- | --- | --- |
| Common Travel Area | GB → IE and IE → GB, based on citizenship. No rights inferred from visitor visas or residence permits. Crown Dependency destinations added in the 13 September audit below. | [UK government](https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance), [Irish government](https://www.gov.ie/en/department-of-foreign-affairs/publications/the-common-travel-area/) |
| EU citizenship | EU → EU, with residence conditions and registration. | [Your Europe](https://europa.eu/youreurope/citizens/residence/residence-rights/index_en.htm) |
| EEA | EU plus Iceland, Liechtenstein and Norway. Reciprocal movement with a Liechtenstein residence exception. | [EFTA](https://www.efta.int/eea/policy-areas/persons) |
| EU–Switzerland | EU ↔ CH; residence depends on the agreement’s economic/study/resources conditions and local procedures. | [Agreement summary](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=legissum%3Aem0025), [Swiss migration authority](https://www.sem.admin.ch/sem/en/home/themen/fza_schweiz-eu-efta/eu-efta_buerger_schweiz/faq.html) |
| EFTA Convention | CH ↔ IS/NO/LI; quota approval still required for residence in LI. | [EFTA Convention overview](https://www.efta.int/about-efta/legal-documents/efta-convention/short-overview-efta-convention) |
| Liechtenstein | EEA/Swiss passport holders can visit, but residence is quota-controlled. A declared existing LI residence permit is assessed separately. | [Liechtenstein migration authority](https://www.llv.li/en/national-administration/migration-and-passport-office/residing-in-liechtenstein) |
| Croatian citizens in Switzerland | Full free movement applies in 2026; the safeguard thresholds were not reached. Do not reuse outdated quota guidance. | [Swiss announcement, 14 January 2026](https://www.agov.admin.ch/en/newnsb/ciU7vNgDGQu6) |
| EU short-stay waivers | Annex II ordinary-passport origins → Schengen. Biometric requirements for AL/BA/GE/MD/ME/MK/RS/UA/XK; ID-number condition for TW; SAR-passport condition for HK/MO. No automatic reciprocal rules outside Schengen. | [Consolidated Regulation 2018/1806](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02018R1806-20251230) |
| Waiver exceptions | Vanuatu is no longer exempt; Nauru’s agreement condition has not been fulfilled. Georgian diplomatic/service/official passports are outside our ordinary-passport scope. | [Commission policy and suspensions](https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en), [Council agreement overview](https://www.consilium.europa.eu/en/infographics/eu-visa-agreements-with-non-eu-countries/) |
| Brazil | The Commission identifies a special EU–Brazil three-month/six-month calculation. For EU Schengen destinations show that caveat, without inventing a numeric days entitlement. | [Commission border-crossing guidance](https://home-affairs.ec.europa.eu/policies/schengen/border-crossing_en) |
| Schengen documents | Eligible residence permits / type C visas support short visits, not automatic residence elsewhere. IE/CY excluded as Schengen destinations. | [Your Europe](https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-nationals/index_en.htm) |

## Deliberate boundaries

Nationality alone cannot establish family sponsorship, Withdrawal Agreement protection, EU long-term resident/Blue Card mobility, Turkish association rights, or most bilateral employment schemes. Only the explicitly documented conditional or confirmed routes below are assessed; nationality alone does not grant them. Visa facilitation is not a waiver. Future or proposed agreements are not treated as in force. ETIAS and other travel-date requirements must be checked before departure; the app does not guess a launch date or track authorisations.

## Maintenance

Review amendments and suspensions before changing membership lists. Keep EU, EEA, EFTA and Schengen separate. Update REVIEWED and the source dialog together after a new source audit. A missing passport confirmation must not silently become true. Run tests/rules.test.js and browser checks after rule or category changes; verify the map legend, filters, counters and JPEG export use the same categories. Do not treat the bundled passport dataset as a live legal source.


## Additional corridors reviewed 12 September 2026

| Coverage | Authority |
| --- | --- |
| TTTA, NZ → AU: subclass 444 on arrival; residence conditional on its grant and ongoing eligibility | [Australian Home Affairs](https://immi.homeaffairs.gov.au/Visa-subsite/Pages/other-visas/444-special-category-visa.aspx) |
| TTTA, AU → NZ; separate conditional Australian permanent-resident route | [Immigration New Zealand](https://www.immigration.govt.nz/visit/what-you-need-to-visit-new-zealand/australian-citizens-and-permanent-residents-travelling-to-new-zealand/) |
| US permanent residence → Canada | [IRCC](https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/entry-requirements-country.html) |
| Qualifying permanent residence → Mexico | [Mexican consulate](https://consulmex.sre.gob.mx/denver/index.php/visasparapersonasextranjeras) |
| Qualifying Schengen/EU/US/UK documents → Albania | [Albanian foreign ministry](https://punetejashtme.gov.al/en/regjimi-i-vizave-per-te-huajt/) |
| Qualifying visas/permits → Serbia and Montenegro | [Serbia](https://www.mfa.rs/en/citizens/travel-serbia/visa-requirements), [Montenegro](https://www.gov.me/en/article/visas) |
| Greenland passport, document and Nordic routes | [Danish Immigration Service](https://www.nyidanmark.dk/en-GB/You-want-to-apply/Short-stay-visa/Visa-to-the-Faroe-Island-or-Greenland) |
| UK/Canada → China, 17 February–31 December 2026 | [Chinese embassy notice](https://gb.china-embassy.gov.cn/eng/visa/notice/202602/t20260216_11860580.htm), [GOV.UK confirmation](https://www.gov.uk/foreign-travel-advice/china/entry-requirements) |

The bundled matrix still reports UK/Canada → China as visa required. The official, dated override takes precedence during its published window; after expiry the result requests rechecking instead of silently retaining the waiver or reverting to stale data. The source window uses Beijing dates; the app evaluates its current local calendar date.

`permanent`, `multipleEntry`, and `previouslyUsed` are optional boolean wallet/profile fields. Missing values remain unconfirmed; false values cannot satisfy a required condition. Existing residence entries are never silently promoted to permanent residence. Visa stay history does not infer prior use in the issuing country. Exemption routes retain their own stay limits and do not inherit a Schengen or US visa clock. Expired/not-yet-valid documents and missing linked passports do not qualify; reported nationality-specific admission restrictions remain in force.

Greenland is destination-only in the selector, not a new passport nationality or a Schengen member. EU residence cards outside Schengen that require additional EU-law status checks remain unassessed. Coverage is a curated set of exemptions, not an exhaustive global list.


## BOTC and overseas territories

Reviewed 12 September 2026. Supported wallet territory codes: GI, FK, BM, KY. These codes on a passport/citizenship entry explicitly represent BOTC nationality; GB continues to mean British citizen. The existing profile format remains version 1, with an optional boolean `localStatus` for these entries. Missing/false confirmation does not establish local residence rights. A citizenship-only entry adds no travel route. Confirmed local status applies only to its territory, not other BOTs or the UK; residence/work documents remain independently recordable.

| Coverage | Source |
| --- | --- |
| BOTC UK visits, nationality distinctions and limits on residence entitlement | [HM Passport Office](https://www.gov.uk/government/publications/british-overseas-territories-citizens/british-overseas-territories-citizens-accessible-version), [ETA exemption](https://www.gov.uk/eta/when-not-need-eta) |
| BOTC Schengen short-visit waiver | [Annex II, section 3](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02018R1806-20251230) |
| BOTC Canada eTA by air and ordinary land/sea exemption | [IRCC](https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/entry-requirements-country.html) |
| Gibraltar visits and document exemptions from 15 July 2026 | [Technical notice](https://www.gibraltar.gov.gi/press-releases/technical-notice-reminder-concerning-visa-arrangements-5582026-12201), [British-citizen entry](https://www.gov.uk/foreign-travel-advice/gibraltar/entry-requirements) |
| Gibraltar residence framework | [Residency regulations commencement](https://www.gibraltar.gov.gi/press-releases/government-launches-new-residency-portal-as-new-residency-regulations-come-into-force-5542026-12197) |
| Falklands national visa list and one-calendar-month arrival permit | [Customs visitor guidance](https://www.gov.fk/customs/visitor-permit/) |
| Falklands work permission and local right of abode | [Work permits](https://www.gov.fk/customs/work-permit/), [Status and permanent residence](https://www.customs.gov.fk/news/47-immigration-amendments-2021-faqs) |
| Bermuda British-citizen visitors and residence/status options | [Visitor requirements](https://www.gov.uk/foreign-travel-advice/bermuda/entry-requirements), [Immigration department](https://www2.gov.bm/department/immigration) |
| Cayman British-citizen visitors and residence/status options | [Visitor requirements](https://www.gov.uk/foreign-travel-advice/cayman-islands/entry-requirements), [Immigration services](https://otp.gov.ky/web/govky/immigration) |

Gibraltar remains separate from the Schengen member list. Its reciprocal document exemptions are dated and explicitly request checking the applicable stay calculation. UK residence/visa exemptions are not inferred under the new arrangements. BOTC-only Gibraltar visitors without confirmed local status remain conditional; the British-citizen exemption is not automatically applied. The Falklands visa-required list is independent of the UK and Schengen lists. One-month and six-month allowances are not converted to a fixed number of days.

Do not extend BOTC territorial coverage from a British-citizen GOV.UK page alone. Additional territories and outbound corridors need their own review; no territorial citizenship is inferred from passport issuance location.


## Turkish association rights

Reviewed 12 September 2026. Decision 1/80 is evaluated for an existing residence entry in an EU member state. It is not added to citizenship-based free movement. Confirmed acquired worker/family stages use the existing treaty-rights category only in the entry’s host country. A Turkish passport alone produces a conditional explanation in Live mode; it does not add tourist entry rights. Family beneficiaries need not be Turkish; worker/business routes require active Turkish nationality in the wallet, including an explicitly recorded additional citizenship.

| Scope | Source |
| --- | --- |
| Article 6 worker progression (1/3/4 years); lawful employment and continuity requirements | [CJEU, Eker](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A61995CJ0386) |
| Article 7 family residence progression (3/5 years) | [CJEU, Aydinli](https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A62003CJ0373) |
| Vocationally trained child, parent’s three years of legal work | [CJEU, Akman](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A61997CJ0210) |
| Dutch application facilitation and self-employment assessment | [IND guidance](https://ind.nl/en/turkish-citizens-and-living-in-the-netherlands) |
| UK existing-holder extensions; separate dependant conditions | [Appendix ECAA](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-ecaa-extension-of-stay) |

The optional `associationRoute` enum and tri-state `associationConfirmed` boolean are stored on residence entries and preserved in version-1 profiles. Each selection describes all conditions the user must confirm. No elapsed years are inferred from a permit’s issue date; no employer names, employment records or family identities are collected. Changing country, route or linked passport clears confirmation. Unknown routes, wrong document types, unsupported host countries and non-boolean confirmations are rejected on import.

Worker stages require continuing membership of the lawful labour force, genuine/effective work and retained rights. Family stages depend on authorised admission and qualifying family residence, not merely time since a wedding. Country-specific improvements remain possible, including the Dutch TWV rules. Confirmation is a declaration, not an administrative determination. Interruptions, long absences, public-policy restrictions, historical rights, service-provider and standstill exceptions, and new UK dependent-child entry applications require separate assessment. UK extensions and Dutch self-employed applications remain conditional even when the user confirms the listed conditions.

An active linked passport and residence entry are required to display the declared acquired stage. Expired or missing documents do not establish that legal association rights have been lost; the app does not adjudicate retained rights after document expiry. A held permit remains independently visible even if association conditions are unconfirmed or unmet. Existing visa/Schengen permit travel rules remain separate.


## IMI Daily settlement-bloc coverage — 13 September 2026

All 21 headings in the [IMI Daily overview](https://www.imidaily.com/supranational-settlement-blocs-ssbs/) are represented: EU/EEA, MERCOSUR-RA, CARICOM-CSME, GCC, Nordic Passport Union, CTA, TTTA, CoFA, EAEU, India–Nepal, EAC, OECS, Benelux, CAN, ECOWAS, CA-4, Pacific Alliance, CPLP, ASEAN, APEC and the African passport initiative. The overview defines scope, not legal classifications. Official sources determine the displayed conditions. EU/EEA, CTA, TTTA and Greenland routes retain their existing assessments.

`SETTLEMENT_BLOCS` supplies additional directional routes. Overlaps are retained, including CAN/MERCOSUR, OECS/CSME/enhanced CARICOM and Benelux/EU. Residence applications and employment-dependent schemes are conditional. APEC and the AU initiative add an explanation in Live mode with category `unknown`, not a residence entitlement. An APEC business-card route in Visit mode remains conditional: the wallet does not establish a card or destination pre-clearance. Existing visitor routes remain independently available. CoFA US entry is conditional even if the passport snapshot reports a waiver, because acquisition-of-citizenship eligibility is unconfirmed.

| Additional rule | Authority |
| --- | --- |
| MERCOSUR Residence Agreement | [Official source](https://www.mercosur.int/documento/acuerdo-residencia-nacionales-estados-partes-mercosur) |
| Andean Community (CAN) residence | [Official source](https://www.comunidadandina.org/notas-de-prensa/hoy-entra-en-vigencia-el-estatuto-migratorio-andino/) |
| CARICOM Single Market and Economy (CSME) | [Official source](https://caricom.org/csme-resources/) |
| CARICOM enhanced free movement | [Official source](https://www.foreign.gov.bb/faqs-on-enhanced-cooperation-in-movement-of-caricom-nationals/) |
| Gulf Cooperation Council (GCC) | [Official source](https://www.gcc-sg.org/en/MediaCenter/DigitalLibrary/Documents/1274592562.pdf) |
| Nordic Passport Union / Nordic residence | [Official source](https://www.norden.org/en/info-norden/work-and-residence-permits-faroe-islands) |
| Benelux Union | [Official source](https://www.benelux.int/en/information-for-citizens/benelux-union/about-us/benelux-treaty/) |
| Compact of Free Association (CoFA) · United States | [Official source](https://www.uscis.gov/sites/default/files/document/fact-sheets/FactSheetVerifyFASCitizens.pdf) |
| Compact of Free Association (CoFA) · Pacific states | [Official source](https://www.doi.gov/oia/compacts) |
| Eurasian Economic Union (EAEU) workers | [Official source](https://eec.eaeunion.org/upload/iblock/9fc/ef4tm95rjpz5qimsd8iogeltvpnv9uwi/EAEU-10-Eng.pdf) |
| India–Nepal Treaty of Peace and Friendship | [Official source](https://www.mea.gov.in/Images/pdf/rti-samsher-9-11-140001.pdf) |
| East African Community (EAC) Common Market | [Official source](https://www.eac.int/working-in-east-africa) |
| OECS Economic Union free movement | [Official source](https://pressroom.oecs.int/oecs-continues-to-strengthen-the-free-movement-of-persons-regime) |
| ECOWAS residence and establishment | [Official source](https://www.ecowas.int/press-statement-2/) |
| ECOWAS · withdrawn-state transitional arrangements | [Official source](https://www.ecowas.int/press-statement-2/) |
| Central America Four (CA-4) · residence requires approval | [Official source](https://inm.gob.hn/residencias.html) |
| Pacific Alliance · working-holiday mobility | [Official source](https://alianzapacifico.net/en/download/acuerdo-interinstitucional-de-la-alianza-del-pacifico-para-un-programa-de-vacaciones-y-trabajo/) |
| Community of Portuguese Language Countries (CPLP) | [Official source](https://www.cplp.org/organizacao/mobilidade-circulacao-e-cidadania/) |
| Portugal · CPLP residence application | [Official source](https://aima.gov.pt/pt/noticias/kgljg) |
| ASEAN · professional mobility | [Official source](https://investasean.asean.org/asean-framework/mras/) |
| APEC Business Travel Card (ABTC) | [Official source](https://www.apec.org/groups/committee-on-trade-and-investment/business-mobility-group/abtc/faq) |
| African Union passport initiative · no general settlement right | [Official source](https://www.au.int/en/treaties/protocol-treaty-establishing-african-economic-community-relating-free-movement-persons) |

Territory coverage: FO, AX, GG, JE and IM are destination-only. Greenland/Faroe Islands nationals use DK, Åland nationals FI, and British citizens from Crown Dependencies GB; territory codes never invent new nationalities. Åland is covered as Finnish territory for EU/EEA/Swiss movement and Schengen visits, including shared visa clocks. It is not added to the EU member-state list. Faroe Islands and Greenland remain outside Schengen. Crown Dependency CTA immigration exemptions do not remove local housing/population or employment controls. See [Jersey](https://www.gov.je/LifeEvents/MovingToJersey/LivingInJersey/Pages/Work.aspx), [Guernsey](https://parliament.gg/parliamentary-business/assets/propositions/p2022-81), [Isle of Man](https://www.gov.im/immigration), [Åland](https://www.norden.org/en/info-norden/aland-right-domicile) and [Nordic nationality guidance](https://www.udi.no/en/want-to-apply/residence-under-the-eueeu-regulations/nordic-nationals-who-are-going-to-live-in-norway/).

Corrections and boundaries relative to the overview:

- [Timor-Leste joined ASEAN on 26 October 2025](https://asean.org/forging-a-new-era-timor-leste-admitted-into-asean/). Membership is not automatic participation in every professional arrangement.
- Enhanced CARICOM movement applies only among BB/BZ/DM/VC from 1 October 2025. Other CSME routes require appropriate skills/establishment eligibility. No blanket exclusion based on investment citizenship is inferred.
- EAC residence is tied to qualifying economic activity/family status and national implementation, not unconditional permanent residence based only on identity. EAEU worker residence likewise requires a qualifying contract.
- MERCOSUR applicants must check naturalisation duration, documentation and permanent-residence conditions. CAN permanent residence is a separate process; no automatic immediate permanent permit is inferred. Venezuela is excluded from the multilateral residence list.
- ECOWAS has 12 current members. BF/ML/NE are separately represented as origins under the published until-further-notice transitional treatment; no reciprocity or continued membership is inferred.
- CoFA is bilateral with the US, not an all-to-all Pacific settlement union. US citizens moving to a Pacific Compact state must check its national residence/employment requirements.
- OECS coverage follows the six sovereign origins listed in the overview. Montserrat’s distinct nationality/local-status implementation is outside this addition; associate OECS members are not automatically included.
- CA-4 travel arrangements do not grant a verified permanent-settlement right. Pacific Alliance working-holiday programmes require destination-specific approval. CPLP implementation is country-specific; Portugal’s current process requires the relevant consular visa.
- APEC nationality alone does not grant an ABTC or pre-clearance; US/Canada participation does not remove visa requirements. The African passport initiative creates no ordinary-passport residence entitlement. Western Sahara is in the AU membership list but is not a supported passport/destination in the bundled matrix.

Validation: `tests/settlement.test.js` covers every added configured corridor, overlap, current-versus-withdrawn membership, effective dates, asymmetric CoFA/ECOWAS boundaries, expiry, admission restrictions, territory profiles and Schengen clock coverage. `tests/settlement-browser.js` covers rendered sources, destinations, filters, counters and JPEG export.
