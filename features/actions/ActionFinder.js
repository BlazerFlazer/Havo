'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, ArrowRight, Check, RotateCcw, Search, Sparkles } from 'lucide-react';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { Button } from '@/components/ui/Button';
import { ACTION_CATEGORIES } from '@/data/actions';
import { pluralize } from '@/lib/format';
import { scrollToSection } from '@/lib/scroll';
import { AddToPlanButton } from '@/features/planner/AddToPlanButton';
import { actionToPlanItem } from '@/features/planner/planItems';
import { DEFAULT_FINDER_ANSWERS, FINDER_QUESTIONS, recommendActions } from './finder';
import { openAction } from './actionSheetStore';
import { EffectLabel, ActionMeta } from './ActionMeta';
import styles from './ActionFinder.module.css';

const EASE = [0.22, 1, 0.36, 1];

function sameAnswers(a, b) {
  return FINDER_QUESTIONS.every((q) => a[q.id] === b[q.id]);
}

export function ActionFinder() {
  const [answers, setAnswers] = useState(DEFAULT_FINDER_ANSWERS);
  const [submitted, setSubmitted] = useState(null); // answers used for the current results
  const resultsRef = useRef(null);

  const results = submitted ? recommendActions(submitted) : null;
  const stale = submitted && !sameAnswers(answers, submitted);

  const submit = () => {
    setSubmitted({ ...answers });
    // On narrow screens results are below the form: bring them into view.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const reset = () => {
    setAnswers(DEFAULT_FINDER_ANSWERS);
    setSubmitted(null);
  };

  return (
    <div className={`${styles.finder} theme-dark`}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        aria-labelledby="finder-title"
      >
        <div className={styles.formHead}>
          <p className="t-label">Подбор действий · 5 вопросов</p>
          <h3 id="finder-title" className={styles.formTitle}>
            Найди свой первый шаг
          </h3>
        </div>
        {FINDER_QUESTIONS.map((q) => (
          <ChoiceGroup
            key={q.id}
            label={q.label}
            options={q.options}
            value={answers[q.id]}
            onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
            size="sm"
          />
        ))}
        <div className={styles.formActions}>
          <Button type="submit" icon={Search} iconPosition="start">
            Подобрать действия
          </Button>
          <Button type="button" variant="ghost" icon={RotateCcw} iconPosition="start" onClick={reset}>
            Сбросить
          </Button>
        </div>
      </form>

      <div ref={resultsRef} className={styles.results} aria-live="polite" aria-busy={false}>
        {!results && (
          <div className={styles.intro}>
            <Sparkles size={28} aria-hidden="true" className={styles.introIcon} />
            <p className={styles.introTitle}>Ответь на пять коротких вопросов</p>
            <p className={styles.introText}>
              Мы подберём действия под твоё время, бюджет и интересы — и объясним, почему они подходят. Регистрация не
              нужна.
            </p>
          </div>
        )}

        {results && (
          <>
            <div className={styles.resultsHead}>
              <p className={styles.count}>
                {results.length > 0
                  ? `Подобрали ${pluralize(results.length, ['действие', 'действия', 'действий'])}`
                  : 'Подходящих действий не нашлось'}
              </p>
              {stale && (
                <p className={styles.stale}>
                  <AlertCircle size={15} aria-hidden="true" />
                  Ответы изменились — нажми «Подобрать действия», чтобы обновить список.
                </p>
              )}
            </div>

            {results.length === 0 ? (
              <div className={styles.empty}>
                <p>
                  Попробуй выбрать больше времени или гибкий бюджет: многие проекты требуют подготовки. Или посмотри
                  всю библиотеку действий.
                </p>
                <Button variant="secondary" icon={ArrowRight} onClick={() => scrollToSection('library')}>
                  Вся библиотека
                </Button>
              </div>
            ) : (
              <ol className={styles.list} role="list">
                <AnimatePresence initial>
                  {results.map(({ action, reasons, cautions }, i) => (
                    <motion.li
                      key={`${action.id}-${JSON.stringify(submitted)}`}
                      className={styles.item}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: i * 0.06, ease: EASE }}
                    >
                      <div className={styles.itemHead}>
                        <span className={styles.rank}>{String(i + 1).padStart(2, '0')}</span>
                        <div className={styles.itemTitleBlock}>
                          <p className={styles.itemCat}>
                            {ACTION_CATEGORIES.find((c) => c.id === action.category)?.label} ·{' '}
                            <EffectLabel effect={action.effect} />
                          </p>
                          <h4 className={styles.itemTitle}>{action.title}</h4>
                        </div>
                      </div>
                      <ActionMeta action={action} />
                      <ul className={styles.reasons} role="list" aria-label="Почему подходит">
                        {reasons.map((r) => (
                          <li key={r}>
                            <Check size={14} aria-hidden="true" />
                            {r}
                          </li>
                        ))}
                        {cautions.map((c) => (
                          <li key={c} className={styles.caution}>
                            <AlertCircle size={14} aria-hidden="true" />
                            {c}
                          </li>
                        ))}
                      </ul>
                      <div className={styles.itemActions}>
                        <Button size="sm" variant="secondary" icon={ArrowRight} onClick={() => openAction(action.id)}>
                          Подробнее
                        </Button>
                        <AddToPlanButton item={actionToPlanItem(action)} />
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
            )}
          </>
        )}
      </div>
    </div>
  );
}
