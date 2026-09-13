const assert = require('node:assert/strict');
require('../rules.js');
const matrix = require('../data/passports.json');
const R=globalThis.PortpassRules;
const p=country=>({type:'passport',country});
const permit=(country,passport)=>({type:'residence',country,passport});
const run=(destination,docs,mode='visit',data=matrix)=>R.evaluate(destination,docs,mode,data,'2026-09-12');
assert.equal(Object.keys(matrix).length,199);
assert.equal(run('FR',[]).category,'unknown');
assert.equal(run('DE',[p('DE')],'live').category,'home');
assert.equal(run('FR',[p('DE')],'live').category,'live');
assert.equal(run('FR',[p('US')],'live').category,'unknown');
assert.equal(run('FR',[p('IN'),permit('DE','IN')]).category,'document');
assert.equal(run('FR',[p('IN'),permit('DE','IN')],'live').category,'unknown');
assert.equal(run('DE',[p('IN'),permit('DE','IN')],'live').category,'permit');
assert.equal(run('IE',[p('IN'),permit('DE','IN')]).category,run('IE',[p('IN')]).category);
assert.equal(run('FR',[p('IN'),{type:'schengen',country:'DE',passport:'IN'}]).category,'document');
assert.equal(run('FR',[p('IN'),{type:'schengen',country:'DE',passport:'IN'}],'live').category,'unknown');
assert.equal(run('FR',[{...p('DE'),expiry:'2026-09-11'}]).category,'unknown');
assert.equal(run('FR',[{...p('DE'),expiry:'2026-09-12'}]).category,'free');
assert.equal(run('FR',[permit('DE','IN')]).category,'unknown');
assert.equal(run('FR',[p('IN'),{...permit('DE','IN'),expiry:'2026-01-01'}]).category,run('FR',[p('IN')]).category);
const fixture={IN:{US:{status:'no admission'},JP:{status:'visa required'}},DE:{JP:{status:'visa free',days:90}}};
assert.equal(run('US',[p('IN'),{type:'visa',country:'US',passport:'IN'}],'visit',fixture).category,'restricted');
assert.equal(run('JP',[p('IN'),p('DE')],'visit',fixture).category,'free');
assert.equal(run('JP',[p('IN'),p('DE')],'visit',fixture).best.document.country,'DE');
assert.equal(run('JP',[p('IN'),{type:'visa',country:'JP',passport:'IN'}],'visit',fixture).category,'document');
assert.equal(run('JP',[p('IN'),{type:'visa',country:'JP',passport:'US'}],'visit',fixture).category,'required');
for(const [origin,row] of Object.entries(matrix))for(const [dest,rule]of Object.entries(row)){
 assert.match(origin,/^[A-Z]{2}$/);assert.match(dest,/^[A-Z]{2}$/);
 assert.ok(['visa free','visa on arrival','eta','e-visa','visa required','no admission','-1'].includes(String(rule.status)),`Unexpected status ${rule.status}`);
}
console.log('Passed: 20 rule/data assertions plus all passport matrix status checks.');

// Citizenship treaties: both directions, independent of the passport dataset.
for (const [origin,destination] of [['GB','IE'],['IE','GB']]) {
 for (const mode of ['visit','live']) {
  const result=run(destination,[p(origin)],mode,{});
  assert.equal(result.category,mode==='live'?'live':'free');
  assert.equal(result.best.source,R.sources.cta);
  assert.equal(result.best.reviewed,R.REVIEWED);
 }
}
for (const origin of [...R.EEA,'CH']) for (const destination of [...R.EEA,'CH']) {
 const residence=run(destination,[p(origin)],'live',{});
 assert.equal(residence.category,origin===destination?'home':destination==='LI'?'conditional':'live',`${origin} → ${destination}`);
 assert.equal(run(destination,[p(origin)],'visit',{}).category,origin===destination?'home':'free');
}
assert.equal(run('LI',[p('DE'),permit('LI','DE')],'live',{}).category,'permit');
assert.equal(run('CH',[p('HR')],'live',{}).category,'live');
assert.equal(run('NO',[p('CH')],'live',{}).best.source,R.sources.efta);
assert.equal(run('FR',[p('CH')],'live',{}).best.source,R.sources.swiss);
assert.equal(run('FR',[p('NO')],'live',{}).best.source,R.sources.eea);
for (const [origin,destination] of [['GB','FR'],['GB','CH'],['DE','GB'],['US','IE'],['TR','DE']]) {
 assert.equal(run(destination,[p(origin)],'live',{}).category,origin==='TR'?'conditional':'unknown',`${origin} has no blanket residence right in ${destination}`);
}
for (const [issuer,destination] of [['GB','IE'],['IE','GB'],['CH','FR'],['FR','CH']]) {
 assert.equal(run(destination,[p('IN'),permit(issuer,'IN')],'live',{}).category,'unknown');
}
assert.equal(run('IE',[{...p('GB'),expiry:'2026-09-11'}],'live',{}).category,'unknown');
assert.equal(run('IE',[{...p('GB'),expiry:'2026-09-12'}],'live',{}).category,'live');
assert.equal(run('IE',[p('IN'),p('GB')],'live',{}).best.document.country,'GB');
// Visa waivers do not become residence rights or apply to non-Schengen states.
for (const origin of R.VISA_WAIVER) for (const destination of R.SCHENGEN) {
 const passport={...p(origin),biometric:true,nationalId:true,sarPassport:true};
 const result=run(destination,[passport],'visit',{});
 assert.equal(result.category,'free',`${origin} → ${destination} waiver`);
 // Brazil and Timor-Leste separately have a conditional CPLP route in Portugal.
 assert.equal(run(destination,[passport],'live',{}).category,
   destination==='PT' && ['BR','TL'].includes(origin) ? 'conditional' : 'unknown');
 if(origin!=='BR')assert.equal(result.best.days,90);
}
for (const country of R.BIOMETRIC) {
 assert.equal(run('FR',[p(country)],'visit',{}).category,'conditional');
 assert.equal(run('FR',[{...p(country),biometric:false}],'visit',{}).category,'required');
 assert.equal(run('FR',[{...p(country),biometric:true}],'visit',{}).category,'free');
 assert.equal(run('FR',[{...p(country),biometric:'true'}],'visit',{}).category,'conditional');
 assert.equal(run('FR',[p(country),permit('DE',country)],'visit',{}).category,'document');
}
for (const [country,key] of [['TW','nationalId'],['HK','sarPassport'],['MO','sarPassport']]) {
 assert.equal(run('FR',[p(country)],'visit',{}).category,'conditional');
 assert.equal(run('FR',[{...p(country),[key]:true}],'visit',{}).category,'free');
 assert.equal(run('FR',[{...p(country),[key]:false}],'visit',{}).category,'required');
}
for (const origin of ['VU','NR']) {
 assert.equal(run('FR',[p(origin)],'visit',{[origin]:{FR:{status:'visa free',days:90}}}).category,'required');
 assert.equal(run('FR',[p(origin),permit('DE',origin)],'visit',{}).category,'document');
}
assert.equal(run('FR',[p('US')],'visit',{US:{FR:{status:'no admission'}}}).category,'restricted');
assert.equal(run('FR',[p('US'),permit('DE','US')],'visit',{US:{FR:{status:'no admission'}}}).category,'restricted');
for (const destination of ['IE','CY','GB'])assert.equal(run(destination,[p('US')],'visit',{}).category,'unknown');
assert.equal(run('FR',[p('BR')],'visit',{}).best.source,R.sources.brazil);
assert.equal(run('FR',[p('BR')],'visit',{}).best.days,undefined);
assert.equal(run('FR',[p('RS'),{type:'visa',country:'FR',passport:'RS'}],'visit',{}).category,'document');
console.log('Passed: CTA, EU/EEA/Swiss/EFTA corridor matrix, Liechtenstein quotas, visa-waiver matrix, passport conditions, expiry, restrictions, permit and nationality boundaries.');

// Dated updates, extra destinations and document-based exemptions.
assert.ok(R.destinationCodes(matrix).includes('GL'));
assert.equal(R.destinationCodes(matrix).length,209);
for(const origin of ['GB','CA']) {
 for(const date of ['2026-02-17','2026-09-12','2026-12-31']) {
  const result=R.evaluate('CN',[p(origin)],'visit',matrix,date);
  assert.equal(result.category,'free');assert.equal(result.best.days,30);
  assert.equal(result.best.source,R.sources.china);
 }
 assert.equal(R.evaluate('CN',[p(origin)],'visit',matrix,'2026-02-16').category,'required');
 assert.equal(R.evaluate('CN',[p(origin)],'visit',matrix,'2027-01-01').category,'conditional');
 assert.equal(run('CN',[p(origin)],'live').category,'unknown');
 assert.equal(run('CN',[p(origin)],'visit',{[origin]:{CN:{status:'no admission'}}}).category,'restricted');
}
assert.equal(run('AU',[p('NZ')],'live',{}).category,'live');
assert.equal(run('AU',[p('NZ')],'visit',{}).category,'arrival');
assert.equal(run('NZ',[p('AU')],'live',{}).category,'live');
assert.equal(run('NZ',[p('AU')],'visit',{}).category,'free');
assert.equal(run('AU',[p('IN'),permit('NZ','IN')],'live',{}).category,'unknown');
assert.equal(run('NZ',[p('IN'),{...permit('AU','IN'),permanent:true}],'live',{}).category,'conditional');
assert.equal(run('NZ',[p('IN'),{...permit('AU','IN'),permanent:false}],'live',{}).category,'unknown');
const greenCard={...permit('US','IN'),permanent:true};
for(const destination of ['CA','MX']) {
 assert.equal(run(destination,[p('IN'),greenCard],'visit',{}).category,'document');
 assert.equal(run(destination,[p('IN'),permit('US','IN')],'visit',{}).category,'conditional');
 assert.equal(run(destination,[p('IN'),{...greenCard,permanent:false}],'visit',{}).category,'unknown');
 assert.equal(run(destination,[greenCard],'visit',{}).category,'unknown');
 assert.equal(run(destination,[p('IN'),{...greenCard,expiry:'2026-09-11'}],'visit',{}).category,'unknown');
 assert.equal(run(destination,[p('IN'),{...greenCard,validFrom:'2026-09-13'}],'visit',{}).category,'unknown');
 assert.equal(run(destination,[p('IN'),greenCard],'live',{}).category,'unknown');
 assert.equal(run(destination,[p('IN'),greenCard],'visit',{IN:{[destination]:{status:'no admission'}}}).category,'restricted');
}
const schengen={type:'schengen',country:'DE',passport:'IN',multipleEntry:true,previouslyUsed:true};
for(const destination of ['AL','RS','ME']) {
 assert.equal(run(destination,[p('IN'),schengen],'visit',{}).category,'document');
 assert.equal(run(destination,[p('IN'),permit('DE','IN')],'visit',{}).category,'document');
 assert.equal(run(destination,[p('IN'),schengen],'live',{}).category,'unknown');
 assert.equal(run(destination,[p('IN'),{...schengen,expiry:'2026-09-11'}],'visit',{}).category,'unknown');
}
assert.equal(run('AL',[p('IN'),{...schengen,previouslyUsed:undefined}],'visit',{}).category,'conditional');
assert.equal(run('AL',[p('IN'),{...schengen,previouslyUsed:false}],'visit',{}).category,'unknown');
assert.equal(run('AL',[p('IN'),{...schengen,multipleEntry:false}],'visit',{}).category,'unknown');
assert.equal(run('RS',[p('IN'),permit('GB','IN')],'visit',{}).category,'unknown');
assert.equal(run('GL',[p('GB')],'visit',{}).category,'free');
assert.equal(run('GL',[p('IN')],'visit',{}).category,'required');
assert.equal(run('GL',[p('IN'),schengen],'visit',{}).category,'required');
assert.equal(run('GL',[p('IN'),permit('DE','IN')],'visit',{}).category,'document');
assert.equal(run('GL',[p('IN'),permit('IE','IN')],'visit',{}).category,'required');
assert.equal(run('GL',[p('DE')],'live',{}).category,'unknown');
for(const origin of ['DK','FI','IS','NO','SE'])assert.equal(run('GL',[p(origin)],'live',{}).category,'live');
assert.equal(run('GL',[p('UA')],'visit',{}).category,'conditional');
assert.equal(run('GL',[{...p('UA'),biometric:false}],'visit',{}).category,'required');
assert.equal(run('GL',[{...p('UA'),biometric:true}],'visit',{}).category,'free');
assert.equal(run('GL',[p('IN'),{type:'visa',country:'GL',passport:'IN'}],'visit',{}).category,'document');
assert.equal(run('GL',[p('IN'),permit('GL','IN')],'live',{}).category,'permit');
require('../visa-time.js');
const exhausted={...schengen,stayDuration:1,stayBasis:'total',stayUnit:'days',historyComplete:true,visits:[{entry:'2026-09-01',exit:'2026-09-01'}]};
assert.equal(run('FR',[p('IN'),exhausted],'visit',{}).category,'conditional');
const outside=run('ME',[p('IN'),exhausted],'visit',{});
assert.equal(outside.category,'document');assert.equal(outside.best.days,30);assert.equal(outside.best.timing,null);
console.log('Passed: TTTA, green cards, third-country exemptions, Greenland, dated China waiver and separate stay clocks.');
assert.equal(run('AU',[p('NZ')],'visit',{NZ:{AU:{status:'no admission'}}}).category,'restricted');
assert.equal(run('GL',[p('DK')],'visit',{DK:{GL:{status:'no admission'}}}).category,'restricted');
