// Converts catalogue entries into plan items stored in the personal plan.

const INITIATIVE_EFFECT = {
  awareness: 'awareness',
  transport: 'direct',
  research: 'community',
  community: 'community',
  greening: 'community',
};

export function actionToPlanItem(action) {
  return {
    kind: 'action',
    refId: action.id,
    title: action.title,
    category: action.category,
    effect: action.effect,
    mode: action.mode,
    difficulty: action.difficulty,
  };
}

export function initiativeToPlanItem(initiative) {
  return {
    kind: 'initiative',
    refId: initiative.id,
    title: initiative.name,
    category: 'initiative',
    effect: INITIATIVE_EFFECT[initiative.category] ?? 'community',
    mode: 'group',
    difficulty: initiative.difficulty,
  };
}
