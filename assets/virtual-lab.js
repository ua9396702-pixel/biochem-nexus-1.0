(function(){
  const CHECK_INTERVAL = 150;
  function whenPageReady(cb){
    const id = setInterval(()=>{
      if(document.body.classList.contains('page-ready')){ clearInterval(id); cb(); }
    }, CHECK_INTERVAL);
    // safety
    setTimeout(()=>clearInterval(id), 10000);
  }

  const VL = {
    techniques: {},
    state: { current: null, selections: {}, playIndex:0, playing:false, speed:1 }
  };

  // Data-driven configs for each existing lab technique
  VL.techniques = {
    'pcr':{
      title:'PCR',
      key:'pcr',
      materials:{sample:['Genomic DNA','Plasmid DNA','cDNA'], polymerase:['Taq (standard)','High-fidelity polymerase','Hot-start Taq'], primerTm:['55°C','60°C','65°C'], mg:['1.5 mM','2.5 mM','4.0 mM']},
      steps:[{title:'Denaturation',desc:'Separate DNA strands by heating.'},{title:'Annealing',desc:'Primers bind to complementary sequence.'},{title:'Extension',desc:'Polymerase extends primers to make new DNA.'}],
      validate: function(sel){
        const tm = Number(sel.primerTm.replace('°C',''));
        const anneal = tm - 5; // ideal
        const chosenAnneal = Number(sel.annealTemp?.replace('°C','') || (tm-5));
        if(!sel.sample || !sel.polymerase || !sel.primerTm) return {status:'incorrect',step:'setup',hint:'Missing a required reagent or primer selection.'};
        const diff = Math.abs(chosenAnneal - anneal);
        if(diff===0 && sel.mg==='2.5 mM') return {status:'correct'};
        if(diff<=2) return {status:'suboptimal',hint:'Annealing temperature is near ideal but Mg2+ concentration could be optimised.'};
        return {status:'incorrect',hint:'Chosen annealing temperature is inappropriate for the primers and will reduce specificity.'};
      },
      animationSteps:function(){
        return this.steps.map(s=>({title:s.title,desc:s.desc}));
      }
    },
    'gel-electrophoresis':{
      title:'Gel Electrophoresis',key:'gel-electrophoresis',
      materials:{sampleSize:['100 bp','1,000 bp','5,000 bp'],agarose:['0.8%','1.0%','2.0%'],buffer:['TAE','TBE'],ladder:['Present','Absent'],voltage:['50 V','100 V','150 V']},
      steps:[{title:'Cast gel',desc:'Prepare gel matrix with correct percentage.'},{title:'Load samples',desc:'Load ladder and samples into wells.'},{title:'Run gel',desc:'Apply voltage to separate fragments.'},{title:'Stain and visualize',desc:'Stain the gel and interpret bands.'}],
      validate:function(sel){
        if(!sel.sampleSize || !sel.agarose) return {status:'incorrect',hint:'Select a sample size and gel percentage.'};
        const map = {'100 bp':'2.0%','1,000 bp':'1.0%','5,000 bp':'0.8%'};
        const ideal = map[sel.sampleSize];
        if(sel.agarose===ideal && sel.ladder==='Present' && Number(sel.voltage.split(' ')[0])<=120) return {status:'correct'};
        if(sel.agarose===ideal) return {status:'suboptimal',hint:'Consider adding a ladder and using a moderate voltage for best resolution.'};
        return {status:'incorrect',hint:'Gel percentage does not match fragment size, causing poor separation.'};
      },
      animationSteps:function(){return this.steps.map(s=>({title:s.title,desc:s.desc}));}
    },
    'elisa':{
      title:'ELISA',key:'elisa',materials:{format:['Sandwich','Indirect','Direct'],controls:['Positive control','Negative control','Blank'],incubation:['Room temp 1h','37°C 30min'],wash:['3 washes','1 wash','No wash']},
      steps:[{title:'Coating/Capture',desc:'Capture antibody immobilizes target.'},{title:'Blocking',desc:'Reduce non-specific binding.'},{title:'Detection',desc:'Add detection antibodies and substrate.'},{title:'Read',desc:'Measure signal and compare with standards.'}],
      validate:function(sel){ if(sel.format && sel.controls && sel.wash==='3 washes') return {status:'correct'}; if(sel.wash!=='3 washes') return {status:'suboptimal',hint:'Insufficient wash steps increase background.'}; return {status:'incorrect',hint:'Missing essential controls or detection reagents.'}; },
      animationSteps:function(){return this.steps.map(s=>({title:s.title,desc:s.desc}));}
    },
    'western-blot':{
      title:'Western Blot',key:'western-blot',materials:{gelPercent:['8%','10%','12%'],transfer:['Wet transfer','Semi-dry transfer'],primaryAntibody:['Anti-target 1:1000','Anti-target 1:5000'],loadingControl:['Actin','Tubulin','None']},
      steps:[{title:'SDS-PAGE',desc:'Separate proteins by size.'},{title:'Transfer',desc:'Move proteins to membrane.'},{title:'Blocking & probing',desc:'Probe with antibodies.'},{title:'Detection',desc:'Develop and image membrane.'}],
      validate:function(sel){ if(sel.loadingControl!=='None' && sel.transfer) return {status:'correct'}; if(sel.loadingControl==='None') return {status:'suboptimal',hint:'A loading control is recommended to compare lanes.'}; return {status:'incorrect',hint:'Missing transfer method or antibody selection.'}; },
      animationSteps:function(){return this.steps.map(s=>({title:s.title,desc:s.desc}));}
    },
    'spectrophotometry':{
      title:'Spectrophotometry',key:'spectrophotometry',materials:{wavelength:['260 nm','280 nm','595 nm'],blank:['Solvent blank','No blank'],dilution:['No dilution','1:10','1:100']},
      steps:[{title:'Blanking',desc:'Set baseline with blank.'},{title:'Measure sample',desc:'Read absorbance at chosen wavelength.'},{title:'Calculate concentration',desc:'Use Beer-Lambert law or standard curve.'}],
      validate:function(sel){ if(sel.blank==='Solvent blank' && sel.wavelength) return {status:'correct'}; if(sel.blank!=='Solvent blank') return {status:'suboptimal',hint:'Without a blank, readings may be inaccurate due to background.'}; return {status:'incorrect',hint:'Select a valid wavelength for your analyte.'}; },
      animationSteps:function(){return this.steps.map(s=>({title:s.title,desc:s.desc}));}
    },
    'chromatography':{
      title:'Chromatography',key:'chromatography',materials:{mode:['Affinity','Ion exchange','Size exclusion','Reverse phase'],mobilePhase:['Aqueous','Organic'],flowRate:['0.5 mL/min','1.0 mL/min','2.0 mL/min']},
      steps:[{title:'Load sample',desc:'Inject sample onto column.'},{title:'Separation',desc:'Components elute at different times.'},{title:'Detection',desc:'Collect fractions or detect peaks.'}],
      validate:function(sel){ if(sel.mode && sel.mobilePhase) return {status:'correct'}; return {status:'incorrect',hint:'Choose a chromatographic mode and compatible mobile phase.'}; },
      animationSteps:function(){return this.steps.map(s=>({title:s.title,desc:s.desc}));}
    },
    'microscopy':{
      title:'Microscopy',key:'microscopy',materials:{mode:['Brightfield','Fluorescence','Confocal'],stain:['None','H&E','DAPI'],objective:['10x','40x','100x']},
      steps:[{title:'Prepare sample',desc:'Mount and stain specimen appropriately.'},{title:'Choose objective',desc:'Select magnification and focus.'},{title:'Capture image',desc:'Acquire and interpret images.'}],
      validate:function(sel){ if(sel.mode && sel.objective) return {status:'correct'}; return {status:'incorrect',hint:'Select imaging mode and objective lens appropriate for specimen.'}; },
      animationSteps:function(){return this.steps.map(s=>({title:s.title,desc:s.desc}));}
    }
  };

  function renderVirtualLab(){
    const interactive = document.getElementById('interactive');
    if(!interactive) return; // bail if structure changed
    const container = document.createElement('div'); container.className='virtual-lab';
    container.innerHTML = `
      <div class="wrap vl-grid">
        <div class="vl-left vl-panel">
          <h3>Choose Procedure</h3>
          <div id="vlList" class="vl-list"></div>
        </div>
        <div class="vl-center vl-panel">
          <h3 id="vlTitle">Select a procedure</h3>
          <div class="vl-diagram" id="vlDiagram">Select a procedure to see the animated procedure.</div>
          <div id="vlSetup" class="vl-setup" aria-live="polite"></div>
          <div class="vl-controls" id="vlPlayControls" style="margin-top:10px;display:none">
            <button class="btn" id="vlPlay">Play</button>
            <button class="btn secondary" id="vlPause">Pause</button>
            <button class="btn" id="vlPrev">Prev</button>
            <button class="btn" id="vlNext">Next</button>
            <button class="btn" id="vlRestart">Restart</button>
            <label style="margin-left:8px">Speed <input id="vlSpeed" class="vl-speed" type="range" min="0.25" max="2" step="0.25" value="1"></label>
            <div style="margin-left:auto" id="vlStepIndicator" aria-live="polite"></div>
          </div>
        </div>
        <div class="vl-right vl-panel">
          <h3>Validation & Results</h3>
          <div id="vlValidation" class="vl-result">Make selections to validate your setup.</div>
          <div style="height:12px"></div>
          <div id="vlResults" class="vl-result" style="margin-top:8px">No results yet.</div>
          <div style="height:12px"></div>
          <div id="vlReferences" class="vl-result" style="margin-top:8px"></div>
        </div>
      </div>
    `;
    // replace interactive content
    interactive.innerHTML = '';
    interactive.appendChild(container);

    // populate list
    const vlList = document.getElementById('vlList');
    Object.values(VL.techniques).forEach(t=>{
      const item = document.createElement('button'); item.type='button'; item.className='vl-item'; item.innerHTML = `<div><strong>${t.title}</strong><div class="muted" style="font-size:12px">${t.key}</div></div>`;
      item.addEventListener('click', ()=> selectTechnique(t.key, item));
      vlList.appendChild(item);
    });

    // wire controls
    document.getElementById('vlPlay').addEventListener('click', ()=> play());
    document.getElementById('vlPause').addEventListener('click', ()=> pause());
    document.getElementById('vlPrev').addEventListener('click', ()=> step(-1));
    document.getElementById('vlNext').addEventListener('click', ()=> step(1));
    document.getElementById('vlRestart').addEventListener('click', ()=> restart());
    document.getElementById('vlSpeed').addEventListener('input', (e)=>{ VL.state.speed = Number(e.target.value); });

    // keyboard accessibility
    container.addEventListener('keydown', (e)=>{
      if(e.key===' ' || e.key==='Enter'){ const focused = document.activeElement; if(focused && focused.classList.contains('vl-item')) focused.click(); }
    });
  }

  function selectTechnique(key, elButton){
    VL.state.current = key; VL.state.selections = {}; VL.state.playIndex = 0; VL.state.playing = false;
    // update active class
    document.querySelectorAll('.vl-item').forEach(b=>b.classList.remove('active'));
    if(elButton) elButton.classList.add('active');
    // populate title, diagram, setup
    const t = VL.techniques[key];
    document.getElementById('vlTitle').textContent = t.title;
    const diagramBox = document.getElementById('vlDiagram'); diagramBox.innerHTML = `<div style="text-align:center;max-width:360px">${renderTechniqueSVG(key)}</div>`;
    const setup = document.getElementById('vlSetup'); setup.innerHTML = '';
    // create inputs from materials
    Object.entries(t.materials).forEach(([name,opts])=>{
      const fld = document.createElement('div'); fld.className='vl-field'; fld.innerHTML = `<label>${capitalize(name)}</label>`;
      if(Array.isArray(opts)){
        const sel = document.createElement('select'); sel.id = 'vl-field-'+name; opts.forEach(o=>{ const optEl = document.createElement('option'); optEl.value = o; optEl.textContent = o; sel.appendChild(optEl); });
        sel.addEventListener('change', ()=>{ VL.state.selections[name]=sel.value; validateAndRender(); });
        fld.appendChild(sel);
      }
      // some techniques might need additional numeric inputs: for PCR annealing temp
      if(key==='pcr' && name==='primerTm'){
        const anneal = document.createElement('select'); anneal.id='vl-field-annealTemp'; anneal.innerHTML = '<option>50°C</option><option>55°C</option><option>58°C</option><option>60°C</option><option>62°C</option><option>65°C</option>';
        anneal.addEventListener('change', ()=>{ VL.state.selections['annealTemp']=anneal.value; validateAndRender(); }); fld.appendChild(anneal);
      }
      setup.appendChild(fld);
    });
    // show play controls
    document.getElementById('vlPlayControls').style.display='flex';
    // show references
    const refBox = document.getElementById('vlReferences'); const refs = (window.BN && window.BN.topicPages && window.BN.topicPages[key] && window.BN.topicPages[key].refs) || [];
    refBox.innerHTML = `<strong>References</strong><ul>${refs.map(r=>`<li class="muted">${r}</li>`).join('')}</ul>`;
    validateAndRender();
  }

  function capitalize(s){ return s.replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }

  function validateAndRender(){
    const key = VL.state.current; if(!key) return;
    const t = VL.techniques[key];
    const selections = VL.state.selections;
    // default set selects values for all fields present
    Object.keys(t.materials).forEach(name=>{ if(!selections[name]){ const el = document.getElementById('vl-field-'+name); if(el) selections[name]=el.value; } });
    // call validate
    const result = t.validate(selections || {});
    const valBox = document.getElementById('vlValidation'); valBox.innerHTML = '';
    const status = document.createElement('div');
    if(result.status==='correct'){ status.className='vl-status correct'; status.innerHTML=`✅ Correct setup.`; }
    else if(result.status==='suboptimal'){ status.className='vl-status suboptimal'; status.innerHTML=`⚠️ Suboptimal — ${result.hint || ''}`; }
    else { status.className='vl-status incorrect'; status.innerHTML=`❌ Incorrect — ${result.hint || 'Review selections.'}`; }
    valBox.appendChild(status);
    // show configured selections
    const summary = document.createElement('div'); summary.style.marginTop='8px'; summary.innerHTML = `<strong>Selections</strong><ul>${Object.entries(selections).map(([k,v])=>`<li><strong>${capitalize(k)}</strong>: ${v}</li>`).join('')}</ul>`;
    valBox.appendChild(summary);
    // results placeholder
    const resBox = document.getElementById('vlResults'); resBox.innerHTML = '';
    // enable run only if not incorrect
    const canRun = result.status !== 'incorrect';
    const runBtn = document.createElement('button'); runBtn.className='btn'; runBtn.textContent='Run Experiment'; runBtn.disabled = !canRun;
    runBtn.addEventListener('click', ()=> runExperiment(key, selections, result));
    resBox.appendChild(runBtn);
    if(!canRun){ const help = document.createElement('div'); help.className='muted'; help.style.marginTop='8px'; help.textContent='Fix incorrect selections before running. Hints are shown above.'; resBox.appendChild(help); }
    // update step indicator
    updateStepIndicator();
  }

  function runExperiment(key, selections, validateResult){
    // start animation sequence
    VL.state.playIndex = 0; VL.state.playing = true; VL.state.selections = selections;
    document.getElementById('vlPlayControls').style.display='flex';
    play();
    // prepare result area
    const resBox = document.getElementById('vlResults'); resBox.innerHTML = `<div class="vl-result">Running: <strong>${VL.techniques[key].title}</strong></div>`;
    // compute expected result quickly
    const outcome = computeOutcome(key, selections, validateResult);
    // show result at end of animation
    // animation runner will call finish when done
    VL.state.onFinish = ()=>{ showFinalResult(key, selections, outcome); };
  }

  function computeOutcome(key, selections, validation){
    // basic mapping: correct -> expected success; suboptimal -> partial; incorrect -> fail
    if(validation.status==='correct') return {grade:'success',message:'Expected result achieved.'};
    if(validation.status==='suboptimal') return {grade:'partial',message:'Suboptimal choices reduced efficiency or clarity of result.'};
    return {grade:'fail',message:'Experiment likely failed or produced ambiguous results.'};
  }

  function showFinalResult(key, selections, outcome){
    const resBox = document.getElementById('vlResults');
    const refs = (window.BN && window.BN.topicPages && window.BN.topicPages[key] && window.BN.topicPages[key].refs) || [];
    resBox.innerHTML = `<div class="vl-result"><h4>Result — ${outcome.grade === 'success' ? 'Success' : outcome.grade === 'partial' ? 'Suboptimal' : 'Failure'}</h4><p class="muted">${outcome.message}</p><div style="margin-top:8px"><strong>Procedure summary</strong><ul>${Object.entries(selections).map(([k,v])=>`<li><strong>${capitalize(k)}</strong>: ${v}</li>`).join('')}</ul></div><div style="margin-top:8px"><strong>References</strong><ul>${refs.map(r=>`<li class="muted">${r}</li>`).join('')}</ul></div><div style="margin-top:8px"><button class="btn" id="vlRestartExp">Restart Experiment</button></div></div>`;
    document.getElementById('vlRestartExp').addEventListener('click', ()=>{ restartExperiment(); });
    // also call any learning feedback
    const valBox = document.getElementById('vlValidation');
    if(outcome.grade!=='success'){
      const learn = document.createElement('div'); learn.style.marginTop='8px'; learn.innerHTML = `<strong>Learning note:</strong> ${outcome.grade==='partial' ? 'Some choices reduced the clarity or efficiency of the result — review hints and try again.' : 'Review your reagent choices, volumes, and conditions. Check controls and repeat with corrected setup.'}`;
      valBox.appendChild(learn);
    }
  }

  function restartExperiment(){
    VL.state.playIndex = 0; VL.state.playing = false; VL.state.onFinish = null; validateAndRender();
    document.getElementById('vlDiagram').innerHTML = `<div style="text-align:center;max-width:360px">${renderTechniqueSVG(VL.state.current)}</div>`;
  }

  // animation controls: very lightweight simulated step progression
  let animationTimer = null;
  function play(){ if(!VL.state.current) return; VL.state.playing=true; runAnimationLoop(); }
  function pause(){ VL.state.playing=false; if(animationTimer) clearTimeout(animationTimer); }
  function step(dir){ const t = VL.techniques[VL.state.current]; if(!t) return; VL.state.playIndex = Math.max(0, Math.min(t.animationSteps().length-1, VL.state.playIndex + dir)); renderAnimationFrame(); }
  function restart(){ VL.state.playIndex = 0; renderAnimationFrame(); }
  function runAnimationLoop(){ if(!VL.state.playing) return; const t = VL.techniques[VL.state.current]; if(!t) return; const steps = t.animationSteps(); renderAnimationFrame(); if(VL.state.playIndex < steps.length - 1){ animationTimer = setTimeout(()=>{ VL.state.playIndex++; runAnimationLoop(); }, 1200 / VL.state.speed); } else { // finished
      VL.state.playing = false; if(typeof VL.state.onFinish === 'function') VL.state.onFinish(); }
  }
  function renderAnimationFrame(){ const key = VL.state.current; const t = VL.techniques[key]; if(!t) return; const steps = t.animationSteps(); const idx = VL.state.playIndex; document.getElementById('vlDiagram').classList.add('pulse'); setTimeout(()=>document.getElementById('vlDiagram').classList.remove('pulse'), 600);
    document.getElementById('vlDiagram').innerHTML = `<div style="text-align:left;max-width:520px"><h4>Step ${idx+1} of ${steps.length} — ${steps[idx].title}</h4><p class="muted">${steps[idx].desc}</p><div style="height:8px"></div>${renderTechniqueSVG(key, idx)}</div>`;
    updateStepIndicator();
  }
  function updateStepIndicator(){ const t = VL.techniques[VL.state.current]; if(!t) return; const total = t.animationSteps().length; const idx = VL.state.playIndex; document.getElementById('vlStepIndicator').textContent = `Step ${idx+1} of ${total}`; }

  function renderTechniqueSVG(key, stepIndex=0){ // lightweight SVG placeholders leveraging existing styles in bionexus.js where possible
    // Use different SVG shells per technique; do not fabricate details but provide realistic visuals
    if(key==='pcr') return `<svg viewBox="0 0 520 220" width="100%"><rect x="40" y="36" width="120" height="148" rx="12" fill="#fff" stroke="#cbd5e1"></rect><rect x="200" y="36" width="120" height="148" rx="12" fill="#fff" stroke="#cbd5e1"></rect><rect x="360" y="36" width="120" height="148" rx="12" fill="#fff" stroke="#cbd5e1"></rect><text x="72" y="24" fill="#64748b">Denaturation</text><text x="232" y="24" fill="#64748b">Annealing</text><text x="392" y="24" fill="#64748b">Extension</text><circle cx="100" cy="120" r="8" fill="#14b8a6" ${stepIndex===0? 'opacity="1"' : 'opacity="0.18"'}></circle><circle cx="260" cy="120" r="8" fill="#3b82f6" ${stepIndex===1? 'opacity="1"' : 'opacity="0.18"'}></circle><circle cx="420" cy="120" r="8" fill="#06b6d4" ${stepIndex===2? 'opacity="1"' : 'opacity="0.18"'}></circle></svg>`;
    if(key==='gel-electrophoresis') return `<svg viewBox="0 0 520 220"><rect x="80" y="36" width="360" height="148" rx="8" fill="#f8fafc" stroke="#e6f6ff"></rect>${[110,164,218,272,326,380].map((x,i)=>`<rect x="${x}" y="64" width="28" height="120" rx="6" fill="#e6f6ff"></rect><path d="M${x+10} ${120 - (i+ (stepIndex*4))}" stroke="#3b82f6" stroke-width="8" stroke-linecap="round"></path>`).join('')}</svg>`;
    if(key==='elisa') return `<svg viewBox="0 0 520 220"><rect x="90" y="60" width="110" height="100" rx="10" fill="#fff" stroke="#cbd5e1"></rect><rect x="220" y="60" width="110" height="100" rx="10" fill="#fff" stroke="#cbd5e1"></rect><rect x="350" y="60" width="80" height="100" rx="10" fill="#fff" stroke="#cbd5e1"></rect><text x="120" y="40" fill="#64748b">Capture</text><text x="250" y="40" fill="#64748b">Detection</text><text x="380" y="40" fill="#64748b">Signal</text></svg>`;
    if(key==='western-blot') return `<svg viewBox="0 0 520 220"><rect x="150" y="40" width="220" height="140" rx="8" fill="#fff" stroke="#cbd5e1"></rect><path d="M180 90h160" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"></path><path d="M180 122h120" stroke="#14b8a6" stroke-width="12" stroke-linecap="round"></path></svg>`;
    if(key==='spectrophotometry') return `<svg viewBox="0 0 520 220"><rect x="80" y="60" width="120" height="100" rx="10" fill="#fff" stroke="#cbd5e1"></rect><rect x="220" y="60" width="100" height="100" rx="6" fill="#fff" stroke="#cbd5e1"></rect><path d="M340 160c20-40 40-60 80-40" stroke="#3b82f6" stroke-width="3" fill="none"></path><text x="100" y="48" fill="#64748b">Cuvette</text><text x="240" y="48" fill="#64748b">Detector</text></svg>`;
    if(key==='chromatography') return `<svg viewBox="0 0 520 220"><rect x="120" y="48" width="80" height="140" rx="10" fill="#fff" stroke="#cbd5e1"></rect><rect x="220" y="48" width="180" height="140" rx="10" fill="#fff" stroke="#cbd5e1"></rect><path d="M120 160c80-20 130-40 260-40" stroke="#06b6d4" stroke-width="4" fill="none"></path></svg>`;
    if(key==='microscopy') return `<svg viewBox="0 0 520 220"><rect x="80" y="40" width="140" height="140" rx="12" fill="#fff" stroke="#cbd5e1"></rect><rect x="260" y="40" width="160" height="140" rx="12" fill="#fff" stroke="#cbd5e1"></rect><circle cx="330" cy="110" r="30" stroke="#3b82f6" stroke-width="4" fill="#fff"></circle><text x="100" y="32" fill="#64748b">Stage</text><text x="320" y="32" fill="#64748b">Objective</text></svg>`;
    return `<div class="muted">Visualization not available</div>`;
  }

  // Initialization
  whenPageReady(()=>{
    // only run on virtual-lab page
    const page = (window.location.pathname.split('/').pop() || '').replace(/\.html$/,'');
    if(page !== 'virtual-lab') return;
    renderVirtualLab();
    // keyboard: space toggles play/pause
    window.addEventListener('keydown',(e)=>{
      if(e.code==='Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'){
        e.preventDefault(); const btn = VL.state.playing ? document.getElementById('vlPause') : document.getElementById('vlPlay'); btn && btn.click();
      }
    });
  });
})();
