const assert=require('node:assert/strict');
require('../visa-time.js');require('../rules.js');require('../profile.js');
const R=PortpassRules,P=PortpassProfile,matrix=require('../data/passports.json');
const p=country=>({id:country,type:'passport',country});
const permit=(country,route,confirmed=true,passport='TR')=>({id:'r',type:'residence',country,passport,associationRoute:route,associationConfirmed:confirmed});
const run=(country,docs,mode='live',data=matrix)=>R.evaluate(country,docs,mode,data,'2026-09-12');
const assessment=result=>result.routes.find(r=>r.title.startsWith('Turkish association ·'));
for(const country of R.EU) {
 assert.equal(run(country,[p('TR')]).category,'conditional');
 for(const route of ['worker1','worker3','worker4','family3','family5','child']) {
  const d=permit(country,route),result=run(country,[p('TR'),d]);
  assert.equal(result.category,'live',country+' '+route);
  assert.ok(assessment(result).conditions.includes('only in this host country'));
  assert.equal(assessment(run(country,[p('TR'),{...d,associationConfirmed:undefined}])).category,'conditional');
  assert.equal(assessment(run(country,[p('TR'),{...d,associationConfirmed:false}])).category,'conditional');
  assert.equal(assessment(run(country,[p('TR'),{...d,associationConfirmed:'true'}])),undefined);
  assert.equal(assessment(run(country,[p('TR'),{...d,expiry:'2026-09-11'}])),undefined);
  assert.equal(assessment(run(country,[p('TR'),{...d,validFrom:'2026-09-13'}])),undefined);
  assert.equal(assessment(run(country,[d])),undefined);
  assert.equal(assessment(run(country,[{...p('TR'),expiry:'2026-09-11'},d])),undefined);
  assert.equal(assessment(run(country,[p('TR'),d],'visit')),undefined);
  assert.equal(assessment(run(country,[p('TR'),d],'live',{TR:{[country]:{status:'no admission'}}})),undefined);
 }
}
const german=permit('DE','worker4');
assert.equal(run('DE',[p('TR'),german]).best.document.id,'r');
assert.equal(run('FR',[p('TR'),german]).category,'conditional');
for(const country of ['NO','IS','CH','LI','GI','GL']) {
 assert.equal(R.associationOptions(country).length,0);
 assert.equal(assessment(run(country,[p('TR'),permit(country,'worker4')])),undefined);
}
assert.equal(assessment(run('DE',[p('IN'),permit('DE','worker4',true,'IN')])).category,'conditional');
assert.equal(run('DE',[p('IN'),{id:'tr',type:'citizenship',country:'TR'},permit('DE','worker4',true,'IN')]).category,'live');
for(const route of ['family3','family5','child'])assert.equal(run('DE',[p('IN'),permit('DE',route,true,'IN')]).category,'live');
assert.equal(run('DE',[{id:'tr',type:'citizenship',country:'TR'}]).category,'unknown');
assert.equal(run('DE',[p('TR')],'visit').category,'required');
assert.equal(assessment(run('NL',[p('TR'),permit('NL','selfEmployedNL')])).category,'conditional');
assert.equal(assessment(run('DE',[p('TR'),permit('DE','selfEmployedNL')])),undefined);
for(const route of ['ukWorker3','ukWorker4','ukBusiness','ukFamily']) {
 assert.equal(assessment(run('GB',[p('TR'),permit('GB',route)])).category,'conditional');
 assert.equal(assessment(run('DE',[p('TR'),permit('DE',route)])),undefined);
}
assert.equal(assessment(run('GB',[p('TR'),permit('GB','worker4')])),undefined);
assert.equal(run('GB',[p('TR')]).category,'conditional');
const docs=[p('TR'),german];
assert.deepEqual(P.parse(P.stringify(docs,'Association',R.destinationCodes(matrix)),R.destinationCodes(matrix)).documents,docs);
for(const d of [{...german,associationRoute:'invalid'},{...german,country:'CH'},{...german,associationConfirmed:'true'},{...german,type:'visa'},{...german,associationRoute:undefined},{...german,associationRoute:'ukBusiness'}])assert.throws(()=>P.stringify([p('TR'),d]));
console.log('EU association stages, host-country boundaries, nationality, family members, UK legacy routes, expiry and profiles passed.');
