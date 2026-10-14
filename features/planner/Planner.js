'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Calendar, Check, NotebookPen, Search, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { havoActions, useHavoState } from '@/features/progress/store';
import { MAX_NOTE_LENGTH, POINTS_BY_DIFFICULTY } from '@/features/progress/progress';
import { showToast } from '@/features/feedback/toast';
import { openAction } from '@/features/actions/actionSheetStore';
import { EffectLabel } from '@/features/actions/ActionMeta';
import { deadlineLabel, formatDate, pluralize } from '@/lib/format';
import styles from './Planner.module.css';

function PlanItem({ item }) {
  const id = useId();
  const [noteOpen, setNoteOpen] = useState(Boolean(item.note));
  const done = Boolean(item.completedAt);
  const due = !done ? deadlineLabel(item.deadline) : null;

  const toggle = () => {
    havoActions.toggleComplete(item.id);
    if (!done) showToast(`Выполнено! +${POINTS_BY_DIFFICULTY[item.difficulty]} очков участия`);
    else showToast('Отметка о выполнении снята', { tone: 'info' });
  };

  return (
    <motion.li
      layout="position"
      className={styles.item}
      data-done={done || undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        className={styles.check}
        aria-pressed={done}
        onClick={toggle}
        aria-label={done ? `Снять отметку о выполнении: ${item.title}` : `Отметить выполненным: ${item.title}`}
      >
        <Check size={18} strokeWidth={3} aria-hidden="true" />
      </button>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <p className={styles.title}>{item.title}</p>
          <div className={styles.tags}>
            <span className={styles.kind}>{item.kind === 'initiative' ? 'Инициатива' : 'Действие'}</span>
            {item.effect && <EffectLabel effect={item.effect} />}
            {item.mode === 'group' && (
              <span className={styles.kind}>
                <Users size={12} aria-hidden="true" /> команда
              </span>
            )}
          </div>
        </div>

        {done ? (
          <p className={styles.doneLine}>Выполнено {formatDate(item.completedAt)}</p>
        ) : (
          <div className={styles.controls}>
            <div className={styles.deadline}>
              <label htmlFor={`${id}-deadline`} className={styles.controlLabel}>
                <Calendar size={14} aria-hidden="true" /> Срок
              </label>
              <input
                id={`${id}-deadline`}
                type="date"
                className={styles.date}
                value={item.deadline ?? ''}
                onChange={(e) => havoActions.updatePlanItem(item.id, { deadline: e.target.value || null })}
              />
              {due && (
                <span className={styles.due} data-tone={due.tone}>
                  {due.text}
                </span>
              )}
            </div>
            <button
              type="button"
              className={styles.noteToggle}
              aria-expanded={noteOpen}
              aria-controls={`${id}-note`}
              onClick={() => setNoteOpen((v) => !v)}
            >
              <NotebookPen size={14} aria-hidden="true" />
              {noteOpen ? 'Скрыть заметку' : item.note ? 'Заметка' : 'Добавить заметку'}
            </button>
          </div>
        )}

        {noteOpen && !done && (
          <div className={styles.noteBox} id={`${id}-note`}>
            <label htmlFor={`${id}-note-input`} className="sr-only">
              Заметка к задаче «{item.title}»
            </label>
            <textarea
              id={`${id}-note-input`}
              className={`textarea ${styles.note}`}
              rows={2}
              maxLength={MAX_NOTE_LENGTH}
              value={item.note}
              placeholder="Например: с кем договориться, что подготовить"
              onChange={(e) => havoActions.updatePlanItem(item.id, { note: e.target.value })}
            />
            <span className={styles.noteCount}>
              {item.note.length}/{MAX_NOTE_LENGTH}
            </span>
          </div>
        )}
        {done && item.note && <p className={styles.noteRead}>{item.note}</p>}
      </div>

      <div className={styles.itemActions}>
        {item.kind === 'action' && (
          <Button size="sm" variant="ghost" onClick={() => openAction(item.refId)} aria-label={`Подробнее: ${item.title}`}>
            Подробнее
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          icon={Trash2}
          aria-label={`Удалить из плана: ${item.title}`}
          onClick={() => {
            havoActions.removeFromPlan(item.id);
            showToast('Задача удалена из плана', { tone: 'info' });
          }}
        />
      </div>
    </motion.li>
  );
}

export function Planner() {
  const { plan } = useHavoState();
  const [tab, setTab] = useState('open');
  const [confirmClear, setConfirmClear] = useState(false);

  const open = plan.filter((p) => !p.completedAt);
  const done = plan.filter((p) => p.completedAt).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  // Upcoming: dated tasks first (soonest first), then the rest by date added.
  const upcoming = [...open].sort((a, b) => {
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return b.addedAt.localeCompare(a.addedAt);
  });
  const items = tab === 'open' ? upcoming : done;

  if (plan.length === 0) {
    return (
      <div className={styles.emptyPlan}>
        <p className={styles.emptyTitle}>План пока пуст</p>
        <p className={styles.emptyText}>
          Добавь первое действие или инициативу — и отмечай здесь, когда действительно сделаешь их. Добавить в план ещё
          не значит выполнить.
        </p>
        <div className={styles.emptyActions}>
          <Button href="#actions" icon={Search} iconPosition="start">
            Подобрать действия
          </Button>
          <Button href="#initiatives" variant="secondary" icon={ArrowRight}>
            Инициативы
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.planner}>
      <div className={styles.head}>
        <div className={styles.tabs} role="group" aria-label="Показать задачи">
          {[
            { id: 'open', label: 'Предстоящие', count: open.length },
            { id: 'done', label: 'Выполненные', count: done.length },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              aria-controls="plan-panel"
              className={styles.tab}
              onClick={() => setTab(t.id)}
            >
              {t.label} <span className={styles.tabCount}>{t.count}</span>
            </button>
          ))}
        </div>
        <Button variant="danger" size="sm" icon={Trash2} iconPosition="start" onClick={() => setConfirmClear(true)}>
          Очистить план
        </Button>
      </div>

      <div id="plan-panel">
        {items.length === 0 ? (
          <p className={styles.emptyTab}>
            {tab === 'open'
              ? 'Все задачи выполнены — отличная работа! Добавь новое действие, когда будешь готов.'
              : 'Здесь появятся выполненные задачи. Отмечай задачу, только когда действительно её сделаешь.'}
          </p>
        ) : (
          <ul className={styles.list} role="list">
            <AnimatePresence initial={false} mode="popLayout">
              {items.map((item) => (
                <PlanItem key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Очистить план?"
        description={`Из плана будут удалены ${pluralize(plan.length, ['задача', 'задачи', 'задач'])}. История выполненных действий, очки и значки сохранятся.`}
        confirmLabel="Очистить"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          havoActions.clearPlan();
          setConfirmClear(false);
          showToast('План очищен', { tone: 'info' });
        }}
      />
    </div>
  );
}
