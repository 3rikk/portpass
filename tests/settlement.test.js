const assert = require('node:assert/strict');
require('../rules.js');
require('../visa-time.js');
require('../profile.js');
const R = globalThis.PortpassRules;
const matrix = require('../data/passports.json');
const p = country => ({id:country, type:'passport', country});
const run = (origin, destination, mode='live', date='2026-09-13', data=matrix) => R.evaluate(destination,[p(origin)],mode,data,date);
const has = (result, id) => result.routes.some(r => r.title === R.SETTLEMENT_BLOCS.find(b => b.id === id).title);

// Every configured corridor produces a sourced explanation, including overlaps.
for (const bloc of R.SETTLEMENT_BLOCS) {
  assert.ok(R.sourceLabels[bloc.source],bloc.id);
  for (const origin of bloc.members) for (const destination of bloc.destinations) {
    if (origin === destination || (origin === 'FI' && destination === 'AX')) continue;
    const result=run(origin,destination,'live','2026-09-13',{});
    assert.ok(has(result,bloc.id),`${bloc.id}: ${origin} → ${destination}`);
    assert.equal(run(origin,destination,'live','2026-09-13',{[origin]:{[destination]:{status:'no admission'}}}).routes.length,0);
  }
}
for (const [origin,destination,category] of [
  ['AR','BR','conditional'],['CO','PE','conditional'],['JM','TT','conditional'],
  ['BB','BZ','live'],['DM','LC','live'],['SA','AE','live'],['IN','NP','live'],
  ['AM','KZ','conditional'],['KE','TZ','conditional'],['SO','KE','conditional'],
  ['NG','GH','conditional'],['GT','HN','conditional'],['MX','CL','conditional'],
  ['BR','PT','conditional'],['TL','SG','conditional'],['US','PW','conditional'],
  ['PW','US','conditional'],['JP','US','unknown'],['ZA','DZ','unknown'],
  ['DK','FO','live'],['SE','AX','live'],['DE','AX','live'],['FI','AX','home'],
  ['GB','JE','live'],['IE','GG','live'],['GB','IM','live'],['DE','FO','unknown']
]) assert.equal(run(origin,destination).category,category,`${origin} → ${destination}`);
assert.ok(has(run('CO','PE'),'can') && has(run('CO','PE'),'mercosur'));
assert.ok(has(run('DM','VC'),'oecs') && has(run('DM','VC'),'caricomEnhanced') && has(run('DM','VC'),'csme'));
assert.ok(has(run('BE','NL'),'benelux'));
assert.ok(run('BE','NL').routes.some(r=>r.title==='EU freedom of movement'));
assert.equal(has(run('BB','BZ','live','2025-09-30'),'caricomEnhanced'),false);
assert.equal(has(run('VE','BR'),'mercosur'),false);
assert.equal(has(run('BS','JM'),'csme'),false);
assert.equal(has(run('BF','GH'),'ecowas'),false);
assert.equal(has(run('BF','GH'),'ecowasTransition'),true);
assert.equal(has(run('GH','BF'),'ecowasTransition'),false);
assert.equal(has(run('FM','PW'),'cofaPacific'),false);
assert.equal(run('PW','US','visit').category,'conditional');
assert.equal(run('CA','CN','visit','2026-02-16').category,'required');
assert.equal(run('US','JP','visit','2026-09-13',{}).category,'unknown');
assert.equal(run('JP','US','visit','2026-09-13',{}).category,'unknown');
assert.equal(run('SA','AE','visit').best.days,undefined);
assert.equal(run('US','FO','visit').category,'free');
assert.equal(run('US','AX','visit').category,'free');
assert.equal(run('IN','AX','visit').category,'required');
assert.equal(run('US','FO','visit').best.days,90);
assert.ok(!R.SCHENGEN.includes('FO') && R.SCHENGEN.includes('AX'));
for (const destination of ['FO','AX','GG','JE','IM']) {
  assert.ok(R.destinationCodes(matrix).includes(destination));
  assert.ok(!R.passportCodes(matrix).includes(destination));
}
const expired={...p('SA'),expiry:'2026-09-12'};
assert.equal(R.evaluate('AE',[expired],'live',matrix,'2026-09-13').category,'unknown');
assert.equal(R.evaluate('AE',[{id:'c',type:'citizenship',country:'SA'}],'live',matrix,'2026-09-13').category,'unknown');
const held={id:'r',type:'residence',country:'PE',passport:'CO'};
assert.equal(R.evaluate('PE',[p('CO'),held],'live',matrix,'2026-09-13').category,'permit');
const docs=[p('US'),{id:'r',type:'residence',country:'FO',passport:'US'}];
assert.deepEqual(PortpassProfile.parse(PortpassProfile.stringify(docs,'Faroes',R.destinationCodes(matrix)),R.destinationCodes(matrix)).documents,docs);
const schengen={id:'v',type:'schengen',country:'DE',passport:'IN'};
assert.equal(R.evaluate('AX',[p('IN'),schengen],'visit',matrix,'2026-09-13').category,'document');
assert.equal(PortpassVisaTime.covers(schengen,'AX'),true);
assert.equal(PortpassVisaTime.covers(schengen,'FO'),false);
console.log('Settlement blocs: corridor coverage, overlapping routes, conditional/proposed boundaries, dates, territories, restrictions, documents and profiles passed.');
