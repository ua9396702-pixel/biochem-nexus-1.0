const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const workspace = require('../assets/student-workspace.js');

test('laboratory navigation groups all techniques under one menu and learning links include metabolism', () => {
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
  assert.ok(BN.nav.laboratory, 'laboratory navigation should be defined');
  const labels = BN.nav.laboratory.map(([label]) => label);
  assert.deepStrictEqual(labels, ['PCR', 'ELISA', 'Western Blot', 'Gel Electrophoresis', 'Spectrophotometry', 'Chromatography', 'Microscopy']);
  assert.ok(BN.nav.learning.some(([label]) => label === 'Metabolism Map Strategy'), 'learning navigation should include the metabolism module');
});

test('metabolism module content is expanded with structured sections, glossary, and references', () => {
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
  const moduleData = BN.learningModulePages['metabolism-map-strategy'];
  assert.ok(moduleData, 'metabolism module should be defined');
  assert.ok(Array.isArray(moduleData.sections) && moduleData.sections.length >= 6, 'metabolism module should include multiple sections');
  assert.ok(Array.isArray(moduleData.keyTakeaways) && moduleData.keyTakeaways.length >= 6, 'metabolism module should include key takeaways');
  assert.ok(Array.isArray(moduleData.glossary) && moduleData.glossary.length >= 8, 'metabolism module should include glossary terms');
  assert.ok(Array.isArray(moduleData.recommendedResources) && moduleData.recommendedResources.length >= 4, 'metabolism module should include recommended resources');
});

test('student workspace supports exporting and importing notes as text', () => {
  const profile = workspace.createEmptyStudentProfile('alex@example.com');
  const note = workspace.createNote(profile, { title: 'Cellular respiration', body: '<p>ATP is produced in the mitochondria.</p>' });
  const exported = workspace.exportNoteText(note);
  assert.match(exported, /Cellular respiration/);
  assert.match(exported, /ATP is produced/);

  const imported = workspace.importNotesFromText('Glycolysis\n\nGlucose becomes pyruvate.', profile, { title: 'Imported note' });
  assert.ok(Array.isArray(imported));
  assert.strictEqual(imported[0].title, 'Imported note');
  assert.match(imported[0].body, /Glucose becomes pyruvate/);
});
