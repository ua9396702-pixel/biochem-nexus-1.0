const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const assets = path.join(__dirname, '..', 'assets');
const styles = fs.readFileSync(path.join(assets, 'bionexus.css'), 'utf8');
const labStyles = fs.readFileSync(path.join(assets, 'virtual-lab.css'), 'utf8');
const dnaStyles = fs.readFileSync(path.join(assets, 'dna-3d.css'), 'utf8');
const app = fs.readFileSync(path.join(assets, 'bionexus.js'), 'utf8');

test('shared layouts use a valid narrow-screen container and prevent grid children forcing overflow', () => {
  assert.match(styles, /\.wrap\{width:min\(1180px,calc\(100% - 28px\)\)\}/);
  assert.match(styles, /\.hero-grid>\*,[\s\S]*\.workspace-main-grid>\*,[\s\S]*\{min-width:0\}/);
  assert.match(styles, /@media \(max-width:360px\)/);
});

test('virtual lab and DNA model adapt to narrow viewports and keep controls usable', () => {
  assert.match(labStyles, /grid-template-columns:minmax\(180px,\.8fr\) minmax\(0,1\.5fr\) minmax\(220px,\.9fr\)/);
  assert.match(labStyles, /@media\(max-width:1100px\)\{\.vl-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(labStyles, /\.vl-item\{[^}]*min-height:44px/);
  assert.match(labStyles, /\.vl-visual>div>div>div\{flex:1 1 100%!important;min-width:0!important\}/);
  assert.match(dnaStyles, /\.dna-3d-frame\{[^}]*aspect-ratio:16\/9/);
  assert.match(dnaStyles, /\.dna-3d-actions \.btn\{min-height:44px/);
});

test('mobile navigation has touch targets and closes on Escape', () => {
  assert.match(styles, /\.mobile-toggle\{display:grid;order:-1;width:44px;height:44px\}/);
  assert.match(app, /event\.key === "Escape" && navLinks\?\.classList\.contains\("open"\)/);
  assert.match(app, /mobileToggle\?\.focus\(\)/);
});
