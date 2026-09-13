/* Local-only visa allowances and calendar-day calculations. No network or DOM. */
(function(root) {
  const DAY = 86400000;
  const sources = {
    schengen: 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en',
    uk: 'https://www.gov.uk/standard-visitor',
    us: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/visa-expiration-date.html',
    passport: 'https://github.com/imorte/passport-index-data'
  };
  function day(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const n = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(n) && new Date(n).toISOString().slice(0,10) === value ? n / DAY : null;
  }
  const iso = n => new Date(n * DAY).toISOString().slice(0,10);
  function addMonths(start, count) {
    const d = new Date(start * DAY), target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + count, 1));
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d.getUTCDate(), last)); return target.getTime() / DAY;
  }
  const isVisa = d => d.type === 'visa' || d.type === 'schengen';
  const scope = d => d.type === 'schengen' ? 'Schengen' : d.country;
  // Entry coverage and the shared stay clock are deliberately separate:
  // ordinary Schengen visas do not grant entry to Greenland or the Faroes,
  // although short visits there count toward the same 90/180-day allowance.
  const covers = (d, country) => isVisa(d) && (d.type === 'schengen' ? root.PortpassRules.SCHENGEN.includes(country) && root.PortpassRules.SCHENGEN.includes(d.country) : d.country === country);
  const sharesStayClock = (d, country) => isVisa(d) && (d.type === 'schengen' ? root.PortpassRules.SCHENGEN_STAY_SCOPE.includes(country) && root.PortpassRules.SCHENGEN.includes(d.country) : d.country === country);
  function allowance(d, matrix) {
    if (Number.isInteger(d.stayDuration) && d.stayDuration > 0 && d.stayDuration <= 3650) return {
      value:d.stayDuration, unit:d.stayUnit === 'months' ? 'months' : 'days', assumed:false,
      basis:'Entered from your visa or admission record', source:null
    };
    if (d.type === 'schengen') return {value:90,unit:'days',assumed:true,basis:'Assumed Schengen maximum; your visa sticker may allow fewer days',source:sources.schengen};
    if (d.country === 'GB') return {value:6,unit:'months',assumed:true,basis:'Assumed usual Standard Visitor allowance; check your issued permission',source:sources.uk};
    const rule = matrix?.[d.passport]?.[d.country];
    if (d.country !== 'US' && ['e-visa','visa on arrival','visa required'].includes(rule?.status) && Number.isInteger(rule.days) && rule.days > 0 && rule.days <= 3650) return {
      value:rule.days,unit:'days',assumed:true,basis:`Passport-specific ${rule.status} estimate; it may differ from your issued visa`,source:sources.passport
    };
    return {value:null,unit:'days',assumed:false,basis:d.country === 'US' ? 'Use your I-94 admitted-until date; visa expiry is not your stay deadline' : 'No reliable issued-visa default for this passport; enter your allowance',source:d.country === 'US' ? sources.us : null};
  }
  function intervals(d, at) {
    const ranges = (Array.isArray(d.visits) ? d.visits : []).flatMap(v => {
      const start = day(v?.entry), end = day(v?.exit);
      return start !== null && end !== null && start <= end && start <= at ? [[start,Math.min(end,at)]] : [];
    });
    const entry = day(d.entryDate);
    if (entry !== null && entry <= at) ranges.push([entry, at]);
    return merge(ranges);
  }
  function merge(ranges) {
    const output=[];
    for (const [start,end] of ranges.sort((a,b)=>a[0]-b[0])) {
      const last=output[output.length-1];
      if (last && start <= last[1]+1) last[1]=Math.max(last[1],end);
      else output.push([start,end]);
    }
    return output;
  }
  const count = (ranges, from, to) => ranges.reduce((sum,[start,end])=>sum+Math.max(0,Math.min(end,to)-Math.max(start,from)+1),0);
  function summary(d, docs, matrix, date = root.PortpassRules.today()) {
    if (!isVisa(d)) return null;
    const at=day(date); if(at===null)return null;
    const error=validate(d,date) || (d.type==='schengen' && docs.some(v=>v.type==='schengen' && validate(v,date)) ? 'Check the dates in all your Schengen visa records.' : '');
    const limit=allowance(d,matrix), expiry=day(d.expiry), starts=day(d.validFrom), entry=day(d.entryDate), admitted=day(d.admittedUntil);
    const passport=docs.find(p=>p.type==='passport' && p.country===d.passport && (!p.expiry || (day(p.expiry)!==null && day(p.expiry)>=at)));
    const basis=d.stayBasis || (d.type==='schengen' ? (limit.value===90 ? 'rolling' : 'total') : 'perVisit');
    const own=intervals(d,at);
    // Schengen's rolling cap belongs to the person, not a passport or country.
    // Merge all logged Schengen visa visits, including expired/other-passport visas.
    const bloc=merge(docs.filter(v=>v.type==='schengen').flatMap(v=>intervals(v,at)));
    const started=entry!==null && entry<=at;
    const usedThisVisit=started ? at-entry+1 : 0;
    const usedTotal=count(own,-Infinity,at);
    const usedRolling=count(bloc,at-179,at);
    const used=basis==='rolling'?usedRolling:basis==='total'?usedTotal:usedThisVisit;
    let capacity=limit.value;
    if(limit.unit==='months')capacity=entry===null?null:addMonths(entry,limit.value)-entry;
    let remaining=null, leaveBy=null, windowRemaining=null;
    const historyNeeded=d.type==='schengen'||basis==='total';
    const historyReady=!historyNeeded || d.historyComplete===true;
    if(capacity!==null && started && historyReady) {
      remaining=Math.max(0,capacity-used+1); // Includes today, as do entry and exit days.
      leaveBy=remaining?at+remaining-1:at-(used-capacity);
    }
    if(d.type==='schengen' && started && historyReady) {
      const cap=basis==='rolling'?Math.min(90,capacity??90):90;
      windowRemaining=Math.max(0,cap-usedRolling);
      let possible=0;
      // Simulate consecutive days: old visits fall out of the rolling window.
      for(let offset=0;offset<=90;offset++) {
        const target=at+offset;
        const occupied=count(merge([...bloc,[at,target]]),target-179,target);
        if(occupied>cap)break;
        possible++;
      }
      if(basis==='rolling'||remaining===null) {remaining=possible;leaveBy=possible?at+possible-1:at-1;}
      else if(possible<remaining){remaining=possible;leaveBy=possible?at+possible-1:at-1;}
    }
    // A supplied admission deadline is separate from the visa's travel validity.
    if(admitted!==null && started && historyReady) {
      const admittedDays=Math.max(0,admitted-at+1);
      if(remaining===null || admittedDays<remaining) {remaining=admittedDays;leaveBy=admitted;}
    }
    // Schengen stays must also fit within the visa validity; do not apply this
    // rule to US visas, whose expiry does not determine authorised presence.
    if(d.type==='schengen' && expiry!==null && remaining!==null) {
      const validDays=Math.max(0,expiry-at+1);
      if(validDays<remaining){remaining=validDays;leaveBy=expiry;}
    }
    if(error) {remaining=null;leaveBy=null;}
    const totalExhausted=basis==='total' && historyReady && capacity!==null && usedTotal>=capacity && !started;
    const expiryDays=expiry===null?null:expiry-at;
    let state=error?'invalid':!passport?'unlinked':starts!==null&&starts>at?'future':expiryDays!==null&&expiryDays<0?'expired':remaining===0||totalExhausted?'exhausted':'active';
    const attention=remaining!==null?remaining:expiryDays;
    const urgency=['invalid','unlinked','future'].includes(state)?'unknown':['expired','exhausted'].includes(state)?'ended':attention===null?'unknown':attention<=7?'urgent':attention<=30?'soon':'comfortable';
    return {error,id:d.id,scope:scope(d),limit,basis,remaining,leaveBy:leaveBy===null?null:iso(leaveBy),used,usedRolling,windowRemaining,
      expiryDays,expiry:d.expiry||null,starts:d.validFrom||null,entry:d.entryDate||null,state,urgency,historyReady,
      estimated:limit.assumed||d.type==='schengen'||admitted===null, started, covers:country=>covers(d,country), sharesStayClock:country=>sharesStayClock(d,country)};
  }
  function validate(d, date = root.PortpassRules.today()) {
    if (!isVisa(d)) return '';
    for(const field of ['expiry','validFrom','entryDate','admittedUntil'])if(d[field] && day(d[field])===null)return 'Enter valid calendar dates.';
    if(d.validFrom && d.expiry && d.validFrom>d.expiry)return 'The visa start date must be on or before its expiry date.';
    if(d.stayDuration!==undefined && (!Number.isInteger(d.stayDuration)||d.stayDuration<1||d.stayDuration>3650))return 'Enter a whole-number stay allowance from 1 to 3650.';
    if(d.stayUnit && !['days','months'].includes(d.stayUnit))return 'Choose days or calendar months.';
    if(d.stayBasis && !['perVisit','total','rolling'].includes(d.stayBasis))return 'Choose how the allowance applies.';
    if(d.stayUnit==='months' && d.stayDuration>120)return 'Enter a stay allowance of at most 120 months.';
    if(d.type==='schengen' && d.stayUnit==='months')return 'Enter the Schengen duration of stay in days, as printed on the visa.';
    if(d.type==='schengen' && d.stayDuration>90)return 'A Schengen short-stay visa cannot allow more than 90 days in a rolling 180-day period.';
    if(d.entryDate && d.validFrom && d.entryDate<d.validFrom)return 'The arrival date is before this visa becomes valid.';
    if(d.entryDate && d.expiry && d.entryDate>d.expiry)return 'The arrival date is after this visa expires.';
    if(d.entryDate && d.admittedUntil && d.admittedUntil<d.entryDate)return 'The admitted-until date is before arrival.';
    if(d.type==='schengen' && d.stayBasis==='perVisit')return 'Schengen allowances are shared across visits, not reset on each entry.';
    if(d.stayBasis==='rolling' && d.type!=='schengen')return 'Rolling 180-day tracking is only supported for Schengen visas.';
    if(d.visits!==undefined && !Array.isArray(d.visits))return 'Check your previous visits.';
    const ranges=[];
    for(const visit of d.visits||[]) {
      const start=day(visit?.entry),end=day(visit?.exit);
      if(start===null||end===null||start>end)return 'Each previous visit needs valid arrival and departure dates, in that order.';
      if(visit.exit>date)return 'Previous visits must end today or earlier.';
      if(d.entryDate && visit.exit>=d.entryDate)return 'Previous visits must end before the current arrival date.';
      if(ranges.some(([a,b])=>start<=b&&end>=a))return 'Previous visits on this visa must not overlap.';
      ranges.push([start,end]);
    }
    return '';
  }
  root.PortpassVisaTime={sources,day,iso,addMonths,isVisa,covers,sharesStayClock,allowance,summary,validate,merge,count};
})(globalThis);
