(function(){
  const CHECK_INTERVAL = 120;
  function whenPageReady(cb){
    const id = setInterval(()=>{ if(document.body.classList.contains('page-ready')){ clearInterval(id); cb(); } }, CHECK_INTERVAL);
    setTimeout(()=>clearInterval(id), 10000);
  }

  const Engine = {
    experiments: {},
    state: { current:null, selections:{}, step:0, playing:false, speed:1, onFinish:null }
  };

  // Helper utilities
  function capitalize(s){ return (s||'').toString().replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  // Define experiments in a data-driven way. Each experiment defines materials, UI fields, validation, steps, animation and result logic.
  Engine.experiments = {
    'pcr':{
      id:'pcr', title:'PCR', refs:(window.BN && window.BN.topicPages && window.BN.topicPages.pcr && window.BN.topicPages.pcr.refs) || [],
      fields:[
        {name:'sample',label:'Sample',type:'select',options:['E. coli DNA (K-12)','Bacillus subtilis DNA','Human genomic DNA','Positive control','Negative control','Unknown sample']},
        {name:'polymerase',label:'Polymerase',type:'select',options:['Taq (standard)','Hot-start Taq','High-fidelity polymerase']},
        {name:'primerTm',label:'Primer Tm',type:'select',options:['52°C','55°C','58°C','60°C','62°C']},
        {name:'annealTemp',label:'Annealing temp',type:'number',min:45,max:68,step:1,default:55},
        {name:'mg',label:'MgCl2',type:'select',options:['1.5 mM','2.5 mM','4.0 mM']},
        {name:'cycles',label:'Cycles',type:'number',min:20,max:40,step:1,default:30}
      ],
      steps:function(sel){ return [
        {key:'prep',title:'Prepare master mix',desc:'Combine polymerase, primers, dNTPs, buffer and template.'},
        {key:'load',title:'Load into thermal cycler',desc:'Place tubes into thermal cycler wells.'},
        {key:'cycles',title:'Thermal cycling',desc:`Run ${sel.cycles || 30} cycles of denaturation, annealing and extension.`},
        {key:'detect',title:'Detection',desc:'Visualize product on gel or read qPCR signal.'}
      ]; },
      validate:function(sel){
        if(!sel.sample || !sel.polymerase || !sel.primerTm) return {status:'incorrect',hint:'Missing sample, polymerase or primer Tm.'};
        const tm = Number((sel.primerTm||'55').replace('°C',''));
        const anneal = Number(sel.annealTemp || (tm-5));
        const diff = Math.abs(anneal - (tm-5));
        if(diff<=2 && sel.mg==='2.5 mM' && sel.polymerase!=='Taq (standard)') return {status:'correct'};
        if(diff<=3) return {status:'suboptimal',hint:'Annealing temperature near ideal; enzyme choice or Mg2+ may be suboptimal.'};
        return {status:'incorrect',hint:'Annealing temperature poorly matched to primer Tm; expect non-specific bands or low yield.'};
      },
      // animation frame generator: returns SVG for each step reflecting selections
      frame:function(sel,stepIndex){
        const steps = this.steps(sel);
        const step = steps[stepIndex] || steps[steps.length-1];
        const sampleLabel = (sel.sample||'Sample').replace('(low copy)','').replace('(high copy)','').trim();
        const enzyme = sel.polymerase || '';
        const cycleText = `Cycles: ${sel.cycles||30}`;
        // stepIndex mapping: 0=prep (pipette),1=load (move tubes),2=cycles (thermocycler active),3=detect (show gel icon)
        const pipetteClass = stepIndex===0? 'pipette animate' : 'pipette';
        const tubeY = stepIndex===1? 40 : 0; // move tube down to indicate loading
        // layout for tubes: responsive spacing within rack width (220)
        const rackWidth = 220;
        const tubeCount = 4;
        const tubeWidth = 32;
        const rackPad = 12;
        const gap = Math.max(8, Math.floor((rackWidth - rackPad*2 - tubeWidth*tubeCount)/(tubeCount-1)));
        const tubeX = (i) => rackPad + i*(tubeWidth + gap);
        const cyclerActive = stepIndex===2 ? true : false;
        const thermColor = cyclerActive? '#fde68a' : '#e6eefc';
        return `
          <div class="vl-canvas vl-scene" role="img" aria-label="PCR bench and thermal cycler">
            <svg viewBox="0 0 720 360" width="100%">
              <defs>
                <linearGradient id="glass" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#e6eef7" stop-opacity="0.9"/></linearGradient>
              </defs>
              <rect x="0" y="0" width="720" height="360" fill="#ffffff"/>
              <!-- lab bench -->
              <g class="lab-bench" transform="translate(20,200)">
                <rect x="0" y="0" width="680" height="140" rx="8" fill="url(#glass)" stroke="#e6eef7"></rect>
              </g>
              <!-- tube rack -->
              <g transform="translate(60,120)">
                <rect x="0" y="0" width="220" height="100" rx="6" fill="#f3f4f6" stroke="#e6eef7"></rect>
                ${[0,1,2,3].map((i)=>`<g class="tube" transform="translate(${tubeX(i)},${10 + tubeY})"><rect x="0" y="0" width="${tubeWidth}" height="72" rx="6" fill="#ffffff" stroke="#cbd5e1"></rect><rect class="tube-liquid" x="6" y="${42}" width="${Math.max(12, tubeWidth-12)}" height="${18}" rx="3" fill="#dbeafe"></rect><g class="tube-label"><rect x="${-8}" y="78" width="${tubeWidth+16}" height="20" rx="4" fill="rgba(255,255,255,0.9)"></rect><text x="${tubeWidth/2}" y="92" font-size="10" fill="#475569" text-anchor="middle" style="pointer-events:none;white-space:pre-wrap">${i===0? sampleLabel : i===1? enzyme : 'Mix'}</text></g></g>`).join('')}
              </g>
              <!-- pipette (animated during prep) -->
              <g transform="translate(360,80)"><g class="${pipetteClass}" >
                <rect x="0" y="0" width="10" height="80" rx="4" fill="#111827"></rect>
                <rect x="-6" y="-8" width="22" height="8" rx="3" fill="#94a3b8"></rect>
              </g></g>
              <!-- thermal cycler -->
              <g transform="translate(520,80)">
                <rect x="0" y="0" width="160" height="120" rx="8" fill="${thermColor}" stroke="#c7d2fe"></rect>
                <rect x="18" y="18" width="124" height="68" rx="6" fill="#f8fafc" stroke="#e6eef7"></rect>
                <text x="8" y="105" font-size="12" fill="#0f172a">Thermal Cycler</text>
                <text x="8" y="120" font-size="10" fill="#64748b">${cycleText}</text>
              </g>
              <!-- step label -->
              <g transform="translate(40,24)"><text x="0" y="0" font-size="14" fill="#0f172a">${step.title}</text><text x="0" y="18" font-size="12" fill="#64748b">${step.desc}</text></g>
            </svg>
          </div>`;
      },
      result:function(sel,validation){
        // simple quantitative model: base yield depends on sample copy number and validation
        const copy = (sel.sample||'').includes('high')? 1000 : (sel.sample||'').includes('low')? 10 : 100;
        const enzymeFactor = sel.polymerase && sel.polymerase.includes('High-fidelity')?1.0: sel.polymerase && sel.polymerase.includes('Hot-start')?1.1:0.9;
        const cycleFactor = clamp((sel.cycles||30)/30,0.5,2);
        const quality = validation.status==='correct'?1.0: validation.status==='suboptimal'?0.5:0.15;
        const yieldValue = Math.round(copy * enzymeFactor * cycleFactor * quality);
        // band visibility logic
        const bands = [];
        if(yieldValue>800) bands.push({pos:80,intensity:0.95});
        if(yieldValue>200) bands.push({pos:140,intensity:0.8});
        if(yieldValue>50) bands.push({pos:200,intensity:0.6});
        const success = validation.status==='correct' && yieldValue>100;
        return {grade: success? 'success' : (validation.status==='suboptimal'? 'partial' : 'fail'), yield:yieldValue, bands};
      },
      interpret:function(sel,validation,outcome){
        const expected = 'A clear band at expected size if primers match the template.';
        let why = '';
        if(outcome.grade==='success') why = 'Good enzyme choice, annealing temperature and Mg2+ produced efficient amplification.';
        else if(outcome.grade==='partial') why = 'Amplification occurred but yield or specificity reduced by suboptimal conditions.';
        else why = 'Poor annealing temperature, wrong enzyme, or low input template led to minimal amplification.';
        return {result:outcome, expected, observed:`Yield ~ ${outcome.yield}`, interpretation:why, improvements:'Adjust annealing temperature, increase template concentration, or switch to a more suitable polymerase.'};
      }
    },

    'gel-electrophoresis':{
      id:'gel-electrophoresis', title:'Gel Electrophoresis', refs:(window.BN && window.BN.topicPages && window.BN.topicPages['gel-electrophoresis'] && window.BN.topicPages['gel-electrophoresis'].refs) || [],
      fields:[
        {name:'sample',label:'Sample',type:'select',options:['PCR product 100 bp','PCR product 1,000 bp','Genomic digest 5,000 bp','Positive control','Negative control','Unknown sample']},
        {name:'agarose',label:'Agarose %',type:'select',options:['0.8%','1.0%','2.0%']},
        {name:'ladder',label:'Ladder',type:'select',options:['Present','Absent']},
        {name:'voltage',label:'Voltage (V)',type:'select',options:['50','100','150']}
      ],
      steps:function(sel){ return [
        {key:'cast',title:'Prepare gel',desc:`Cast ${sel.agarose||'1.0%'} agarose gel.`},
        {key:'load',title:'Load samples',desc:'Load ladder and samples into wells carefully.'},
        {key:'run',title:'Run gel',desc:`Run at ${sel.voltage||100} V until separation visible.`},
        {key:'stain',title:'Stain & image',desc:'Stain the gel and visualize bands under UV.'}
      ]; },
      validate:function(sel){ if(!sel.sample || !sel.agarose) return {status:'incorrect',hint:'Select sample and agarose percentage.'}; const ideal = sel.sample.includes('100')? '2.0%' : sel.sample.includes('1,000')? '1.0%' : '0.8%'; if(sel.agarose===ideal && sel.ladder==='Present') return {status:'correct'}; if(sel.agarose===ideal) return {status:'suboptimal',hint:'Add ladder for size comparison.'}; return {status:'incorrect',hint:'Gel percentage mismatched to fragment size; expect poor resolution.'}; },
      frame:function(sel,stepIndex){
        const wells = 6; const frag = sel.sample || ''; const size = frag.includes('100')?100: frag.includes('1,000')?1000:frag.includes('5,000')?5000:300;
        const loading = stepIndex===1; const running = stepIndex===2; const staining = stepIndex===3;
        // build wells and pipette; animate migration by shifting band positions when running
        const bandOffset = running? (stepIndex===2? 40 : 0) : 0;
        return `
          <div class="vl-canvas vl-scene" role="img" aria-label="Gel electrophoresis setup">
            <svg viewBox="0 0 720 360" width="100%">
              <rect x="0" y="0" width="720" height="360" fill="#fff"/>
              <!-- gel tank -->
              <g transform="translate(60,60)">
                <rect x="0" y="0" width="420" height="220" rx="8" fill="#f8fafc" stroke="#e6eef7"></rect>
                <text x="8" y="-6" font-size="13" fill="#0f172a">Gel tank</text>
                <!-- wells -->
                ${Array.from({length:wells}).map((_,i)=>`<g transform="translate(${20 + i*60},16)"><rect x="0" y="0" width="36" height="18" rx="3" fill="#e6f6ff"></rect></g>`).join('')}
                <!-- sample band (will move when running) -->
                <g transform="translate(0,40)">${renderGelBands(size, sel.agarose, running? 6: stepIndex)}</g>
              </g>
              <!-- pipette for loading -->
              <g transform="translate(520,120)"><g class="pipette ${loading? 'animate':''}"><rect x="0" y="0" width="10" height="80" rx="4" fill="#111827"></rect></g></g>
              <!-- label -->
              <g transform="translate(60,28)"><text x="0" y="0" font-size="14" fill="#0f172a">${this.steps(sel)[stepIndex].title}</text><text x="0" y="18" font-size="12" fill="#64748b">${this.steps(sel)[stepIndex].desc}</text></g>
            </svg>
          </div>`;
      },
      result:function(sel,validation){ const size = sel.sample && sel.sample.includes('100')?100: sel.sample && sel.sample.includes('1,000')?1000:5000; const resolutionOk = (sel.agarose==='2.0%' && size<=200) || (sel.agarose==='1.0%' && size<=2000) || (sel.agarose==='0.8%' && size>2000); const success = validation.status==='correct' && resolutionOk; return {grade: success? 'success': (validation.status==='suboptimal' ? 'partial' : 'fail'), size, resolutionOk}; },
      interpret:function(sel,validation,outcome){ const expected = `Bands at expected positions according to fragment size.`; let obs=''; if(outcome.grade==='success') obs='Clear discrete bands at expected migration distances.'; else if(outcome.grade==='partial') obs='Bands visible but ladder missing or faint; sizing approximate.'; else obs='Smearing or no clear bands; poor separation or loading error.'; const why = outcome.grade==='success'? 'Gel % and ladder appropriate.' : outcome.grade==='partial'? 'Missing ladder reduces sizing confidence.' : 'Wrong gel %, high voltage or degraded sample.'; return {result:outcome, expected, observed:obs, interpretation:why, improvements:'Use appropriate gel %, include ladder, reduce voltage or improve loading technique.'}; }
    },

    'spectrophotometry':{
      id:'spectrophotometry', title:'Spectrophotometry', refs:(window.BN && window.BN.topicPages && window.BN.topicPages.spectrophotometry && window.BN.topicPages.spectrophotometry.refs) || [],
      fields:[{name:'sample',label:'Sample',type:'select',options:['Nucleic acid solution (DNA)','Protein assay solution','Blank only','Unknown sample']},{name:'wavelength',label:'Wavelength (nm)',type:'select',options:['260','280','595']},{name:'blank',label:'Blank',type:'select',options:['Solvent blank','No blank']},{name:'dilution',label:'Dilution',type:'select',options:['1','1:10','1:100']}],
      steps:function(){ return [{key:'blank',title:'Blank the instrument',desc:'Place blank and zero the absorbance.'},{key:'measure',title:'Measure sample',desc:'Place cuvette and record absorbance.'},{key:'calc',title:'Calculate concentration',desc:'Apply Beer-Lambert or standard curve.'}]; },
      validate:function(sel){ if(sel.blank==='Solvent blank') return {status:'correct'}; return {status:'suboptimal',hint:'Blanking improves accuracy; without blank expect background.'}; },
      frame:function(sel,stepIndex){
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const w = sel.wavelength||260;
        const dilution = sel.dilution||'1';
        const base = dilution==='1:100'?0.15: dilution==='1:10'?0.95: 1.8;
        const absVal = (base * (w==260?0.9: w==280?0.8:0.65)).toFixed(2);
        const step = this.steps()[stepIndex] ? this.steps()[stepIndex].title : 'Measure sample';
        const beamOpacity = reduced?0.6:0.95;
        const cuvetteFill = `rgba(59,130,246,${Math.min(0.95, 0.2 + Number(absVal)/3)})`;
        return `
          <div class="vl-canvas vl-scene" role="img" aria-label="Spectrophotometer scene">
            <svg viewBox="0 0 720 360" width="100%">
              <rect x="0" y="0" width="720" height="360" fill="#fff"/>
              <g transform="translate(60,60)">
                <rect x="0" y="0" width="360" height="220" rx="10" fill="#f8fafc" stroke="#e6eef7"></rect>
                <rect x="28" y="32" width="120" height="120" rx="6" fill="#fff" stroke="#cbd5e1"></rect>
                <text x="160" y="24" font-size="14" fill="#0f172a">Spectrophotometer</text>
                <text x="160" y="44" font-size="12" fill="#64748b">Mode: ${sel.blank||'Blanking'}</text>
                <text x="160" y="60" font-size="12" fill="#64748b">Wavelength: ${w} nm</text>
                <text x="160" y="76" font-size="12" fill="#64748b">Dilution: ${dilution}</text>
                <g transform="translate(36,40)">
                  <rect x="8" y="8" width="84" height="96" rx="6" fill="#f1f5f9" stroke="#e6eef7"></rect>
                  <g transform="translate(20,20)"><rect x="0" y="0" width="44" height="72" rx="6" fill="${cuvetteFill}" stroke="#cbd5e1"></rect></g>
                </g>
                <g transform="translate(180,80)">
                  <rect x="0" y="28" width="120" height="12" fill="rgba(99,102,241,0.06)"/>
                  <rect x="0" y="24" width="120" height="4" fill="rgba(99,102,241,${beamOpacity})"></rect>
                  <circle cx="140" cy="30" r="18" fill="#eef2ff" stroke="#c7d2fe"></circle>
                  <text x="170" y="36" font-size="12" fill="#0f172a">Detector</text>
                </g>
                <g transform="translate(360,24)">
                  <rect x="0" y="0" width="160" height="56" rx="6" fill="#fff" stroke="#e6eef7"></rect>
                  <text x="12" y="20" font-size="12" fill="#0f172a">${step}</text>
                  <text x="12" y="40" font-size="18" font-weight="600" fill="#0f172a">Abs: ${absVal}</text>
                </g>
              </g>
            </svg>
          </div>`;
      },
      result:function(sel,validation){ const base = sel.wavelength==='260'?50: sel.wavelength==='280'?40: 10; const dilution = sel.dilution==='1:100'?0.01: sel.dilution==='1:10'?0.1:1; const value = Math.round(base * dilution * (validation.status==='correct'?1:0.6)); return {grade: validation.status==='correct'? 'success':'partial', value}; },
      interpret:function(sel,validation,outcome){ const expected='Absorbance proportional to concentration within linear range.'; const obs=`Measured value ${outcome.value} (arbitrary units).`; const why = validation.status==='correct'? 'Blanking and correct dilution used.' : 'No blank or poor dilution can bias result.'; return {result:outcome, expected, observed:obs, interpretation:why, improvements:'Use proper blank and adjust dilution to stay within linear range.'}; }
    },

    'elisa':{
      id:'elisa', title:'ELISA', refs:(window.BN && window.BN.topicPages && window.BN.topicPages.elisa && window.BN.topicPages.elisa.refs) || [],
      fields:[{name:'sample',label:'Sample',type:'select',options:['Patient serum (positive)','Patient serum (negative)','Positive control','Negative control','Unknown sample']},{name:'format',label:'Format',type:'select',options:['Sandwich','Indirect','Direct']},{name:'controls',label:'Controls',type:'select',options:['Positive and negative','Only negative','None']},{name:'wash',label:'Wash steps',type:'select',options:['3 washes','1 wash','No wash']},{name:'incubation',label:'Incubation',type:'select',options:['Room temp 1h','37°C 30min']}],
      steps:function(){ return [{key:'coat',title:'Coating',desc:'Capture antibody binds to plate.'},{key:'block',title:'Blocking',desc:'Block to reduce background.'},{key:'detect',title:'Detection',desc:'Add detection antibody and substrate.'},{key:'read',title:'Read',desc:'Measure absorbance.'}]; },
      validate:function(sel){ if(sel.controls && sel.controls.includes('Positive') && sel.wash==='3 washes') return {status:'correct'}; if(sel.wash!=='3 washes') return {status:'suboptimal',hint:'Insufficient washes increase background.'}; return {status:'incorrect',hint:'Missing controls or detection reagents.'}; },
      frame:function(sel,stepIndex){
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const steps=this.steps(); const step=steps[stepIndex]||steps[steps.length-1];
        const washFactor = sel.wash && sel.wash.includes('3')?1: sel.wash && sel.wash.includes('1')?0.6:0.25;
        const baseSignal = sel.format==='Sandwich'?100: sel.format==='Indirect'?70:40;
        const signal = Math.round(baseSignal * washFactor * (sel.controls && sel.controls.includes('Positive')?1:0.7));
        const intensity = Math.min(1, Math.max(0, signal/120));
        const color = `rgba(220, 38, 38, ${intensity})`;
        return `
          <div class="vl-canvas vl-scene" role="img" aria-label="ELISA plate and pipetting">
            <svg viewBox="0 0 720 360" width="100%">
              <rect x="0" y="0" width="720" height="360" fill="#fff"/>
              <g transform="translate(60,60)">
                <text x="0" y="0" font-size="14" fill="#0f172a">ELISA — ${sel.format || 'Format'}</text>
                <g transform="translate(0,20)">
                  ${[0,1,2,3].map((r)=>`<g transform="translate(${r*80},0)">${[0,1,2,3].map((c)=>`<g transform="translate(${c*40},${r*40})"><rect x="0" y="0" width="36" height="36" rx="6" fill="#fff" stroke="#e6eef7"></rect><circle cx="18" cy="18" r="12" fill="${r===0&&c===0? color : r===0&&c===1? 'rgba(220,38,38,0.9)': r===0&&c===2? 'rgba(120,120,120,0.3)': 'rgba(200,200,200,0.12)'}"></circle></g>`).join('')}</g>`).join('')}
                </g>
                <g transform="translate(380,40)">
                  <rect x="0" y="0" width="240" height="120" rx="6" fill="#f8fafc" stroke="#e6eef7"></rect>
                  <text x="12" y="20" font-size="12" fill="#0f172a">Step: ${step.title}</text>
                  <text x="12" y="40" font-size="12" fill="#64748b">${step.desc}</text>
                  <text x="12" y="68" font-size="14" fill="#0f172a">Abs: ${signal}</text>
                </g>
              </g>
            </svg>
          </div>`;
      },
      result:function(sel,validation){ const baseSignal = sel.format==='Sandwich'?100: sel.format==='Indirect'?70:40; const washFactor = sel.wash==='3 washes'?1: sel.wash==='1 wash'?0.6:0.25; const ctrl = sel.controls && sel.controls.includes('Positive'); const signal = Math.round(baseSignal * washFactor * (validation.status==='correct'?1:0.6)); return {grade: ctrl && validation.status==='correct'? 'success': (validation.status==='suboptimal'? 'partial':'fail'), signal}; },
      interpret:function(sel,validation,outcome){ const expected='A strong signal in positive wells and low background in negatives.'; const obs=`Signal: ${outcome.signal}`; const why = outcome.grade==='success'? 'Appropriate controls and wash steps produced clear signal.' : outcome.grade==='partial'? 'Some background due to insufficient washes.' : 'Poor controls/washing led to high background or low signal.'; return {result:outcome, expected, observed:obs, interpretation:why, improvements:'Improve wash steps, include appropriate controls, and verify antibody specificity.'}; }
    },

    'western-blot':{
      id:'western-blot', title:'Western Blot', refs:(window.BN && window.BN.topicPages && window.BN.topicPages['western-blot'] && window.BN.topicPages['western-blot'].refs) || [],
      fields:[{name:'sample',label:'Sample',type:'select',options:['Lysate A (HeLa)','Lysate B (E. coli)','Positive control','Negative control','Unknown sample']},{name:'gelPercent',label:'Gel %',type:'select',options:['8%','10%','12%']},{name:'transfer',label:'Transfer',type:'select',options:['Wet transfer','Semi-dry transfer']},{name:'primary',label:'Primary antibody',type:'select',options:['Anti-target 1:1000','Anti-target 1:5000']},{name:'loadingControl',label:'Loading control',type:'select',options:['Actin','Tubulin','None']}],
      steps:function(){ return [{key:'separate',title:'SDS-PAGE',desc:'Separate proteins by size.'},{key:'transfer',title:'Transfer',desc:'Transfer proteins to membrane.'},{key:'probe',title:'Probe',desc:'Probe with primary and secondary antibodies.'},{key:'detect',title:'Detect',desc:'Visualize bands.'}]; },
      validate:function(sel){ if(sel.loadingControl!=='None' && sel.transfer) return {status:'correct'}; if(sel.loadingControl==='None') return {status:'suboptimal',hint:'Add a loading control to allow lane comparisons.'}; return {status:'incorrect',hint:'Missing transfer or antibody selection.'}; },
      frame:function(sel,stepIndex){
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const stepsArr = this.steps(); const step = stepsArr[stepIndex]||stepsArr[stepsArr.length-1];
        const hasLoadingControl = sel.loadingControl && sel.loadingControl!=='None';
        const showTransfer = stepIndex>=1; // after separation
        const detectPhase = stepIndex>=2;
        const bandOpacity = detectPhase? 0.95 : detectPhase===false && stepIndex===1? 0.6 : 0.25;
        const lanes = 4;
        const bands = Array.from({length:lanes}).map((_,i)=>`<rect x="${i*48 + 60}" y="${60 + i*6}" width="16" height="12" rx="2" fill="#0f172a" opacity="${bandOpacity}"></rect>`).join('');
        return `
          <div class="vl-canvas vl-scene" role="img" aria-label="Western blot transfer and detection">
            <svg viewBox="0 0 720 360" width="100%">
              <rect x="0" y="0" width="720" height="360" fill="#fff"/>
              <g transform="translate(40,40)">
                <text x="0" y="0" font-size="14" fill="#0f172a">Western Blot — ${sel.gelPercent || ''}</text>
                <g transform="translate(0,20)">
                  <rect x="40" y="20" width="340" height="180" rx="6" fill="#f8fafc" stroke="#e6eef7"></rect>
                  ${bands}
                </g>
                <g transform="translate(420,40)"><text x="0" y="0" font-size="12" fill="#64748b">${step.title}</text><text x="0" y="18" font-size="12" fill="#64748b">${step.desc}</text></g>
                ${showTransfer? '<g transform="translate(420,96)"><rect x="0" y="0" width="120" height="60" rx="6" fill="#fff" stroke="#cbd5e1"></rect><text x="8" y="18" font-size="12" fill="#0f172a">Transfer unit</text></g>':''}
                ${hasLoadingControl? '<text x="48" y="220" font-size="11" fill="#0f172a">Loading control: present</text>':'<text x="48" y="220" font-size="11" fill="#ef4444">No loading control</text>'}
              </g>
            </svg>
          </div>`;
      },
      result:function(sel,validation){ const bands = sel.loadingControl==='None'? false: true; const success = validation.status==='correct' && bands; return {grade: success? 'success': (validation.status==='suboptimal' ? 'partial' : 'fail'), bands}; },
      interpret:function(sel,validation,outcome){ const expected='Distinct protein bands at expected sizes with loading control present.'; const obs = outcome.bands? 'Bands visible; loading control present.' : 'Weak signal or missing loading control.'; const why = outcome.grade==='success'? 'Good transfer and antibody specificity.' : outcome.grade==='partial'? 'Signal present but controls missing or weak.' : 'Transfer or antibody issues.'; return {result:outcome, expected, observed:obs, interpretation:why, improvements:'Ensure efficient transfer, use proper antibody dilutions and include loading controls.'}; }
    },

    'chromatography':{
      id:'chromatography', title:'Chromatography', refs:(window.BN && window.BN.topicPages && window.BN.topicPages.chromatography && window.BN.topicPages.chromatography.refs) || [],
      fields:[{name:'sample',label:'Sample',type:'select',options:['Mixture A (3 components)','Mixture B (2 components)','Standard mix','Unknown sample']},{name:'mode',label:'Mode',type:'select',options:['Affinity','Ion exchange','Size exclusion','Reverse phase']},{name:'mobilePhase',label:'Mobile phase',type:'select',options:['Aqueous','Organic']},{name:'flowRate',label:'Flow rate',type:'select',options:['0.5','1.0','2.0']}],
      steps:function(){ return [{key:'inject',title:'Inject sample',desc:'Inject the sample onto the column.'},{key:'separate',title:'Separation',desc:'Components separate by affinity or size.'},{key:'detect',title:'Detection',desc:'Monitor detector output.'}]; },
      validate:function(sel){ if(sel.mode && sel.mobilePhase) return {status:'correct'}; return {status:'incorrect',hint:'Choose a chromatographic mode and mobile phase.'}; },
      frame:function(sel,stepIndex){
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mode = sel.mode||'Mode'; const flow = sel.flowRate||'1.0';
        const running = stepIndex>=1; const peaks = sel.mode==='Size exclusion'?3: sel.mode==='Affinity'?2: sel.mode==='Ion exchange'?3:2;
        const peakHtml = Array.from({length:peaks}).map((_,i)=>`<path d="M ${20 + i*80} 120 C ${20 + i*80} ${80 - i*8} ${40 + i*80} ${40} ${60 + i*80} 120" stroke="#0ea5a3" stroke-width="3" fill="none" opacity="${running?1:0.25}"></path>`).join('');
        return `
          <div class="vl-canvas vl-scene" role="img" aria-label="Chromatography column and detector">
            <svg viewBox="0 0 720 360" width="100%">
              <rect x="0" y="0" width="720" height="360" fill="#fff"/>
              <g transform="translate(40,40)">
                <text x="0" y="0" font-size="14" fill="#0f172a">Chromatography — ${mode} | Flow ${flow} mL/min</text>
                <g transform="translate(0,20)">
                  <rect x="20" y="22" width="80" height="220" rx="6" fill="#f8fafc" stroke="#e6eef7"></rect>
                  <rect x="116" y="60" width="520" height="180" rx="6" fill="#fff" stroke="#e6eef7"></rect>
                  <text x="28" y="16" font-size="11" fill="#64748b">Column</text>
                  <g transform="translate(120,80)">${peakHtml}</g>
                </g>
                <g transform="translate(560,40)"><text x="0" y="0" font-size="12" fill="#64748b">Detector</text></g>
              </g>
            </svg>
          </div>`;
      },
      result:function(sel,validation){ const peaks = sel.mode==='Size exclusion'?3: sel.mode==='Affinity'?2: sel.mode==='Ion exchange'?3:2; const quality = validation.status==='correct'? 'good':'poor'; return {grade: validation.status==='correct'? 'success':'partial', peaks, quality}; },
      interpret:function(sel,validation,outcome){ const expected='Separated peaks representing components; retention times reflect properties.'; const obs=`${outcome.peaks} peaks detected; quality ${outcome.quality}.`; const why = validation.status==='correct'? 'Appropriate mobile phase and mode.' : 'Mobile phase or mode mismatch caused poor separation.'; return {result:outcome, expected, observed:obs, interpretation:why, improvements:'Adjust mobile phase, flow rate, or column selection.'}; }
    },

    'microscopy':{
      id:'microscopy', title:'Microscopy', refs:(window.BN && window.BN.topicPages && window.BN.topicPages.microscopy && window.BN.topicPages.microscopy.refs) || [],
      fields:[{name:'sample',label:'Sample',type:'select',options:['E. coli smear','HeLa cells stained','Tissue section H&E','Unknown sample']},{name:'mode',label:'Mode',type:'select',options:['Brightfield','Fluorescence','Confocal']},{name:'stain',label:'Stain',type:'select',options:['None','H&E','DAPI']},{name:'objective',label:'Objective',type:'select',options:['10x','40x','100x']}],
      steps:function(){ return [{key:'prep',title:'Prepare slide',desc:'Mount sample and apply stain if needed.'},{key:'focus',title:'Focus and choose objective',desc:'Select objective and focus image.'},{key:'capture',title:'Capture image',desc:'Acquire and interpret image.'}]; },
      validate:function(sel){ if(sel.mode && sel.objective) return {status:'correct'}; return {status:'incorrect',hint:'Choose imaging mode and objective lens.'}; },
      frame:function(sel,stepIndex){
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const stain = sel.stain||'None'; const objective = sel.objective||'10x'; const mode = sel.mode||'Brightfield';
        const clarity = objective==='100x'? 'high': objective==='40x'? 'moderate':'low';
        const zoom = objective==='100x'?1.6: objective==='40x'?1.2:1.0;
        const fieldColor = stain==='DAPI'? '#c7d2fe' : stain==='H&E'? '#fde68a' : '#ffffff';
        return `
          <div class="vl-canvas vl-scene" role="img" aria-label="Microscope and slide">
            <svg viewBox="0 0 720 360" width="100%">
              <rect x="0" y="0" width="720" height="360" fill="#fff"/>
              <g transform="translate(40,40)">
                <text x="0" y="0" font-size="14" fill="#0f172a">Microscopy — ${mode} | ${objective}</text>
                <g transform="translate(40,20)">
                  <rect x="0" y="40" width="180" height="140" rx="8" fill="#f8fafc" stroke="#e6eef7"></rect>
                  <rect x="24" y="20" width="48" height="24" rx="4" fill="#111827"></rect>
                  <g transform="translate(220,60)"><rect x="0" y="0" width="240" height="120" rx="6" fill="#fff" stroke="#e6eef7"></rect><circle cx="120" cy="60" r="${60 * zoom}" fill="${fieldColor}" stroke="#cbd5e1"></circle></g>
                  <g transform="translate(220,196)"><text x="0" y="14" font-size="12" fill="#64748b">Clarity: ${clarity}</text></g>
                </g>
              </g>
            </svg>
          </div>`;
      },
      result:function(sel,validation){ const clarity = sel.objective==='100x'? 'high': sel.objective==='40x'? 'moderate':'low'; const success = validation.status==='correct'; return {grade: success? 'success':'partial', clarity}; },
      interpret:function(sel,validation,outcome){ const expected='Image showing specimen structures appropriate for stain and magnification.'; const obs=`Image clarity: ${outcome.clarity}`; const why = outcome.grade==='success'? 'Appropriate mode and objective used.' : 'Change objective or staining for better contrast.'; return {result:outcome, expected, observed:obs, interpretation:why, improvements:'Choose stain and objective suited to target structures.'}; }
    }
  };

  // helper to render gel band patterns
  function renderGelBands(size, agarose, stepIndex){
    // create a few bands; position depends on size; larger sizes are higher (near top)
    const basePos = size<=200? 200: size<=2000? 140: 80;
    const bands = [{x:20,y:basePos},{x:80,y:basePos+20},{x:140,y:basePos+8}];
    return bands.map((b,i)=>`<rect x="${b.x}" y="${b.y - (i*6 + stepIndex*1)}" width="80" height="6" rx="2" fill="#1e293b" opacity="${0.6 + i*0.12}"></rect>`).join('');
  }

  // Render the Virtual Lab UI into the existing interactive section
  function renderUI(){
    const interactive = document.getElementById('interactive'); if(!interactive) return;
    const container = document.createElement('div'); container.className='virtual-lab';
    container.innerHTML = `
      <div class="wrap vl-grid">
        <div class="vl-left vl-panel">
          <h3>Choose Procedure</h3>
          <div id="vlList" class="vl-list" role="list"></div>
        </div>
        <div class="vl-center vl-panel">
          <h3 id="vlTitle">Select a procedure</h3>
          <div id="vlDiagram" class="vl-diagram" aria-live="polite">Select a procedure to begin configuration.</div>
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
    interactive.innerHTML = ''; interactive.appendChild(container);

    const list = document.getElementById('vlList');
    Object.values(Engine.experiments).forEach(exp=>{
      const btn = document.createElement('button'); btn.type='button'; btn.className='vl-item'; btn.setAttribute('role','listitem'); btn.innerHTML = `<div><strong>${exp.title}</strong><div class="muted" style="font-size:12px">${exp.id}</div></div>`;
      btn.addEventListener('click', ()=> selectExperiment(exp.id, btn));
      list.appendChild(btn);
    });

    // control wiring
    document.getElementById('vlPlay').addEventListener('click', ()=> play());
    document.getElementById('vlPause').addEventListener('click', ()=> pause());
    document.getElementById('vlPrev').addEventListener('click', ()=> step(-1));
    document.getElementById('vlNext').addEventListener('click', ()=> step(1));
    document.getElementById('vlRestart').addEventListener('click', ()=> restart());
    document.getElementById('vlSpeed').addEventListener('input', (e)=>{ Engine.state.speed = Number(e.target.value); });

    // keyboard accessibility
    container.addEventListener('keydown', (e)=>{
      if((e.key===' ' || e.key==='Enter') && document.activeElement && document.activeElement.classList.contains('vl-item')){ e.preventDefault(); document.activeElement.click(); }
    });
  }

  function selectExperiment(id, el){
    Engine.state.current = id; Engine.state.selections = {}; Engine.state.step = 0; Engine.state.playing = false; Engine.state.onFinish = null;
    document.querySelectorAll('.vl-item').forEach(b=>b.classList.remove('active'));
    if(el) el.classList.add('active');
    const exp = Engine.experiments[id];
    document.getElementById('vlTitle').textContent = exp.title;
    document.getElementById('vlDiagram').innerHTML = exp.frame({},0);
    renderSetupForm(exp);
    const refs = exp.refs || [];
    document.getElementById('vlReferences').innerHTML = `<strong>References</strong><ul>${refs.map(r=>`<li class="muted">${r}</li>`).join('')}</ul>`;
    document.getElementById('vlPlayControls').style.display='flex';
    validateAndUpdate();
  }

  function renderSetupForm(exp){
    const container = document.getElementById('vlSetup'); container.innerHTML = '';
    const form = document.createElement('form'); form.className='vl-form'; form.addEventListener('change', (e)=>{ handleFieldChange(e, exp); });
    exp.fields.forEach(field=>{
      const row = document.createElement('div'); row.className='vl-field';
      const label = document.createElement('label'); label.textContent = field.label; row.appendChild(label);
      if(field.type==='select'){
        const sel = document.createElement('select'); sel.id = `vl-${exp.id}-${field.name}`;
        field.options.forEach(opt=>{ const o = document.createElement('option'); o.value = opt; o.textContent = opt; sel.appendChild(o); });
        sel.value = field.options[0];
        row.appendChild(sel);
      } else if(field.type==='number'){
        const inp = document.createElement('input'); inp.type='number'; inp.id=`vl-${exp.id}-${field.name}`; if(field.min) inp.min=field.min; if(field.max) inp.max=field.max; if(field.step) inp.step=field.step; inp.value=field.default||field.min||0; row.appendChild(inp);
      }
      form.appendChild(row);
    });
    // run button
    const runRow = document.createElement('div'); runRow.style.marginTop='8px'; const runBtn = document.createElement('button'); runBtn.type='button'; runBtn.className='btn'; runBtn.id='vlRun'; runBtn.textContent='Run Experiment'; runBtn.addEventListener('click', ()=> startExperiment()); runRow.appendChild(runBtn); form.appendChild(runRow);
    container.appendChild(form);
    // If primerTm and annealTemp are present, set anneal default to primerTm-5 and keep them linked
    const primerId = `vl-${exp.id}-primerTm`;
    const annealId = `vl-${exp.id}-annealTemp`;
    const primerEl = document.getElementById(primerId);
    const annealEl = document.getElementById(annealId);
    if(primerEl && annealEl){
      const setAnnealDefault = ()=>{
        const tm = Number(String(primerEl.value).replace(/[^0-9.-]/g,'')) || null;
        if(tm){ annealEl.value = String(Math.max(Number(annealEl.min||45), tm - 5)); annealEl.dispatchEvent(new Event('change',{bubbles:true})); }
      };
      setAnnealDefault();
      primerEl.addEventListener('change', setAnnealDefault);
    }
  }

  // Read current form values for an experiment into a selections object
  function gatherSelections(exp){
    const sel = {};
    const container = document.getElementById('vlSetup');
    if(!container) return sel;
    const prefix = `vl-${exp.id}-`;
    container.querySelectorAll('select, input[type=number]').forEach(el=>{
      if(!el.id) return;
      let key = el.id;
      if(key.indexOf(prefix)===0) key = key.slice(prefix.length);
      else key = el.id.split('-').slice(2).join('-');
      sel[key] = el.value;
    });
    // sensible default: if primerTm provided but annealTemp is not intentionally set, set annealTemp to primerTm-5
    if(sel.primerTm && (!sel.annealTemp || String(sel.annealTemp).trim()==='')){
      const tm = Number(String(sel.primerTm).replace(/[^0-9.-]/g,'')) || null;
      if(tm) sel.annealTemp = String(Math.max(45, tm - 5));
    }
    return sel;
  }

  function handleFieldChange(e, exp){
    const target = e.target; if(!target || !Engine.state.current) return;
    const id = Engine.state.current; const prefix = `vl-${id}-`;
    // read all fields for this experiment
    const selections = {};
    exp.fields.forEach(f=>{ const el = document.getElementById(prefix+f.name); if(!el) return; selections[f.name] = el.value; });
    Engine.state.selections = selections;
    validateAndUpdate();
  }

  function validateAndUpdate(){ const id = Engine.state.current; if(!id) return; const exp = Engine.experiments[id]; const sel = gatherSelections(exp); Engine.state.selections = sel; const validation = exp.validate(sel);
    // update validation box
    const vbox = document.getElementById('vlValidation'); vbox.innerHTML = '';
    const status = document.createElement('div'); status.className = `vl-status ${validation.status}`; status.innerHTML = `${validation.status==='correct'? '✅ Correct': validation.status==='suboptimal'? '⚠️ Suboptimal' : '❌ Incorrect'} ${validation.hint? '- ' + validation.hint : ''}`;
    vbox.appendChild(status);
    const summary = document.createElement('div'); summary.className='vl-summary'; summary.style.marginTop='8px'; summary.innerHTML = `<strong>Selections</strong><ul>${Object.entries(sel).map(([k,v])=>`<li><strong>${capitalize(k)}</strong>: ${v}</li>`).join('')}</ul>`;
    vbox.appendChild(summary);
    // enable/disable run
    const runBtn = document.getElementById('vlRun'); if(runBtn) runBtn.disabled = validation.status==='incorrect';
    // render diagram preview
    const diag = document.getElementById('vlDiagram'); diag.innerHTML = exp.frame(sel, Engine.state.step || 0);
  }

  // Experiment control functions
  let animTimer = null;
  function startExperiment(){ const id = Engine.state.current; if(!id) return; const exp = Engine.experiments[id]; const sel = Engine.state.selections || {}; const validation = exp.validate(sel); Engine.state.step = 0; Engine.state.playing = true; Engine.state.onFinish = ()=>{ finishExperiment(id, sel, validation); };
    document.getElementById('vlResults').innerHTML = `<div class="muted">Running ${exp.title}...</div>`;
    play();
  }
  function play(){ if(!Engine.state.current) return; Engine.state.playing = true; runLoop(); }
  function pause(){ Engine.state.playing = false; if(animTimer) clearTimeout(animTimer); }
  function step(dir){ const id = Engine.state.current; if(!id) return; const exp = Engine.experiments[id]; const steps = exp.steps(Engine.state.selections||{}); Engine.state.step = clamp(Engine.state.step + dir, 0, steps.length-1); renderStep(); }
  function restart(){ Engine.state.step = 0; renderStep(); }

  function runLoop(){ if(!Engine.state.playing) return; const id = Engine.state.current; if(!id) return; const exp = Engine.experiments[id]; const steps = exp.steps(Engine.state.selections||{});
    renderStep(); if(Engine.state.step < steps.length -1){ animTimer = setTimeout(()=>{ Engine.state.step++; runLoop(); }, 1200 / Engine.state.speed); } else { Engine.state.playing = false; if(typeof Engine.state.onFinish === 'function') Engine.state.onFinish(); } }

  function renderStep(){ const id = Engine.state.current; if(!id) return; const exp = Engine.experiments[id]; const sel = Engine.state.selections || {}; const stepIndex = Engine.state.step; const steps = exp.steps(sel); const step = steps[stepIndex]; document.getElementById('vlDiagram').innerHTML = exp.frame(sel, stepIndex); document.getElementById('vlStepIndicator').textContent = `Step ${stepIndex+1} of ${steps.length} — ${step.title}`; }

  function finishExperiment(id, sel, validation){
    const exp = Engine.experiments[id];
    const outcome = exp.result(sel, validation);
    const interp = exp.interpret(sel, validation, outcome);
    const resultsBox = document.getElementById('vlResults');

    // determine sample identity if unknown
    let revealedSample = null;
    if(sel && sel.sample && sel.sample.toLowerCase().includes('unknown')){
      // choose a plausible hidden sample from the experiment's sample options
      const sampleField = (exp.fields || []).find(f=>f.name==='sample');
      const pool = (sampleField && sampleField.options)||[];
      const candidates = pool.filter(s => !/unknown|positive|negative/i.test(s));
      revealedSample = candidates.length? candidates[Math.floor(Math.random()*candidates.length)] : 'Unknown';
    }

    // Visual result area generated per experiment type
    let visualHtml = '<div class="muted">No visual available for this technique.</div>';
    try{
      if(id==='pcr') visualHtml = renderPCRResult(exp, sel, validation, outcome, revealedSample);
      else if(id==='gel-electrophoresis') visualHtml = renderGelResult(exp, sel, validation, outcome, revealedSample);
      else if(id==='spectrophotometry') visualHtml = renderSpectrumResult(exp, sel, validation, outcome, revealedSample);
      else if(id==='elisa') visualHtml = renderELISAResult(exp, sel, validation, outcome, revealedSample);
      else if(id==='western-blot') visualHtml = renderWesternResult(exp, sel, validation, outcome, revealedSample);
      else if(id==='chromatography') visualHtml = renderChromatogramResult(exp, sel, validation, outcome, revealedSample);
      else if(id==='microscopy') visualHtml = renderMicroscopyResult(exp, sel, validation, outcome, revealedSample);
    } catch(err){ visualHtml = `<div class="muted">Visualization error: ${err.message}</div>`; }

    resultsBox.innerHTML = `
      <div>
        <h4>Result — ${interp.result.grade.toUpperCase()}</h4>
        <div class="vl-visual">${visualHtml}</div>
        <p class="muted"><strong>Expected:</strong> ${interp.expected}</p>
        <p class="muted"><strong>Observed:</strong> ${interp.observed}</p>
        <p class="muted"><strong>Interpretation:</strong> ${interp.interpretation}</p>
        <p style="margin-top:8px"><strong>Recommendations:</strong> ${interp.improvements}</p>
        <div style="margin-top:8px"><button class="btn" id="vlRestartExp">Restart Experiment</button> <button class="btn secondary" id="vlTryAgain">Try Again</button>` + (revealedSample? ` <button class="btn" id="vlReveal">Reveal Sample</button>` : '') + `</div>
      </div>`;

    document.getElementById('vlRestartExp').addEventListener('click', ()=>{ Engine.state.step=0; Engine.state.playing=false; validateAndUpdate(); document.getElementById('vlResults').innerHTML='No results yet.'; });
    document.getElementById('vlTryAgain').addEventListener('click', ()=>{ Engine.state.step=0; Engine.state.playing=false; validateAndUpdate(); startExperiment(); });
    if(revealedSample){ document.getElementById('vlReveal').addEventListener('click', ()=>{ alert('Actual sample: ' + revealedSample); }); }
  }

  // -- Visualization renderers --
  function renderPCRResult(exp, sel, validation, outcome, revealed){
    // amplification curve: y-scale by outcome.yield
    const yieldVal = outcome.yield || 0;
    const maxY = Math.max(200, yieldVal*1.2);
    const points = [];
    const cycles = Number(sel.cycles||30);
    for(let i=0;i<=cycles;i+=Math.ceil(cycles/10)){
      const x = Math.round((i/cycles)*300);
      // simulate exponential-looking curve depending on yield
      const noise = 1 + (Math.random()*0.08);
      const y = Math.round((1 - Math.exp(-i/(cycles/6))) * (yieldVal/maxY) * 120 * noise);
      points.push([x,120 - y]);
    }
    const path = points.map((p,i)=>`${i===0?'M':'L'} ${40 + p[0]} ${40 + p[1]}`).join(' ');
    // endpoint gel from outcome.bands
    const bandsHtml = (outcome.bands || []).map((b,i)=>`<rect x="${40 + i*80}" y="${220 - (i*20)}" width="40" height="8" rx="2" fill="#0f172a" opacity="${b.intensity||0.6}"></rect>`).join('');
    return `<div><svg viewBox="0 0 520 280" width="100%"><rect x="0" y="0" width="520" height="280" fill="#fff"/><g transform="translate(20,20)"><text x="0" y="12" fill="#0f172a">Amplification curve</text><path d="${path}" stroke="#059669" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"></path><g transform="translate(0,140)"><text x="0" y="0" fill="#64748b" font-size="12">Endpoint gel</text><rect x="0" y="8" width="480" height="80" rx="4" fill="#f8fafc" stroke="#e6eef7"></rect>${bandsHtml}</g></g></svg><div style="margin-top:8px"><strong>Yield:</strong> ${yieldVal} (relative units)</div>${revealed?`<div style="margin-top:4px" class="muted">Hidden sample likely: ${revealed}</div>`:''}</div>`;
  }

  function renderGelResult(exp, sel, validation, outcome, revealed){
    // create gel lanes and band positions based on sample selection
    const sizeMap = {'PCR product 100 bp':100,'PCR product 1,000 bp':1000,'Genomic digest 5,000 bp':5000,'Positive control':100,'Negative control':0};
    const size = sizeMap[sel.sample] || 300;
    const laneBands = [{pos: mapSizeToY(size), intensity: validation.status==='correct'?0.95: validation.status==='suboptimal'?0.6:0.25}];
    const ladderHtml = sel.ladder==='Present'? Array.from({length:6}).map((_,i)=>`<rect x="${10}" y="${20 + i*18}" width="8" height="6" fill="#94a3b8"></rect>`).join('') : '';
    const bandsHtml = laneBands.map((b,i)=>`<rect x="${80}" y="${b.pos}" width="220" height="8" rx="2" fill="#0f172a" opacity="${b.intensity}"></rect>`).join('');
    function mapSizeToY(sz){ if(sz<=200) return 32; if(sz<=2000) return 72; return 112; }
    return `<div><svg viewBox="0 0 420 200" width="100%"><rect x="0" y="0" width="420" height="200" fill="#fff"/><g transform="translate(20,20)"><text x="0" y="12" fill="#0f172a">Simulated Gel</text><rect x="40" y="24" width="280" height="120" rx="6" fill="#f8fafc" stroke="#e6eef7"></rect>${ladderHtml}${bandsHtml}</g></svg>${revealed?`<div class="muted">Hidden sample guessed: ${revealed}</div>`:''}</div>`;
  }

  function renderSpectrumResult(exp, sel, validation, outcome, revealed){
    const value = outcome.value || 0;
    // simple bar gauge
    const h = Math.min(180, 10 + value*3);
    return `<div style="display:flex;align-items:center"><svg viewBox="0 0 200 120" width="200"><rect x="0" y="0" width="200" height="120" fill="#fff"/><rect x="40" y="20" width="40" height="${h}" y="${100 - h}" rx="4" fill="#2563eb"></rect><text x="90" y="60" fill="#0f172a">Abs: ${value}</text></svg><div style="margin-left:12px"><strong>Wavelength:</strong> ${sel.wavelength} nm<br><strong>Dilution:</strong> ${sel.dilution}</div></div>${revealed?`<div class="muted">Hidden sample: ${revealed}</div>`:''}`;
  }

  function renderELISAResult(exp, sel, validation, outcome, revealed){
    // show 4 wells: sample, positive, negative, blank
    const signal = outcome.signal || 0;
    const intensity = Math.min(1, Math.max(0, signal/120));
    const color = `rgba(220, 38, 38, ${intensity})`;
    return `<div><svg viewBox="0 0 320 120" width="100%"><g transform="translate(20,20)"><text x="0" y="12" fill="#0f172a">ELISA plate (sample, +ctrl, -ctrl, blank)</text>${[0,1,2,3].map((i)=>`<circle cx="${30 + i*70}" cy="60" r="18" fill="${i===0? color : i===1? 'rgba(220,38,38,0.9)': i===2? 'rgba(120,120,120,0.3)': 'rgba(200,200,200,0.15)'}" stroke="#cbd5e1"></circle>`).join('')}</g></svg><div style="margin-top:6px"><strong>Absorbance:</strong> ${signal}</div>${revealed?`<div class="muted">Hidden sample: ${revealed}</div>`:''}</div>`;
  }

  function renderWesternResult(exp, sel, validation, outcome, revealed){
    // membrane with 4 lanes
    const lanes = 4;
    const bandHtml = outcome.result && outcome.result.bands? '<rect x="60" y="60" width="16" height="12" fill="#0f172a"></rect>': (outcome.grade==='partial'? '<rect x="60" y="80" width="16" height="8" fill="#0f172a" opacity="0.6"></rect>': '');
    return `<div><svg viewBox="0 0 320 200" width="100%"><rect x="10" y="10" width="300" height="180" rx="6" fill="#f8fafc" stroke="#e6eef7"/><g transform="translate(40,30)">${Array.from({length:lanes}).map((_,i)=>`<rect x="${i*48}" y="0" width="28" height="140" rx="2" fill="#fff" stroke="#e6eef7"></rect>`).join('')}${bandHtml}</g></svg>${revealed?`<div class="muted">Hidden sample: ${revealed}</div>`:''}</div>`;
  }

  function renderChromatogramResult(exp, sel, validation, outcome, revealed){
    const peaks = outcome.peaks || 2;
    const peaksHtml = Array.from({length:peaks}).map((_,i)=>`<path d="M ${20 + i*60} 120 C ${20 + i*60} ${80 - i*8} ${40 + i*60} ${40} ${60 + i*60} 120" stroke="#0ea5a3" stroke-width="3" fill="none"></path>`).join('');
    return `<div><svg viewBox="0 0 420 160" width="100%"><rect x="0" y="0" width="420" height="160" fill="#fff"/><g transform="translate(10,0)">${peaksHtml}</g></svg>${revealed?`<div class="muted">Hidden sample: ${revealed}</div>`:''}</div>`;
  }

  function renderMicroscopyResult(exp, sel, validation, outcome, revealed){
    const clarity = outcome.clarity || 'moderate';
    const color = clarity==='high'? '#334155' : clarity==='moderate'? '#64748b' : '#cbd5e1';
    return `<div><svg viewBox="0 0 320 200" width="100%"><rect x="0" y="0" width="320" height="200" fill="#fff"/><g transform="translate(50,20)"><circle cx="120" cy="80" r="60" fill="${color}" stroke="#0f172a"/></g></svg><div style="margin-top:6px"><strong>Clarity:</strong> ${clarity}</div>${revealed?`<div class="muted">Hidden sample: ${revealed}</div>`:''}</div>`;
  }

  // Initialize on virtual-lab page
  whenPageReady(()=>{ const page = (window.location.pathname.split('/').pop() || '').replace(/\.html$/,''); if(page !== 'virtual-lab') return; renderUI(); // auto-select first
    const first = document.querySelector('.vl-item'); if(first) first.click(); // keyboard space toggles play/pause
    window.addEventListener('keydown',(e)=>{ if(e.code==='Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'){ e.preventDefault(); if(Engine.state.playing) pause(); else play(); } });
  });

})();
