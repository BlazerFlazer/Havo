import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysUntil, deadlineLabel, plural, pluralize } from '../lib/format.js';

const FORMS = ['действие', 'действия', 'действий'];

test('plural picks correct Russian forms', () => {
  assert.equal(plural(1, FORMS), 'действие');
  assert.equal(plural(2, FORMS), 'действия');
  assert.equal(plural(4, FORMS), 'действия');
  assert.equal(plural(5, FORMS), 'действий');
  assert.equal(plural(11, FORMS), 'действий');
  assert.equal(plural(12, FORMS), 'действий');
  assert.equal(plural(21, FORMS), 'действие');
  assert.equal(plural(22, FORMS), 'действия');
  assert.equal(plural(111, FORMS), 'действий');
  assert.equal(plural(0, FORMS), 'действий');
});

test('pluralize prefixes the number', () => {
  assert.equal(pluralize(3, FORMS), '3 действия');
});

test('daysUntil and deadlineLabel use local calendar days', () => {
  const now = new Date(2026, 9, 14, 18, 30); // 14 Oct 2026, evening
  assert.equal(daysUntil('2026-10-14', now), 0);
  assert.equal(daysUntil('2026-10-15', now), 1);
  assert.equal(daysUntil('2026-10-10', now), -4);
  assert.equal(daysUntil(null, now), null);
  assert.equal(deadlineLabel('2026-10-14', now).text, 'сегодня');
  assert.equal(deadlineLabel('2026-10-15', now).text, 'завтра');
  assert.equal(deadlineLabel('2026-10-20', now).text, 'через 6 дней');
  assert.equal(deadlineLabel('2026-10-12', now).tone, 'danger');
});
