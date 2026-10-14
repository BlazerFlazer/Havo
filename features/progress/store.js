'use client';

// Client store for the personal plan and progress.
// Implemented as an external store + useSyncExternalStore so that:
//  - the server render and hydration use the empty initial state (no mismatch),
//  - the client then switches to the LocalStorage snapshot,
//  - other tabs stay in sync through the `storage` event.

import { useSyncExternalStore } from 'react';
import { readJSON, writeJSON, createId } from '@/lib/storage';
import { INITIAL_STATE, reducer, sanitizeState } from './progress';

const STORAGE_KEY = 'havo:v1';

let state = INITIAL_STATE;
let loaded = false;
let persistOk = true;
const listeners = new Set();

function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  const raw = readJSON(STORAGE_KEY);
  if (raw) state = sanitizeState(raw);
}

function emit() {
  for (const l of listeners) l();
}

// Another tab changed the plan — pick up its version.
function onStorage(e) {
  if (e.key !== STORAGE_KEY) return;
  state = sanitizeState(readJSON(STORAGE_KEY));
  emit();
}

function subscribe(listener) {
  ensureLoaded();
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

function getServerSnapshot() {
  return INITIAL_STATE;
}

function dispatch(action) {
  ensureLoaded();
  const next = reducer(state, action);
  if (next === state) return false;
  state = next;
  persistOk = writeJSON(STORAGE_KEY, state);
  emit();
  return true;
}

const nowIso = () => new Date().toISOString();

export const havoActions = {
  addToPlan(item) {
    return dispatch({ type: 'ADD_PLAN_ITEM', item, id: createId('plan'), now: nowIso() });
  },
  removeFromPlan(id) {
    return dispatch({ type: 'REMOVE_PLAN_ITEM', id });
  },
  toggleComplete(id) {
    return dispatch({ type: 'TOGGLE_COMPLETE', id, historyId: createId('done'), now: nowIso() });
  },
  updatePlanItem(id, patch) {
    return dispatch({ type: 'UPDATE_PLAN_ITEM', id, patch });
  },
  clearPlan() {
    return dispatch({ type: 'CLEAR_PLAN' });
  },
  recordQuiz(score, total) {
    return dispatch({ type: 'RECORD_QUIZ', score, total, now: nowIso() });
  },
  addProposal(proposal) {
    return dispatch({ type: 'ADD_PROPOSAL', proposal, id: createId('idea'), now: nowIso() });
  },
  removeProposal(id) {
    return dispatch({ type: 'REMOVE_PROPOSAL', id });
  },
  setWeeklyGoal(goal) {
    return dispatch({ type: 'SET_WEEKLY_GOAL', goal });
  },
  toggleChecklist(listId, index) {
    return dispatch({ type: 'TOGGLE_CHECKLIST', listId, index });
  },
  resetProgress() {
    return dispatch({ type: 'RESET_PROGRESS' });
  },
};

/** Current persisted state. Equals INITIAL_STATE during SSR and hydration. */
export function useHavoState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** False when the browser refused the last write (private mode, quota, disabled storage). */
export function isPersistenceAvailable() {
  return persistOk;
}
