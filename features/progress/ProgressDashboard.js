'use client';

import { useState } from 'react';
import {
  CalendarDays,
  CircleHelp,
  Flame,
  Footprints,
  Leaf,
  Lightbulb,
  Lock,
  Megaphone,
  Microscope,
  Minus,
  Plus,
  RotateCcw,
  Users,
} from 'lucide-react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Counter } from '@/components/ui/Counter';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useIsClient } from '@/hooks/useIsClient';
import { Planner } from '@/features/planner/Planner';
import { openTool } from '@/features/tools/toolTabStore';
import { showToast } from '@/features/feedback/toast';
import { formatDate, plural, pluralize } from '@/lib/format';
import { havoActions, useHavoState } from './store';
import {
  MILESTONES,
  WEEKLY_GOAL_RANGE,
  completionsInWeek,
  computeBadges,
  computeMilestones,
  computePoints,
  computeStreak,
  planStats,
} from './progress';
import styles from './ProgressDashboard.module.css';

const BADGE_ICONS = {
  'first-step': Footprints,
  'air-explorer': Microscope,
  initiator: Lightbulb,
  'team-player': Users,
  voice: Megaphone,
  'clean-step': Leaf,
  steady: Flame,
  weekly: CalendarDays,
};

function Stats({ state }) {
  const stats = planStats(state.plan);
  const points = computePoints(state);
  const streak = computeStreak(state.history);
  const thisWeek = completionsInWeek(state.history);
  const goal = state.weeklyGoal;

  return (
    <div className={styles.stats}>
      <div className={`${styles.card} ${styles.ringCard}`}>
        <ProgressRing value={stats.ratio} size={150} stroke={12} label="Выполнение плана">
          <span className={`${styles.ringValue} t-num`}>{Math.round(stats.ratio * 100)}%</span>
        </ProgressRing>
        <div>
          <p className={styles.cardLabel}>План</p>
          <p className={styles.cardMain}>
            {stats.done} из {stats.total}
          </p>
          <p className={styles.cardSub}>
            {stats.total === 0
              ? 'Добавь первую задачу'
              : `${plural(stats.done, ['задача выполнена', 'задачи выполнены', 'задач выполнено'])}`}
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.cardLabel}>Очки участия</p>
        <p className={`${styles.big} t-num`}>
          <Counter value={points.total} />
        </p>
        <ul className={styles.breakdown} role="list">
          <li>
            <span>Действия</span>
            <span className="t-num">{points.fromActions}</span>
          </li>
          <li>
            <span>Квиз</span>
            <span className="t-num">{points.fromQuiz}</span>
          </li>
          <li>
            <span>Идеи</span>
            <span className="t-num">{points.fromProposals}</span>
          </li>
        </ul>
      </div>

      <div className={styles.card}>
        <p className={styles.cardLabel}>Серия</p>
        <p className={`${styles.big} t-num`}>
          {streak.current}
          <span className={styles.bigUnit}> {plural(streak.current, ['день', 'дня', 'дней'])}</span>
        </p>
        <p className={styles.cardSub}>
          Дни подряд с выполненным действием. Лучшая серия: {pluralize(streak.best, ['день', 'дня', 'дней'])}.
        </p>
      </div>

      <div className={styles.card}>
        <p className={styles.cardLabel}>Цель на неделю</p>
        <p className={`${styles.big} t-num`}>
          {thisWeek}
          <span className={styles.bigUnit}> / {goal}</span>
        </p>
        <div className={styles.weekBar} aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.min(1, thisWeek / goal)})` }} />
        </div>
        <div className={styles.stepper}>
          <span className={styles.cardSub}>Действий в неделю:</span>
          <Button
            size="sm"
            variant="secondary"
            icon={Minus}
            aria-label="Уменьшить недельную цель"
            disabled={goal <= WEEKLY_GOAL_RANGE.min}
            onClick={() => havoActions.setWeeklyGoal(goal - 1)}
          />
          <span className={`${styles.goalValue} t-num`} aria-live="polite">
            {goal}
          </span>
          <Button
            size="sm"
            variant="secondary"
            icon={Plus}
            aria-label="Увеличить недельную цель"
            disabled={goal >= WEEKLY_GOAL_RANGE.max}
            onClick={() => havoActions.setWeeklyGoal(goal + 1)}
          />
        </div>
      </div>
    </div>
  );
}

function Badges({ state }) {
  const badges = computeBadges(state);
  const earned = badges.filter((b) => b.earned).length;
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <h3 className={styles.blockTitle}>Значки</h3>
        <p className={styles.blockMeta}>
          {earned} из {badges.length}
        </p>
      </div>
      <ul className={styles.badges} role="list">
        {badges.map((b) => {
          const Icon = BADGE_ICONS[b.id] ?? Leaf;
          return (
            <li key={b.id} className={styles.badge} data-earned={b.earned || undefined}>
              <span className={styles.badgeIcon} aria-hidden="true">
                {b.earned ? <Icon size={22} /> : <Lock size={18} />}
              </span>
              <p className={styles.badgeTitle}>
                {b.title}
                <span className="sr-only">{b.earned ? ' — получен' : ' — ещё не получен'}</span>
              </p>
              <p className={styles.badgeText}>{b.description}</p>
              {!b.earned && (
                <p className={styles.badgeProgress}>
                  <span className="t-num">
                    {b.value}/{b.target}
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {state.quiz.bestScore === null && (
        <Button variant="soft" size="sm" icon={CircleHelp} iconPosition="start" onClick={() => openTool('quiz')}>
          Пройти квиз
        </Button>
      )}
    </div>
  );
}

function Milestones({ history }) {
  const { count, next } = computeMilestones(history);
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <h3 className={styles.blockTitle}>Вехи</h3>
        <p className={styles.blockMeta}>
          {next ? `До следующей: ${pluralize(next - count, ['действие', 'действия', 'действий'])}` : 'Все вехи пройдены'}
        </p>
      </div>
      <ol className={styles.milestones} role="list">
        {MILESTONES.map((m) => (
          <li key={m} data-reached={count >= m || undefined}>
            <span className={styles.mDot} aria-hidden="true" />
            <span className="t-num">{m}</span>
            <span className={styles.mLabel}>{plural(m, ['действие', 'действия', 'действий'])}</span>
            <span className="sr-only">{count >= m ? ' — достигнуто' : ' — впереди'}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function History({ history }) {
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <h3 className={styles.blockTitle}>История</h3>
        <p className={styles.blockMeta}>{pluralize(history.length, ['запись', 'записи', 'записей'])}</p>
      </div>
      {history.length === 0 ? (
        <p className={styles.emptyHistory}>Здесь появится список выполненных действий с датами.</p>
      ) : (
        <ol className={styles.history} role="list">
          {history.slice(0, 12).map((h) => (
            <li key={h.id}>
              <span className={styles.hDate}>{formatDate(h.completedAt)}</span>
              <span className={styles.hTitle}>{h.title}</span>
              <span className={`${styles.hPoints} t-num`}>+{h.points}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function ProgressDashboard() {
  const state = useHavoState();
  const isClient = useIsClient();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isClient) {
    return (
      <div className={styles.loading} aria-busy="true">
        Загружаем твой прогресс…
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <Stats state={state} />
      <p className={styles.disclaimer}>
        Очки показывают твоё участие на платформе, а не измеренное снижение загрязнения. Всё хранится только в этом
        браузере — без регистрации, рейтингов и сравнения с другими.
      </p>

      <div className={styles.block}>
        <div className={styles.blockHead}>
          <h3 className={styles.blockTitle}>Мой план</h3>
        </div>
        <Planner />
      </div>

      <div className={styles.split}>
        <Badges state={state} />
        <div className={styles.splitCol}>
          <Milestones history={state.history} />
          <History history={state.history} />
        </div>
      </div>

      <div className={styles.reset}>
        <p>
          Хочешь начать заново? Сброс удалит план, историю, результаты квиза и цели. Сохранённые идеи инициатив останутся.
        </p>
        <Button variant="danger" size="sm" icon={RotateCcw} iconPosition="start" onClick={() => setConfirmReset(true)}>
          Сбросить прогресс
        </Button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Сбросить весь прогресс?"
        description="План, история выполненных действий, очки, значки и результаты квиза будут удалены из этого браузера. Это нельзя отменить."
        confirmLabel="Сбросить"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          havoActions.resetProgress();
          setConfirmReset(false);
          showToast('Прогресс сброшен', { tone: 'info' });
        }}
      />
    </div>
  );
}
