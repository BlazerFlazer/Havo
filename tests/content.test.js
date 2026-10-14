// Integrity checks for educational content and the quiz answer key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, ACTION_CATEGORIES, EFFECTS } from '../data/actions.js';
import { INITIATIVES, INITIATIVE_CATEGORIES } from '../data/initiatives.js';
import { QUIZ } from '../data/quiz.js';
import { SOURCES } from '../config/dataSources.js';

test('quiz has 10–15 well-formed questions', () => {
  assert.ok(QUIZ.length >= 10 && QUIZ.length <= 15);
  const ids = new Set(QUIZ.map((q) => q.id));
  assert.equal(ids.size, QUIZ.length);
  for (const q of QUIZ) {
    assert.equal(q.options.length, 4, q.id);
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4, q.id);
    assert.equal(new Set(q.options).size, 4, `${q.id}: duplicate options`);
    assert.ok(q.explanation.length > 40, q.id);
  }
});

test('quiz answer positions are varied', () => {
  const positions = new Set(QUIZ.map((q) => q.correct));
  assert.ok(positions.size >= 3);
});

test('spot-check answer key for key concepts', () => {
  const byId = Object.fromEntries(QUIZ.map((q) => [q.id, q]));
  assert.match(byId['pm25-meaning'].options[byId['pm25-meaning'].correct], /до 2,5 микрометра/);
  assert.match(byId.inversion.options[byId.inversion.correct], /тёплого воздуха лежит над холодным/);
  assert.match(byId['co2-vs-pm'].options[byId['co2-vs-pm'].correct], /парниковый газ/);
  assert.match(byId['direct-action'].options[byId['direct-action'].correct], /пешком/);
});

test('actions have every field the UI and finder rely on', () => {
  const ids = new Set();
  const cats = new Set(ACTION_CATEGORIES.map((c) => c.id));
  for (const a of ACTIONS) {
    assert.ok(!ids.has(a.id), `duplicate ${a.id}`);
    ids.add(a.id);
    assert.ok(cats.has(a.category), a.id);
    assert.ok(a.effect in EFFECTS, a.id);
    assert.ok([1, 2, 3].includes(a.difficulty), a.id);
    assert.ok([1, 2, 3, 4].includes(a.timeBucket), a.id);
    assert.ok(['free', 'low', 'flexible'].includes(a.cost), a.id);
    assert.ok(['solo', 'group', 'both'].includes(a.mode), a.id);
    assert.ok(a.settings.length > 0 && a.activities.length > 0, a.id);
    assert.ok(a.steps.length >= 3, `${a.id}: steps`);
    assert.ok(a.safety.length >= 1, `${a.id}: safety`);
    assert.ok(a.materials.length >= 1, `${a.id}: materials`);
    assert.ok(a.benefit.length > 40, `${a.id}: benefit`);
  }
  for (const c of ACTION_CATEGORIES) assert.ok(ACTIONS.filter((a) => a.category === c.id).length >= 4, c.id);
});

test('tree planting is never presented as a direct emission cut', () => {
  const tree = ACTIONS.find((a) => a.id === 'tree-care');
  assert.notEqual(tree.effect, 'direct');
  assert.match(tree.benefit, /не убирает измеримое количество PM2\.5/);
});

test('initiatives have roles, steps, materials and a safety checklist', () => {
  assert.equal(INITIATIVES.length, 6);
  for (const i of INITIATIVES) {
    assert.ok(i.category in INITIATIVE_CATEGORIES, i.id);
    assert.ok(i.roles.length >= 2 && i.steps.length >= 4 && i.materials.length >= 2 && i.checklist.length >= 3, i.id);
    assert.ok(i.outcome.length > 30, i.id);
  }
});

test('all sources use https and are unique', () => {
  const urls = new Set();
  for (const s of SOURCES) {
    assert.match(s.url, /^https:\/\//, s.id);
    assert.ok(!urls.has(s.url), `duplicate ${s.url}`);
    urls.add(s.url);
  }
});
