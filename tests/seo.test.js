const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
require('../visa-time.js');require('../rules.js');require('../profile.js');
const SEO=require('../scripts/generate-seo.js');
const homepage=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
assert.match(homepage,/<section class="product-definition"[\s\S]*<h2 id="what-is-portpass">What is Portpass\?<\/h2>/);
assert.match(homepage,/href="\/passport\/">Passport guides<\/a>/);
const llms=fs.readFileSync(path.join(__dirname,'..','llms.txt'),'utf8');
assert.match(llms,/^# Portpass\n\n> Portpass is a free, private multi-passport travel and residence map/m);
assert.match(llms,/\[Passport mobility guides\]\(https:\/\/portpass\.world\/passport\/\)/);
const german=SEO.overview('DE');
assert.ok(german.visitKnown>0,'German overview has visit data');
assert.ok(german.liveKnown>0,'German overview has live data');
const belarus=SEO.overview('BY');
for(const territory of ['GI','FK','BM','KY'])assert.equal(belarus.live.find(x=>x.destination===territory)?.result.category,'unknown',territory+' is not a Belarus residence route');
const swiss=SEO.destinationHTML('DE','CH',SEO.CONFIG.baseUrl);
assert.equal(swiss.visit.category,'free');
assert.equal(swiss.live.category,'live');
assert.match(swiss.html,/EU–Switzerland free movement/);
assert.match(swiss.html,/<h2>Visit<\/h2>[\s\S]*<h2>Live<\/h2>/);
const compound=SEO.compoundHTML(SEO.CONFIG.baseUrl);
assert.equal(compound.base.category,'online');
assert.equal(compound.combined.category,'document');
assert.equal(SEO.shouldIndex('compound',compound),true);
assert.equal(SEO.shouldIndex('destination',{origin:'DE',destination:'FR',visit:{category:'unknown'},live:{category:'unknown'}}),false);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'portpass-seo-'));
try {
 const output=SEO.generate({outputRoot:root,log:()=>{}});
 assert.ok(output.total>200,'controlled corpus generated');
 const germany=path.join(root,'passport','germany','index.html');
 const germanySwiss=path.join(root,'passport','germany','switzerland','index.html');
 const belarusOverview=path.join(root,'passport','belarus','index.html');
 const belarusLive=path.join(root,'passport','belarus','live','index.html');
 const proof=path.join(root,'travel','india','germany-residence-permit','albania','index.html');
 for(const file of [germany,germanySwiss,belarusOverview,belarusLive,proof])assert.ok(fs.existsSync(file),file);
 assert.match(fs.readFileSync(germanySwiss,'utf8'),/https:\/\/portpass\.world\/passport\/germany\/switzerland\//);
 for(const file of [belarusOverview,belarusLive]) {
  const html=fs.readFileSync(file,'utf8');
  for(const territory of ['Gibraltar','Falkland Islands','Bermuda','Cayman Islands'])assert.ok(!html.includes(territory),territory+' is not emitted as a Belarus residence highlight');
 }
 const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 const guides=JSON.parse(fs.readFileSync(path.join(root,'seo-search.json'),'utf8'));
 const swissGuide=guides.find(guide=>guide.url==='/passport/germany/switzerland/');
 assert.ok(swissGuide,'Germany–Switzerland guide is searchable');
 assert.match(swissGuide.title,/citizens visit or live in Switzerland/);
 assert.match(sitemap,/<loc>https:\/\/portpass\.world\/<\/loc>/);
 assert.match(sitemap,/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
 assert.match(sitemap,/https:\/\/portpass\.world\/passport\/germany\//);
 assert.match(sitemap,/germany-residence-permit\/albania/);
 const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
 for(const agent of ['*','OAI-SearchBot','GPTBot','PerplexityBot','Perplexity-User','Claude-SearchBot','Claude-User','ClaudeBot']) {
  assert.ok(robots.split('\n\n').some(group=>group.split('\n').includes('User-agent: '+agent)&&group.split('\n').includes('Allow: /')),agent+' can crawl public pages');
 }
 assert.doesNotMatch(robots,/^Disallow:\s*\S/m);
 assert.match(robots,/^Sitemap: https:\/\/portpass\.world\/sitemap\.xml$/m);
 for(const url of output.urls) {
  assert.ok(url==='/'||/^\/(passport|travel)\/[a-z0-9/-]*$/.test(url),'only public reference URLs enter the sitemap: '+url);
  if(url==='/')continue;
  const html=fs.readFileSync(path.join(root,url,'index.html'),'utf8');
  assert.ok(html.includes('<link rel="canonical" href="'+SEO.CONFIG.baseUrl+url+'">'));
  assert.match(html,/<meta name="robots" content="index,follow">/);
  assert.match(html,/<meta property="og:image" content="https:\/\/portpass\.world\/assets\/portpass-banner\.png">/);
  assert.match(html,/<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html,/<script type="application\/ld\+json">/);
 }

 console.log('SEO generation passed: engine-backed overview, distinct visit/live, BOT filtering, compound permit route, filtering and sitemap.');
} finally {fs.rmSync(root,{recursive:true,force:true});}
