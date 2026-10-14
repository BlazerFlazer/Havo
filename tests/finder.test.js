import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_RESULTS, recommendActions } from '../features/actions/finder.js';

const COST_RANK = { free: 0, low: 1, flexible: 2 };

test('respects time and budget as hard limits', () => {
  for (const time of [1, 2, 3, 4]) {
    for (const budget of ['free', 'low', 'flexible']) {
      const results = recommendActions({ time, budget, setting: 'school', activity: 'learning', mode: 'solo' });
      for (const { action } of results) {
        assert.ok(action.timeBucket <= time, `${action.id} needs more time`);
        assert.ok(COST_RANK[action.cost] <= COST_RANK[budget], `${action.id} exceeds budget`);
      }
    }
  }
});

test('every result matches the setting or the activity and explains why', () => {
  const answers = { time: 4, budget: 'flexible', setting: 'online', activity: 'creating', mode: 'group' };
  const results = recommendActions(answers);
  assert.ok(results.length > 0 && results.length <= MAX_RESULTS);
  for (const { action, reasons } of results) {
    assert.ok(action.settings.includes('online') || action.activities.includes('creating'));
    assert.ok(reasons.length >= 2);
  }
});

test('results are sorted by score (best match first)', () => {
  const results = recommendActions({ time: 4, budget: 'flexible', setting: 'school', activity: 'organizing', mode: 'group' });
  for (let i = 1; i < results.length; i++) assert.ok(results[i - 1].score >= results[i].score);
  const first = results[0].action;
  assert.ok(first.settings.includes('school') && first.activities.includes('organizing'));
});

test('returns an empty list when nothing fits', () => {
  const results = recommendActions({ time: 1, budget: 'free', setting: 'online', activity: 'creating', mode: 'solo' });
  assert.equal(results.length, 0);
});

test('warns when a group action is suggested to someone working alone', () => {
  const results = recommendActions({ time: 4, budget: 'flexible', setting: 'school', activity: 'organizing', mode: 'solo' });
  const group = results.find((r) => r.action.mode === 'group');
  assert.ok(group, 'expected at least one group action');
  assert.ok(group.cautions.some((c) => c.includes('команда')));
});
