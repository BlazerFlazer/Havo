'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { QUIZ, QUIZ_PASS_RATIO } from '@/data/quiz';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { havoActions, useHavoState } from '@/features/progress/store';
import { pluralize } from '@/lib/format';
import { scrollToSection } from '@/lib/scroll';
import styles from './Quiz.module.css';

const LETTERS = ['А', 'Б', 'В', 'Г'];
const EASE = [0.22, 1, 0.36, 1];

function resultMessage(ratio) {
  if (ratio >= 0.9) return 'Отлично! Ты хорошо разбираешься в теме — можешь объяснять её другим.';
  if (ratio >= QUIZ_PASS_RATIO) return 'Хороший результат. Посмотри разбор ошибок — и ты будешь знать тему уверенно.';
  if (ratio >= 0.4) return 'Неплохое начало. Разбор ниже поможет закрыть пробелы.';
  return 'Тема непростая — и это нормально. Прочитай разбор и раздел «Проблема», а потом попробуй ещё раз.';
}

export function Quiz() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]); // { id, chosen, correct }
  const [finished, setFinished] = useState(false);
  const { quiz: saved } = useHavoState();
  const nextRef = useRef(null);
  const headingRef = useRef(null);
  const started = useRef(false);

  const q = QUIZ[index];
  const total = QUIZ.length;
  const score = answers.filter((a) => a.chosen === a.correct).length;

  // Move focus sensibly between steps (never on first render). The focus for a
  // new question is set when its enter animation completes (see below).
  useEffect(() => {
    if (!started.current) return;
    if (finished) headingRef.current?.focus({ preventScroll: true });
    else if (submitted) nextRef.current?.focus({ preventScroll: true });
  }, [submitted, finished]);

  const submit = () => {
    if (selected === null) return;
    started.current = true;
    setSubmitted(true);
    setAnswers((prev) => [...prev, { id: q.id, chosen: selected, correct: q.correct }]);
  };

  const next = () => {
    started.current = true;
    if (index + 1 < total) {
      setIndex(index + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      setFinished(true);
      havoActions.recordQuiz(score, total);
    }
  };

  const restart = () => {
    started.current = true;
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
    setFinished(false);
  };

  if (finished) {
    const ratio = score / total;
    const mistakes = answers.filter((a) => a.chosen !== a.correct);
    return (
      <div className={styles.quiz}>
        <div className={styles.result}>
          <ProgressRing value={ratio} size={170} stroke={12} label={`Результат: ${score} из ${total}`}>
            <span className={`${styles.ringScore} t-num`}>
              {score}/{total}
            </span>
          </ProgressRing>
          <div className={styles.resultText}>
            <h3 ref={headingRef} tabIndex={-1} className={styles.resultTitle}>
              {pluralize(score, ['правильный ответ', 'правильных ответа', 'правильных ответов'])} из {total}
            </h3>
            <p className={styles.resultMsg}>{resultMessage(ratio)}</p>
            {saved.bestScore !== null && (
              <p className={styles.best}>
                Лучший результат: {saved.bestScore} из {saved.total ?? total} · попыток: {saved.attempts}
              </p>
            )}
            <div className={styles.resultActions}>
              <Button icon={RotateCcw} iconPosition="start" onClick={restart}>
                Пройти ещё раз
              </Button>
              <Button variant="secondary" icon={ArrowRight} onClick={() => scrollToSection('actions')}>
                К действиям
              </Button>
            </div>
          </div>
        </div>

        {mistakes.length > 0 ? (
          <div className={styles.review}>
            <p className="t-label">Разбор ошибок</p>
            <ol className={styles.reviewList} role="list">
              {mistakes.map((m) => {
                const question = QUIZ.find((x) => x.id === m.id);
                return (
                  <li key={m.id} className={styles.reviewItem}>
                    <p className={styles.reviewQ}>{question.question}</p>
                    <p className={styles.reviewWrong}>
                      <X size={15} aria-hidden="true" /> Твой ответ: {question.options[m.chosen]}
                    </p>
                    <p className={styles.reviewRight}>
                      <Check size={15} aria-hidden="true" /> Правильно: {question.options[question.correct]}
                    </p>
                    <p className={styles.reviewExpl}>{question.explanation}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <p className={styles.perfect}>Ни одной ошибки — разбирать нечего!</p>
        )}
      </div>
    );
  }

  const isCorrect = submitted && selected === q.correct;

  return (
    <div className={styles.quiz}>
      <div className={styles.top}>
        <p className={styles.counter}>
          Вопрос <span className="t-num">{index + 1}</span> из {total}
          <span className={styles.topic}>{q.topic}</span>
        </p>
        <div
          className={styles.progress}
          role="progressbar"
          aria-label="Прогресс квиза"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index + (submitted ? 1 : 0)}
        >
          <span style={{ transform: `scaleX(${(index + (submitted ? 1 : 0)) / total})` }} />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.32, ease: EASE }}
          onAnimationComplete={() => {
            if (started.current && !submitted) headingRef.current?.focus({ preventScroll: true });
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (submitted) next();
              else submit();
            }}
          >
            <fieldset className={styles.fieldset}>
              <legend className={styles.question}>
                <span ref={headingRef} tabIndex={-1} className={styles.questionText}>
                  {q.question}
                </span>
              </legend>
              <div className={styles.options}>
                {q.options.map((opt, i) => {
                  const state = !submitted
                    ? selected === i
                      ? 'selected'
                      : 'idle'
                    : i === q.correct
                      ? 'correct'
                      : i === selected
                        ? 'wrong'
                        : 'dim';
                  return (
                    <label key={i} className={styles.option} data-state={state}>
                      <input
                        type="radio"
                        name={`quiz-${q.id}`}
                        className={styles.radio}
                        checked={selected === i}
                        disabled={submitted}
                        onChange={() => setSelected(i)}
                      />
                      <span className={styles.letter} aria-hidden="true">
                        {state === 'correct' ? <Check size={16} /> : state === 'wrong' ? <X size={16} /> : LETTERS[i]}
                      </span>
                      <span className={styles.optionText}>{opt}</span>
                      {state === 'correct' && <span className="sr-only"> — правильный ответ</span>}
                      {state === 'wrong' && <span className="sr-only"> — твой ответ, неверно</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div aria-live="polite">
              {submitted && (
                <motion.div
                  className={styles.feedback}
                  data-correct={isCorrect || undefined}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <p className={styles.feedbackTitle}>{isCorrect ? 'Верно!' : 'Не совсем.'}</p>
                  <p>{q.explanation}</p>
                </motion.div>
              )}
            </div>

            <div className={styles.actions}>
              {!submitted ? (
                <Button type="submit" disabled={selected === null}>
                  Проверить
                </Button>
              ) : (
                <Button ref={nextRef} type="submit" icon={ArrowRight}>
                  {index + 1 < total ? 'Следующий вопрос' : 'Посмотреть результат'}
                </Button>
              )}
              {!submitted && selected === null && <p className={styles.hint}>Выбери вариант ответа</p>}
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
