/* Apply the local preference before styles paint; System remains the default. */
(function() {
  const key='portpass-theme',system=matchMedia('(prefers-color-scheme: dark)');
  const valid=value=>['system','light','dark'].includes(value)?value:'system';
  let preference='system';
  try{preference=valid(localStorage.getItem(key));}catch{}
  function apply() {
    const theme=preference==='system'?(system.matches?'dark':'light'):preference;
    document.documentElement.dataset.theme=theme;
    // Refresh inherited palette values after parsing and when the choice changes.
    if(document.readyState!=='loading')document.documentElement.style.setProperty('--theme-mode',preference+' '+theme);
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta=>{
      meta.removeAttribute('media');meta.content=theme==='dark'?'#171e2b':'#f7f8f5';
    });
    const select=document.querySelector('#theme-select');if(select)select.value=preference;
  }
  apply();
  system.addEventListener('change',apply);
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null){preference=valid(event.newValue);apply();}});
  document.addEventListener('DOMContentLoaded',()=>{
    apply();
    document.querySelector('#theme-select').addEventListener('change',event=>{
      preference=valid(event.target.value);
      try{localStorage.setItem(key,preference);}catch{}
      apply();
    });
  });
})();
