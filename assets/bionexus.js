(function(){
  const root = document.documentElement;
  const page = document.body.dataset.page || "home";
  const kind = document.body.dataset.kind || "topic";
  const depth = Number(document.body.dataset.depth || 0);
  const base = depth ? "../".repeat(depth) : "";
  const BN = window.BN || {};

  function href(path){ return base + path; }
  function icon(name){
    const icons = {
      dna:'<svg viewBox="0 0 80 80" fill="none"><path d="M24 10c0 18 32 18 32 36S24 62 24 72" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M56 10c0 18-32 18-32 36s32 16 32 26" stroke="#14b8a6" stroke-width="5" stroke-linecap="round"/><path d="M28 24h24M29 40h22M28 56h24" stroke="#6366f1" stroke-width="4" stroke-linecap="round"/></svg>',
      protein:'<svg viewBox="0 0 80 80" fill="none"><path d="M18 48c5-18 17-27 32-25 13 2 19 16 11 27-8 12-26 15-38 5" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="50" r="6" fill="#06b6d4"/><circle cx="48" cy="23" r="6" fill="#6366f1"/><circle cx="62" cy="43" r="6" fill="#14b8a6"/></svg>',
      lab:'<svg viewBox="0 0 80 80" fill="none"><path d="M30 10h20M36 10v18L20 58c-3 6 1 12 8 12h24c7 0 11-6 8-12L44 28V10" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 56h30" stroke="#06b6d4" stroke-width="5" stroke-linecap="round"/></svg>',
      calc:'<svg viewBox="0 0 80 80" fill="none"><rect x="20" y="12" width="40" height="56" rx="10" stroke="currentColor" stroke-width="5"/><path d="M30 26h20M30 42h4M46 42h4M30 54h4M46 54h4" stroke="#06b6d4" stroke-width="5" stroke-linecap="round"/></svg>',
      book:'<svg viewBox="0 0 80 80" fill="none"><path d="M18 16h24c8 0 14 6 14 14v34H30c-7 0-12-5-12-12V16Z" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M42 16v48M28 30h8M28 42h8" stroke="#06b6d4" stroke-width="5" stroke-linecap="round"/></svg>',
      mail:'<svg viewBox="0 0 80 80" fill="none"><rect x="14" y="20" width="52" height="40" rx="10" stroke="currentColor" stroke-width="5"/><path d="M20 28l20 16 20-16" stroke="#06b6d4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    return icons[name] || icons.dna;
  }

  function stripBase(path){ return (path || '').replace(/^\.\//,'').replace(/^\.\.\//,'').replace(/\\/g,'/'); }
  function normalizeNavPath(path){ const value = stripBase(path || '').replace(/^\/+/, '').replace(/%20/g,' '); return value || 'index.html'; }
  function isCurrentNavPath(path){
    const current = normalizeNavPath(window.location.pathname.split('/').pop() || 'index.html');
    const target = normalizeNavPath(path);
    if (target === 'index.html') {
      return current === 'index.html' || current === '' || current === 'preview (1).html' || current === 'preview (1) - Copy.html';
    }
    return current === target || current.endsWith('/' + target) || current === target.split('/').pop();
  }
  function navLinkClass(path){ return isCurrentNavPath(path) ? 'nav-link active' : 'nav-link'; }
  function navButtonClass(paths){ return paths.some(isCurrentNavPath) ? 'nav-button active' : 'nav-button'; }

  function nav(){
    const toolLinks = BN.nav.tools.map(([t,u])=>`<a class="${isCurrentNavPath(u) ? 'active' : ''}" href="${href(u)}">${t}</a>`).join('');
    const learningLinks = BN.nav.learning.map(([t,u])=>`<a class="${isCurrentNavPath(u) ? 'active' : ''}" href="${href(u)}">${t}</a>`).join('');
    const laboratoryLinks = BN.nav.laboratory.map(([t,u])=>`<a class="${isCurrentNavPath(u) ? 'active' : ''}" href="${href(u)}">${t}</a>`).join('');
    const exploreGroups = BN.nav.exploreGroups || [
      {title:'Molecular Biology', items: BN.nav.explore.slice(0,3)},
      {title:'Biochemistry', items: BN.nav.explore.slice(3)}
    ];
    const explorePaths = exploreGroups.flatMap(group => group.items.map(([,u]) => u));
    const exploreMarkup = exploreGroups.map(group => `<div class="dropdown-section"><h4>${group.title}</h4>${group.items.map(([t,u])=>`<a class="${isCurrentNavPath(u)?'active':''}" href="${href(u)}" ${isCurrentNavPath(u) ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</div>`).join('');
    return `<header class="site-header">
      <div class="wrap nav">
        <a class="brand" href="${href('index.html')}"><span class="brand-mark">${icon('dna')}</span>Bio<span>Nexus</span></a>
        <button class="mobile-toggle" id="mobileToggle" aria-label="Toggle navigation" aria-controls="navLinks" aria-expanded="false">Menu</button>
        <ul class="nav-links" id="navLinks" role="navigation" aria-label="Primary">
          <li class="nav-item"><a class="${navLinkClass('index.html')}" href="${href('index.html')}" ${isCurrentNavPath('index.html') ? 'aria-current="page"' : ''}>Home</a></li>
          <li class="nav-item"><button class="${navButtonClass(explorePaths)}" type="button">Explore</button><div class="dropdown">${exploreMarkup}</div></li>
          <li class="nav-item"><button class="${navButtonClass(BN.nav.laboratory.map(([,u])=>u))}" type="button">Laboratory Techniques</button><div class="dropdown"><div class="dropdown-section"><h4>Laboratory Methods</h4>${laboratoryLinks}</div></div></li>
          <li class="nav-item"><button class="${navButtonClass(BN.nav.tools.map(([,u])=>u))}" type="button">Tools</button><div class="dropdown"><div class="dropdown-section"><h4>Calculators</h4>${toolLinks}</div></div></li>
          <li class="nav-item"><button class="${navButtonClass(BN.nav.learning.map(([,u])=>u))}" type="button">Learning Center</button><div class="dropdown"><div class="dropdown-section"><h4>Resources</h4>${learningLinks}</div></div></li>
          <li class="nav-item"><a class="${navLinkClass('portfolio.html')}" href="${href('portfolio.html')}" ${isCurrentNavPath('portfolio.html') ? 'aria-current="page"' : ''}>Portfolio</a></li>
          <li class="nav-item"><a class="${navLinkClass('about.html')}" href="${href('about.html')}" ${isCurrentNavPath('about.html') ? 'aria-current="page"' : ''}>About</a></li>
          <li class="nav-item"><a class="${navLinkClass('contact.html')}" href="${href('contact.html')}" ${isCurrentNavPath('contact.html') ? 'aria-current="page"' : ''}>Contact</a></li>
        </ul>
      </div>
    </header>`;
  }

  function footer(){
    return `<footer class="footer">
      <button class="back-to-top" type="button" aria-label="Back to top">↑</button>
      <div class="wrap">
        <div class="footer-grid">
          <div><a class="brand" href="${href('index.html')}"><span class="brand-mark">${icon('dna')}</span>Bio<span>Nexus</span></a><p>BioNexus is a portfolio-quality interactive learning platform for biochemistry, molecular biology, biotechnology, genetics, and life science students.</p><div class="pill-row"><span class="pill">GitHub</span><span class="pill">LinkedIn</span><span class="pill">Email</span></div></div>
          <div><h4>Quick Links</h4><ul><li><a href="${href('molecular-biology/dna-explorer.html')}">Molecular Biology</a></li><li><a href="${href('biochemistry/protein-explorer.html')}">Biochemistry</a></li><li><a href="${href('laboratory/pcr.html')}">Laboratory</a></li></ul></div>
          <div><h4>Resources</h4><ul><li><a href="${href('learning/study-notes.html')}">Study Notes</a></li><li><a href="${href('learning/scientific-glossary.html')}">Glossary</a></li><li><a href="${href('learning/visual-library.html')}">Visual Library</a></li></ul></div>
          <div><h4>Contact</h4><ul><li><a href="${href('contact.html')}">Contact Form</a></li><li><a href="mailto:hello@bionexus.edu">hello@bionexus.edu</a></li><li><a href="${href('about.html')}">About BioNexus</a></li></ul></div>
          <div><h4>Newsletter</h4><p>Stay connected with new learning modules and study tools.</p><div class="newsletter"><input aria-label="Email address" placeholder="email@example.com"><button class="btn btn-primary" type="button" aria-label="Join newsletter">Join</button></div></div>
        </div>
        <div class="footer-bottom"><span>Copyright ${new Date().getFullYear()} BioNexus.</span><span>Built for interactive science learning.</span></div>
      </div>
    </footer>`;
  }

  function breadcrumbs(kind, data){
    const items = [{label:'Home', href:href('index.html')}];
    if(kind==='topic'){ items.push({label:data.hub || 'Topic', href:'#'}); items.push({label:data.title, href:'#'}); }
    if(kind==='tool'){ items.push({label:'Tools', href:href('tools/molecular-weight-calculator.html')}); items.push({label:data.title, href:'#'}); }
    if(kind==='learning'){ items.push({label:'Learning Center', href:href('learning/study-notes.html')}); items.push({label:data.title, href:'#'}); }
    if(kind==='about'){ items.push({label:'About', href:'#'}); }
    if(kind==='portfolio'){ items.push({label:'Portfolio', href:'#'}); }
    if(kind==='contact'){ items.push({label:'Contact', href:'#'}); }
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((item,i)=>`<li>${i<items.length-1?`<a href="${item.href}">${item.label}</a>`:item.label}</li>`).join('')}</ol></nav>`;
  }

  function scientificDnaSvg(options = {}){
    const label = options.label || 'Animated DNA double helix';
    const variant = options.variant || 'hero';
    const accentA = variant === 'repair' ? '#f59e0b' : '#14b8a6';
    const accentB = variant === 'repair' ? '#ef4444' : '#3b82f6';
    const strandA = variant === 'sequencing' ? 'M162 90C188 110 188 302 162 324' : 'M156 84C190 114 190 302 156 336';
    const strandB = variant === 'sequencing' ? 'M258 90C232 110 232 302 258 324' : 'M264 84C230 114 230 302 264 336';
    const pairs = Array.from({length: 10}, (_, i)=>{
      const y = 112 + i * 24;
      const offset = i % 2 === 0 ? -12 : 12;
      return `<g class="dna-base-pair" style="animation-delay:${i * 0.28}s" transform="translate(170 ${y}) rotate(${offset} 0 0)">
        <path class="dna-pair-link" d="M0 0C18 -12 34 -8 44 8" />
        <circle class="hotspot" data-tip="Base-pair connection" cx="0" cy="0" r="5" fill="#fff" stroke="${accentA}" stroke-width="2.2"/>
        <circle class="hotspot" data-tip="Complementary base pair" cx="44" cy="8" r="5" fill="#fff" stroke="${accentB}" stroke-width="2.2"/>
      </g>
      <g class="dna-base-pair" style="animation-delay:${i * 0.28 + 0.18}s" transform="translate(250 ${y}) rotate(${-offset} 0 0)">
        <path class="dna-pair-link" d="M0 0C-18 -12 -34 -8 -44 8" />
        <circle class="hotspot" data-tip="Base-pair connection" cx="0" cy="0" r="5" fill="#fff" stroke="${accentB}" stroke-width="2.2"/>
        <circle class="hotspot" data-tip="Complementary base pair" cx="-44" cy="8" r="5" fill="#fff" stroke="${accentA}" stroke-width="2.2"/>
      </g>`;
    }).join('');
    const particles = Array.from({length: 8}, (_, i)=>`<circle class="dna-particle" cx="${94 + i * 34}" cy="${92 + (i % 3) * 58}" r="${1.8 + (i % 3)}" fill="${i % 2 ? 'rgba(59,130,246,0.22)' : 'rgba(20,184,166,0.24)'}" style="animation-delay:${i * 0.42}s"/>`).join('');
    return `<div class="dna-visual-shell"><svg class="helix-svg" viewBox="0 0 420 420" role="img" aria-label="${label}"><defs><linearGradient id="dnaStrandA" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="#bdeeff"/><stop offset="100%" stop-color="#4f8cff"/></linearGradient><linearGradient id="dnaStrandB" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f7fdff"/><stop offset="45%" stop-color="#92e5d5"/><stop offset="100%" stop-color="#3f7cf6"/></linearGradient><linearGradient id="dnaBase" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#a7e8ff"/></linearGradient><linearGradient id="dnaHalo" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="rgba(6,182,212,0.18)"/><stop offset="100%" stop-color="rgba(59,130,246,0.04)"/></linearGradient><filter id="dnaGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="210" cy="210" r="158" fill="url(#dnaHalo)"/><circle cx="210" cy="210" r="142" stroke="rgba(255,255,255,.55)" stroke-width="1.1" fill="none"/><g class="dna-helix-group"><path d="${strandA}" stroke="url(#dnaStrandA)" stroke-width="8" fill="none" stroke-linecap="round"/><path d="${strandB}" stroke="url(#dnaStrandB)" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M164 96C186 116 186 290 164 318" stroke="rgba(255,255,255,.8)" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M256 96C234 116 234 290 256 318" stroke="rgba(255,255,255,.8)" stroke-width="2.2" fill="none" stroke-linecap="round"/><g filter="url(#dnaGlow)" opacity="0.95"><path d="M176 104C194 124 194 288 176 316" stroke="${accentA}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M244 104C226 124 226 288 244 316" stroke="${accentB}" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>${pairs}${particles}</g></svg></div>`;
  }

  function premiumDnaHeroSvg(options = {}){
    const label = options.label || 'Premium DNA double helix model';
    const variant = options.variant || 'hero';
    const accentA = variant === 'repair' ? '#f59e0b' : '#14b8a6';
    const accentB = variant === 'repair' ? '#ef4444' : '#3b82f6';
    const bonds = Array.from({length: 12}, (_, i)=>{
      const y = 102 + i * 20;
      const offset = i % 2 === 0 ? -10 : 10;
      return `<g class="dna-base-pair" style="animation-delay:${i * 0.22}s" transform="translate(170 ${y}) rotate(${offset} 0 0)">
        <rect x="-8" y="-16" width="48" height="32" rx="10" fill="#ffffff" fill-opacity="0.94" stroke="${accentA}" stroke-width="2.2"/>
        <path d="M0 -10C12 -10 24 -6 34 2" stroke="rgba(15,23,42,.24)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <circle cx="10" cy="-2" r="4.8" fill="${accentA}"/>
        <circle cx="32" cy="8" r="4.8" fill="${accentB}"/>
      </g>
      <g class="dna-base-pair" style="animation-delay:${i * 0.22 + 0.12}s" transform="translate(250 ${y}) rotate(${-offset} 0 0)">
        <rect x="-40" y="-16" width="48" height="32" rx="10" fill="#ffffff" fill-opacity="0.94" stroke="${accentB}" stroke-width="2.2"/>
        <path d="M0 -10C-12 -10 -24 -6 -34 2" stroke="rgba(15,23,42,.24)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <circle cx="-10" cy="-2" r="4.8" fill="${accentB}"/>
        <circle cx="-32" cy="8" r="4.8" fill="${accentA}"/>
      </g>`;
    }).join('');
    const particles = Array.from({length: 10}, (_, i)=>{
      const x = 96 + (i % 5) * 54;
      const y = 92 + Math.floor(i / 5) * 64 + ((i % 2) * 18);
      return `<circle class="dna-particle" cx="${x}" cy="${y}" r="${1.6 + (i % 3) * 0.5}" fill="${i % 2 ? 'rgba(59,130,246,0.22)' : 'rgba(20,184,166,0.24)'}" style="animation-delay:${i * 0.28}s"/>`;
    }).join('');
    return `<div class="dna-visual-shell"><svg class="helix-svg" viewBox="0 0 420 420" role="img" aria-label="${label}"><defs><linearGradient id="dnaStrandA" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="#bdeeff"/><stop offset="100%" stop-color="#4f8cff"/></linearGradient><linearGradient id="dnaStrandB" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f7fdff"/><stop offset="45%" stop-color="#92e5d5"/><stop offset="100%" stop-color="#3f7cf6"/></linearGradient><linearGradient id="dnaGlow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="rgba(255,255,255,0.96)"/><stop offset="100%" stop-color="rgba(6,182,212,0.2)"/></linearGradient><filter id="dnaGlowFilter" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="210" cy="210" r="158" fill="rgba(6,182,212,0.12)"/><circle cx="210" cy="210" r="142" stroke="rgba(255,255,255,.72)" stroke-width="1.1" fill="none"/><g opacity="0.7" class="hero-science-rings"><path d="M132 150C168 118 252 118 288 150" stroke="rgba(255,255,255,.5)" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M116 202C150 168 270 168 304 202" stroke="rgba(255,255,255,.36)" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M150 110C182 86 238 86 270 110" stroke="rgba(255,255,255,.38)" stroke-width="1.2" fill="none" stroke-linecap="round"/></g><g opacity="0.72" class="hero-science-bonds"><path d="M92 120C120 98 156 100 178 122" stroke="rgba(99,102,241,.3)" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M242 122C264 100 300 98 328 120" stroke="rgba(6,182,212,.28)" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M126 290C152 312 234 312 260 290" stroke="rgba(59,130,246,.24)" stroke-width="1.4" fill="none" stroke-linecap="round"/></g><g class="dna-helix-group" filter="url(#dnaGlowFilter)"><path d="M156 84C190 114 190 302 156 336" stroke="url(#dnaStrandA)" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M264 84C230 114 230 302 264 336" stroke="url(#dnaStrandB)" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M172 100C194 120 194 288 172 314" stroke="rgba(255,255,255,.82)" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M248 100C226 120 226 288 248 314" stroke="rgba(255,255,255,.82)" stroke-width="2.6" fill="none" stroke-linecap="round"/><g opacity="0.95">${bonds}${particles}</g></g></svg></div>`;
  }

  function scientificProteinSvg(type){
    const activeColor = type === 'enzyme' ? '#14b8a6' : '#3b82f6';
    const ribbon = type === 'enzyme' ? '<path class="protein-ribbon" d="M122 170c28-62 76-94 132-88 42 4 78 30 92 76-16 54-46 86-92 92-54 6-104-22-132-80" fill="none" stroke="url(#proteinGradient)" stroke-width="12" stroke-linecap="round"/>' : '<path class="protein-ribbon" d="M126 184c24-68 84-102 142-98 50 4 92 34 104 90-12 54-60 96-116 102-56 6-116-24-130-94" fill="none" stroke="url(#proteinGradient)" stroke-width="12" stroke-linecap="round"/>';
    return `<svg viewBox="0 0 520 320" role="img" aria-label="Scientific protein structure"><defs><linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="45%" stop-color="#bdeeff"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs>${ribbon}<path class="protein-sheet" d="M196 132c22-12 50-16 76-8 20 6 38 20 54 40" stroke="rgba(255,255,255,.88)" stroke-width="4" fill="none" stroke-linecap="round"/><path class="protein-sheet" d="M178 190c24 20 60 30 94 20 24-8 46-24 66-44" stroke="rgba(255,255,255,.76)" stroke-width="4" fill="none" stroke-linecap="round"/><circle class="hotspot" data-tip="Active site" cx="254" cy="164" r="32" fill="rgba(20,184,166,.16)" stroke="${activeColor}" stroke-width="5"/><circle class="hotspot" data-tip="Hydrophobic core" cx="214" cy="132" r="18" fill="#fff" stroke="#6366f1" stroke-width="4"/><circle class="hotspot" data-tip="Binding interface" cx="310" cy="214" r="18" fill="#fff" stroke="#06b6d4" stroke-width="4"/><path d="M286 164h54" stroke="rgba(255,255,255,.78)" stroke-width="4" stroke-linecap="round"/><path d="M234 132l-34-28" stroke="rgba(255,255,255,.85)" stroke-width="4" stroke-linecap="round"/></svg>`;
  }

  function scientificPcrSvg(){
    return `<svg viewBox="0 0 520 320" role="img" aria-label="Animated polymerase chain reaction workflow"><rect x="90" y="80" width="80" height="140" rx="22" fill="rgba(255,255,255,.85)" stroke="#cbd5e1"/><rect x="220" y="80" width="80" height="140" rx="22" fill="rgba(255,255,255,.85)" stroke="#cbd5e1"/><rect x="350" y="80" width="80" height="140" rx="22" fill="rgba(255,255,255,.85)" stroke="#cbd5e1"/><path class="pcr-arrow" d="M175 150h40" stroke="#14b8a6" stroke-width="4" stroke-linecap="round"/><path class="pcr-arrow" d="M305 150h40" stroke="#14b8a6" stroke-width="4" stroke-linecap="round"/><path class="pcr-stage" d="M110 120c16-20 42-24 66-16" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/><path class="pcr-stage" d="M240 118c16-16 38-20 58-10" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/><path class="pcr-stage" d="M370 118c16-16 38-20 58-10" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/><path class="pcr-stage" d="M108 178c14 18 40 24 68 16" stroke="#06b6d4" stroke-width="3" stroke-linecap="round"/><path class="pcr-stage" d="M238 178c12 14 32 20 58 12" stroke="#06b6d4" stroke-width="3" stroke-linecap="round"/><path class="pcr-stage" d="M368 178c12 14 32 20 58 12" stroke="#06b6d4" stroke-width="3" stroke-linecap="round"/><circle class="hotspot" data-tip="Denaturation" cx="130" cy="110" r="12" fill="#fff" stroke="#06b6d4" stroke-width="4"/><circle class="hotspot" data-tip="Annealing" cx="260" cy="112" r="12" fill="#fff" stroke="#06b6d4" stroke-width="4"/><circle class="hotspot" data-tip="Extension" cx="390" cy="112" r="12" fill="#fff" stroke="#06b6d4" stroke-width="4"/><text x="72" y="280" fill="#64748b" font-size="16">Thermal cycling drives denaturation, annealing, and extension.</text></svg>`;
  }

  function scientificGelSvg(){
    return `<svg viewBox="0 0 520 320" role="img" aria-label="Animated gel electrophoresis"><rect x="90" y="48" width="340" height="216" rx="22" fill="#f7fbff" stroke="#cbd5e1"/><rect x="108" y="64" width="36" height="184" rx="10" fill="#e6f6ff" class="gel-well"/><rect x="162" y="64" width="36" height="184" rx="10" fill="#e6f6ff" class="gel-well"/><rect x="216" y="64" width="36" height="184" rx="10" fill="#e6f6ff" class="gel-well"/><rect x="270" y="64" width="36" height="184" rx="10" fill="#e6f6ff" class="gel-well"/><rect x="324" y="64" width="36" height="184" rx="10" fill="#e6f6ff" class="gel-well"/><rect x="378" y="64" width="36" height="184" rx="10" fill="#e6f6ff" class="gel-well"/><path d="M120 110h12" stroke="#3b82f6" stroke-width="8" stroke-linecap="round" class="gel-band"/><path d="M174 154h12" stroke="#14b8a6" stroke-width="8" stroke-linecap="round" class="gel-band"/><path d="M228 142h12" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" class="gel-band"/><path d="M282 126h12" stroke="#6366f1" stroke-width="8" stroke-linecap="round" class="gel-band"/><path d="M336 178h12" stroke="#3b82f6" stroke-width="8" stroke-linecap="round" class="gel-band"/><path d="M390 132h12" stroke="#14b8a6" stroke-width="8" stroke-linecap="round" class="gel-band"/><path d="M110 223c94 0 178-6 300 0" stroke="rgba(100,116,139,.36)" stroke-width="2" stroke-dasharray="6 6"/><text x="80" y="292" fill="#64748b" font-size="16">Smaller fragments travel farther through the gel matrix.</text></svg>`;
  }

  function scientificPathwaySvg(type){
    const title = type === 'respiration' ? 'Cellular respiration' : 'Metabolic pathway';
    return `<svg viewBox="0 0 520 320" role="img" aria-label="${title}"><rect x="78" y="70" width="364" height="188" rx="24" fill="rgba(255,255,255,0.9)" stroke="#dbe8f1"/><path class="flow-arrow" d="M142 160h88" stroke="#06b6d4" stroke-width="6" stroke-linecap="round"/><path class="flow-arrow" d="M286 160h92" stroke="#3b82f6" stroke-width="6" stroke-linecap="round"/><circle class="hotspot" data-tip="Input metabolite" cx="122" cy="160" r="26" fill="#fff" stroke="#06b6d4" stroke-width="5"/><circle class="hotspot" data-tip="Intermediate" cx="248" cy="160" r="28" fill="#fff" stroke="#6366f1" stroke-width="5"/><circle class="hotspot" data-tip="Energy output" cx="398" cy="160" r="26" fill="#fff" stroke="#14b8a6" stroke-width="5"/><path d="M148 106c12-24 38-36 70-28" stroke="rgba(6,182,212,.25)" stroke-width="3" stroke-linecap="round"/><path d="M372 108c-12-24-38-36-70-28" stroke="rgba(59,130,246,.25)" stroke-width="3" stroke-linecap="round"/><text x="80" y="292" fill="#64748b" font-size="16">Sequential biochemical steps create a coherent pathway map.</text></svg>`;
  }

  function scientificMicroscopySvg(){
    return `<svg viewBox="0 0 520 320" role="img" aria-label="Microscopy illustration"><rect x="92" y="92" width="144" height="140" rx="24" fill="rgba(255,255,255,.92)" stroke="#cbd5e1"/><rect x="260" y="88" width="172" height="150" rx="28" fill="#f7fbff" stroke="#dbe8f1"/><path d="M284 150c24-40 64-54 112-46" stroke="#06b6d4" stroke-width="4" stroke-linecap="round"/><path d="M208 208c26 18 54 18 86 0" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/><circle cx="172" cy="160" r="42" fill="rgba(6,182,212,.14)" stroke="#06b6d4" stroke-width="4"/><circle cx="172" cy="160" r="24" fill="#fff" stroke="#3b82f6" stroke-width="3"/><circle class="hotspot" data-tip="Specimen" cx="328" cy="160" r="20" fill="#fff" stroke="#14b8a6" stroke-width="4"/><circle class="hotspot" data-tip="Objective lens" cx="370" cy="150" r="16" fill="#fff" stroke="#6366f1" stroke-width="4"/><text x="78" y="292" fill="#64748b" font-size="16">Brightfield and fluorescence imagery reveal cellular structure with clarity.</text></svg>`;
  }

  function scientificChromatographySvg(){
    return `<svg viewBox="0 0 520 320" role="img" aria-label="Chromatography workflow"><rect x="104" y="88" width="312" height="152" rx="24" fill="#f9fcff" stroke="#dbe8f1"/><rect x="126" y="112" width="72" height="108" rx="16" fill="#ffffff" stroke="#cbd5e1"/><rect x="220" y="104" width="168" height="124" rx="18" fill="#f7fbff" stroke="#dbe8f1"/><path d="M158 180c44 0 84 0 118-20" stroke="#06b6d4" stroke-width="4" stroke-linecap="round"/><path class="flow-arrow" d="M290 150h66" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/><circle class="hotspot" data-tip="Sample injection" cx="158" cy="180" r="12" fill="#fff" stroke="#06b6d4" stroke-width="4"/><circle class="hotspot" data-tip="Separation column" cx="290" cy="150" r="18" fill="#fff" stroke="#6366f1" stroke-width="4"/><circle class="hotspot" data-tip="Detector output" cx="372" cy="150" r="12" fill="#fff" stroke="#14b8a6" stroke-width="4"/><text x="78" y="292" fill="#64748b" font-size="16">Different analytes separate by affinity and transit time.</text></svg>`;
  }

  function scientificElisaSvg(){
    return `<svg viewBox="0 0 520 320" role="img" aria-label="ELISA workflow"><rect x="78" y="90" width="364" height="176" rx="24" fill="#f9fcff" stroke="#dbe8f1"/><rect x="116" y="128" width="96" height="96" rx="18" fill="#ffffff" stroke="#dbe8f1"/><rect x="242" y="128" width="96" height="96" rx="18" fill="#ffffff" stroke="#dbe8f1"/><rect x="368" y="128" width="64" height="96" rx="18" fill="#ffffff" stroke="#dbe8f1"/><path d="M214 176h24" stroke="#06b6d4" stroke-width="4" stroke-linecap="round"/><path d="M340 176h24" stroke="#14b8a6" stroke-width="4" stroke-linecap="round"/><circle class="hotspot" data-tip="Antigen capture" cx="164" cy="176" r="16" fill="#fff" stroke="#3b82f6" stroke-width="4"/><circle class="hotspot" data-tip="Detection antibody" cx="290" cy="176" r="16" fill="#fff" stroke="#06b6d4" stroke-width="4"/><circle class="hotspot" data-tip="Colorimetric readout" cx="400" cy="176" r="16" fill="#fff" stroke="#14b8a6" stroke-width="4"/><text x="78" y="292" fill="#64748b" font-size="16">Antibodies and enzymatic signal generation create a measurable readout.</text></svg>`;
  }

  function scientificWesternSvg(){
    return `<svg viewBox="0 0 520 320" role="img" aria-label="Western blot workflow"><rect x="128" y="64" width="264" height="192" rx="20" fill="#f9fcff" stroke="#dbe8f1"/><rect x="158" y="90" width="204" height="126" rx="16" fill="#ffffff" stroke="#dbe8f1"/><path d="M182 104h156" stroke="#dbe8f1" stroke-width="3"/><path d="M182 134h156" stroke="#dbe8f1" stroke-width="3"/><path d="M182 164h156" stroke="#dbe8f1" stroke-width="3"/><path class="gel-band" d="M190 112h48" stroke="#3b82f6" stroke-width="8" stroke-linecap="round"/><path class="gel-band" d="M248 144h52" stroke="#14b8a6" stroke-width="8" stroke-linecap="round"/><path d="M208 220c44 0 86 0 120-20" stroke="#06b6d4" stroke-width="4" stroke-linecap="round"/><circle class="hotspot" data-tip="Protein transfer" cx="248" cy="220" r="14" fill="#fff" stroke="#06b6d4" stroke-width="4"/><text x="82" y="292" fill="#64748b" font-size="16">Proteins are separated, transferred, and probed with antibodies.</text></svg>`;
  }

  function scientificSpectroSvg(){
    return `<svg viewBox="0 0 520 320" role="img" aria-label="Spectrophotometry workflow"><rect x="86" y="82" width="348" height="180" rx="24" fill="#f9fcff" stroke="#dbe8f1"/><path d="M132 220c48-52 86-84 124-84 30 0 56 16 92 44" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/><path d="M128 222c42-34 74-44 104-44 36 0 74 18 112 56" stroke="#06b6d4" stroke-width="3" stroke-linecap="round"/><circle class="hotspot" data-tip="Light source" cx="126" cy="220" r="14" fill="#fff" stroke="#3b82f6" stroke-width="4"/><circle class="hotspot" data-tip="Sample cuvette" cx="246" cy="176" r="18" fill="#fff" stroke="#14b8a6" stroke-width="4"/><circle class="hotspot" data-tip="Detector" cx="376" cy="214" r="14" fill="#fff" stroke="#6366f1" stroke-width="4"/><text x="80" y="292" fill="#64748b" font-size="16">Absorbance measurements support quantitative biochemical analysis.</text></svg>`;
  }

  function scientificRnaSvg(){
    return `<svg viewBox="0 0 520 320" role="img" aria-label="RNA structure"><path d="M132 170c34-58 84-88 140-90 58-2 112 24 148 72" stroke="url(#rnaGradient)" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M132 170c34-58 84-88 140-90 58-2 112 24 148 72" stroke="rgba(255,255,255,.86)" stroke-width="4" stroke-linecap="round" fill="none"/><circle class="hotspot" data-tip="Messenger RNA" cx="170" cy="160" r="18" fill="#fff" stroke="#3b82f6" stroke-width="4"/><circle class="hotspot" data-tip="Transfer RNA" cx="278" cy="118" r="16" fill="#fff" stroke="#14b8a6" stroke-width="4"/><circle class="hotspot" data-tip="Ribosome" cx="360" cy="170" r="22" fill="#fff" stroke="#6366f1" stroke-width="4"/><text x="86" y="292" fill="#64748b" font-size="16">RNA folds into dynamic structures that support transcription and translation.</text><defs><linearGradient id="rnaGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="50%" stop-color="#bdeeff"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs></svg>`;
  }

  function home(){
    return `${nav()}<main>
      <section class="hero">
        <div class="wrap hero-grid">
          <div>
            <span class="eyebrow">Interactive life science education</span>
            <h1>BioNexus turns complex science into clear, guided learning.</h1>
            <p class="lead">Explore molecular biology, biochemistry, laboratory methods, and scientific tools through one cohesive, responsive platform.</p>
            <div class="hero-actions"><a class="btn btn-primary" href="${href('molecular-biology/dna-explorer.html')}">Start with DNA</a><a class="btn btn-secondary" href="${href('tools/molecular-weight-calculator.html')}">Try a tool</a></div>
            <p class="hero-note">Every page shares the same navigation, footer, typography, and visual system.</p>
          </div>
          <div class="visual-card">
            <div class="helix-art">
              ${premiumDnaHeroSvg({variant:'hero'})}
            </div>
            <span class="floating-label" style="top:24px;right:24px">Shared learning flow</span>
            <span class="floating-label" style="bottom:24px;left:24px">Accessible by design</span>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="section-head center">
            <span class="eyebrow">Core modules</span>
            <h2>Study the science from concept to application.</h2>
            <p>Each pathway opens into the same polished experience so students can move from fundamentals to laboratory practice without friction.</p>
          </div>
          <div class="grid grid-3">${BN.hubs.map(h=>`<a class="card" href="${href(h.href)}"><div class="icon">${icon(h.icon)}</div><h3>${h.title}</h3><p class="muted">${h.desc}</p><span class="pill-row"><span class="pill">Open module</span></span></a>`).join('')}</div>
        </div>
      </section>
      <section class="section">
        <div class="wrap grid grid-2">
          <div class="card">
            <h3>Why BioNexus feels cohesive</h3>
            <ul><li>Consistent navigation and footer across every page</li><li>Shared visual language for cards, buttons, and spacing</li><li>Interactive resources designed for revision and review</li></ul>
          </div>
          <div class="card">
            <h3>Recommended next steps</h3>
            <div class="hero-actions"><a class="btn btn-primary" href="${href('learning/study-notes.html')}">Open study notes</a><a class="btn btn-secondary" href="${href('about.html')}">Learn about the project</a></div>
          </div>
        </div>
      </section>
    </main>${footer()}`;
  }

  function diagram(type){
    if(["dna","repair","sequencing","crispr"].includes(type)) return scientificDnaSvg({variant:type});
    if(["rna","expression"].includes(type)) return scientificRnaSvg();
    if(["protein","enzyme"].includes(type)) return scientificProteinSvg(type);
    if(type === "pcr") return scientificPcrSvg();
    if(type === "gel") return scientificGelSvg();
    if(type === "chromatography") return scientificChromatographySvg();
    if(type === "elisa") return scientificElisaSvg();
    if(type === "western") return scientificWesternSvg();
    if(type === "spectro") return scientificSpectroSvg();
    if(type === "microscopy") return scientificMicroscopySvg();
    if(["respiration","pathway"].includes(type)) return scientificPathwaySvg(type);
    return scientificPathwaySvg(type);
  }

  function buildTopicStudyGuide(page, data){
    const guides = {
      'dna-explorer':{overview:["DNA stores hereditary information as a sequence of bases arranged in an antiparallel double helix.","Complementary base pairing allows accurate replication and transcription while preserving genomic information.","DNA structure explains stability, mutation, and the logic of sequencing, repair, and gene editing."],sections:[{title:"Definition",body:"DNA is a polymer of deoxyribonucleotides joined by phosphodiester bonds. Its base order carries the information required to build and regulate cells."},{title:"Structure",body:"The double helix has major and minor grooves, a consistent sugar-phosphate backbone, and complementary A-T and G-C pairing. These features influence protein binding and DNA accessibility."},{title:"Biological role",body:"DNA must be replicated before cell division, transcribed into RNA when a gene is active, and repaired when lesions arise. These processes are central to inheritance and cell identity."},{title:"Laboratory relevance",body:"DNA isolation, amplification, sequencing, and restriction analysis are foundational methods in biotechnology, forensics, diagnostics, and synthetic biology."}],examTips:["Always state 5′ and 3′ orientation when discussing replication or polymerase activity.","Link base pairing to hydrogen bonding and to the stability of the helix."],commonMistakes:["Confusing DNA with genes; many non-coding regions regulate expression and genome organization.","Assuming every mutation is harmful; many are neutral or context-dependent."],faq:[{q:"Why is DNA called an information molecule?",a:"Because the order of bases acts as a coded instruction set for RNA synthesis, protein production, and cellular regulation."},{q:"What is the difference between a gene and a genome?",a:"A gene is a segment with a defined functional role, while a genome is the complete DNA content of an organism or cell."}],related:[["DNA Repair","molecular-biology/dna-repair.html"],["DNA Sequencing","molecular-biology/dna-sequencing.html"],["Gene Expression","molecular-biology/gene-expression.html"]]},
      'rna-explorer':{overview:["RNA is a versatile nucleic acid that carries information, regulates gene expression, and can even catalyze reactions.","Messenger RNA carries coding information, transfer RNA delivers amino acids, and ribosomal RNA forms the core of the translation apparatus.","RNA structure is flexible, which allows it to interact with proteins, other RNAs, and small molecules in dynamic ways."],sections:[{title:"Definition",body:"RNA contains ribose sugar and uracil instead of thymine. Its single-stranded nature allows rapid folding and diverse functions."},{title:"Types",body:"mRNA carries codons, tRNA carries anticodons and amino acids, and rRNA provides structural and catalytic functions within ribosomes."},{title:"Regulation",body:"RNA processing, localization, stability, and translation efficiency strongly affect gene expression in healthy cells and disease states."},{title:"Applications",body:"RNA biology underpins mRNA therapeutics, diagnostics, viral assays, and transcriptome profiling."}],examTips:["Compare DNA and RNA using sugar, base composition, stability, and function.","Remember that not all RNA encodes protein."],commonMistakes:["Treating all RNA as messenger RNA.","Ignoring the role of RNA structure in regulatory control."],faq:[{q:"Why is RNA less stable than DNA?",a:"Its ribose sugar contains an extra hydroxyl group and it is often single-stranded, making it more chemically reactive."},{q:"What makes RNA suitable for regulation?",a:"Its flexible structure allows rapid turnover and interaction with proteins and other nucleic acids."}],related:[["Gene Expression","molecular-biology/gene-expression.html"],["Protein Explorer","biochemistry/protein-explorer.html"],["CRISPR Overview","molecular-biology/crispr-overview.html"]]},
      'gene-expression':{overview:["Gene expression transforms stored DNA information into functional RNA and proteins.","Regulation can occur at transcription, RNA processing, translation, and protein turnover.","The same genome can produce different cell states because expression is carefully controlled."],sections:[{title:"Core pathway",body:"Transcription begins at promoters and is controlled by enhancers, silencers, and transcription factors. The resulting RNA is processed before translation."},{title:"RNA processing",body:"Splicing removes introns, capping and polyadenylation stabilize transcripts, and alternative splicing expands protein diversity."},{title:"Translation",body:"Ribosomes decode mRNA codons with tRNA, linking amino acids into polypeptides according to the genetic code."},{title:"Regulation",body:"Epigenetic marks, chromatin structure, microRNAs, and protein stability influence how strongly a gene is expressed."}],examTips:["Separate transcriptional regulation from post-transcriptional and translational control.","Use examples of enhancers, silencers, and splicing when explaining cell-specific expression."],commonMistakes:["Assuming transcription is the only important control point.","Treating mRNA levels as equal to protein levels."],faq:[{q:"What is the role of enhancers?",a:"Enhancers increase the probability of transcription by providing binding sites for regulatory proteins that contact the transcriptional machinery."},{q:"Why is alternative splicing important?",a:"It allows one gene to produce multiple proteins with different functions or localization."}],related:[["RNA Explorer","molecular-biology/rna-explorer.html"],["Protein Explorer","biochemistry/protein-explorer.html"],["DNA Repair","molecular-biology/dna-repair.html"]]},
      'dna-repair':{overview:["Cells use repair pathways to correct damage before it becomes a permanent mutation.","Repair mechanisms differ by lesion type, including base damage, bulky adducts, mismatches, and double-strand breaks.","Defective repair is linked to cancer predisposition, aging, and altered responses to DNA-damaging therapies."],sections:[{title:"Damage recognition",body:"The first step is identifying abnormal bases, mismatches, or strand breaks. Sensor proteins recruit repair machinery and coordinate checkpoint responses."},{title:"Repair pathways",body:"BER removes small base lesions, NER repairs bulky distortions, MMR corrects replication errors, and HR or NHEJ repairs double-strand breaks."},{title:"Clinical importance",body:"Defective repair pathways are strongly associated with hereditary cancer syndromes and can affect chemotherapy sensitivity."},{title:"Research relevance",body:"Repair studies inform PARP inhibitors, radiation biology, genome editing safety, and aging research."}],examTips:["Match the lesion to the pathway before naming enzymes.","Distinguish homology-dependent repair from error-prone end joining."],commonMistakes:["Assuming all DNA damage is repaired in the same way.","Ignoring that some repair pathways are more error-prone than others."],faq:[{q:"What is the difference between HR and NHEJ?",a:"HR uses a homologous template and is generally precise, while NHEJ directly rejoins broken ends and can be error-prone."},{q:"Why do repair defects increase cancer risk?",a:"They allow mutations and chromosome instability to accumulate over time."}],related:[["DNA Explorer","molecular-biology/dna-explorer.html"],["DNA Sequencing","molecular-biology/dna-sequencing.html"],["CRISPR Overview","molecular-biology/crispr-overview.html"]]},
      'dna-sequencing':{overview:["Sequencing determines the order of nucleotides in DNA and is a foundation of modern molecular biology.","Sanger sequencing is highly accurate for short regions, while next-generation sequencing enables large-scale genome analysis.","Interpretation depends on read quality, coverage, reference genome choice, and downstream analysis."],sections:[{title:"Principles",body:"Sequencing methods generate reads that represent short fragments of DNA. These reads are aligned or assembled to reconstruct the original sequence."},{title:"Platforms",body:"Sanger sequencing remains useful for targeted confirmation, while NGS enables whole genomes, exomes, amplicons, and metagenomics."},{title:"Analysis",body:"Bioinformatics steps include quality control, adapter trimming, alignment, variant calling, and biological interpretation."},{title:"Applications",body:"Sequencing supports diagnostics, cancer genomics, pathogen identification, evolutionary studies, and personalized medicine."}],examTips:["Define read length, depth, and coverage in relation to confidence and sensitivity.","Explain why low coverage increases uncertainty in variant detection."],commonMistakes:["Treating sequence data as a diagnosis without validation.","Ignoring quality control and contamination checks."],faq:[{q:"Why is coverage important?",a:"Higher coverage improves confidence in base calls and makes rare variants easier to distinguish from errors."},{q:"What is the difference between whole-genome and targeted sequencing?",a:"Whole-genome sequencing examines the entire genome, while targeted sequencing focuses on selected regions of interest."}],related:[["DNA Explorer","molecular-biology/dna-explorer.html"],["Gene Expression","molecular-biology/gene-expression.html"],["CRISPR Overview","molecular-biology/crispr-overview.html"]]},
      'crispr-overview':{overview:["CRISPR-Cas systems enable programmable genome editing by using guide RNAs to direct a nuclease to a target sequence.","The approach has transformed functional genomics because it allows rapid gene disruption, correction, or regulation.","Its power is matched by concerns about specificity, ethics, and the need for careful validation."],sections:[{title:"Mechanism",body:"A guide RNA directs Cas proteins to a matching target adjacent to a PAM site. Cas9 then creates a DNA break that the cell repairs by endogenous pathways."},{title:"Outcomes",body:"Editing can produce knockouts through error-prone repair or precise corrections when a donor template is supplied."},{title:"Applications",body:"CRISPR is used in gene function screens, crop engineering, cell therapy, diagnostic assays, and basic research."},{title:"Limitations",body:"Off-target cutting, chromosomal rearrangements, efficiency differences between cell types, and ethical concerns remain important challenges."}],examTips:["Describe the order: guide RNA, PAM recognition, cleavage, and repair.","Explain why repair outcome depends on the cell's repair machinery."],commonMistakes:["Assuming CRISPR always makes a precise repair.","Ignoring the importance of PAM and target context."],faq:[{q:"What does PAM mean?",a:"PAM is the short sequence next to the target that Cas proteins must recognize before binding and cleavage."},{q:"Why is off-target editing a concern?",a:"Unintended cuts can disrupt other genes, alter genomic stability, or complicate therapeutic development."}],related:[["DNA Repair","molecular-biology/dna-repair.html"],["DNA Sequencing","molecular-biology/dna-sequencing.html"],["RNA Explorer","molecular-biology/rna-explorer.html"]]},
      'protein-explorer':{overview:["Proteins are the molecular machines of the cell, carrying out catalysis, transport, signaling, movement, and structural support.","Amino acid sequence determines the three-dimensional fold, which then defines function.","Protein structure is studied across multiple levels, from primary sequence to quaternary assemblies."],sections:[{title:"Structure levels",body:"Primary structure is the amino acid sequence; secondary structure includes alpha helices and beta sheets; tertiary structure defines the full fold; quaternary structure describes multi-subunit complexes."},{title:"Folding",body:"Folding is guided by hydrophobic packing, hydrogen bonds, ionic interactions, disulfide bridges, and chaperone assistance."},{title:"Functions",body:"Proteins act as enzymes, receptors, transporters, antibodies, motors, and scaffolds. Their diversity makes them central to physiology and disease."},{title:"Analytical methods",body:"X-ray crystallography, cryo-EM, NMR, and mass spectrometry reveal structure and interaction features relevant to drug discovery."}],examTips:["Relate each structural level to the interactions that stabilize it.","Explain how a change in one amino acid can influence folding and activity."],commonMistakes:["Thinking proteins are rigid rather than dynamic.","Ignoring that function often depends on shape, flexibility, and interactions."],faq:[{q:"Why does protein folding matter?",a:"Misfolding can destroy function or cause aggregation, which is linked to disease."},{q:"What is a protein domain?",a:"A domain is a distinct folded region that often carries out a specific function or interaction."}],related:[["Enzyme Explorer","biochemistry/enzyme-explorer.html"],["RNA Explorer","molecular-biology/rna-explorer.html"],["Amino Acid Metabolism","biochemistry/amino-acid-metabolism.html"]]},
      'enzyme-explorer':{overview:["Enzymes accelerate reactions by lowering activation energy and stabilizing transition states.","Their activity depends on substrate binding, active site architecture, cofactor availability, and environmental conditions.","Kinetics and inhibition patterns are central to biochemistry, pharmacology, and diagnostics."],sections:[{title:"Mechanism",body:"Enzymes bind substrates in an active site and convert them to products through a lower-energy pathway. The transition state is often the key target of catalysis."},{title:"Kinetics",body:"Michaelis-Menten behavior describes how rate changes with substrate concentration, and parameters such as Km and Vmax summarize key properties."},{title:"Regulation",body:"Enzymes can be regulated by allostery, covalent modification, feedback inhibition, compartmentalization, and protein-protein interactions."},{title:"Clinical relevance",body:"Many drugs inhibit enzymes, and enzyme assays are used to diagnose disease, monitor therapy, and study metabolism."}],examTips:["Sketch the Michaelis-Menten curve and define Km and Vmax clearly.","Distinguish competitive, non-competitive, and uncompetitive inhibition."],commonMistakes:["Equating Km with substrate affinity in every context.","Ignoring that enzymes can be regulated by both concentration and activity."],faq:[{q:"Why do enzymes not change equilibrium?",a:"They speed both forward and reverse reactions equally, so they do not alter the final equilibrium position."},{q:"What is the role of a cofactor?",a:"A cofactor assists catalysis and may participate directly in electron transfer, acid-base chemistry, or substrate binding."}],related:[["Protein Explorer","biochemistry/protein-explorer.html"],["Cellular Respiration","biochemistry/cellular-respiration.html"],["PCR","laboratory/pcr.html"]]},
      'carbohydrate-metabolism':{overview:["Carbohydrate metabolism links food intake, ATP generation, and biosynthetic demand.","Glycolysis initiates glucose breakdown, while glycogen storage and the pentose phosphate pathway supply diverse metabolic needs.","The pathway network is strongly linked to insulin signaling, redox balance, and cell growth."],sections:[{title:"Core pathways",body:"Glycolysis converts glucose into pyruvate and produces ATP and NADH. Glycogenesis stores glucose as glycogen, while glycogenolysis releases it when needed."},{title:"Regulation",body:"Hormones such as insulin and glucagon coordinate pathway activity according to fed and fasting states."},{title:"Alternative routes",body:"The pentose phosphate pathway provides NADPH and ribose-5-phosphate, supporting biosynthesis and antioxidant defense."},{title:"Clinical relevance",body:"Disorders include diabetes, glycogen storage disease, hypoglycemia, and pathways altered in cancer cells."}],examTips:["Know the irreversible steps of glycolysis and the bypass reactions used in gluconeogenesis.","Separate ATP yield from NADH yield in pathway comparisons."],commonMistakes:["Assuming gluconeogenesis is simply glycolysis in reverse.","Ignoring the role of the pentose phosphate pathway in biosynthesis."],faq:[{q:"Why is glycogen stored in the liver and muscle?",a:"The liver supports whole-body glucose homeostasis, while muscle uses glycogen mainly for its own energy needs."},{q:"What is the importance of NADPH?",a:"It supports reductive biosynthesis and protects cells from oxidative damage."}],related:[["Cellular Respiration","biochemistry/cellular-respiration.html"],["Lipid Metabolism","biochemistry/lipid-metabolism.html"],["Enzyme Explorer","biochemistry/enzyme-explorer.html"]]},
      'lipid-metabolism':{overview:["Lipid metabolism includes fat storage, membrane assembly, signaling lipids, and energy release.","Fatty acid oxidation supplies energy during fasting, while fatty acid synthesis is active during feeding.","Lipid pathways are central to obesity, atherosclerosis, metabolic disease, and membrane composition."],sections:[{title:"Storage and mobilization",body:"Triacylglycerols are stored in adipose tissue and mobilized during fasting through lipolysis and beta-oxidation."},{title:"Energy release",body:"Beta-oxidation produces acetyl-CoA, NADH, and FADH2, which feed the TCA cycle and electron transport chain."},{title:"Biosynthesis",body:"Fatty acid synthase builds palmitate from acetyl-CoA, while cholesterol and phospholipid pathways create essential membrane components."},{title:"Clinical relevance",body:"Disorders include fatty liver disease, dyslipidemia, ketoacidosis, and inherited defects in lipid oxidation."}],examTips:["Distinguish fed-state synthesis from fasting-state oxidation.","Know the role of carnitine in transporting long-chain fatty acids."],commonMistakes:["Treating all lipids as interchangeable.","Ignoring transport steps that make oxidation possible."],faq:[{q:"Why is cholesterol essential?",a:"It stabilizes membranes and serves as the precursor for steroid hormones and bile acids."},{q:"What is the point of ketone bodies?",a:"They provide alternative fuel for the brain and other tissues during prolonged fasting."}],related:[["Carbohydrate Metabolism","biochemistry/carbohydrate-metabolism.html"],["Cellular Respiration","biochemistry/cellular-respiration.html"],["Spectrophotometry","laboratory/spectrophotometry.html"]]},
      'amino-acid-metabolism':{overview:["Amino acid metabolism links protein turnover, nitrogen disposal, and biosynthesis of key molecules.","Transamination and deamination are central reactions that connect amino acids to central carbon metabolism.","The urea cycle prevents toxic ammonia accumulation and is a key metabolic feature of mammals."],sections:[{title:"Nitrogen handling",body:"Amino acids lose nitrogen through transamination and deamination, and the nitrogen is processed in the urea cycle."},{title:"Carbon skeletons",body:"Carbon skeletons can enter pathways that support glucose production, ketone body formation, or energy generation."},{title:"Specialized roles",body:"Amino acids are precursors for neurotransmitters, porphyrins, nucleotide bases, and other essential biomolecules."},{title:"Clinical relevance",body:"Inherited disorders such as phenylketonuria and urea cycle defects disrupt normal metabolism and require careful management."}],examTips:["Classify amino acids as glucogenic, ketogenic, or both where appropriate.","Know the purpose of the urea cycle rather than memorizing every intermediate alone."],commonMistakes:["Assuming amino acids are used only for protein synthesis.","Overlooking the importance of nitrogen balance."],faq:[{q:"Why is the urea cycle important?",a:"It converts toxic ammonia into urea for safe excretion."},{q:"What is PLP?",a:"Pyridoxal phosphate is a cofactor required for many amino acid transformations."}],related:[["Protein Explorer","biochemistry/protein-explorer.html"],["Enzyme Explorer","biochemistry/enzyme-explorer.html"],["Cellular Respiration","biochemistry/cellular-respiration.html"]]},
      'cellular-respiration':{overview:["Cellular respiration converts nutrients into ATP through coupled redox reactions.","Pyruvate oxidation, the TCA cycle, and oxidative phosphorylation are tightly linked through electron carriers and proton gradients.","Mitochondria are central not only for energy but also for signaling and programmed cell death."],sections:[{title:"Pathway overview",body:"Pyruvate enters mitochondria and is converted to acetyl-CoA, which feeds the TCA cycle and drives electron transfer."},{title:"Electron transport",body:"NADH and FADH2 donate electrons to the electron transport chain, generating a proton motive force across the inner membrane."},{title:"ATP synthesis",body:"ATP synthase uses the gradient to make ATP, coupling chemiosmosis to oxidative phosphorylation."},{title:"Clinical relevance",body:"Respiration defects contribute to mitochondrial disease, ischemia, poisoning, and metabolic disorders."}],examTips:["Track carbon, electrons, and ATP separately when drawing pathway steps.","Remember that oxygen is the terminal electron acceptor in aerobic respiration."],commonMistakes:["Treating the TCA cycle as the main ATP-producing step directly.","Ignoring the importance of the proton gradient."],faq:[{q:"Why is oxygen needed?",a:"It accepts electrons at the end of the chain, allowing the pathway to continue."},{q:"What is the proton motive force?",a:"It is the stored energy in the electrochemical gradient that ATP synthase uses to make ATP."}],related:[["Carbohydrate Metabolism","biochemistry/carbohydrate-metabolism.html"],["Enzyme Explorer","biochemistry/enzyme-explorer.html"],["Spectrophotometry","laboratory/spectrophotometry.html"]]},
      'pcr':{overview:["PCR amplifies a targeted DNA sequence through repeated temperature cycles.","Each cycle denatures DNA, anneals primers, and extends new strands, producing exponential amplification.","Primer design and reaction conditions strongly affect specificity and efficiency."],sections:[{title:"Mechanism",body:"High temperature separates strands, primers bind at a defined temperature, and polymerase extends from the primers to make new DNA."},{title:"Design considerations",body:"Primer length, melting temperature, GC content, and avoidance of secondary structures influence success."},{title:"Applications",body:"PCR is used in diagnostics, genotyping, cloning, sequencing library prep, and forensic analysis."},{title:"Limitations",body:"Contamination, primer-dimer formation, inhibitor effects, and poor reaction optimization can compromise results."}],examTips:["List the temperature steps in the correct order and describe the event at each stage.","Explain why PCR is exponential but not unlimited in efficiency."],commonMistakes:["Assuming PCR amplifies all DNA in a sample.","Ignoring contamination controls and negative controls."],faq:[{q:"Why is a polymerase thermostable?",a:"It must survive repeated high-temperature denaturation cycles."},{q:"What is an amplicon?",a:"An amplicon is the specific DNA fragment generated by PCR."}],related:[["DNA Explorer","molecular-biology/dna-explorer.html"],["Gel Electrophoresis","laboratory/gel-electrophoresis.html"],["DNA Sequencing","molecular-biology/dna-sequencing.html"]]},
      'gel-electrophoresis':{overview:["Gel electrophoresis separates molecules by size and charge as they migrate through a matrix under an electric field.","Agarose is common for DNA and RNA, while polyacrylamide is often used for proteins and fine resolution.","Band position and intensity provide quick evidence about fragment size, purity, and yield."],sections:[{title:"Principles",body:"Charged molecules move toward the opposite electrode, and smaller or more compact molecules generally travel further."},{title:"Interpretation",body:"Comparison with a ladder allows approximate sizing; intensity relates to amount but must be interpreted carefully."},{title:"Experimental use",body:"The technique confirms PCR products, checks digested DNA, and supports protein analysis in combination with other methods."},{title:"Troubleshooting",body:"Poor resolution, smearing, and unexpected band patterns often result from buffer problems, sample quality, or run conditions."}],examTips:["Always mention that molecules move toward the opposite electrode and that size influences migration.","Distinguish agarose versus polyacrylamide applications."],commonMistakes:["Assuming band brightness is a perfect quantitative measure.","Ignoring the effect of gel percentage on separation range."],faq:[{q:"What does a ladder show?",a:"It provides markers of known size so the sample bands can be compared and estimated."},{q:"Why is buffer important?",a:"Buffer conducts current and stabilizes pH during electrophoresis."}],related:[["PCR","laboratory/pcr.html"],["Western Blot","laboratory/western-blot.html"],["DNA Sequencing","molecular-biology/dna-sequencing.html"]]},
      'chromatography':{overview:["Chromatography separates molecules using differences in how they interact with a stationary phase and a mobile phase.","The method is essential for purification, quantification, and analysis in biochemistry and biotechnology.","The best technique depends on the molecule's charge, size, polarity, or binding properties."],sections:[{title:"Principles",body:"A sample is carried by a mobile phase through a stationary phase. Molecules with different affinities move at different speeds and separate into bands or peaks."},{title:"Common modes",body:"Affinity, ion exchange, size exclusion, and reversed-phase chromatography each exploit a different physical property."},{title:"Applications",body:"Chromatography is used for protein purification, metabolite analysis, drug monitoring, and quality control."},{title:"Interpretation",body:"Retention time and peak shape provide information about identity and purity, but standards are essential for confirmation."}],examTips:["Identify the separation principle before naming the method.","Recognize when chromatography is used for purification versus analysis."],commonMistakes:["Treating retention time as absolute identity.","Ignoring that different molecules may require different modes of separation."],faq:[{q:"What is elution?",a:"Elution is the process of releasing molecules from the column so they can be collected or detected."},{q:"Why do peaks matter?",a:"Peak shape and retention indicate resolution, purity, and the behavior of the analyte."}],related:[["ELISA","laboratory/elisa.html"],["Western Blot","laboratory/western-blot.html"],["Spectrophotometry","laboratory/spectrophotometry.html"]]},
      'elisa':{overview:["ELISA uses antibody-antigen binding to produce a measurable signal that reflects the amount of target present.","The assay is widely used because it is sensitive, relatively quick, and easy to standardize.","Careful controls are essential for trustworthy interpretation."],sections:[{title:"Workflow",body:"A capture antibody binds the target, detection reagents produce a color change, and signal intensity is compared with standards."},{title:"Types",body:"Direct, indirect, and sandwich ELISA formats vary in their use of antibodies and in the specificity of the readout."},{title:"Applications",body:"ELISA supports infectious disease testing, hormone assays, cytokine measurement, and biomarker research."},{title:"Limitations",body:"Cross-reactivity, matrix effects, and poor controls can distort results and must be considered carefully."}],examTips:["Know the order of reagents in a sandwich assay.","Explain why a standard curve is necessary for quantification."],commonMistakes:["Ignoring wash steps and background control.","Treating a color change as meaningful without standards and controls."],faq:[{q:"Why are wash steps important?",a:"They remove unbound material and reduce background signal."},{q:"What is a standard curve?",a:"It is a series of known concentrations used to estimate the amount in unknown samples."}],related:[["Western Blot","laboratory/western-blot.html"],["Spectrophotometry","laboratory/spectrophotometry.html"],["PCR","laboratory/pcr.html"]]},
      'western-blot':{overview:["Western blotting combines protein separation, transfer, and antibody-based detection to reveal protein size and abundance.","The method is often used to confirm expression and detect post-translational modification.","Interpretation depends strongly on controls, transfer efficiency, and antibody specificity."],sections:[{title:"Workflow",body:"Proteins are separated by SDS-PAGE, transferred to a membrane, and probed with primary and secondary antibodies."},{title:"Controls",body:"Loading controls and positive or negative controls help determine whether a band is real and comparable across samples."},{title:"Applications",body:"Western blotting is used in cell signaling studies, protein validation, and confirmatory analysis in research and diagnostics."},{title:"Limitations",body:"Transfer quality, antibody quality, and overexposure can affect interpretation."}],examTips:["Explain why SDS gives proteins a similar charge-to-mass relationship.","Describe the role of the loading control in comparing lanes."],commonMistakes:["Reading a single band as proof of specificity without controls.","Ignoring the possibility of poor transfer or non-specific binding."],faq:[{q:"Why is transfer important?",a:"Proteins must be moved from the gel to the membrane so antibodies can detect them."},{q:"What is a loading control?",a:"It is a protein expected to remain constant across samples and helps normalize comparisons."}],related:[["ELISA","laboratory/elisa.html"],["Gel Electrophoresis","laboratory/gel-electrophoresis.html"],["Protein Explorer","biochemistry/protein-explorer.html"]]},
      'spectrophotometry':{overview:["Spectrophotometry measures light absorbance to estimate concentration, reaction progress, or purity.","The Beer-Lambert law links absorbance to concentration under controlled conditions.","The technique is central to routine biochemical and clinical assays."],sections:[{title:"Principles",body:"A sample absorbs light at a selected wavelength, and the resulting absorbance is proportional to concentration within the valid range."},{title:"Applications",body:"It is used for nucleic acid quantification, protein assays, enzyme activity measurements, and microbial growth studies."},{title:"Experimental care",body:"A blank corrects background, and standards help establish a reliable curve."},{title:"Limitations",body:"Very high absorbance values may fall outside the linear range and require dilution or alternative methods."}],examTips:["Write A = εlc and define each variable clearly.","Explain why a blank is essential before reading a sample."],commonMistakes:["Using absorbance values beyond the linear range.","Forgetting that purity ratios only capture one aspect of sample quality."],faq:[{q:"What is a blank?",a:"A blank contains everything except the analyte and corrects the instrument and reagent background."},{q:"Why use a standard curve?",a:"It converts absorbance into an estimate of concentration under the same conditions."}],related:[["ELISA","laboratory/elisa.html"],["PCR","laboratory/pcr.html"],["Cellular Respiration","biochemistry/cellular-respiration.html"]]},
      'microscopy':{overview:["Microscopy allows students to connect molecular processes with cell structure and tissue organization.","Different modalities reveal different levels of detail, from whole cells to subcellular structures.","The choice of technique depends on magnification needs, contrast, fluorophore availability, and sample preparation."],sections:[{title:"Resolution",body:"Resolution is the ability to distinguish closely spaced structures, and it is often more important than simple magnification."},{title:"Modalities",body:"Brightfield, fluorescence, confocal, and electron microscopy each offer different strengths for biological questions."},{title:"Applications",body:"Microscopy supports pathology, cell biology, microbiology, developmental biology, and materials science."},{title:"Interpretation",body:"Images require careful controls because sample preparation, staining, and optics can influence appearance."}],examTips:["Compare light and electron microscopy by resolution, preparation, and use.","Explain the value of fluorescence for localizing specific molecules."],commonMistakes:["Equating more magnification with more useful information.","Ignoring the role of staining and sample preparation."],faq:[{q:"Why is fluorescence useful?",a:"It allows specific molecules or structures to be labeled and visualized in living or fixed samples."},{q:"What is the difference between magnification and resolution?",a:"Magnification enlarges an image, but resolution determines how much detail can actually be separated."}],related:[["Protein Explorer","biochemistry/protein-explorer.html"],["Spectrophotometry","laboratory/spectrophotometry.html"],["PCR","laboratory/pcr.html"]]}
    };
    const guide = guides[page] || {overview:[`${data.title} is a core concept in modern life sciences. Review the main principles, laboratory relevance, and exam framing for this topic.`],sections:[{title:"Introduction",body:data.intro},{title:"Key relevance",body:data.importance},{title:"Lab importance",body:data.clinical},{title:"Exam focus",body:data.exam}],examTips:[data.exam],commonMistakes:data.misconceptions.slice(0,2),faq:[{q:"Why is this topic important?",a:data.importance},{q:"What should I revise first?",a:data.exam}],related:[["DNA Explorer","molecular-biology/dna-explorer.html"],["Protein Explorer","biochemistry/protein-explorer.html"]]};
    const overviewList = guide.overview.map(item=>`<li>${item}</li>`).join("");
    const sectionList = guide.sections.map(section=>`<details class="study-detail"><summary>${section.title}</summary><div class="study-body"><p class="muted">${section.body}</p></div></details>`).join("");
    const examList = guide.examTips.map(item=>`<li>${item}</li>`).join("");
    const mistakeList = guide.commonMistakes.map(item=>`<li>${item}</li>`).join("");
    const faqList = guide.faq.map(item=>`<div class="study-faq"><strong>${item.q}</strong><p class="muted">${item.a}</p></div>`).join("");
    const relatedList = guide.related.map(([label,hrefVal])=>`<a class="pill" href="${href(hrefVal)}">${label}</a>`).join("");
    return `<div class="card"><h3>Study Guide</h3><div class="study-guide"><div class="study-highlights"><h4>Core ideas</h4><ul class="study-list">${overviewList}</ul></div><div class="study-accordion">${sectionList}</div><div class="study-grid"><div class="study-box"><h4>Exam focus</h4><ul class="study-list">${examList}</ul></div><div class="study-box"><h4>Common mistakes</h4><ul class="study-list">${mistakeList}</ul></div></div><div class="study-faqs"><h4>Quick questions</h4>${faqList}</div><div class="pill-row"><span class="pill">Related modules</span>${relatedList}</div></div></div>`;
  }

  function buildExpandedTopicContent(pageKey, data){
    const glossaryMap = {
      'dna-explorer': ['Nucleotide','Phosphodiester bond','Antiparallel','Major groove','Minor groove','GC content'],
      'rna-explorer': ['Messenger RNA','Transfer RNA','Ribosomal RNA','Splicing','Codon','Ribosome'],
      'gene-expression': ['Promoter','Enhancer','Transcription factor','Splicing','Translation','Epigenetics'],
      'dna-repair': ['Base excision repair','Nucleotide excision repair','Mismatch repair','Homologous recombination','NHEJ','Checkpoint'],
      'dna-sequencing': ['Read','Coverage','Adapter','Variant','Alignment','Assembly'],
      'crispr-overview': ['Cas9','Guide RNA','PAM','Knockout','HDR','Off-target'],
      'protein-explorer': ['Amino acid','Alpha helix','Beta sheet','Domain','Active site','Chaperone'],
      'enzyme-explorer': ['Active site','Substrate','Transition state','Km','Vmax','Cofactor'],
      'carbohydrate-metabolism': ['Glycolysis','Gluconeogenesis','Glycogen','NADH','ATP','Pentose phosphate pathway'],
      'lipid-metabolism': ['Beta-oxidation','Fatty acid synthase','Acetyl-CoA','Ketone body','Cholesterol','Lipoprotein'],
      'amino-acid-metabolism': ['Transamination','Deamination','Urea cycle','Glucogenic','Ketogenic','PLP'],
      'cellular-respiration': ['TCA cycle','Electron transport chain','Oxidative phosphorylation','Proton motive force','ATP synthase','Redox'],
      'pcr': ['Primer','Template','Annealing','Amplicon','Polymerase','Denaturation'],
      'gel-electrophoresis': ['Agarose','Polyacrylamide','Ladder','Migration','Buffer','Band'],
      'chromatography': ['Stationary phase','Mobile phase','Retention time','Elution','Affinity','HPLC'],
      'elisa': ['Antigen','Antibody','Substrate','Standard curve','Capture antibody','Wash step'],
      'western-blot': ['SDS-PAGE','Transfer','Membrane','Primary antibody','Secondary antibody','Loading control'],
      'spectrophotometry': ['Absorbance','Wavelength','Beer-Lambert law','Blank','Path length','Standard curve'],
      'microscopy': ['Resolution','Magnification','Fluorophore','Objective','Confocal','Electron microscopy']
    };
    const glossaryTerms = (glossaryMap[pageKey] || data.terms || []).slice(0,8);
    const termDefinitions = {
      nucleotide:'A nucleotide is a small building block of nucleic acids made of a sugar, phosphate, and nitrogenous base.',
      'phosphodiester bond':'A phosphodiester bond links nucleotides into a DNA or RNA chain.',
      antiparallel:'Antiparallel means the two strands run in opposite directions, which supports replication and base pairing.',
      'major groove':'The major groove is a wider region of the helix where proteins often bind DNA.',
      'minor groove':'The minor groove is a narrower region of the helix that also influences protein interactions.',
      'gc content':'GC content is the proportion of guanine and cytosine bases in a sequence.',
      'messenger rna':'mRNA carries the coding information from DNA to the ribosome.',
      'transfer rna':'tRNA delivers amino acids to the ribosome during translation.',
      'ribosomal rna':'rRNA forms the structural and catalytic core of the ribosome.',
      splicing:'Splicing removes non-coding regions from an RNA transcript before translation.',
      codon:'A codon is a three-base sequence that specifies an amino acid or stop signal.',
      ribosome:'A ribosome is the molecular machine that translates mRNA into protein.',
      promoter:'A promoter is a DNA sequence that helps recruit transcription machinery.',
      enhancer:'An enhancer is a regulatory DNA element that increases transcription of a gene.',
      'transcription factor':'A transcription factor is a protein that helps control gene expression.',
      translation:'Translation is the step where ribosomes build a protein from an mRNA template.',
      epigenetics:'Epigenetics studies reversible changes in gene expression that do not alter the DNA sequence.',
      'base excision repair':'BER removes small damaged bases and repairs them before they become stable mutations.',
      'nucleotide excision repair':'NER removes bulky DNA lesions that distort the helix.',
      'mismatch repair':'Mismatch repair corrects base-pairing errors that arise during replication.',
      'homologous recombination':'Homologous recombination uses a matching sequence as a template for accurate repair.',
      nhej:'Non-homologous end joining rejoins broken DNA ends quickly but can be error-prone.',
      checkpoint:'A checkpoint is a control point that delays the cell cycle until DNA damage is handled.',
      read:'A read is a short DNA sequence generated by a sequencing instrument.',
      coverage:'Coverage is the average number of times each base is observed in a sequencing experiment.',
      adapter:'An adapter is a short DNA sequence added to fragments so they can be amplified or sequenced.',
      variant:'A variant is a difference from a reference sequence that may or may not be clinically important.',
      alignment:'Alignment compares sequencing reads to a reference to determine their position.',
      assembly:'Assembly reconstructs longer sequences from overlapping reads.',
      cas9:'Cas9 is the nuclease that cuts DNA at a target site specified by guide RNA.',
      'guide rna':'Guide RNA directs Cas proteins to a matching DNA sequence.',
      pam:'PAM is a short sequence adjacent to the target that must be recognized for cleavage.',
      knockout:'A knockout is a loss-of-function mutation introduced into a gene.',
      hdr:'HDR is a repair pathway that can copy a donor template into a target site.',
      'off-target':'Off-target editing refers to unintended cuts at other genomic sites.',
      'amino acid':'Amino acids are the building blocks of proteins and also participate in metabolism.',
      'alpha helix':'An alpha helix is a common local protein secondary structure stabilized by hydrogen bonds.',
      'beta sheet':'A beta sheet is a common protein secondary structure formed by aligned strands.',
      domain:'A domain is a folded region of a protein that often carries out a specific function.',
      'active site':'An active site is the region of an enzyme where substrate binding and catalysis occur.',
      chaperone:'A chaperone assists proteins in folding correctly and avoiding aggregation.',
      substrate:'A substrate is the molecule that binds an enzyme and is converted into product.',
      'transition state':'The transition state is the high-energy arrangement of atoms during a reaction.',
      km:'Km is the substrate concentration at which an enzyme proceeds at half of its maximal rate.',
      vmax:'Vmax is the maximum rate an enzyme can reach under saturating substrate conditions.',
      cofactor:'A cofactor is a helper molecule that supports enzyme function.',
      glycolysis:'Glycolysis breaks glucose into pyruvate and produces ATP and NADH.',
      gluconeogenesis:'Gluconeogenesis makes glucose from non-carbohydrate precursors during fasting.',
      glycogen:'Glycogen is the stored form of glucose in animals.',
      nadh:'NADH is a reduced electron carrier that fuels ATP production.',
      atp:'ATP is the main immediate energy currency of the cell.',
      'pentose phosphate pathway':'The pentose phosphate pathway provides NADPH and ribose-5-phosphate for biosynthesis.',
      'beta-oxidation':'Beta-oxidation breaks fatty acids into acetyl-CoA units for energy production.',
      'fatty acid synthase':'Fatty acid synthase builds fatty acids from acetyl-CoA units.',
      'acetyl-coa':'Acetyl-CoA is a central carbon carrier that enters the TCA cycle and lipid synthesis.',
      'ketone body':'Ketone bodies are fuel molecules made during fasting or prolonged exercise.',
      cholesterol:'Cholesterol is a lipid that stabilizes membranes and is the precursor of steroid hormones.',
      lipoprotein:'Lipoproteins transport lipids through the blood.',
      transamination:'Transamination transfers an amino group between molecules during amino acid metabolism.',
      deamination:'Deamination removes amino groups from amino acids for nitrogen disposal.',
      'urea cycle':'The urea cycle converts ammonia into urea for safe excretion.',
      glucogenic:'Glucogenic amino acids can contribute carbon to glucose production.',
      ketogenic:'Ketogenic amino acids can contribute carbon to ketone body formation.',
      plp:'PLP is a cofactor required for many amino acid transformations.',
      'tca cycle':'The TCA cycle oxidizes acetyl-CoA and generates high-energy electron carriers.',
      'electron transport chain':'The electron transport chain transfers electrons to create a proton gradient.',
      'oxidative phosphorylation':'Oxidative phosphorylation couples electron transport to ATP synthesis.',
      'proton motive force':'The proton motive force is the stored energy in a proton gradient across a membrane.',
      'atp synthase':'ATP synthase uses the proton gradient to make ATP.',
      redox:'A redox reaction transfers electrons between molecules and changes their oxidation states.',
      primer:'A primer is a short oligonucleotide that initiates DNA synthesis.',
      template:'A template is the strand that provides the sequence information for copying.',
      annealing:'Annealing is the step where primers bind to their complementary DNA sequence.',
      amplicon:'An amplicon is the DNA fragment produced by PCR.',
      polymerase:'A polymerase is an enzyme that builds a new nucleic acid chain.',
      denaturation:'Denaturation separates double-stranded DNA into single strands.',
      agarose:'Agarose is a gel matrix commonly used to separate DNA fragments.',
      polyacrylamide:'Polyacrylamide is a tighter gel matrix often used for proteins or high-resolution nucleic acids.',
      ladder:'A ladder is a mixture of standards with known sizes used for comparison.',
      migration:'Migration is the movement of molecules through a gel under an electric field.',
      buffer:'Buffer maintains pH and conducts electric current during electrophoresis.',
      band:'A band is a visible zone of separated molecules in a gel.',
      'stationary phase':'The stationary phase is the fixed material that molecules interact with during chromatography.',
      'mobile phase':'The mobile phase carries the sample through the separation system.',
      'retention time':'Retention time is how long a compound takes to pass through a chromatographic column.',
      elution:'Elution is the process of releasing a compound from the column.',
      affinity:'Affinity is the strength of the interaction between a molecule and its binding partner.',
      hplc:'HPLC uses high pressure to move samples through a chromatographic column.',
      antigen:'An antigen is a molecule that can be recognized by the immune system and antibodies.',
      antibody:'An antibody is a protein that binds a specific target with high specificity.',
      substrate:'A substrate is the target molecule measured or detected in an assay.',
      'standard curve':'A standard curve relates known concentrations to measured signal for quantification.',
      'capture antibody':'A capture antibody immobilizes the target in an ELISA format.',
      'wash step':'A wash step removes unbound material and reduces background signal.',
      'sds-page':'SDS-PAGE separates proteins by size after denaturing them with sodium dodecyl sulfate.',
      transfer:'Transfer moves proteins from a gel onto a membrane for detection.',
      membrane:'A membrane is the solid support used to capture transferred proteins.',
      'primary antibody':'The primary antibody binds the target protein directly.',
      'secondary antibody':'The secondary antibody binds the primary antibody and carries the detection signal.',
      'loading control':'A loading control is a reference protein used to compare samples fairly.',
      absorbance:'Absorbance is the amount of light a sample removes at a given wavelength.',
      wavelength:'A wavelength is the distance between repeating points of a light wave.',
      'beer-lambert law':'The Beer-Lambert law links absorbance to concentration and path length.',
      blank:'A blank corrects for background signal from reagents and the instrument.',
      'path length':'Path length is the distance light travels through the sample.',
      resolution:'Resolution is the smallest distance between two points that can still be distinguished.',
      magnification:'Magnification enlarges an image but does not guarantee greater detail.',
      fluorophore:'A fluorophore is a molecule that emits light after excitation.',
      objective:'The objective lens gathers light and determines resolution in microscopy.',
      confocal:'Confocal microscopy uses optical sectioning to create sharper three-dimensional images.',
      'electron microscopy':'Electron microscopy uses electrons instead of light to achieve very high resolution.'
    };
    const glossaryItems = glossaryTerms.map(term=>{
      const normalized = (term || '').toLowerCase();
      const definition = termDefinitions[normalized] || `${term} is an important concept in ${data.title.toLowerCase()}.`;
      return `<div class="study-box"><strong>${term}</strong><p class="muted">${definition}</p></div>`;
    }).join("");

    const relatedMap = {
      'dna-explorer': [['DNA Repair','molecular-biology/dna-repair.html'],['DNA Sequencing','molecular-biology/dna-sequencing.html'],['Gene Expression','molecular-biology/gene-expression.html']],
      'rna-explorer': [['Gene Expression','molecular-biology/gene-expression.html'],['Protein Explorer','biochemistry/protein-explorer.html'],['CRISPR Overview','molecular-biology/crispr-overview.html']],
      'gene-expression': [['RNA Explorer','molecular-biology/rna-explorer.html'],['Protein Explorer','biochemistry/protein-explorer.html'],['DNA Repair','molecular-biology/dna-repair.html']],
      'dna-repair': [['DNA Explorer','molecular-biology/dna-explorer.html'],['DNA Sequencing','molecular-biology/dna-sequencing.html'],['CRISPR Overview','molecular-biology/crispr-overview.html']],
      'dna-sequencing': [['DNA Explorer','molecular-biology/dna-explorer.html'],['Gene Expression','molecular-biology/gene-expression.html'],['PCR','laboratory/pcr.html']],
      'crispr-overview': [['DNA Repair','molecular-biology/dna-repair.html'],['DNA Sequencing','molecular-biology/dna-sequencing.html'],['RNA Explorer','molecular-biology/rna-explorer.html']],
      'protein-explorer': [['Enzyme Explorer','biochemistry/enzyme-explorer.html'],['RNA Explorer','molecular-biology/rna-explorer.html'],['Amino Acid Metabolism','biochemistry/amino-acid-metabolism.html']],
      'enzyme-explorer': [['Protein Explorer','biochemistry/protein-explorer.html'],['Cellular Respiration','biochemistry/cellular-respiration.html'],['PCR','laboratory/pcr.html']],
      'carbohydrate-metabolism': [['Cellular Respiration','biochemistry/cellular-respiration.html'],['Lipid Metabolism','biochemistry/lipid-metabolism.html'],['Enzyme Explorer','biochemistry/enzyme-explorer.html']],
      'lipid-metabolism': [['Carbohydrate Metabolism','biochemistry/carbohydrate-metabolism.html'],['Cellular Respiration','biochemistry/cellular-respiration.html'],['Spectrophotometry','laboratory/spectrophotometry.html']],
      'amino-acid-metabolism': [['Protein Explorer','biochemistry/protein-explorer.html'],['Enzyme Explorer','biochemistry/enzyme-explorer.html'],['Cellular Respiration','biochemistry/cellular-respiration.html']],
      'cellular-respiration': [['Carbohydrate Metabolism','biochemistry/carbohydrate-metabolism.html'],['Enzyme Explorer','biochemistry/enzyme-explorer.html'],['Spectrophotometry','laboratory/spectrophotometry.html']],
      'pcr': [['DNA Explorer','molecular-biology/dna-explorer.html'],['Gel Electrophoresis','laboratory/gel-electrophoresis.html'],['DNA Sequencing','molecular-biology/dna-sequencing.html']],
      'gel-electrophoresis': [['PCR','laboratory/pcr.html'],['Western Blot','laboratory/western-blot.html'],['DNA Sequencing','molecular-biology/dna-sequencing.html']],
      'chromatography': [['ELISA','laboratory/elisa.html'],['Western Blot','laboratory/western-blot.html'],['Spectrophotometry','laboratory/spectrophotometry.html']],
      'elisa': [['Western Blot','laboratory/western-blot.html'],['Spectrophotometry','laboratory/spectrophotometry.html'],['PCR','laboratory/pcr.html']],
      'western-blot': [['ELISA','laboratory/elisa.html'],['Gel Electrophoresis','laboratory/gel-electrophoresis.html'],['Protein Explorer','biochemistry/protein-explorer.html']],
      'spectrophotometry': [['ELISA','laboratory/elisa.html'],['PCR','laboratory/pcr.html'],['Cellular Respiration','biochemistry/cellular-respiration.html']],
      'microscopy': [['Protein Explorer','biochemistry/protein-explorer.html'],['Spectrophotometry','laboratory/spectrophotometry.html'],['PCR','laboratory/pcr.html']]
    };
    const relatedItems = (relatedMap[pageKey] || [['DNA Explorer','molecular-biology/dna-explorer.html'],['Protein Explorer','biochemistry/protein-explorer.html']]).map(([label, link])=>`<a class="pill" href="${href(link)}">${label}</a>`).join("");

    const referenceLibrary = {
      'dna-explorer':[{title:'Molecular Biology of the Cell', authors:'Bruce Alberts et al.', edition:'7th ed.', publisher:'W. W. Norton & Company', year:'2022', description:'A reliable and widely used undergraduate resource for DNA structure, gene expression, and genome integrity.', topics:['DNA structure','replication','gene regulation'], audience:'Undergraduate'},{title:'Molecular Cell Biology', authors:'Harvey Lodish et al.', edition:'9th ed.', publisher:'W. H. Freeman', year:'2021', description:'Excellent for understanding core molecular mechanisms and how they connect to cell biology and disease.', topics:['RNA biology','gene expression','cell function'], audience:'Undergraduate'},{title:'Lewin\'s Genes XII', authors:'Jocelyn E. Krebs et al.', edition:'12th ed.', publisher:'Jones & Bartlett Learning', year:'2017', description:'A concise genetics text that strengthens conceptual understanding of inheritance and molecular regulation.', topics:['genes','regulation','genetics'], audience:'Beginner to undergraduate'}],
      'rna-explorer':[{title:'Molecular Biology of the Cell', authors:'Bruce Alberts et al.', edition:'7th ed.', publisher:'W. W. Norton & Company', year:'2022', description:'A foundational guide for RNA, protein synthesis, and the wider cellular context of gene expression.', topics:['RNA biology','translation','gene expression'], audience:'Undergraduate'},{title:'Molecular Cell Biology', authors:'Harvey Lodish et al.', edition:'9th ed.', publisher:'W. H. Freeman', year:'2021', description:'Useful for linking RNA processing, translation, and regulation to real cellular pathways.', topics:['mRNA processing','translation','post-transcriptional regulation'], audience:'Undergraduate'},{title:'Lewin\'s Genes XII', authors:'Jocelyn E. Krebs et al.', edition:'12th ed.', publisher:'Jones & Bartlett Learning', year:'2017', description:'Great for concise treatments of transcription, RNA regulation, and gene expression logic.', topics:['transcription','RNA regulation','genetics'], audience:'Beginner to undergraduate'}],
      'gene-expression':[{title:'Molecular Biology of the Cell', authors:'Bruce Alberts et al.', edition:'7th ed.', publisher:'W. W. Norton & Company', year:'2022', description:'Excellent for understanding transcriptional control and the cellular logic of gene regulation.', topics:['promoters','enhancers','transcription'], audience:'Undergraduate'},{title:'Molecular Cell Biology', authors:'Harvey Lodish et al.', edition:'9th ed.', publisher:'W. H. Freeman', year:'2021', description:'Provides a strong bridge between molecular mechanisms and quantitative ideas in regulation.', topics:['gene expression','RNA processing','translation'], audience:'Undergraduate'},{title:'Lewin\'s Genes XII', authors:'Jocelyn E. Krebs et al.', edition:'12th ed.', publisher:'Jones & Bartlett Learning', year:'2017', description:'A compact and approachable introduction to regulatory systems in biology.', topics:['expression control','epigenetics','genes'], audience:'Beginner to undergraduate'}],
      'dna-repair':[{title:'Molecular Biology of the Cell', authors:'Bruce Alberts et al.', edition:'7th ed.', publisher:'W. W. Norton & Company', year:'2022', description:'A strong general resource for DNA repair pathways and the maintenance of genome stability.', topics:['DNA repair','genome integrity','mutagenesis'], audience:'Undergraduate'},{title:'Lewin\'s Genes XII', authors:'Jocelyn E. Krebs et al.', edition:'12th ed.', publisher:'Jones & Bartlett Learning', year:'2017', description:'Useful for linking mutation, repair, and inheritance in a clear teaching style.', topics:['repair pathways','mutation','genetics'], audience:'Beginner to undergraduate'},{title:'Human Molecular Genetics', authors:'Tom Strachan and Andrew Read', edition:'5th ed.', publisher:'Garland Science', year:'2018', description:'Helpful for understanding how DNA repair defects contribute to inherited disease and cancer.', topics:['genetic disease','repair defects','cancer genetics'], audience:'Undergraduate'}],
      'dna-sequencing':[{title:'Molecular Biology of the Cell', authors:'Bruce Alberts et al.', edition:'7th ed.', publisher:'W. W. Norton & Company', year:'2022', description:'A dependable reference for how nucleic acid methods fit into broader molecular biology.', topics:['DNA sequencing','genomics','molecular methods'], audience:'Undergraduate'},{title:'Lewin\'s Genes XII', authors:'Jocelyn E. Krebs et al.', edition:'12th ed.', publisher:'Jones & Bartlett Learning', year:'2017', description:'Good for building an early understanding of genome analysis and molecular interpretation.', topics:['genomics','gene analysis','techniques'], audience:'Beginner to undergraduate'},{title:'Principles of Gene Manipulation', authors:'Sandy B. Primrose and Richard M. Twyman', edition:'7th ed.', publisher:'Wiley-Blackwell', year:'2013', description:'A useful guide for experimental tools and molecular workflows used in modern genetics.', topics:['gene manipulation','molecular methods','cloning'], audience:'Undergraduate'}],
      'crispr-overview':[{title:'Molecular Biology of the Cell', authors:'Bruce Alberts et al.', edition:'7th ed.', publisher:'W. W. Norton & Company', year:'2022', description:'Useful for contextualizing genome editing inside modern molecular biology and cell biology.', topics:['CRISPR','editing','genome engineering'], audience:'Undergraduate'},{title:'Molecular Biotechnology', authors:'Bernard R. Glick, Jack J. Pasternak, and Cheryl L. Patten', edition:'5th ed.', publisher:'ASM Press', year:'2017', description:'A practical chemistry-and-biology text for understanding biotechnological tools and engineered systems.', topics:['biotechnology','gene editing','molecular tools'], audience:'Undergraduate'},{title:'Principles of Gene Manipulation', authors:'Sandy B. Primrose and Richard M. Twyman', edition:'7th ed.', publisher:'Wiley-Blackwell', year:'2013', description:'Bridges foundational genetics with contemporary gene editing and recombinant DNA practice.', topics:['recombinant DNA','gene manipulation','biotech'], audience:'Undergraduate'}],
      'protein-explorer':[{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'A standard biochemistry text that covers protein structure, enzymes, and function with exceptional clarity.', topics:['protein structure','enzymes','metabolism'], audience:'Undergraduate'},{title:'Harper\'s Illustrated Biochemistry', authors:'Victor W. Rodwell et al.', edition:'32nd ed.', publisher:'McGraw Hill', year:'2023', description:'Excellent for quick, high-yield revision and clinical links in biochemistry.', topics:['proteins','metabolism','clinical biochemistry'], audience:'Undergraduate'},{title:'Biochemistry', authors:'Jeremy M. Berg, John L. Tymoczko, and Gregory J. Gatto', edition:'9th ed.', publisher:'W. H. Freeman', year:'2023', description:'A modern and thoughtful survey of biochemical principles and their applications.', topics:['biochemistry','protein function','metabolism'], audience:'Undergraduate'}],
      'enzyme-explorer':[{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'One of the best references for enzyme kinetics, catalytic mechanisms, and biochemical regulation.', topics:['enzyme kinetics','mechanism','metabolism'], audience:'Undergraduate'},{title:'Harper\'s Illustrated Biochemistry', authors:'Victor W. Rodwell et al.', edition:'32nd ed.', publisher:'McGraw Hill', year:'2023', description:'Good for rapid study of enzyme regulation and how catalysts relate to disease.', topics:['enzymes','clinical relevance','metabolism'], audience:'Undergraduate'},{title:'Structure and Mechanism in Protein Science', authors:'Alan Fersht', edition:'2nd ed.', publisher:'W. H. Freeman', year:'1999', description:'A deeper text for students who want to understand catalytic principles in a more mechanistic way.', topics:['catalysis','mechanism','protein science'], audience:'Advanced undergraduate'}],
      'carbohydrate-metabolism':[{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'An excellent core text for glycolysis, glycogen metabolism, and coordinated energy pathways.', topics:['glycolysis','gluconeogenesis','glycogen'], audience:'Undergraduate'},{title:'Harper\'s Illustrated Biochemistry', authors:'Victor W. Rodwell et al.', edition:'32nd ed.', publisher:'McGraw Hill', year:'2023', description:'Useful for concise summaries of carbohydrate metabolism and clinical applications.', topics:['carbohydrate metabolism','clinical biochemistry','energy pathways'], audience:'Undergraduate'},{title:'Biochemistry', authors:'Jeremy M. Berg, John L. Tymoczko, and Gregory J. Gatto', edition:'9th ed.', publisher:'W. H. Freeman', year:'2023', description:'Connects pathway logic with regulation and chemical reasoning.', topics:['metabolism','regulation','enzymes'], audience:'Undergraduate'}],
      'lipid-metabolism':[{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'A classic resource for fatty acid oxidation, synthesis, and lipid physiology.', topics:['fatty acid oxidation','cholesterol','lipid metabolism'], audience:'Undergraduate'},{title:'Harper\'s Illustrated Biochemistry', authors:'Victor W. Rodwell et al.', edition:'32nd ed.', publisher:'McGraw Hill', year:'2023', description:'Useful for high-yield revision and the clinical context of lipid disorders.', topics:['lipids','metabolism','clinical cases'], audience:'Undergraduate'},{title:'Biochemistry', authors:'Jeremy M. Berg, John L. Tymoczko, and Gregory J. Gatto', edition:'9th ed.', publisher:'W. H. Freeman', year:'2023', description:'Helps students connect lipid pathways with membrane biology and cellular signaling.', topics:['lipids','metabolism','membranes'], audience:'Undergraduate'}],
      'amino-acid-metabolism':[{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'An authoritative source for amino acid metabolism, nitrogen handling, and the urea cycle.', topics:['amino acids','urea cycle','nitrogen metabolism'], audience:'Undergraduate'},{title:'Harper\'s Illustrated Biochemistry', authors:'Victor W. Rodwell et al.', edition:'32nd ed.', publisher:'McGraw Hill', year:'2023', description:'Excellent for revision of amino acid pathways and clinical patterns.', topics:['amino acids','clinical biochemistry','metabolism'], audience:'Undergraduate'},{title:'Biochemistry', authors:'Jeremy M. Berg, John L. Tymoczko, and Gregory J. Gatto', edition:'9th ed.', publisher:'W. H. Freeman', year:'2023', description:'Provides clear explanations for how amino acids connect to central carbon metabolism.', topics:['amino acids','metabolism','biosynthesis'], audience:'Undergraduate'}],
      'cellular-respiration':[{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'The standard text for cellular respiration, oxidative phosphorylation, and bioenergetics.', topics:['TCA cycle','oxidative phosphorylation','ATP'], audience:'Undergraduate'},{title:'Harper\'s Illustrated Biochemistry', authors:'Victor W. Rodwell et al.', edition:'32nd ed.', publisher:'McGraw Hill', year:'2023', description:'Brings the themes of energy metabolism into a clinically meaningful frame.', topics:['respiration','biomedical relevance','metabolism'], audience:'Undergraduate'},{title:'Bioenergetics', authors:'David G. Nicholls and Stuart J. Ferguson', edition:'4th ed.', publisher:'Academic Press', year:'2013', description:'A deeper text useful for students wanting more mechanistic detail about mitochondrial bioenergetics.', topics:['electron transport','chemiosmosis','ATP synthase'], audience:'Advanced undergraduate'}],
      'pcr':[{title:'Principles and Techniques of Biochemistry and Molecular Biology', authors:'Keith Wilson and John Walker', edition:'8th ed.', publisher:'Cambridge University Press', year:'2018', description:'A practical laboratory text that covers molecular methods and core experimental design well.', topics:['PCR','molecular methods','laboratory technique'], audience:'Undergraduate'},{title:'Molecular Biology of the Cell', authors:'Bruce Alberts et al.', edition:'7th ed.', publisher:'W. W. Norton & Company', year:'2022', description:'Useful for contextualizing PCR in the broader workflows of molecular biology.', topics:['DNA methods','molecular tools','genetics'], audience:'Undergraduate'},{title:'Molecular Biotechnology', authors:'Bernard R. Glick, Jack J. Pasternak, and Cheryl L. Patten', edition:'5th ed.', publisher:'ASM Press', year:'2017', description:'Good for understanding the biotechnology applications of PCR and related methods.', topics:['PCR','cloning','biotechnology'], audience:'Undergraduate'}],
      'gel-electrophoresis':[{title:'Principles and Techniques of Biochemistry and Molecular Biology', authors:'Keith Wilson and John Walker', edition:'8th ed.', publisher:'Cambridge University Press', year:'2018', description:'A strong practical resource for electrophoresis and other core lab techniques.', topics:['electrophoresis','laboratory methods','biochemistry'], audience:'Undergraduate'},{title:'Molecular Biology of the Cell', authors:'Bruce Alberts et al.', edition:'7th ed.', publisher:'W. W. Norton & Company', year:'2022', description:'Helpful for understanding how gel-based separation fits into broader molecular biology experiments.', topics:['DNA methods','analysis','molecular biology'], audience:'Undergraduate'},{title:'Principles of Gene Manipulation', authors:'Sandy B. Primrose and Richard M. Twyman', edition:'7th ed.', publisher:'Wiley-Blackwell', year:'2013', description:'Useful for students learning laboratory approaches in molecular genetics.', topics:['gene manipulation','molecular methods','techniques'], audience:'Undergraduate'}],
      'chromatography':[{title:'Principles and Techniques of Biochemistry and Molecular Biology', authors:'Keith Wilson and John Walker', edition:'8th ed.', publisher:'Cambridge University Press', year:'2018', description:'A widely used lab text for separation methods, analytical techniques, and practical workflows.', topics:['chromatography','analytical methods','lab practice'], audience:'Undergraduate'},{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'Helpful for seeing how separation methods support biochemical analysis and purification.', topics:['biochemistry','analysis','purification'], audience:'Undergraduate'},{title:'Harper\'s Illustrated Biochemistry', authors:'Victor W. Rodwell et al.', edition:'32nd ed.', publisher:'McGraw Hill', year:'2023', description:'Useful for concise explanations of analytical chemistry and biochemical interpretation.', topics:['analysis','biochemistry','clinical biochemistry'], audience:'Undergraduate'}],
      'elisa':[{title:'Principles and Techniques of Biochemistry and Molecular Biology', authors:'Keith Wilson and John Walker', edition:'8th ed.', publisher:'Cambridge University Press', year:'2018', description:'A practical guide to common laboratory assays including immunological and analytical methods.', topics:['ELISA','analytical methods','lab assays'], audience:'Undergraduate'},{title:'Kuby Immunology', authors:'Jenni Punt, Sharon Stranford, Patricia Jones, and Judy Owen', edition:'8th ed.', publisher:'W. H. Freeman', year:'2023', description:'A strong immunology resource for understanding antibody structure, specificity, and assay logic.', topics:['antibodies','immunology','assays'], audience:'Undergraduate'},{title:'Janeway\'s Immunobiology', authors:'Kenneth Murphy and Casey Weaver', edition:'10th ed.', publisher:'Garland Science', year:'2022', description:'Excellent for learning the immunological foundation behind antibody-based diagnostics.', topics:['immunology','antibodies','diagnostics'], audience:'Undergraduate'}],
      'western-blot':[{title:'Principles and Techniques of Biochemistry and Molecular Biology', authors:'Keith Wilson and John Walker', edition:'8th ed.', publisher:'Cambridge University Press', year:'2018', description:'A practical entry point for electrophoresis, transfer, and protein detection methods.', topics:['western blot','protein analysis','laboratory methods'], audience:'Undergraduate'},{title:'Molecular Cell Biology', authors:'Harvey Lodish et al.', edition:'9th ed.', publisher:'W. H. Freeman', year:'2021', description:'Useful for understanding protein expression and detection in the broader context of cell biology.', topics:['protein detection','cell biology','molecular analysis'], audience:'Undergraduate'},{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'Helpful for connecting protein chemistry to analytical techniques and interpretation.', topics:['protein analysis','methods','biochemistry'], audience:'Undergraduate'}],
      'spectrophotometry':[{title:'Principles and Techniques of Biochemistry and Molecular Biology', authors:'Keith Wilson and John Walker', edition:'8th ed.', publisher:'Cambridge University Press', year:'2018', description:'A strong practical text for spectrophotometry and quantitative biochemical analysis.', topics:['spectrophotometry','assays','quantification'], audience:'Undergraduate'},{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'Useful for linking absorbance-based methods to biochemical reasoning and experiments.', topics:['assays','biochemistry','analysis'], audience:'Undergraduate'},{title:'Harper\'s Illustrated Biochemistry', authors:'Victor W. Rodwell et al.', edition:'32nd ed.', publisher:'McGraw Hill', year:'2023', description:'Good for rapid revision of common analytical methods and their biological relevance.', topics:['analytical chemistry','clinical biochemistry','assays'], audience:'Undergraduate'}],
      'microscopy':[{title:'Molecular Biology of the Cell', authors:'Bruce Alberts et al.', edition:'7th ed.', publisher:'W. W. Norton & Company', year:'2022', description:'Excellent for contextualizing microscopy inside cell structure, imaging, and experimental design.', topics:['cell structure','microscopy','cell biology'], audience:'Undergraduate'},{title:'Cell and Molecular Biology', authors:'Gerald Karp', edition:'9th ed.', publisher:'Wiley', year:'2020', description:'A clear resource for understanding imaging methods and how they reveal cellular organization.', topics:['cell biology','imaging','molecular techniques'], audience:'Undergraduate'},{title:'Molecular Biology of the Cell', authors:'Bruce Alberts et al.', edition:'7th ed.', publisher:'W. W. Norton & Company', year:'2022', description:'Useful for students who want a strong visual and conceptual grounding in microscopy and cell architecture.', topics:['imaging','cell architecture','biology'], audience:'Beginner to undergraduate'}]
    };
    const referenceCards = (referenceLibrary[pageKey] || [{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'A dependable reference for core biochemical principles and pathway-based learning.', topics:['biochemistry','metabolism','molecular mechanisms'], audience:'Undergraduate'}]).map(item=>`<article class="reference-card"><div class="reference-meta"><span class="pill">${item.audience}</span><span class="pill">${item.year}</span></div><h4>${item.title}</h4><p class="muted"><strong>${item.authors}</strong> · ${item.edition} · ${item.publisher}</p><p class="muted">${item.description}</p><div class="reference-topics"><strong>Best for:</strong> ${item.topics.join(', ')}</div></article>`).join("");
    const textbooks = (referenceLibrary[pageKey] || [{title:'Lehninger Principles of Biochemistry', authors:'David L. Nelson and Michael M. Cox', edition:'8th ed.', publisher:'W. H. Freeman', year:'2021', description:'A dependable reference for core biochemical principles and pathway-based learning.', topics:['biochemistry','metabolism','molecular mechanisms'], audience:'Undergraduate'}]).map(item=>`<li><strong>${item.title}</strong> · ${item.authors}${item.edition ? ", " + item.edition : ''}${item.publisher ? ", " + item.publisher : ''}${item.year ? ' (' + item.year + ')' : ''}</li>`).join("");

    const furtherLearning = {
      'dna-explorer': [['DNA Repair','molecular-biology/dna-repair.html'],['DNA Sequencing','molecular-biology/dna-sequencing.html'],['PCR','laboratory/pcr.html']],
      'rna-explorer': [['Gene Expression','molecular-biology/gene-expression.html'],['Protein Explorer','biochemistry/protein-explorer.html'],['CRISPR Overview','molecular-biology/crispr-overview.html']],
      'gene-expression': [['RNA Explorer','molecular-biology/rna-explorer.html'],['Protein Explorer','biochemistry/protein-explorer.html'],['DNA Repair','molecular-biology/dna-repair.html']],
      'dna-repair': [['DNA Sequencing','molecular-biology/dna-sequencing.html'],['CRISPR Overview','molecular-biology/crispr-overview.html'],['Mutation','molecular-biology/dna-repair.html']],
      'dna-sequencing': [['DNA Repair','molecular-biology/dna-repair.html'],['PCR','laboratory/pcr.html'],['CRISPR Overview','molecular-biology/crispr-overview.html']],
      'crispr-overview': [['DNA Repair','molecular-biology/dna-repair.html'],['DNA Sequencing','molecular-biology/dna-sequencing.html'],['Gene Expression','molecular-biology/gene-expression.html']],
      'protein-explorer': [['Enzyme Explorer','biochemistry/enzyme-explorer.html'],['Amino Acid Metabolism','biochemistry/amino-acid-metabolism.html'],['Cellular Respiration','biochemistry/cellular-respiration.html']],
      'enzyme-explorer': [['Protein Explorer','biochemistry/protein-explorer.html'],['Cellular Respiration','biochemistry/cellular-respiration.html'],['Carbohydrate Metabolism','biochemistry/carbohydrate-metabolism.html']],
      'carbohydrate-metabolism': [['Cellular Respiration','biochemistry/cellular-respiration.html'],['Lipid Metabolism','biochemistry/lipid-metabolism.html'],['Enzyme Explorer','biochemistry/enzyme-explorer.html']],
      'lipid-metabolism': [['Carbohydrate Metabolism','biochemistry/carbohydrate-metabolism.html'],['Cellular Respiration','biochemistry/cellular-respiration.html'],['Spectrophotometry','laboratory/spectrophotometry.html']],
      'amino-acid-metabolism': [['Protein Explorer','biochemistry/protein-explorer.html'],['Enzyme Explorer','biochemistry/enzyme-explorer.html'],['Cellular Respiration','biochemistry/cellular-respiration.html']],
      'cellular-respiration': [['Carbohydrate Metabolism','biochemistry/carbohydrate-metabolism.html'],['Enzyme Explorer','biochemistry/enzyme-explorer.html'],['Protein Explorer','biochemistry/protein-explorer.html']],
      'pcr': [['Gel Electrophoresis','laboratory/gel-electrophoresis.html'],['DNA Sequencing','molecular-biology/dna-sequencing.html'],['DNA Explorer','molecular-biology/dna-explorer.html']],
      'gel-electrophoresis': [['PCR','laboratory/pcr.html'],['Western Blot','laboratory/western-blot.html'],['DNA Sequencing','molecular-biology/dna-sequencing.html']],
      'chromatography': [['ELISA','laboratory/elisa.html'],['Spectrophotometry','laboratory/spectrophotometry.html'],['Western Blot','laboratory/western-blot.html']],
      'elisa': [['Western Blot','laboratory/western-blot.html'],['Spectrophotometry','laboratory/spectrophotometry.html'],['Chromatography','laboratory/chromatography.html']],
      'western-blot': [['ELISA','laboratory/elisa.html'],['Gel Electrophoresis','laboratory/gel-electrophoresis.html'],['Protein Explorer','biochemistry/protein-explorer.html']],
      'spectrophotometry': [['ELISA','laboratory/elisa.html'],['PCR','laboratory/pcr.html'],['Chromatography','laboratory/chromatography.html']],
      'microscopy': [['Spectrophotometry','laboratory/spectrophotometry.html'],['Protein Explorer','biochemistry/protein-explorer.html'],['PCR','laboratory/pcr.html']]
    };
    const furtherLearningItems = (furtherLearning[pageKey] || [['DNA Explorer','molecular-biology/dna-explorer.html'],['Protein Explorer','biochemistry/protein-explorer.html']]).map(([label, link])=>`<li><a class="pill" href="${href(link)}">${label}</a></li>`).join("");

    const keyTakeaways = [
      data.importance,
      `Use the terminology list to explain ${data.title} clearly in a written answer.`,
      `Link ${data.title} to one laboratory method and one clinical application.`,
      `Remember the main steps, key molecules, and major regulation points.`
    ];

    const quickRevision = [
      `Definition: ${data.intro}`,
      `Key enzymes or components: ${data.terms.slice(0,3).join(', ')}`,
      `Main pathway or process: follow the sequence from start to finish.`,
      `Most common exam focus: connect structure, mechanism, and application.`,
      `Clinical connection: relate the topic to disease, diagnosis, or biotechnology.`
    ];

    return `<div class="grid"><div class="card"><h3>Key Takeaways</h3><ul class="study-list">${keyTakeaways.map(item=>`<li>${item}</li>`).join("")}</ul></div><div class="card"><h3>Related Modules</h3><div class="pill-row">${relatedItems}</div></div><div class="card"><h3>Quick Revision</h3><ul class="study-list">${quickRevision.map(item=>`<li>${item}</li>`).join("")}</ul></div><div class="card"><h3>Clinical & Practical Relevance</h3><ul class="study-list"><li>${data.clinical}</li><li>${data.research}</li><li>Use this topic to interpret a case study, laboratory result, or research abstract.</li></ul></div><div class="card"><h3>Further Learning</h3><ul class="study-list">${furtherLearningItems}</ul></div><div class="card"><h3>Recommended Textbooks & References</h3><ul class="study-list">${textbooks}</ul></div><div class="card"><h3>Module Glossary</h3><div class="study-grid two-up">${glossaryItems}</div></div></div>`;
  }

  function topic(data){
    const steps = ["Build the structure vocabulary","Identify the molecular players","Follow the process step by step","Connect mechanism to disease and research"];
    const pageKey = (window.location.pathname.split('/').pop() || '').replace(/\.html$/,'');
    const studyGuide = buildTopicStudyGuide(pageKey, data);
    const expandedContent = buildExpandedTopicContent(pageKey, data);
    const learningObjectives = [
      `Describe the core mechanism behind ${data.title}.`,
      `Connect ${data.title} to one laboratory application and one clinical example.`,
      `Explain the key terminology and the main exam focus for this topic.`
    ];
    const keyConcepts = data.terms.slice(0,4).map(term=>`<li>${term}</li>`).join("");
    return `${nav()}<main>
      ${breadcrumbs('topic', data)}
      <section class="hero"><div class="wrap hero-grid"><div><span class="eyebrow">${data.hub}</span><h1>${data.title}</h1><p class="lead">${data.intro}</p><div class="hero-actions"><a class="btn btn-primary" href="#interactive">Open Interactive Diagram</a><a class="btn btn-secondary" href="#references">References</a></div></div><div class="visual-card"><div class="helix-art">${diagram(data.diagram)}</div><span class="floating-label" style="top:22px;right:22px">Interactive model</span><span class="floating-label" style="bottom:24px;left:24px">Hover labels</span></div></div></section>
      <section class="section" id="interactive"><div class="wrap learning-layout"><div class="grid">
        <div class="panel diagram">${diagram(data.diagram)}<div id="tipBox" class="result" role="status" aria-live="polite">Hover or tap a highlighted structure to see an explanation.</div></div>
        <div class="card"><h2>Learning Objectives</h2><ul class="study-list">${learningObjectives.map(item=>`<li>${item}</li>`).join("")}</ul></div>
        <div class="card"><h2>Key Concepts</h2><ul class="study-list">${keyConcepts}</ul></div>
        <div class="card"><h2>Step-by-Step Learning</h2><div class="steps">${steps.map((s,i)=>`<div class="step"><div class="step-num">${i+1}</div><div><strong>${s}</strong><p class="muted">${i===0?data.importance:i===1?"Use the terminology list to name structures precisely.":i===2?"Animate the visual sequence and explain cause before outcome.":"Apply the topic to clinical and research contexts."}</p></div></div>`).join("")}</div></div>
        ${studyGuide}
        ${expandedContent}
        <div class="grid grid-2"><div class="card"><h3>Clinical Relevance</h3><p class="muted">${data.clinical}</p></div><div class="card"><h3>Research Applications</h3><p class="muted">${data.research}</p></div></div>
        <div class="grid grid-2"><div class="card"><h3>Interesting Facts</h3><ul>${data.facts.map(x=>`<li>${x}</li>`).join("")}</ul></div><div class="card"><h3>Common Misconceptions</h3><ul>${data.misconceptions.map(x=>`<li>${x}</li>`).join("")}</ul></div></div>
        <div class="card"><h3>Exam Tip</h3><p class="muted">${data.exam}</p></div>
        <div class="card" id="references"><h3>References</h3><ul>${data.refs.map(x=>`<li>${x}</li>`).join("")}</ul></div>
      </div><aside class="sticky-panel grid"><div class="card"><h3>Why It Matters</h3><p class="muted">${data.importance}</p></div><div class="card"><h3>Scientific Terminology</h3><div class="pill-row">${data.terms.map(t=>`<span class="pill">${t}</span>`).join("")}</div></div></aside></div></section>
    </main>${footer()}`;
  }

  function tool(data){
    const guidance = data.kind === 'mw' ? {title:'How to read the result', items:['Enter a DNA, RNA, or peptide sequence and compare the estimate with known molecular weights.','Use this as a quick check during problem solving, not as a replacement for exact analytical measurements.']} : data.kind === 'dilution' ? {title:'How to use this calculation', items:['Keep the concentration units consistent before solving the equation.','Use the result to plan stock preparation, sample setup, and dilution series.']} : data.kind === 'buffer' ? {title:'How to interpret the output', items:['Buffering is strongest when the target pH is close to the pKa.','The ratio is a useful estimate, but real buffer recipes depend on temperature, ionic strength, and activity corrections.']} : data.kind === 'ph' ? {title:'How to interpret the output', items:['pH reflects the activity of hydrogen ions in solution and is a useful quick estimate for many lab tasks.','Very dilute solutions may need more advanced treatment than the simple formula.']} : {title:'How to use the converter', items:['Confirm the units before converting to avoid dimensional errors.','Use this for routine planning and quick comparisons rather than final protocol design.']};
    return `${nav()}<main>${breadcrumbs('tool', data)}<section class="hero"><div class="wrap"><span class="eyebrow">Scientific Tools</span><h1>${data.title}</h1><p class="lead">${data.intro}</p></div></section>
      <section class="section"><div class="wrap toolbox"><div class="card form-card" id="toolForm"></div><aside class="grid"><div class="result" id="toolResult" role="status" aria-live="polite">Enter values to calculate a result.</div><div class="card"><h3>${guidance.title}</h3><ul>${guidance.items.map(t=>`<li>${t}</li>`).join("")}</ul></div><div class="card"><h3>Notes</h3><ul>${data.tips.map(t=>`<li>${t}</li>`).join("")}</ul></div></aside></div></section></main>${footer()}`;
  }

  function glossaryPage(data){
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const letterButtons = alphabet.map(letter=>`<button class="pill-button glossary-letter" data-letter="${letter}" type="button">${letter}</button>`).join("");
    return `${nav()}<main>${breadcrumbs('learning', data)}<section class="hero"><div class="wrap"><span class="eyebrow">Interactive learning</span><h1>Interactive Scientific Glossary</h1><p class="lead">${data.intro}</p></div></section><section class="section"><div class="wrap"><div class="card glossary-shell"><div class="glossary-toolbar"><div class="glossary-controls"><div class="field-label" style="min-width:260px"><span>Search</span><input class="workspace-input" id="glossarySearch" placeholder="Search terms, concepts, or modules"></div><button class="pill-button glossary-favorite active" id="glossaryFavoriteToggle" type="button">Show favorites</button></div><div class="pill-row">${letterButtons}</div></div><div class="glossary-toolbar"><div class="pill-row"><span class="pill" id="glossaryMode">All terms</span><span class="pill" id="glossaryCount">0 terms</span></div></div><div class="glossary-layout"><div class="glossary-main"><div class="grid glossary-grid" id="glossaryTerms"></div></div><aside class="glossary-side"><div class="card glossary-side-card"><h3>Recently Viewed Terms</h3><ul class="study-list" id="recentTermsList"></ul></div><div class="card glossary-side-card"><h3>Favorite Terms</h3><ul class="study-list" id="favoriteTermsList"></ul></div></aside></div></div></div></section></main>${footer()}`;
  }

  function learningModulePage(data){
    const highlights = (data.highlights || []).map(item=>`<li>${item}</li>`).join("");
    const steps = (data.steps || []).map(item=>`<li>${item}</li>`).join("");
    const takeaways = (data.keyTakeaways || []).map(item=>`<li>${item}</li>`).join("");
    const related = (data.related || []).map(([label, target])=>`<a class="pill" href="${href(target)}">${label}</a>`).join("");
    const sections = (data.sections || []).map(section=>`<details class="study-detail"><summary>${section.title}</summary><div class="study-body"><p class="muted">${section.body}</p></div></details>`).join("");
    const glossary = (data.glossary || []).map(item=>`<span class="pill">${item}</span>`).join("");
    const resources = (data.recommendedResources || []).map(([title, target])=>`<a class="card reference-card" href="${target}" target="_blank" rel="noreferrer"><h4>${title}</h4><p class="muted">Use this as a structured reference for deeper reading and revision.</p></a>`).join("");
    return `${nav()}<main>${breadcrumbs('learning', data)}<section class="hero"><div class="wrap hero-grid"><div><span class="eyebrow">Learning Center</span><h1>${data.title}</h1><p class="lead">${data.intro}</p><p class="muted">${data.summary || ''}</p></div><div class="visual-card"><div class="module-illustration large">${icon(data.icon || 'book')}</div></div></div></section><section class="section"><div class="wrap grid grid-2"><div class="card"><h3>Key ideas</h3><ul class="study-list">${highlights}</ul></div><div class="card"><h3>Study pathway</h3><ul class="study-list">${steps}</ul></div></div>${sections ? `<div class="wrap" style="margin-top:24px"><div class="card"><h3>Module sections</h3><div class="study-accordion">${sections}</div></div></div>` : ''}<div class="wrap grid grid-2" style="margin-top:24px"><div class="card"><h3>Takeaways</h3><ul class="study-list">${takeaways}</ul></div><div class="card"><h3>Clinical relevance</h3><p class="muted">${data.clinical || ''}</p></div></div>${glossary ? `<div class="wrap" style="margin-top:24px"><div class="card"><h3>Glossary</h3><div class="pill-row">${glossary}</div></div></div>` : ''}${resources ? `<div class="wrap" style="margin-top:24px"><div class="card"><h3>Recommended resources</h3><div class="reference-grid">${resources}</div></div></div>` : ''}<div class="wrap" style="margin-top:24px"><div class="card"><h3>Related modules</h3><div class="pill-row">${related}</div></div></div></section></main>${footer()}`;
  }

  function learning(data){
    const workflow = data.workflow || ["Start with the core concept and identify the key vocabulary.","Use the module to connect mechanism, examples, and laboratory relevance.","Finish by testing yourself with the main exam or study questions."];
    const cards = (data.cards || []).map((card)=>{
      const item = typeof card === 'string' ? {title:card, href:null} : card;
      const title = item.title || card;
      const target = item.href ? href(item.href) : '#';
      return `<a class="card learning-card" href="${target}"><div class="module-illustration">${icon(["dna","protein","lab","calc","book"][Math.abs(title.split('').reduce((sum,char)=>sum + char.charCodeAt(0),0)) % 5])}</div><h3>${title}</h3><p class="muted">${item.description || 'Open the related module or use this as a revision prompt.'}</p></a>`;
    }).join("");
    return `${nav()}<main>${breadcrumbs('learning', data)}<section class="hero"><div class="wrap"><span class="eyebrow">Learning Center</span><h1>${data.title}</h1><p class="lead">${data.intro}</p></div></section><section class="section"><div class="wrap grid grid-3">${cards}</div><div class="wrap" style="margin-top:24px"><div class="card"><h3>How to study this section</h3><ul>${workflow.map(item=>`<li>${item}</li>`).join("")}</ul></div></div></section></main>${footer()}`;
  }

  function portfolioPage(){
    const moduleCount = Object.keys(BN.topicPages || {}).length;
    const toolCount = Object.keys(BN.toolPages || {}).length;
    const learningCount = Object.keys(BN.learningPages || {}).length;
    const labCount = Object.values(BN.topicPages || {}).filter(page => page.hub === 'Laboratory Hub').length;
    const calculatorCount = Object.values(BN.toolPages || {}).filter(page => page.kind === 'mw' || page.kind === 'dilution' || page.kind === 'buffer' || page.kind === 'ph' || page.kind === 'unit').length;
    const subjectCategories = [...new Set(Object.values(BN.topicPages || {}).map(page => page.hub))].length;
    const educationalPages = moduleCount + toolCount + learningCount + BN.hubs.length;
    const featureCards = [
      {title:'Interactive DNA Explorer', body:'A guided module for understanding structure, replication, sequencing, and genome integrity.'},
      {title:'RNA Explorer', body:'Clear explanations for transcription, translation, RNA regulation, and molecular function.'},
      {title:'Protein Explorer', body:'A visual pathway through protein folding, amino acid chemistry, and structure-function relationships.'},
      {title:'Laboratory Simulations', body:'Interactive coverage of PCR, electrophoresis, chromatography, and microscopy workflows.'},
      {title:'Scientific Calculators', body:'Fast tools for molecular weight, dilution, pH, buffering, and unit conversion.'},
      {title:'Student Workspace', body:'A study environment for notes, planning, bookmarks, glossary references, and revision progress.'},
      {title:'Personal Notes', body:'A structured way to capture ideas, concepts, and learning observations as students study.'},
      {title:'Scientific Glossary', body:'A searchable reference hub for key terms and biological concepts across the platform.'},
      {title:'Learning Progress Dashboard', body:'The workspace provides a more guided view of revision habits and educational momentum.'},
      {title:'Interactive Educational Modules', body:'Every topic page supports guided explanations, visuals, and study resources in one place.'},
      {title:'Responsive Design', body:'The experience is designed to stay readable and functional on desktop and mobile screens.'},
      {title:'Cross-linked Learning Resources', body:'Modules, glossary terms, tools, and study notes connect learners to related material.'}
    ];
    const stackGroups = [
      {title:'Frontend', items:['HTML5','CSS3','JavaScript']},
      {title:'Development Tools', items:['Visual Studio Code','Git','GitHub','AI-assisted development tools']},
      {title:'Future Technologies', items:['Firebase','Node.js','React (Planned)']}
    ];
    const roadmap = ['AI Study Assistant','Interactive 3D Molecular Viewer','Cloud Synchronization','Flashcards','Instructor Dashboard','Mobile Application','Additional Laboratory Simulations','Expanded Educational Content'];
    const learnings = ['Designing educational user interfaces','Organizing large-scale frontend projects','Building reusable components','Creating responsive web applications','Structuring educational content for effective learning','Improving accessibility and user experience','Using Git and GitHub for version control','Collaborating with AI-assisted development tools while reviewing, refining, and improving generated code'];
    const stats = [
      {label:'Total Educational Modules', value:moduleCount},
      {label:'Interactive Features', value:moduleCount + toolCount},
      {label:'Scientific Tools', value:toolCount},
      {label:'Laboratory Simulations', value:labCount},
      {label:'Scientific Calculators', value:calculatorCount},
      {label:'Subject Categories', value:subjectCategories},
      {label:'Learning Resources', value:learningCount + 2},
      {label:'Educational Pages', value:educationalPages}
    ];
    return `${nav()}<main>${breadcrumbs('portfolio', {title:'Portfolio'})}<section class="hero portfolio-hero"><div class="wrap hero-grid"><div><span class="eyebrow">Portfolio</span><h1>BioNexus</h1><p class="lead">An Interactive Educational Platform for Biotechnology, Biochemistry, Molecular Biology, Genetics, and Life Science Students.</p><p class="hero-note">BioNexus is an educational platform designed to simplify complex biological concepts through interactive learning experiences, scientific tools, visual explanations, and student-focused study resources. The goal is to make learning biology more engaging, accessible, and effective for university students.</p><div class="hero-actions"><a class="btn btn-primary" href="${href('learning/study-notes.html')}">Explore the learning hub</a><a class="btn btn-secondary" href="${href('molecular-biology/dna-explorer.html')}">Open a module</a></div></div><div class="visual-card portfolio-highlight"><div class="portfolio-badge">Version 1.0</div><h3>Why BioNexus exists</h3><p class="muted">The project was created to bridge the gap between advanced life-science content and the needs of undergraduate learners who want clear, interactive study pathways.</p><div class="pill-row"><span class="pill">Interactive learning</span><span class="pill">Student-focused design</span><span class="pill">Modern frontend experience</span></div></div></div></section><section class="section"><div class="wrap"><div class="section-head"><span class="eyebrow">About the project</span><h2>Built to make biological learning more engaging and practical.</h2></div><div class="grid grid-2"><div class="card"><h3>Purpose and impact</h3><p class="muted">BioNexus was created to address a common challenge in undergraduate education: complex biology topics are often taught through dense text and static resources. This platform brings those ideas into a more interactive, structured, and accessible format so students can engage with the science through guided modules, visual explanations, calculators, and study tools.</p></div><div class="card"><h3>How it helps students</h3><p class="muted">It supports learners by presenting core concepts in a clear learning flow, connecting related topics across molecular biology and biochemistry, and giving them practical features for revision and reflection. The combination of content, interactivity, and organization makes it easier to study efficiently and retain important ideas.</p></div></div></div></section><section class="section"><div class="wrap"><div class="section-head center"><span class="eyebrow">Key features</span><h2>Everything students need to explore science with clarity.</h2></div><div class="grid grid-3">${featureCards.map(card=>`<div class="card portfolio-feature-card"><h3>${card.title}</h3><p class="muted">${card.body}</p></div>`).join("")}</div></div></section><section class="section"><div class="wrap"><div class="section-head center"><span class="eyebrow">Technology stack</span><h2>Built with modern web tools and a clear educational focus.</h2></div><div class="grid grid-3">${stackGroups.map(group=>`<div class="card"><h3>${group.title}</h3><ul class="study-list">${group.items.map(item=>`<li>${item}</li>`).join("")}</ul></div>`).join("")}</div></div></section><section class="section"><div class="wrap"><div class="section-head center"><span class="eyebrow">Educational value</span><h2>Why BioNexus is more than a static website.</h2></div><div class="grid grid-3"><div class="card portfolio-feature-card"><h3>Guided study pathways</h3><p class="muted">Students can move from foundational concepts to laboratory application using a consistent structure that reduces cognitive overload.</p></div><div class="card portfolio-feature-card"><h3>Integrated revision tools</h3><p class="muted">Notes, bookmarks, glossary links, and progress tracking give learners a single place to manage their study workflow.</p></div><div class="card portfolio-feature-card"><h3>Scientifically grounded design</h3><p class="muted">Each module connects molecular mechanisms, real-world relevance, and practical examples so the experience remains educational rather than purely decorative.</p></div></div></div></section><section class="section"><div class="wrap"><div class="section-head center"><span class="eyebrow">Future roadmap</span><h2>Planned next steps for deeper learning experiences.</h2></div><div class="grid grid-3">${roadmap.map(item=>`<div class="card portfolio-roadmap-card"><h3>${item}</h3><p class="muted">A future-facing upgrade that expands interaction, personalization, and accessibility for learners.</p></div>`).join("")}</div></div></section><section class="section"><div class="wrap"><div class="grid grid-2"><div class="card"><span class="eyebrow">About the developer</span><h2>Umer Ali</h2><p class="muted">Undergraduate Biochemistry Student at Quaid-i-Azam University, pursuing a Bachelor of Science (BS) in Biochemistry.</p><blockquote class="portfolio-quote">“I believe that education becomes more meaningful when complex scientific concepts are presented in a way that is interactive, engaging, and easy to understand. BioNexus reflects my passion for combining biological sciences with modern web technology to create learning experiences that help students study more effectively and explore science with curiosity.”</blockquote></div><div class="card"><span class="eyebrow">Contact</span><div class="portfolio-contact-card"><div class="portfolio-icon">${icon('mail')}</div><div><h3>Email</h3><a href="mailto:umer69799@gmail.com">umer69799@gmail.com</a></div></div></div></div></div></section><section class="section"><div class="wrap"><div class="grid grid-2"><div class="card"><h3>Credits</h3><ul class="study-list"><li>Educational inspiration from standard undergraduate life science curricula.</li><li>Open-source tools and community resources used throughout the project.</li><li>Icons and design resources were selected to support the established BioNexus visual language.</li><li>BioNexus is intended for educational purposes and academic exploration.</li></ul></div><div class="card"><h3>Version</h3><div class="portfolio-version"><strong>BioNexus Version 1.0</strong><p>Interactive Educational Platform</p><p class="muted">2026 Release</p></div></div></div></div></section><section class="section"><div class="wrap"><div class="section-head center"><span class="eyebrow">What I learned</span><h2>Development strengthened both my technical and educational design skills.</h2></div><div class="card"><ul class="study-list portfolio-list">${learnings.map(item=>`<li>${item}</li>`).join("")}</ul></div></div></section><section class="section"><div class="wrap"><div class="section-head center"><span class="eyebrow">BioNexus by the numbers</span><h2>Real project metrics generated from the platform structure.</h2></div><div class="grid grid-4">${stats.map(stat=>`<div class="card portfolio-stat-card"><strong>${stat.value}</strong><span>${stat.label}</span></div>`).join("")}</div></div></section></main>${footer()}`;
  }

  function about(){
    const cards=[{title:"Profile",body:"BioNexus is a portfolio-quality educational platform that brings biochemistry and molecular biology together through polished, interactive study pathways."},{title:"Mission",body:"The project aims to make advanced scientific concepts easier to explore through guided modules, calculators, simulations, and revision tools."},{title:"Learning Design",body:"Each page follows a shared structure so learners can move from concept to application without losing orientation or context."},{title:"Technical Approach",body:"The interface is built with reusable HTML, CSS, and JavaScript so content remains modular, maintainable, and easy to evolve."},{title:"Student Experience",body:"Students can study concepts, save notes, bookmark modules, review glossary terms, and track their revision progress in one place."},{title:"Portfolio Value",body:"The site demonstrates strong frontend engineering, accessibility-minded UI work, and thoughtful educational content design."}];
    return `${nav()}<main>${breadcrumbs('about', {title:'About BioNexus'})}<section class="hero"><div class="wrap hero-grid"><div><span class="eyebrow">Portfolio</span><h1>About BioNexus</h1><p class="lead">A professional educational platform built to make life science learning more interactive, structured, and memorable.</p></div><div class="visual-card">${diagram("protein")}</div></div></section><section class="section"><div class="wrap grid grid-3">${cards.map(c=>`<div class="card"><h3>${c.title}</h3><p class="muted">${c.body}</p></div>`).join("")}</div></section></main>${footer()}`;
  }

  function studentWorkspacePage(){
    const learningData = BN.learningPages?.['study-notes'] || {cards:[]};
    const cards = (learningData.cards || []).map((card)=>{
      const item = typeof card === 'string' ? {title:card, href:null} : card;
      const title = item.title || card;
      const target = item.href ? href(item.href) : '#';
      const description = item.description || 'Open the related module or use this as a revision prompt.';
      return `<a class="card learning-card" href="${target}"><div class="module-illustration">${icon(["dna","protein","lab","calc","book"][Math.abs(title.split('').reduce((sum,char)=>sum + char.charCodeAt(0),0)) % 5])}</div><h3>${title}</h3><p class="muted">${description}</p></a>`;
    }).join("");
    return `${nav()}<main><section class="section"><div class="wrap"><div class="section-head"><span class="eyebrow">Learning Center</span><h2>Study modules and revision pathways</h2><p>Choose a module card below to open the matching BioNexus learning page.</p></div><div class="grid grid-3">${cards}</div><div id="student-workspace-root"></div></div></section></main>${footer()}`;
  }

  function contact(){
    return `${nav()}<main>${breadcrumbs('contact', {title:'Contact'})}<section class="hero"><div class="wrap"><span class="eyebrow">Contact</span><h1>Contact</h1><p class="lead">For portfolio inquiries, collaboration ideas, and educational feedback, reach out through the form below.</p></div></section><section class="section"><div class="wrap toolBox toolbox"><form class="card form-card"><label>Name</label><input placeholder="Your name" aria-label="Your name"><label>Email</label><input placeholder="your@email.com" type="email" aria-label="Email address"><label>Message</label><textarea rows="6" placeholder="Write your message" aria-label="Message"></textarea><button class="btn btn-primary" type="button">Send Message</button></form><aside class="contact-list"><div class="contact-item"><strong>Location</strong><p class="muted">Available for remote collaboration and portfolio review.</p></div><div class="contact-item"><strong>Email</strong><p class="muted"><a href="mailto:hello@bionexus.edu">hello@bionexus.edu</a></p></div><div class="contact-item"><strong>GitHub</strong><p class="muted"><a href="https://github.com" target="_blank" rel="noreferrer">Open source and project work</a></p></div><div class="contact-item"><strong>LinkedIn</strong><p class="muted"><a href="https://linkedin.com" target="_blank" rel="noreferrer">Professional profile and background</a></p></div></aside></div></section></main>${footer()}`;
  }

  function setupTool(data){
    const f = document.getElementById("toolForm"), r = document.getElementById("toolResult");
    if(!f) return;
    if(data.kind==="mw") f.innerHTML = `<label>Sequence</label><textarea id="seq" rows="6" placeholder="ATGCGT or PEPTIDE"></textarea><label>Molecule Type</label><select id="type"><option>DNA</option><option>RNA</option><option>Protein</option></select><button class="btn btn-primary" id="calc" type="button">Calculate</button>`;
    if(data.kind==="dilution") f.innerHTML = `<label>Stock concentration (C1)</label><input id="c1" type="number" step="any"><label>Final concentration (C2)</label><input id="c2" type="number" step="any"><label>Final volume (V2)</label><input id="v2" type="number" step="any"><button class="btn btn-primary" id="calc" type="button">Calculate V1</button>`;
    if(data.kind==="buffer") f.innerHTML = `<label>Target pH</label><input id="ph" type="number" step="any"><label>pKa</label><input id="pka" type="number" step="any"><label>Total concentration</label><input id="ct" type="number" step="any"><button class="btn btn-primary" id="calc" type="button">Calculate Ratio</button>`;
    if(data.kind==="ph") f.innerHTML = `<label>[H+] concentration (mol/L)</label><input id="h" type="number" step="any"><button class="btn btn-primary" id="calc" type="button">Calculate pH</button>`;
    if(data.kind==="unit") f.innerHTML = `<label>Value</label><input id="val" type="number" step="any"><label>From</label><select id="from"><option value="mg">mg</option><option value="g">g</option><option value="ug">ug</option><option value="ml">mL</option><option value="l">L</option><option value="ul">uL</option></select><label>To</label><select id="to"><option value="g">g</option><option value="mg">mg</option><option value="ug">ug</option><option value="l">L</option><option value="ml">mL</option><option value="ul">uL</option></select><button class="btn btn-primary" id="calc" type="button">Convert</button>`;
    document.getElementById("calc").addEventListener("click",()=>{
      try{
        if(data.kind==="mw"){
          const seq = document.getElementById("seq").value.toUpperCase().replace(/[^A-Z]/g,"");
          const type = document.getElementById("type").value;
          const maps = {DNA:{A:313.21,T:304.2,C:289.18,G:329.21},RNA:{A:329.21,U:306.17,C:305.18,G:345.21},Protein:{A:89.09,R:174.2,N:132.12,D:133.1,C:121.16,E:147.13,Q:146.15,G:75.07,H:155.16,I:131.17,L:131.17,K:146.19,M:149.21,F:165.19,P:115.13,S:105.09,T:119.12,W:204.23,Y:181.19,V:117.15}};
          let total = 0, invalid = [];
          for(const ch of seq){ if(maps[type][ch]) total += maps[type][ch]; else invalid.push(ch); }
          r.innerHTML = invalid.length ? `<span class="warning">Invalid ${type} symbols: ${[...new Set(invalid)].join(", ")}</span>` : `<strong>${total.toFixed(2)} Da</strong><p class="muted">${seq.length} residues/bases analyzed.</p>`;
        }
        if(data.kind==="dilution"){
          const c1=+document.getElementById("c1").value,c2=+document.getElementById("c2").value,v2=+document.getElementById("v2").value;
          if(c1<=0||c2<=0||v2<=0||c2>c1) throw Error("Use positive values and keep final concentration below stock concentration.");
          const v1=c2*v2/c1; r.innerHTML=`<strong>V1 = ${v1.toFixed(4)}</strong><p class="muted">Add ${(v2-v1).toFixed(4)} solvent units to reach final volume.</p>`;
        }
        if(data.kind==="buffer"){
          const ph=+document.getElementById("ph").value,pka=+document.getElementById("pka").value,ct=+document.getElementById("ct").value;
          const ratio=Math.pow(10,ph-pka), acid=ct/(1+ratio), base=ct-acid;
          r.innerHTML=`<strong>[base]/[acid] = ${ratio.toFixed(3)}</strong><p class="muted">Approx acid: ${acid.toFixed(4)}, conjugate base: ${base.toFixed(4)} in your concentration unit.</p>`;
        }
        if(data.kind==="ph"){
          const h=+document.getElementById("h").value; if(h<=0) throw Error("Hydrogen ion concentration must be positive.");
          r.innerHTML=`<strong>pH = ${(-Math.log10(h)).toFixed(3)}</strong>`;
        }
        if(data.kind==="unit"){
          const factors={ug:.000001,mg:.001,g:1,ul:.000001,ml:.001,l:1};
          const val=+document.getElementById("val").value, from=document.getElementById("from").value, to=document.getElementById("to").value;
          if(val<0) throw Error("Value cannot be negative.");
          r.innerHTML=`<strong>${(val*factors[from]/factors[to]).toPrecision(6)} ${to}</strong>`;
        }
      } catch(e){ r.innerHTML = `<span class="warning">${e.message}</span>`; }
    });
  }

  function initializeGlossaryPage(){
    const container = document.getElementById("glossaryTerms");
    const searchInput = document.getElementById("glossarySearch");
    const countLabel = document.getElementById("glossaryCount");
    const modeLabel = document.getElementById("glossaryMode");
    let searchTimer = null;
    const recentList = document.getElementById("recentTermsList");
    const favoriteList = document.getElementById("favoriteTermsList");
    const favoriteToggle = document.getElementById("glossaryFavoriteToggle");
    if(!container || !searchInput || !countLabel || !modeLabel || !recentList || !favoriteList || !favoriteToggle) return;

    const terms = BN.glossaryTerms || [];
    const favoritesKey = "bionexus-favorites";
    const recentKey = "bionexus-recent-glossary";
    let state = {query:"", letter:"all", favoritesOnly:false, openTerm:null};

    const readStored = (key)=>{ try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
    const writeStored = (key, value)=> localStorage.setItem(key, JSON.stringify(value));
    const getFavorites = ()=> readStored(favoritesKey);
    const getRecents = ()=> readStored(recentKey);
    const isFavorite = (term)=> getFavorites().includes(term);
    const addRecent = (term)=>{ const next = getRecents().filter(item=>item!==term); next.unshift(term); writeStored(recentKey, next.slice(0,6)); };
    const toggleFavorite = (term)=>{ const current = getFavorites(); const next = current.includes(term) ? current.filter(item=>item!==term) : [...current, term]; writeStored(favoritesKey, next); renderLists(); renderTerms(); };

    const filteredTerms = ()=> terms.filter(term=>{
      const needle = state.query.trim().toLowerCase();
      const matchesSearch = !needle || [term.term, term.category, term.definition, term.simpleExplanation, term.biologicalSignificance].some(value=> (value || "").toLowerCase().includes(needle));
      const matchesLetter = state.letter === "all" || (term.term.charAt(0) || "").toUpperCase() === state.letter;
      const matchesFavorites = !state.favoritesOnly || isFavorite(term.term);
      return matchesSearch && matchesLetter && matchesFavorites;
    });

    const renderLists = ()=>{
      const recentItems = getRecents().filter(Boolean);
      const favoriteItems = getFavorites().filter(Boolean);
      recentList.innerHTML = recentItems.length ? recentItems.map(item=>`<li><button class="glossary-inline-link" data-term="${item}" type="button">${item}</button></li>`).join("") : '<li class="muted">No recent terms yet.</li>';
      favoriteList.innerHTML = favoriteItems.length ? favoriteItems.map(item=>`<li><button class="glossary-inline-link" data-term="${item}" type="button">${item}</button></li>`).join("") : '<li class="muted">Favorite terms will appear here.</li>';
    };

    const renderTerms = ()=>{
      const filtered = filteredTerms();
      countLabel.textContent = `${filtered.length} ${filtered.length === 1 ? "term" : "terms"}`;
      modeLabel.textContent = state.favoritesOnly ? "Favorites only" : state.letter === "all" ? "All terms" : `${state.letter} terms`;
      document.querySelectorAll(".glossary-letter").forEach(button=>button.classList.toggle("active", button.dataset.letter === state.letter));
      favoriteToggle.classList.toggle("active", state.favoritesOnly);
      if(!filtered.length){ container.innerHTML = '<div class="glossary-empty">No terms match this filter yet.</div>'; return; }
      container.innerHTML = filtered.map(term=>{
        const active = state.openTerm === term.term;
        const favorite = isFavorite(term.term);
        return `<article class="card glossary-term-card${active ? " active" : ""}">
          <div class="glossary-term-top">
            <button class="glossary-term-toggle" type="button" data-term="${term.term}">
              <div class="pill-row"><span class="pill">${term.category}</span></div>
              <h3>${term.term}</h3>
              <p class="muted">${term.simpleExplanation}</p>
            </button>
            <button class="glossary-favorite${favorite ? " active" : ""}" type="button" data-term="${term.term}" aria-label="Favorite ${term.term}">${favorite ? "★" : "☆"}</button>
          </div>
          ${active ? `<div class="glossary-term-details"><div class="study-grid two-up"><div class="study-box"><h4>Definition</h4><p class="muted">${term.definition}</p></div><div class="study-box"><h4>Simple explanation</h4><p class="muted">${term.simpleExplanation}</p></div></div><div class="study-box"><h4>Biological significance</h4><p class="muted">${term.biologicalSignificance}</p></div><div class="pill-row"><span class="pill">Related modules</span>${term.relatedTopics.map(link=>`<a class="pill" href="${href(link.href)}">${link.label}</a>`).join("")}</div></div>` : ""}
        </article>`;
      }).join("");
    };

    container.addEventListener("click", (event)=>{
      const favoriteButton = event.target.closest(".glossary-favorite");
      if(favoriteButton){ toggleFavorite(favoriteButton.dataset.term); return; }
      const inlineLink = event.target.closest(".glossary-inline-link");
      if(inlineLink){ const termName = inlineLink.dataset.term; state.openTerm = termName; addRecent(termName); renderTerms(); renderLists(); return; }
      const toggleButton = event.target.closest(".glossary-term-toggle");
      if(toggleButton){ const termName = toggleButton.dataset.term; state.openTerm = state.openTerm === termName ? null : termName; addRecent(termName); renderTerms(); renderLists(); }
    });

    searchInput.addEventListener("input", (event)=>{ clearTimeout(searchTimer); searchTimer = window.setTimeout(()=>{ state.query = event.target.value; renderTerms(); }, 120); });
    favoriteToggle.addEventListener("click", ()=>{ state.favoritesOnly = !state.favoritesOnly; renderTerms(); });
    document.querySelectorAll(".glossary-letter").forEach(button=>button.addEventListener("click", ()=>{ state.letter = button.dataset.letter; state.openTerm = null; renderTerms(); }));
    renderLists();
    renderTerms();
  }

  function boot(){
    let html = "";
    if(kind==="home") html = home();
    else if(page === "portfolio") html = portfolioPage();
    else if(kind==="topic") html = topic(BN.topicPages[page]);
    else if(kind==="tool") html = tool(BN.toolPages[page]);
    else if(page === "scientific-glossary") html = glossaryPage(BN.learningPages[page]);
    else if(kind==="learning") {
      const learningData = BN.learningModulePages?.[page] || BN.learningPages?.[page];
      html = learningData && BN.learningModulePages?.[page] ? learningModulePage(learningData) : learning(learningData);
    }
    else if(kind==="about") html = about();
    else if(kind==="contact") html = contact();
    else if(page === "study-notes") html = studentWorkspacePage();
    document.body.innerHTML = html;
    document.body.classList.add("page-ready");
    if(page === "study-notes" && window.StudentWorkspace?.initStudyNotesPage){
      window.StudentWorkspace.trackPageVisit?.(document.title || 'Student Workspace', window.location.pathname.split('/').pop() || 'study-notes.html');
      window.StudentWorkspace.initStudyNotesPage(BN.learningPages[page] || {title:'Student Workspace',intro:'A personal dashboard for notes, planning, glossary, and progress tracking.'});
    } else {
      window.StudentWorkspace?.trackPageVisit?.(document.title || 'BioNexus page', window.location.pathname.split('/').pop() || 'index.html');
    }
    const mobileToggle = document.getElementById("mobileToggle");
    const navLinks = document.getElementById("navLinks");
    const closeMobileNav = ()=>{ navLinks?.classList.remove("open"); mobileToggle?.setAttribute("aria-expanded", "false"); };
    mobileToggle?.addEventListener("click",()=>{ const isOpen = navLinks?.classList.toggle("open"); mobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false"); });
    navLinks?.querySelectorAll("a").forEach(link=>link.addEventListener("click", closeMobileNav));
    document.querySelectorAll(".hotspot").forEach(el=>el.addEventListener("mouseenter",()=>{const box=document.getElementById("tipBox"); if(box) box.textContent=el.dataset.tip;}));
    document.querySelectorAll(".hotspot").forEach(el=>el.addEventListener("click",()=>{const box=document.getElementById("tipBox"); if(box) box.textContent=el.dataset.tip;}));
    const observer = new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.12});
    document.querySelectorAll(".card,.section-head,.visual-card").forEach(el=>{el.classList.add("reveal");observer.observe(el)});
    const dnaShell = document.querySelector(".dna-visual-shell");
    const dnaGroup = document.querySelector(".dna-helix-group");
    if(dnaShell && dnaGroup){
      let targetTiltX = 0;
      let targetTiltY = 0;
      let tiltX = 0;
      let tiltY = 0;
      let spin = 0;

      const updateDnaTilt = (x,y)=>{
        const rect = dnaShell.getBoundingClientRect();
        const px = (x - rect.left) / rect.width - 0.5;
        const py = (y - rect.top) / rect.height - 0.5;
        targetTiltX = px * 7;
        targetTiltY = py * -7;
      };

      const frame = ()=>{
        tiltX += (targetTiltX - tiltX) * 0.08;
        tiltY += (targetTiltY - tiltY) * 0.08;
        spin = (spin + 0.3) % 360;
        const floatOffset = Math.sin((spin / 180) * Math.PI) * 0.6;
        dnaGroup.style.transform = `translate3d(${tiltX * 0.06}px, ${tiltY * 0.06 + floatOffset}px, 0) rotateZ(${spin}deg) rotateY(${tiltX}deg) rotateX(${tiltY}deg)`;
        requestAnimationFrame(frame);
      };

      dnaShell.addEventListener("pointermove", (event)=>updateDnaTilt(event.clientX, event.clientY));
      dnaShell.addEventListener("pointerleave", ()=>{
        targetTiltX = 0;
        targetTiltY = 0;
      });
      requestAnimationFrame(frame);
    }
    const topButton = document.querySelector(".back-to-top");
    topButton?.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
    const toggleTopButton = ()=>{ if(topButton) topButton.classList.toggle("visible", window.scrollY > 420); };
    toggleTopButton();
    window.addEventListener("scroll", toggleTopButton, {passive:true});
    if(page === "scientific-glossary") initializeGlossaryPage();
    if(kind==="tool") setupTool(BN.toolPages[page]);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
