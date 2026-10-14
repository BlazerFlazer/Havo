// Action finder: filters and ranks actions by the visitor's preferences.
// Pure logic (no React) so it can be unit tested with `node --test`.

import { ACTIONS, ACTIVITY_LABELS, SETTING_LABELS } from '../../data/actions.js';

export const FINDER_QUESTIONS = [
  {
    id: 'time',
    label: 'Сколько у тебя времени?',
    options: [
      { value: 1, label: '10 минут' },
      { value: 2, label: '30 минут' },
      { value: 3, label: '1 час' },
      { value: 4, label: 'Несколько дней' },
    ],
  },
  {
    id: 'budget',
    label: 'Бюджет',
    options: [
      { value: 'free', label: 'Бесплатно' },
      { value: 'low', label: 'Небольшой' },
      { value: 'flexible', label: 'Гибкий' },
    ],
  },
  {
    id: 'setting',
    label: 'Где хочешь действовать?',
    options: [
      { value: 'home', label: 'Дома' },
      { value: 'school', label: 'В школе' },
      { value: 'neighbourhood', label: 'В районе' },
      { value: 'online', label: 'Онлайн' },
    ],
  },
  {
    id: 'activity',
    label: 'Что тебе ближе?',
    options: [
      { value: 'learning', label: 'Изучать' },
      { value: 'organizing', label: 'Организовывать' },
      { value: 'creating', label: 'Создавать' },
      { value: 'participating', label: 'Участвовать' },
    ],
  },
  {
    id: 'mode',
    label: 'Один или с командой?',
    options: [
      { value: 'solo', label: 'Один' },
      { value: 'group', label: 'С группой' },
    ],
  },
];

export const DEFAULT_FINDER_ANSWERS = {
  time: 2,
  budget: 'free',
  setting: 'school',
  activity: 'participating',
  mode: 'solo',
};

const COST_RANK = { free: 0, low: 1, flexible: 2 };

const TIME_REASON = {
  1: 'Укладывается в 10 минут',
  2: 'Укладывается в 30 минут',
  3: 'Можно сделать примерно за час',
  4: 'Рассчитано на несколько дней',
};

const SETTING_REASON = {
  home: 'Можно сделать дома',
  school: 'Подходит для школы',
  neighbourhood: 'Подходит для твоего района',
  online: 'Можно сделать онлайн',
};

const ACTIVITY_REASON = {
  learning: 'Про изучение и понимание',
  organizing: 'Про организацию',
  creating: 'Про создание чего-то своего',
  participating: 'Про личное участие',
};

export const MAX_RESULTS = 6;

/**
 * Returns ranked recommendations with human-readable reasons.
 * Hard constraints: time and budget must fit.
 * Soft constraints: setting (+3), activity (+3), work mode (+2).
 * An action must match at least the setting or the activity to be shown.
 */
export function recommendActions(answers, actions = ACTIONS) {
  const { time, budget, setting, activity, mode } = { ...DEFAULT_FINDER_ANSWERS, ...answers };
  const budgetRank = COST_RANK[budget] ?? 0;

  const results = [];
  for (const action of actions) {
    if (action.timeBucket > time) continue;
    if ((COST_RANK[action.cost] ?? 0) > budgetRank) continue;

    const settingMatch = action.settings.includes(setting);
    const activityMatch = action.activities.includes(activity);
    if (!settingMatch && !activityMatch) continue;

    const modeMatch = action.mode === 'both' || action.mode === mode;

    let score = 0;
    const reasons = [];
    const cautions = [];

    if (settingMatch) {
      score += 3;
      reasons.push(SETTING_REASON[setting]);
    } else {
      cautions.push(
        `Лучше подходит для мест: ${action.settings.map((s) => SETTING_LABELS[s].toLowerCase()).join(', ')}`,
      );
    }

    if (activityMatch) {
      score += 3;
      reasons.push(ACTIVITY_REASON[activity]);
    } else {
      cautions.push(`Скорее про другое: ${action.activities.map((a) => ACTIVITY_LABELS[a].toLowerCase()).join(', ')}`);
    }

    if (modeMatch) {
      score += 2;
      reasons.push(mode === 'solo' ? 'Можно сделать самостоятельно' : 'Хорошо подходит для команды');
    } else if (action.mode === 'group') {
      cautions.push('Понадобится команда — позови друзей или одноклассников');
    } else {
      cautions.push('Обычно это делают в одиночку, но можно позвать друзей');
    }

    // Short sessions favour easy actions; a small nudge, not a filter.
    if (time <= 2 && action.difficulty === 1) score += 1;

    reasons.unshift(TIME_REASON[action.timeBucket]);
    if (action.cost === 'free') reasons.push('Бесплатно');
    else if (action.cost === 'low') reasons.push('Нужны небольшие расходы');

    results.push({ action, score, reasons, cautions });
  }

  results.sort((a, b) => b.score - a.score || a.action.difficulty - b.action.difficulty);
  return results.slice(0, MAX_RESULTS);
}
