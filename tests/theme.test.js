const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync(require.resolve('../theme.js'),'utf8');

function loadTheme(initial={}) {
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
  const document={
    readyState:'loading',documentElement:root,
    head:{appendChild(){}},
    createElement:makeElement,
    querySelector(selector){
      if(selector==='#header-menu .theme-control')return themeControl;
      if(selector==='.palette-picker')return picker;
      if(selector==='#theme-select')return select;
      return null;
    },
    querySelectorAll(selector){return selector==='.palette-swatch'?swatches:[];},
    addEventListener(type,listener){callbacks[type]=listener;}
  };
  const context={
    document,
    localStorage:{getItem:key=>Object.hasOwn(store,key)?store[key]:null,setItem:(key,value)=>{store[key]=value;}},
    matchMedia:()=>({matches:false,addEventListener(){}}),
    window:{addEventListener(){}},
    console
  };
  vm.runInNewContext(code,context,{filename:'theme.js'});
  callbacks.DOMContentLoaded();
  return {root,store,swatches,select,picker};
}

const defaults=loadTheme();
assert.equal(defaults.root.dataset.theme,'light');
assert.equal(defaults.root.dataset.palette,'default');
assert.equal(defaults.swatches.length,6);
assert.equal(defaults.swatches[0].dataset.palette,'default');
assert.equal(defaults.swatches[0]['aria-checked'],'true');
assert.ok(defaults.swatches.every(button=>button.textContent===''&&button.title===''),'palette controls have no visible text');

const saved=loadTheme({'portpass-theme':'dark','portpass-palette':'default'});
saved.swatches.find(button=>button.dataset.palette==='amber').listeners.click();
assert.equal(saved.root.dataset.theme,'dark','palette changes do not alter light/dark preference');
assert.equal(saved.root.dataset.palette,'amber');
assert.equal(saved.store['portpass-theme'],'dark');
assert.equal(saved.store['portpass-palette'],'amber');
assert.equal(saved.swatches.find(button=>button.dataset.palette==='amber')['aria-checked'],'true');

console.log('Theme engine passed: six accent circles, default selection, persistence and independent light/dark mode.');
