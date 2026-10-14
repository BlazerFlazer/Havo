'use client';

import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { havoActions, useHavoState } from '@/features/progress/store';
import { isInPlan } from '@/features/progress/progress';
import { showToast } from '@/features/feedback/toast';

/**
 * Adds a catalogue item to the personal plan. Once added it becomes a link to
 * the plan, so the button never looks clickable without doing anything.
 */
export function AddToPlanButton({ item, size = 'sm', variant = 'soft', label = 'В план', onNavigate, ...rest }) {
  const state = useHavoState();
  const added = isInPlan(state, item.kind, item.refId);

  if (added) {
    return (
      <Button href="#progress" size={size} variant="secondary" icon={Check} iconPosition="start" onClick={onNavigate} {...rest}>
        В плане
        <span className="sr-only"> — открыть мой план</span>
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      icon={Plus}
      iconPosition="start"
      onClick={() => {
        if (havoActions.addToPlan(item)) {
          showToast(`«${item.title}» — в твоём плане. Отметь, когда выполнишь.`);
        }
      }}
      {...rest}
    >
      {label}
      <span className="sr-only">: {item.title}</span>
    </Button>
  );
}
