/* Apply local theme and palette preferences before styles paint. System remains the default. */
(function() {
  const themeKey='portpass-theme',paletteKey='portpass-palette',system=matchMedia('(prefers-color-scheme: dark)');
  const themes=['system','light','dark'];
  const palettes=['rose','default','amber','violet','teal','slate'];
  const names={default:'Green',amber:'Amber',rose:'Rose',violet:'Violet',teal:'Teal',slate:'Slate'};
  const swatches={default:'#66835e',amber:'#b9773f',rose:'#a96674',violet:'#77649b',teal:'#4f827a',slate:'#587691'};
  const validTheme=value=>themes.includes(value)?value:'system';
  const validPalette=value=>palettes.includes(value)?value:'rose';
  let preference='system',palette='rose';
  try{preference=validTheme(localStorage.getItem(themeKey));palette=validPalette(localStorage.getItem(paletteKey));}catch{}

  const style=document.createElement('style');
  style.id='portpass-palette-engine';
  style.textContent=`
html:root[data-palette="default"]{--ink:#243c31;--muted:#7b857e;--green:#365d46;--line:#e3e7df;--paper:#f7f8f5;--surface:#fff;--lime:#dfedb6;--palette-soft:#eaf0de;--palette-soft-2:#f0f2ed;--palette-soft-3:#ecefe8;--palette-border:#dfe6d3;--palette-map:#f9fbf7;--palette-highlight:#7d8a70}
html:root[data-palette="amber"]{--ink:#3b3026;--muted:#8a7a6d;--green:#986133;--line:#e9e1d7;--paper:#faf7f2;--surface:#fffdfa;--lime:#efddb9;--palette-soft:#f4e6d3;--palette-soft-2:#f3ece3;--palette-soft-3:#efe8df;--palette-border:#ead8c4;--palette-map:#fcfaf6;--palette-highlight:#9a7553}
html:root[data-palette="rose"]{--ink:#3b2c31;--muted:#89767c;--green:#8d5966;--line:#eadfe1;--paper:#faf6f7;--surface:#fffdfd;--lime:#efd4da;--palette-soft:#f3e1e5;--palette-soft-2:#f2e9eb;--palette-soft-3:#eee5e7;--palette-border:#e8d3d8;--palette-map:#fcf9fa;--palette-highlight:#9a707b}
html:root[data-palette="violet"]{--ink:#332f3d;--muted:#81798d;--green:#6d5d8b;--line:#e4deea;--paper:#f8f6fa;--surface:#fff;--lime:#e1d8ed;--palette-soft:#e9e2f1;--palette-soft-2:#efebf4;--palette-soft-3:#ebe7f0;--palette-border:#ded3e9;--palette-map:#fbf9fc;--palette-highlight:#81729a}
html:root[data-palette="teal"]{--ink:#243735;--muted:#718581;--green:#3f7169;--line:#dbe6e3;--paper:#f5f8f7;--surface:#fcfefd;--lime:#cae4df;--palette-soft:#dcece8;--palette-soft-2:#e7efed;--palette-soft-3:#e3ece9;--palette-border:#cfdfdb;--palette-map:#f8fbfa;--palette-highlight:#63877f}
html:root[data-palette="slate"]{--ink:#27333f;--muted:#75818e;--green:#4e6c87;--line:#dde4eb;--paper:#f5f7f9;--surface:#fcfdff;--lime:#d5e0ea;--palette-soft:#e0e8ef;--palette-soft-2:#e8edf2;--palette-soft-3:#e5eaf0;--palette-border:#d2dde7;--palette-map:#f8fafc;--palette-highlight:#6d8194}
html:root[data-theme="dark"][data-palette="default"]{--warning:#f1a58d;--ink:#e1e7f0;--muted:#a7b3c5;--green:#a9bfe5;--line:#36445b;--paper:#171e2b;--surface:#202b3c;--lime:#bdcdef;--palette-soft:#26354a;--palette-soft-2:#2a3545;--palette-soft-3:#253244;--palette-border:#3e5069;--palette-map:#1b2534;--palette-highlight:#9cb5db}
html:root[data-theme="dark"][data-palette="amber"]{--warning:#f1a58d;--ink:#f0e5da;--muted:#c5b3a2;--green:#d9a268;--line:#514235;--paper:#241d17;--surface:#30261e;--lime:#d9b785;--palette-soft:#3a2c21;--palette-soft-2:#3b3027;--palette-soft-3:#352a22;--palette-border:#604d3c;--palette-map:#291f19;--palette-highlight:#c39567}
html:root[data-theme="dark"][data-palette="rose"]{--warning:#f1a58d;--ink:#ebe7ea;--muted:#b7adb2;--green:#c78f9d;--line:#3f414a;--paper:#191d25;--surface:#222832;--lime:#d0a3ae;--palette-soft:#30272d;--palette-soft-2:#2d282d;--palette-soft-3:#29272b;--palette-border:#4a3c42;--palette-map:#1c2028;--palette-highlight:#b98a97}
html:root[data-theme="dark"][data-palette="violet"]{--warning:#f1a58d;--ink:#eae5f2;--muted:#b9afc8;--green:#b8a5da;--line:#443b59;--paper:#1f1b29;--surface:#2a2437;--lime:#bcaadb;--palette-soft:#302941;--palette-soft-2:#332d40;--palette-soft-3:#2d273b;--palette-border:#504663;--palette-map:#241f30;--palette-highlight:#aa98ca}
html:root[data-theme="dark"][data-palette="teal"]{--warning:#f1a58d;--ink:#e0ecea;--muted:#a6c0bc;--green:#82bdb4;--line:#34504c;--paper:#162221;--surface:#1e302e;--lime:#8dbfb8;--palette-soft:#233936;--palette-soft-2:#293b38;--palette-soft-3:#243532;--palette-border:#3e5c57;--palette-map:#192825;--palette-highlight:#75aaa2}
html:root[data-theme="dark"][data-palette="slate"]{--warning:#f1a58d;--ink:#e2e9f0;--muted:#aab7c5;--green:#91b0ce;--line:#384a5d;--paper:#18202a;--surface:#222e3a;--lime:#9cb5cd;--palette-soft:#283848;--palette-soft-2:#2b3947;--palette-soft-3:#273441;--palette-border:#42576c;--palette-map:#1c2732;--palette-highlight:#84a1bd}
html:root[data-palette]{--i:var(--ink);--m:var(--muted);--p:var(--paper);--s:var(--surface);--l:var(--line);--a:var(--green)}
html:root[data-palette] .topbar{background:color-mix(in srgb,var(--surface) 82%,var(--paper))}
html:root[data-palette] .beta{background:var(--palette-soft);border-color:var(--palette-border)}
html:root[data-palette] .eyebrow,html:root[data-palette] .tiny-label{color:var(--palette-highlight)}
html:root[data-palette] .mode{background:var(--palette-soft-3)}
html:root[data-palette] .count{background:var(--palette-soft-2)}
html:root[data-palette] .doc-symbol{background:var(--palette-soft);border-color:var(--palette-border)}
html:root[data-palette] .add-document{border-color:var(--palette-border)}
html:root[data-palette] .stat:first-child{background:var(--palette-soft);border-color:var(--palette-border)}
html:root[data-palette] #map-container{background:var(--palette-map)}
html:root[data-palette] .map-toolbar{border-color:var(--line)}
html:root[data-palette] .filters button.active{background:var(--green);border-color:var(--green);color:var(--surface)}
html:root[data-theme="dark"][data-palette] .filters button.active{color:var(--paper)}
html:root[data-palette] dialog{background:color-mix(in srgb,var(--surface) 92%,var(--paper))}
html:root[data-palette] dialog select,html:root[data-palette] dialog input{border-color:var(--line)}
html:root[data-palette] .route{background:var(--palette-soft-2)}
html:root[data-palette] .primary{background:var(--green)}
html:root[data-theme="dark"][data-palette] .primary{color:var(--paper)}
html:root[data-palette] .palette-picker{display:flex;gap:8px;align-items:center;margin-top:10px;padding:2px 1px}
html:root[data-palette] .palette-swatch{width:18px;height:18px;min-width:18px;padding:0;border-radius:50%;border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);background:var(--swatch);position:relative;box-shadow:0 0 0 2px transparent;transition:transform .15s,box-shadow .15s}
html:root[data-palette] .palette-swatch:hover{transform:scale(1.08)}
html:root[data-palette] .palette-swatch[aria-checked="true"]{box-shadow:0 0 0 2px var(--surface),0 0 0 4px color-mix(in srgb,var(--ink) 48%,transparent)}
html:root[data-theme="dark"] .palette-swatch[data-palette="default"]{--swatch:#9cb5db}
@media(prefers-reduced-motion:reduce){html:root[data-palette] .palette-swatch{transition:none}}
`;
  document.head.appendChild(style);

  function themeValue(){return preference==='system'?(system.matches?'dark':'light'):preference;}
  function themeColour(theme,paletteName){
    const light={default:'#f7f8f5',amber:'#faf7f2',rose:'#faf6f7',violet:'#f8f6fa',teal:'#f5f8f7',slate:'#f5f7f9'};
    const dark={default:'#171e2b',amber:'#241d17',rose:'#191d25',violet:'#1f1b29',teal:'#162221',slate:'#18202a'};
    return (theme==='dark'?dark:light)[paletteName];
  }
  function apply() {
    const theme=themeValue();
    document.documentElement.dataset.theme=theme;
    document.documentElement.dataset.palette=palette;
    if(document.readyState!=='loading')document.documentElement.style.setProperty('--theme-mode',preference+' '+theme+' '+palette);
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta=>{meta.removeAttribute('media');meta.content=themeColour(theme,palette);});
    const select=document.querySelector('#theme-select');if(select)select.value=preference;
    document.querySelectorAll('.palette-swatch').forEach(button=>button.setAttribute('aria-checked',String(button.dataset.palette===palette)));
  }
  function buildPalettePicker(){
    const themeControl=document.querySelector('#header-menu .theme-control');
    if(!themeControl||document.querySelector('.palette-picker'))return;
    const picker=document.createElement('div');
    picker.className='palette-picker';picker.setAttribute('role','radiogroup');picker.setAttribute('aria-label','Accent colour');
    for(const id of palettes){
      const button=document.createElement('button');
      button.type='button';button.className='palette-swatch';button.dataset.palette=id;button.setAttribute('role','radio');button.setAttribute('aria-label',names[id]+' accent');button.style.setProperty('--swatch',swatches[id]);
      button.addEventListener('click',()=>{palette=id;try{localStorage.setItem(paletteKey,palette);}catch{}apply();});
      picker.appendChild(button);
    }
    themeControl.insertAdjacentElement('afterend',picker);
  }

  apply();
  system.addEventListener('change',apply);
  window.addEventListener('storage',event=>{
    if(event.key===themeKey||event.key===null)preference=validTheme(event.newValue);
    if(event.key===paletteKey||event.key===null)palette=validPalette(event.newValue);
    if(event.key===themeKey||event.key===paletteKey||event.key===null)apply();
  });
  document.addEventListener('DOMContentLoaded',()=>{
    buildPalettePicker();apply();
    const select=document.querySelector('#theme-select');
    if(select)select.addEventListener('change',event=>{preference=validTheme(event.target.value);try{localStorage.setItem(themeKey,preference);}catch{}apply();});
  });
})();
