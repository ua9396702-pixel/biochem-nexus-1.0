const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('duplicate entry pages redirect to canonical locations', () => {
  const rootPage = fs.readFileSync(path.join(__dirname, '..', 'dna-explorer.html'), 'utf8');
  const previewPage = fs.readFileSync(path.join(__dirname, '..', 'preview (1).html'), 'utf8');

  assert.match(rootPage, /refresh|canonical|molecular-biology\/dna-explorer\.html/i, 'root DNA explorer page should redirect to the canonical module page');
  assert.match(previewPage, /refresh|canonical|index\.html/i, 'preview page should redirect to the home page');
});
