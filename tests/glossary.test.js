const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

test('glossary data includes searchable scientific terms with related module links', () => {
  const dataPath = path.join(__dirname, '..', 'assets', 'bionexus-data.js');
  const source = fs.readFileSync(dataPath, 'utf8');
  const context = {
    window: {},
    document: {},
    console,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (cb) => cb(),
    cancelAnimationFrame: () => {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);

  const BN = context.window.BN;
  assert.ok(BN.glossaryTerms, 'glossary terms should be defined');
  assert.ok(BN.glossaryTerms.length >= 20, 'glossary should contain a substantial term list');

  const firstTerm = BN.glossaryTerms[0];
  assert.ok(firstTerm.term, 'each glossary term should have a display name');
  assert.ok(firstTerm.definition, 'each glossary term should have a definition');
  assert.ok(firstTerm.simpleExplanation, 'each glossary term should have a simple explanation');
  assert.ok(firstTerm.biologicalSignificance, 'each glossary term should have biological significance');
  assert.ok(Array.isArray(firstTerm.relatedTopics), 'related topics should be an array');
  assert.ok(firstTerm.relatedTopics.length > 0, 'related topics should not be empty');
  assert.ok(BN.learningPages['scientific-glossary'], 'the glossary learning page should be defined');
});
