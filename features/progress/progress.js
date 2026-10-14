// Personal progress model: plan, completion history, quiz results, proposals.
// Everything here is pure (no React, no browser APIs) and unit tested.
//
// Points represent participation on the platform — NOT measured reductions
// in air pollution. This is stated in the UI as well.

import { dayKey } from '../../lib/format.js';

export const STATE_VERSION = 1;

export const INITIAL_STATE = Object.freeze({
  version: STATE_VERSION,
  plan: [],
  history: [],
  quiz: { attempts: 0, bestScore: null, lastScore: null, total: null, lastCompletedAt: null },
  proposals: [],
  weeklyGoal: 3,
  checklists: {},
});

export const POINTS_BY_DIFFICULTY = { 1: 10, 2: 20, 3: 30 };
export const QUIZ_POINTS_PER_CORRECT = 2;
export const PROPOSAL_POINTS = 15;
export const MAX_COUNTED_PROPOSALS = 3;
export const MILESTONES = [1, 3, 5, 10, 20];
export const WEEKLY_GOAL_RANGE = { min: 1, max: 7 };
export const MAX_NOTE_LENGTH = 280;

// ───────────────────────────── Sanitising ─────────────────────────────

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, max = 400) => (typeof v === 'string' ? v.slice(0, max) : '');
const isoOrNull = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null);
const clampInt = (v, min, max, fallback) =>
  Number.isInteger(v) ? Math.min(max, Math.max(min, v)) : fallback;

function sanitizePlanItem(raw) {
  if (!isObj(raw) || !raw.id || !raw.refId) return null;
  return {
    id: str(raw.id, 80),
    kind: raw.kind === 'initiative' ? 'initiative' : 'action',
    refId: str(raw.refId, 80),
    title: str(raw.title, 200),
    category: str(raw.category, 40),
    effect: str(raw.effect, 20),
    mode: str(raw.mode, 10),
    difficulty: clampInt(raw.difficulty, 1, 3, 1),
    addedAt: isoOrNull(raw.addedAt) ?? new Date(0).toISOString(),
    deadline: typeof raw.deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.deadline) ? raw.deadline : null,
    note: str(raw.note, MAX_NOTE_LENGTH),
    completedAt: isoOrNull(raw.completedAt),
  };
}

function sanitizeHistoryEntry(raw) {
  if (!isObj(raw) || !raw.id || !isoOrNull(raw.completedAt)) return null;
  return {
    id: str(raw.id, 80),
    planItemId: str(raw.planItemId, 80),
    refId: str(raw.refId, 80),
    kind: raw.kind === 'initiative' ? 'initiative' : 'action',
    title: str(raw.title, 200),
    effect: str(raw.effect, 20),
    mode: str(raw.mode, 10),
    difficulty: clampInt(raw.difficulty, 1, 3, 1),
    points: clampInt(raw.points, 0, 100, 0),
    completedAt: raw.completedAt,
  };
}

function sanitizeProposal(raw) {
  if (!isObj(raw) || !raw.id || !raw.title) return null;
  return {
    id: str(raw.id, 80),
    title: str(raw.title, 120),
    category: str(raw.category, 40),
    description: str(raw.description, 1200),
    place: str(raw.place, 40),
    participants: str(raw.participants, 20),
    needsAdult: Boolean(raw.needsAdult),
    alias: str(raw.alias, 40),
    createdAt: isoOrNull(raw.createdAt) ?? new Date(0).toISOString(),
  };
}

/** Accepts anything (e.g. parsed localStorage) and returns a valid state. */
export function sanitizeState(raw) {
  if (!isObj(raw)) return { ...INITIAL_STATE };
  const quiz = isObj(raw.quiz) ? raw.quiz : {};
  const checklists = {};
  if (isObj(raw.checklists)) {
    for (const [key, value] of Object.entries(raw.checklists)) {
      if (Array.isArray(value)) checklists[str(key, 80)] = value.filter((n) => Number.isInteger(n) && n >= 0 && n < 50);
    }
  }
  return {
    version: STATE_VERSION,
    plan: Array.isArray(raw.plan) ? raw.plan.map(sanitizePlanItem).filter(Boolean) : [],
    history: Array.isArray(raw.history) ? raw.history.map(sanitizeHistoryEntry).filter(Boolean) : [],
    quiz: {
      attempts: clampInt(quiz.attempts, 0, 10000, 0),
      bestScore: Number.isInteger(quiz.bestScore) ? quiz.bestScore : null,
      lastScore: Number.isInteger(quiz.lastScore) ? quiz.lastScore : null,
      total: Number.isInteger(quiz.total) ? quiz.total : null,
      lastCompletedAt: isoOrNull(quiz.lastCompletedAt),
    },
    proposals: Array.isArray(raw.proposals) ? raw.proposals.map(sanitizeProposal).filter(Boolean) : [],
    weeklyGoal: clampInt(raw.weeklyGoal, WEEKLY_GOAL_RANGE.min, WEEKLY_GOAL_RANGE.max, 3),
    checklists,
  };
}

// ───────────────────────────── Reducer ─────────────────────────────

export function isInPlan(state, kind, refId) {
  return state.plan.some((p) => p.kind === kind && p.refId === refId);
}

/**
 * All non-deterministic inputs (ids, timestamps) are passed in the action,
 * so the reducer stays pure.
 */
export function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return sanitizeState(action.state);

    case 'ADD_PLAN_ITEM': {
      const { item, id, now } = action;
      if (isInPlan(state, item.kind, item.refId)) return state;
      const planItem = sanitizePlanItem({ ...item, id, addedAt: now, completedAt: null, note: '', deadline: null });
      if (!planItem) return state;
      return { ...state, plan: [planItem, ...state.plan] };
    }

    case 'REMOVE_PLAN_ITEM':
      // History is kept on purpose: removing a task from the plan does not erase
      // the fact that it was completed.
      return { ...state, plan: state.plan.filter((p) => p.id !== action.id) };

    case 'TOGGLE_COMPLETE': {
      const item = state.plan.find((p) => p.id === action.id);
      if (!item) return state;
      if (item.completedAt) {
        return {
          ...state,
          plan: state.plan.map((p) => (p.id === item.id ? { ...p, completedAt: null } : p)),
          history: state.history.filter((h) => h.planItemId !== item.id),
        };
      }
      const entry = {
        id: action.historyId,
        planItemId: item.id,
        refId: item.refId,
        kind: item.kind,
        title: item.title,
        effect: item.effect,
        mode: item.mode,
        difficulty: item.difficulty,
        points: POINTS_BY_DIFFICULTY[item.difficulty] ?? 10,
        completedAt: action.now,
      };
      return {
        ...state,
        plan: state.plan.map((p) => (p.id === item.id ? { ...p, completedAt: action.now } : p)),
        history: [entry, ...state.history],
      };
    }

    case 'UPDATE_PLAN_ITEM': {
      const patch = {};
      if ('note' in action.patch) patch.note = str(action.patch.note, MAX_NOTE_LENGTH);
      if ('deadline' in action.patch) {
        const d = action.patch.deadline;
        patch.deadline = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
      }
      return { ...state, plan: state.plan.map((p) => (p.id === action.id ? { ...p, ...patch } : p)) };
    }

    case 'CLEAR_PLAN':
      return { ...state, plan: [] };

    case 'RECORD_QUIZ': {
      const { score, total, now } = action;
      const prevBest = state.quiz.bestScore;
      return {
        ...state,
        quiz: {
          attempts: state.quiz.attempts + 1,
          bestScore: prevBest === null ? score : Math.max(prevBest, score),
          lastScore: score,
          total,
          lastCompletedAt: now,
        },
      };
    }

    case 'ADD_PROPOSAL': {
      const proposal = sanitizeProposal({ ...action.proposal, id: action.id, createdAt: action.now });
      if (!proposal) return state;
      return { ...state, proposals: [proposal, ...state.proposals] };
    }

    case 'REMOVE_PROPOSAL':
      return { ...state, proposals: state.proposals.filter((p) => p.id !== action.id) };

    case 'SET_WEEKLY_GOAL':
      return {
        ...state,
        weeklyGoal: clampInt(action.goal, WEEKLY_GOAL_RANGE.min, WEEKLY_GOAL_RANGE.max, state.weeklyGoal),
      };

    case 'TOGGLE_CHECKLIST': {
      const current = state.checklists[action.listId] ?? [];
      const next = current.includes(action.index)
        ? current.filter((i) => i !== action.index)
        : [...current, action.index];
      return { ...state, checklists: { ...state.checklists, [action.listId]: next } };
    }

    case 'RESET_PROGRESS':
      // Clears plan, history, quiz results, goals and checklists.
      // Saved initiative proposals are user content and are managed separately.
      return { ...INITIAL_STATE, proposals: state.proposals };

    default:
      return state;
  }
}

// ───────────────────────────── Selectors ─────────────────────────────

export function computePoints(state) {
  const fromActions = state.history.reduce((sum, h) => sum + h.points, 0);
  const fromQuiz = (state.quiz.bestScore ?? 0) * QUIZ_POINTS_PER_CORRECT;
  const fromProposals = Math.min(state.proposals.length, MAX_COUNTED_PROPOSALS) * PROPOSAL_POINTS;
  return { total: fromActions + fromQuiz + fromProposals, fromActions, fromQuiz, fromProposals };
}

function shiftDay(key, delta) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta));
}

/** Streaks of consecutive local days with at least one recorded completion. */
export function computeStreak(history, now = new Date()) {
  const days = new Set(history.map((h) => dayKey(h.completedAt)));
  if (days.size === 0) return { current: 0, best: 0 };

  // Best streak across all history.
  let best = 0;
  for (const day of days) {
    if (days.has(shiftDay(day, -1))) continue; // not the start of a run
    let len = 1;
    let cursor = day;
    while (days.has(shiftDay(cursor, 1))) {
      cursor = shiftDay(cursor, 1);
      len += 1;
    }
    best = Math.max(best, len);
  }

  // Current streak may end today or yesterday (today is not over yet).
  const today = dayKey(now);
  let start = days.has(today) ? today : shiftDay(today, -1);
  let current = 0;
  while (days.has(start)) {
    current += 1;
    start = shiftDay(start, -1);
  }
  return { current, best };
}

/** Monday 00:00 (local time) of the week containing `date`. */
export function weekStart(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - weekday);
  return d;
}

export function completionsInWeek(history, date = new Date()) {
  const start = weekStart(date).getTime();
  const end = start + 7 * 86400000;
  return history.filter((h) => {
    const t = new Date(h.completedAt).getTime();
    return t >= start && t < end;
  }).length;
}

function bestWeekCount(history) {
  const byWeek = new Map();
  for (const h of history) {
    const key = weekStart(new Date(h.completedAt)).getTime();
    byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
  }
  return Math.max(0, ...byWeek.values());
}

export const BADGES = [
  {
    id: 'first-step',
    title: 'Первый шаг',
    description: 'Отметь выполненным первое действие из своего плана.',
    progress: (s) => ({ value: s.history.length, target: 1 }),
  },
  {
    id: 'air-explorer',
    title: 'Исследователь воздуха',
    description: 'Пройди квиз и ответь правильно хотя бы на 70% вопросов.',
    progress: (s) => {
      const total = s.quiz.total ?? 0;
      const target = total ? Math.ceil(total * 0.7) : 1;
      return { value: total ? Math.min(s.quiz.bestScore ?? 0, target) : 0, target };
    },
  },
  {
    id: 'initiator',
    title: 'Инициатор',
    description: 'Предложи свою инициативу или выполни инициативу из каталога.',
    progress: (s) => ({
      value: Math.min(1, s.proposals.length + s.history.filter((h) => h.kind === 'initiative').length),
      target: 1,
    }),
  },
  {
    id: 'team-player',
    title: 'Командный игрок',
    description: 'Выполни два действия, которые делаются вместе с группой.',
    progress: (s) => ({ value: Math.min(2, s.history.filter((h) => h.mode === 'group').length), target: 2 }),
  },
  {
    id: 'voice',
    title: 'Голос перемен',
    description: 'Выполни три действия, которые распространяют знания или вовлекают других.',
    progress: (s) => ({
      value: Math.min(3, s.history.filter((h) => h.effect === 'awareness' || h.effect === 'community').length),
      target: 3,
    }),
  },
  {
    id: 'clean-step',
    title: 'Меньше выбросов',
    description: 'Выполни два действия, которые напрямую уменьшают сжигание топлива или мусора.',
    progress: (s) => ({ value: Math.min(2, s.history.filter((h) => h.effect === 'direct').length), target: 2 }),
  },
  {
    id: 'steady',
    title: 'Постоянство',
    description: 'Отмечай выполненные действия три дня подряд.',
    progress: (s) => ({ value: Math.min(3, computeStreak(s.history).best), target: 3 }),
  },
  {
    id: 'weekly',
    title: 'Неделя в ритме',
    description: 'Выполни недельную цель хотя бы один раз.',
    progress: (s) => ({ value: Math.min(s.weeklyGoal, bestWeekCount(s.history)), target: s.weeklyGoal }),
  },
];

export function computeBadges(state) {
  return BADGES.map((badge) => {
    const { value, target } = badge.progress(state);
    return { id: badge.id, title: badge.title, description: badge.description, value, target, earned: value >= target };
  });
}

export function computeMilestones(history) {
  const count = history.length;
  const next = MILESTONES.find((m) => m > count) ?? null;
  return { count, reached: MILESTONES.filter((m) => m <= count), next };
}

export function planStats(plan) {
  const total = plan.length;
  const done = plan.filter((p) => p.completedAt).length;
  return { total, done, open: total - done, ratio: total ? done / total : 0 };
}
