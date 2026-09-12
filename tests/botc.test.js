const assert=require('node:assert/strict');
require('../visa-time.js');require('../rules.js');require('../profile.js');
const R=PortpassRules,P=PortpassProfile,matrix=require('../data/passports.json');
const p=(country,extra={})=>({id:country,type:'passport',country,...extra});
const run=(dest,docs,mode='visit',date='2026-09-12',data=matrix)=>R.evaluate(dest,docs,mode,data,date);
assert.equal(R.passportCodes(matrix).length,203);
for(const territory of R.BOTC_TERRITORIES) {
 assert.ok(R.destinationCodes(matrix).includes(territory));
 assert.equal(run('GB',[p(territory)]).category,'free');
 assert.equal(run('GB',[p(territory)],'live').category,'conditional');
 assert.equal(run('GB',[p(territory),{id:'gb',type:'citizenship',country:'GB'}],'live').category,'home');
 assert.equal(run('IE',[p(territory)],'live').category,'unknown');
 assert.equal(run('CN',[p(territory)]).category,'unknown');
 assert.equal(run('CA',[p(territory)]).category,'online');
 assert.equal(run('CA',[p(territory)],'live').category,'unknown');
 for(const dest of R.SCHENGEN) {
  assert.equal(run(dest,[p(territory)]).category,'free');
  assert.equal(run(dest,[p(territory)]).best.days,90);
  assert.equal(run(dest,[p(territory)],'live').category,'unknown');
 }
 assert.equal(run(territory,[p(territory)],'live').category,'conditional');
 assert.equal(run(territory,[p(territory,{localStatus:false})],'live').category,'conditional');
 assert.equal(run(territory,[p(territory,{localStatus:true})],'live').category,'home');
 assert.equal(run(territory,[p(territory,{localStatus:true})]).category,'home');
 assert.equal(run(territory,[p(territory,{localStatus:true,expiry:'2026-09-11'})],'live').category,'unknown');
 const citizen={id:'c',type:'citizenship',country:territory,localStatus:true};
 assert.equal(run(territory,[citizen],'live').category,'home');
 assert.equal(run(territory,[citizen]).category,'unknown');
 assert.equal(run('GB',[citizen],'live').category,'unknown');
 assert.equal(run('FR',[p(territory)],'visit','2026-09-12',{[territory]:{FR:{status:'no admission'}}}).category,'restricted');
 const docs=[p(territory,{localStatus:true}),{id:'v',type:'visa',country:'US',passport:territory},citizen];
 assert.deepEqual(P.parse(P.stringify(docs,'BOTC',R.destinationCodes(matrix)),R.destinationCodes(matrix)).documents,docs);
 assert.equal(run('US',docs).category,'document');
 assert.equal(run('US',[docs[1]]).category,'unknown');
 assert.throws(()=>P.stringify([p(territory,{localStatus:'true'})]));
}
for(const dest of R.BOTC_TERRITORIES) {
 assert.equal(run(dest,[p('GB')]).category,'free');
 assert.equal(run(dest,[p('GB')],'live').category,'conditional');
 assert.equal(run(dest,[p('IN'),{id:'r',type:'residence',country:dest,passport:'IN'}],'live').category,'permit');
}
assert.equal(run('FK',[p('IN')]).category,'required');
assert.equal(run('FK',[p('DE')]).category,'free');
assert.equal(run('FK',[p('GB')]).best.days,undefined); // One calendar month, not 30 days.
assert.equal(run('GI',[p('US')]).category,'free');
assert.equal(run('GI',[p('IN')]).category,'required');
assert.equal(run('GI',[p('US')],'visit','2026-07-14').category,'unknown');
assert.equal(run('GI',[p('UA')]).category,'conditional');
assert.equal(run('GI',[p('UA',{biometric:false})]).category,'required');
const visa={id:'s',type:'schengen',country:'DE',passport:'IN'};
assert.equal(run('GI',[p('IN'),visa]).category,'document');
assert.equal(run('GI',[p('IN'),{...visa,expiry:'2026-09-11'}]).category,'required');
assert.equal(run('GI',[p('IN'),{id:'r',type:'residence',country:'GB',passport:'IN'}]).category,'required');
assert.equal(run('FR',[p('IN'),{id:'r',type:'residence',country:'GI',passport:'IN'}]).category,'document');
assert.equal(run('FR',[p('IN'),{id:'r',type:'residence',country:'GI',passport:'IN'}],'live').category,'unknown');
assert.equal(run('GI',[p('FK',{localStatus:true})],'live').category,'conditional');
console.log('BOTC nationality isolation, local status, overseas destinations, July Gibraltar rules and profile persistence passed.');
