const assert = require('assert');
const workspace = require('../assets/student-workspace.js');

const profile = workspace.createEmptyStudentProfile('alex@example.com');
assert.ok(profile.user.email === 'alex@example.com');
assert.deepStrictEqual(profile.notes, []);
assert.deepStrictEqual(profile.bookmarks, []);
assert.deepStrictEqual(profile.planner, []);
assert.deepStrictEqual(profile.checklist, []);
assert.deepStrictEqual(profile.glossary, []);
assert.deepStrictEqual(profile.favorites, []);
assert.deepStrictEqual(profile.recentlyViewed, []);

const progress = workspace.getProgressSnapshot(profile);
assert.strictEqual(progress.modulesCompleted, 0);
assert.strictEqual(progress.topicsStudied, 0);
assert.strictEqual(progress.savedNotes, 0);
assert.strictEqual(progress.bookmarkedTopics, 0);
assert.strictEqual(progress.revisionProgress, 0);

console.log('student workspace tests passed');
