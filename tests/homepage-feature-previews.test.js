const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(projectRoot, 'assets', 'bionexus.js'), 'utf8');
const styleSource = fs.readFileSync(path.join(projectRoot, 'assets', 'bionexus.css'), 'utf8');
const previewSource = appSource.slice(
  appSource.indexOf('function featurePreviewCards()'),
  appSource.indexOf('function initFeaturePreviewAnimations()')
);

test('homepage feature previews contain exactly four cards linking to existing tools', () => {
  assert.equal((previewSource.match(/<article class="feature-preview-card">/g) || []).length, 4);

  for (const route of [
    'tools/primer-design-studio.html',
    'tools/molecular-weight-calculator.html',
    'molecular-biology/dna-explorer.html',
    'laboratory/virtual-lab.html'
  ]) {
    assert.ok(previewSource.includes(route), `preview should link to ${route}`);
  }

  for (const title of ['Primer Design Studio', 'Molecular Calculator', 'DNA Explorer', 'Virtual Lab']) {
    assert.ok(previewSource.includes(`<h3>${title}</h3>`), `preview should include the ${title} card`);
  }
});

test('previews label illustrative results and provide accessible replay controls', () => {
  assert.match(previewSource, /not experimentally validated/i);
  assert.match(previewSource, /not experimental data/i);
  assert.match(previewSource, /ATGCGT/);
  assert.match(previewSource, /1,869\.21/);
  assert.equal((previewSource.match(/data-preview-replay/g) || []).length, 4);
  assert.equal((previewSource.match(/aria-label="Replay [^"]+ preview"/g) || []).length, 4);
});

test('preview animation is replayable, responsive, and disabled for reduced motion', () => {
  assert.match(appSource, /screen\.classList\.remove\('is-running'\)[\s\S]*screen\.classList\.add\('is-running'\)/);
  assert.match(styleSource, /\.feature-preview-grid[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /@media \(prefers-reduced-motion:reduce\)[\s\S]*\.feature-preview-screen\.is-running \*{animation:none!important/);
});
