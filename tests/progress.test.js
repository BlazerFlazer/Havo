import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_STATE,
  computeBadges,
  computeMilestones,
  computePoints,
  computeStreak,
  completionsInWeek,
  reducer,
  sanitizeState,
} from '../features/progress/progress.js';

const item = { kind: 'action', refId: 'active-short-trips', title: 'Пешком', category: 'personal', effect: 'direct', mode: 'both', difficulty: 2 };

function add(state, it = item, id = 'p1') {
  return reducer(state, { type: 'ADD_PLAN_ITEM', item: it, id, now: '2026-10-01T10:00:00.000Z' });
}

test('adding to the plan does not complete the task and ignores duplicates', () => {
  let s = add(INITIAL_STATE);
  assert.equal(s.plan.length, 1);
  assert.equal(s.plan[0].completedAt, null);
  assert.equal(s.history.length, 0);
  const again = add(s, item, 'p2');
  assert.equal(again, s);
});

test('completing records history and points; un-completing removes them', () => {
  let s = add(INITIAL_STATE);
  s = reducer(s, { type: 'TOGGLE_COMPLETE', id: 'p1', historyId: 'h1', now: '2026-10-02T10:00:00.000Z' });
  assert.equal(s.history.length, 1);
  assert.equal(s.history[0].points, 20);
  assert.equal(computePoints(s).fromActions, 20);
  s = reducer(s, { type: 'TOGGLE_COMPLETE', id: 'p1', historyId: 'h2', now: '2026-10-02T11:00:00.000Z' });
  assert.equal(s.history.length, 0);
  assert.equal(s.plan[0].completedAt, null);
});

test('removing a completed task keeps its history', () => {
  let s = add(INITIAL_STATE);
  s = reducer(s, { type: 'TOGGLE_COMPLETE', id: 'p1', historyId: 'h1', now: '2026-10-02T10:00:00.000Z' });
  s = reducer(s, { type: 'REMOVE_PLAN_ITEM', id: 'p1' });
  assert.equal(s.plan.length, 0);
  assert.equal(s.history.length, 1);
});

test('notes are trimmed to the limit and deadlines validated', () => {
  let s = add(INITIAL_STATE);
  s = reducer(s, { type: 'UPDATE_PLAN_ITEM', id: 'p1', patch: { note: 'x'.repeat(500), deadline: 'tomorrow' } });
  assert.equal(s.plan[0].note.length, 280);
  assert.equal(s.plan[0].deadline, null);
  s = reducer(s, { type: 'UPDATE_PLAN_ITEM', id: 'p1', patch: { deadline: '2026-11-01' } });
  assert.equal(s.plan[0].deadline, '2026-11-01');
});

test('quiz keeps the best score', () => {
  let s = reducer(INITIAL_STATE, { type: 'RECORD_QUIZ', score: 9, total: 13, now: '2026-10-01T10:00:00.000Z' });
  s = reducer(s, { type: 'RECORD_QUIZ', score: 5, total: 13, now: '2026-10-02T10:00:00.000Z' });
  assert.equal(s.quiz.bestScore, 9);
  assert.equal(s.quiz.lastScore, 5);
  assert.equal(s.quiz.attempts, 2);
  assert.equal(computePoints(s).fromQuiz, 18);
});

test('streaks count consecutive local days', () => {
  const at = (d) => ({ completedAt: new Date(2026, 9, d, 12).toISOString() });
  const history = [at(10), at(11), at(12), at(14), at(14)];
  assert.deepEqual(computeStreak(history, new Date(2026, 9, 14, 20)), { current: 1, best: 3 });
  assert.deepEqual(computeStreak(history, new Date(2026, 9, 15, 9)), { current: 1, best: 3 });
  assert.deepEqual(computeStreak(history, new Date(2026, 9, 16, 9)), { current: 0, best: 3 });
  assert.deepEqual(computeStreak([], new Date()), { current: 0, best: 0 });
});

test('weekly completions use Monday as the first day', () => {
  const history = [
    { completedAt: new Date(2026, 9, 12, 9).toISOString() }, // Monday
    { completedAt: new Date(2026, 9, 18, 21).toISOString() }, // Sunday
    { completedAt: new Date(2026, 9, 11, 9).toISOString() }, // previous Sunday
  ];
  assert.equal(completionsInWeek(history, new Date(2026, 9, 14)), 2);
});

test('badges are derived from real completions only', () => {
  let s = add(INITIAL_STATE);
  let badges = computeBadges(s);
  assert.ok(badges.every((b) => !b.earned), 'no badge for merely adding to plan');
  s = reducer(s, { type: 'TOGGLE_COMPLETE', id: 'p1', historyId: 'h1', now: '2026-10-02T10:00:00.000Z' });
  badges = computeBadges(s);
  assert.equal(badges.find((b) => b.id === 'first-step').earned, true);
  s = reducer(s, { type: 'ADD_PROPOSAL', proposal: { title: 'Идея', category: 'awareness' }, id: 'i1', now: '2026-10-03T10:00:00.000Z' });
  assert.equal(computeBadges(s).find((b) => b.id === 'initiator').earned, true);
});

test('milestones report the next goal', () => {
  const history = Array.from({ length: 4 }, (_, i) => ({ completedAt: new Date(2026, 9, i + 1).toISOString() }));
  assert.deepEqual(computeMilestones(history), { count: 4, reached: [1, 3], next: 5 });
});

test('sanitizeState survives corrupted storage', () => {
  assert.deepEqual(sanitizeState(null).plan, []);
  const s = sanitizeState({ plan: [{ nope: 1 }, { id: 'a', refId: 'b', difficulty: 99 }], history: 'x', weeklyGoal: 50 });
  assert.equal(s.plan.length, 1);
  assert.equal(s.plan[0].difficulty, 3);
  assert.deepEqual(s.history, []);
  assert.equal(s.weeklyGoal, 7);
});

test('reset clears progress but keeps saved proposals', () => {
  let s = add(INITIAL_STATE);
  s = reducer(s, { type: 'ADD_PROPOSAL', proposal: { title: 'Идея', category: 'awareness' }, id: 'i1', now: '2026-10-03T10:00:00.000Z' });
  s = reducer(s, { type: 'RESET_PROGRESS' });
  assert.equal(s.plan.length, 0);
  assert.equal(s.proposals.length, 1);
});
