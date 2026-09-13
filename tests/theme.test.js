const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync(require.resolve('../theme.js'),'utf8');

function loadTheme(initial={},systemDark=false,hostname='portpass.world') {
  const store={...initial},callbacks={},swatches=[];
  const root={dataset:{},style:{setProperty(key,value){this[key]=value;}}};
  let picker=null;
  const makeElement=tag=>({
    tagName:tag.toUpperCase(),dataset:{},children:[],listeners:{},textContent:'',id:'',className:'',type:'',title:'',
    style:{setProperty(key,value){this[key]=value;}},
    setAttribute(key,value){this[key]=value;},
    addEventListener(type,listener){this.listeners[type]=listener;},
    appendChild(child){this.children.push(child);if(child.className==='palette-swatch')swatches.push(child);},
    insertAdjacentElement(_position,child){picker=child;}
  });
  const themeControl=makeElement('label');
  const select=makeElement('select');
  const beta=makeElement('span');beta.className='beta';beta.textContent='BETA';
  const document={
    readyState:'loading',documentElement:root,
    head:{appendChild(){}},
    createElement:makeElement,
    querySelector(selector){
      if(selector==='#header-menu .theme-control')return themeControl;
      if(selector==='.palette-picker')return picker;
      if(selector==='#theme-select')return select;
      if(selector==='.beta')return beta;
      return null;
    },
    querySelectorAll(selector){return selector==='.palette-swatch'?swatches:[];},
    addEventListener(type,listener){callbacks[type]=listener;}
  };
  const context={
    document,
    location:{hostname},
    localStorage:{getItem:key=>Object.hasOwn(store,key)?store[key]:null,setItem:(key,value)=>{store[key]=value;}},
    matchMedia:()=>({matches:systemDark,addEventListener(){}}),
    window:{addEventListener(){}},
    console
  };
  vm.runInNewContext(code,context,{filename:'theme.js'});
  callbacks.DOMContentLoaded();
  return {root,store,swatches,select,picker,beta};
}

const defaults=loadTheme();
assert.equal(defaults.root.dataset.theme,'light');
assert.equal(defaults.root.dataset.palette,'rose');
assert.equal(defaults.beta.textContent,'BETA');
assert.equal(defaults.beta['aria-label'],'Beta environment');
assert.equal(defaults.swatches.length,6);
assert.equal(defaults.swatches[0].dataset.palette,'rose');
assert.equal(defaults.swatches[0]['aria-checked'],'true');
assert.ok(defaults.swatches.every(button=>button.textContent===''&&button.title===''),'palette controls have no visible text');

const alpha=loadTheme({},false,'alpha.portpass.world');
assert.equal(alpha.beta.textContent,'ALPHA');
assert.equal(alpha.beta['aria-label'],'Alpha environment');

const darkDefaults=loadTheme({},true);
assert.equal(darkDefaults.root.dataset.theme,'dark');
assert.equal(darkDefaults.root.dataset.palette,'rose');
assert.equal(darkDefaults.swatches[0]['aria-checked'],'true');

const saved=loadTheme({'portpass-theme':'dark','portpass-palette':'default'});
saved.swatches.find(button=>button.dataset.palette==='amber').listeners.click();
assert.equal(saved.root.dataset.theme,'dark','palette changes do not alter light/dark preference');
assert.equal(saved.root.dataset.palette,'amber');
assert.equal(saved.store['portpass-theme'],'dark');
assert.equal(saved.store['portpass-palette'],'amber');
assert.equal(saved.swatches.find(button=>button.dataset.palette==='amber')['aria-checked'],'true');

assert.match(code,/\.palette-picker\{[^}]*justify-content:center[^}]*width:100%/,'palette swatches stay centered');
assert.match(code,/\.header-menu \.palette-picker\{margin-top:-8px/,'palette row stays close to theme control');
assert.match(code,/\.intro h1 span\{color:var\(--green\)\}/,'headline accent follows selected palette');
assert.match(code,/--category-unknown:color-mix\(in srgb,var\(--green\)/,'unhighlighted map countries follow selected palette');
assert.match(code,/data-theme="dark"\]\[data-palette="rose"\] \.mode\{background:#20252d/,'dark rose segmented control uses a neutral track');
assert.match(code,/hostname==='alpha\.portpass\.world'\?'ALPHA':'BETA'/,'environment badge stays hostname-aware');
assert.match(code,/button\.textContent=onAlpha\?'View stable website ↗':'View alpha branch ↗'/,'footer environment switch is hostname-aware');
assert.match(code,/You are about to leave the Alpha branch and go back to the Stable website\./,'alpha site uses a return-to-stable confirmation');
assert.match(code,/destination=onAlpha\?'https:\/\/portpass\.world\/':'https:\/\/alpha\.portpass\.world\/'/,'environment switch targets the opposite hostname');
assert.match(code,/deadline=Date\.now\(\)\+10000/,'stable return countdown lasts ten seconds');
assert.match(code,/class="alpha-countdown"/,'stable return action includes the circular countdown');

console.log('Theme engine passed: hostname badge and environment switch, stable-return countdown, rose default, centered picker and palette-driven accents.');
