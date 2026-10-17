(function(){
  // Page-specific 3D DNA viewer integration (Sketchfab embed) with lazy loading and fallback
  if((document.body && document.body.dataset && document.body.dataset.page) !== 'dna-explorer') return;
  let container = document.getElementById('dna3dContainer');
  let frameHost = container && document.getElementById('dna3dFrame');
  let fallback = container && document.getElementById('dna3dFallback');
  let loadBtn = container && document.getElementById('dna3dLoad');
  const loadingNode = frameHost && frameHost.querySelector('.dna-3d-loading');
  let loaded = false;

  function createIframe(){
    // Respect reduced motion
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const params = ['autostart=0','ui_controls=1','ui_infos=0','preload=1'];
    if(!prefersReduced) params.push('autospin=0.6');
    const src = 'https://sketchfab.com/models/51f5ab2ffc364f60be00289eb6909535/embed?' + params.join('&');
    const iframe = document.createElement('iframe');
    iframe.title = 'DNA model by absolution on Sketchfab';
    iframe.src = src;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.border = '0';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; fullscreen; vr; xr-spatial-tracking';
    iframe.setAttribute('aria-label','Interactive three-dimensional model of the DNA double helix');
    return iframe;
  }

  function showFallback(){
    if(fallback) fallback.style.display = '';
    if(loadingNode) loadingNode.style.display = 'none';
  }

  function loadModel(){
    if(loaded) return; loaded = true;
    // ensure host references are current
    frameHost = document.getElementById('dna3dFrame') || frameHost;
    fallback = document.getElementById('dna3dFallback') || fallback;
    const currentLoading = frameHost && frameHost.querySelector('.dna-3d-loading');
    if(currentLoading) { currentLoading.style.display = ''; }
    // If frameHost isn't available yet, retry a few times before giving up
    if(!frameHost){
      let attempts = 0;
      const retry = setInterval(()=>{
        attempts++;
        frameHost = document.getElementById('dna3dFrame');
        if(frameHost || attempts > 8){
          clearInterval(retry);
          if(!frameHost){ console.warn('dna3dFrame not found; showing fallback'); showFallback(); return; }
          // proceed to create iframe now that frameHost exists
          tryCreateAndInsert();
        }
      }, 300);
      return;
    }
    tryCreateAndInsert();
  }

  function tryCreateAndInsert(){
    try{ window._dna3d_state = window._dna3d_state || {}; window._dna3d_state.called = true; }catch(e){}
    try{
      const iframe = createIframe();
      try{ window._dna3d_state.attempted = true; }catch(e){}
      const timeout = setTimeout(()=>{
        showFallback();
        console.warn('Sketchfab iframe load timeout, showing fallback.');
      }, 7000);
      iframe.onload = ()=>{
        clearTimeout(timeout);
        const fb = document.getElementById('dna3dFallback') || fallback;
        if(fb) fb.style.display = 'none';
        const ld = document.getElementById('dna3dFrame')?.querySelector('.dna-3d-loading') || loadingNode;
        if(ld) ld.style.display = 'none';
        try{ window._dna3d_state.iframeOnload = true; }catch(e){}
      };
      // append to the current frame host
      const host = document.getElementById('dna3dFrame') || frameHost;
      host.appendChild(iframe);
      try{ window._dna3d_state.iframeAppended = true; }catch(e){}
    }catch(err){
      console.warn('Failed to initialize Sketchfab iframe', err);
      try{ window._dna3d_state.error = String(err); }catch(e){}
      showFallback();
    }
  }

  // Lazy load when visible or when user clicks button.
  function attachObservers(){
    container = document.getElementById('dna3dContainer');
    frameHost = document.getElementById('dna3dFrame');
    fallback = document.getElementById('dna3dFallback');
    loadBtn = document.getElementById('dna3dLoad');
    if(!container) return false;
    if('IntersectionObserver' in window){
      const obs = new IntersectionObserver((entries, o)=>{
        entries.forEach(entry=>{ if(entry.isIntersecting){ loadModel(); o.disconnect(); } });
      },{threshold:0.15});
      obs.observe(container);
    }
    if(loadBtn) loadBtn.addEventListener('click', loadModel);
    return true;
  }

  // support delegated clicks in case the page content is injected after this script runs
  document.addEventListener('click', (e)=>{ if(e.target && e.target.id === 'dna3dLoad') loadModel(); });

  // Try attaching observers now or shortly after in case DOM was mutated by the main renderer
  if(!attachObservers()){
    const retryId = setInterval(()=>{ if(attachObservers()){ clearInterval(retryId); } }, 250);
    // stop retry after a few seconds
    setTimeout(()=>clearInterval(retryId), 8000);
  }

  // expose for debugging and manual invocation
  try{ window._dna3d_loadModel = loadModel; }catch(e){}

  // after a short delay, if the frame exists and no iframe present, try loading once (user may prefer manual click)
  setTimeout(()=>{
    const frame = document.getElementById('dna3dFrame');
    if(frame && !frame.querySelector('iframe')){
      // do not force-load; only prepare listeners. Keep this non-invasive.
      // attempt a single automatic load if the load button is marked with data-autoload
      const btn = document.getElementById('dna3dLoad');
      if(btn && btn.dataset && btn.dataset.autoload === 'true') btn.click();
    }
  }, 1200);

  // If scripts blocked or no JS, fallback will remain visible; also ensure fallback shown if WebGL not supported
  if(!window.WebGLRenderingContext){ showFallback(); }

})();