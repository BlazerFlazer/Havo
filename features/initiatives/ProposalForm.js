'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Lock, Send, Trash2 } from 'lucide-react';
import { INITIATIVE_CATEGORIES } from '@/data/initiatives';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { havoActions, isPersistenceAvailable, useHavoState } from '@/features/progress/store';
import { showToast } from '@/features/feedback/toast';
import { formatDate } from '@/lib/format';
import {
  EMPTY_PROPOSAL,
  LIMITS,
  PARTICIPANT_OPTIONS,
  PLACE_OPTIONS,
  toStoredProposal,
  validateProposal,
} from './proposal';
import styles from './ProposalForm.module.css';

const FIELD_ORDER = ['title', 'category', 'place', 'description', 'participants', 'alias', 'consent'];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      {message}
    </p>
  );
}

function SavedProposals() {
  const { proposals } = useHavoState();
  const [pendingDelete, setPendingDelete] = useState(null);

  return (
    <>
      {proposals.length > 0 && (
    <div className={styles.saved}>
      <p className="t-label">Мои идеи · сохранены только в этом браузере</p>
      <ul className={styles.savedList} role="list">
        <AnimatePresence initial={false}>
          {proposals.map((p) => (
            <motion.li
              key={p.id}
              className={styles.savedItem}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.savedBody}>
                <p className={styles.savedMeta}>
                  {INITIATIVE_CATEGORIES[p.category]} · {PLACE_OPTIONS.find((o) => o.value === p.place)?.label} ·{' '}
                  {formatDate(p.createdAt)}
                </p>
                <p className={styles.savedTitle}>{p.title}</p>
                <p className={styles.savedText}>{p.description}</p>
                {p.alias && <p className={styles.savedMeta}>Автор: {p.alias}</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                aria-label={`Удалить идею «${p.title}»`}
                onClick={() => setPendingDelete(p)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
      )}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Удалить идею?"
        description={pendingDelete ? `Идея «${pendingDelete.title}» будет удалена из этого браузера.` : ''}
        confirmLabel="Удалить"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          havoActions.removeProposal(pendingDelete.id);
          setPendingDelete(null);
          showToast('Идея удалена', { tone: 'info' });
        }}
      />
    </>
  );
}

export function ProposalForm() {
  const [values, setValues] = useState(EMPTY_PROPOSAL);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | success | error
  const formRef = useRef(null);

  const update = (field, value) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (status !== 'idle') setStatus('idle');
    // After the first submit attempt, re-validate live so errors disappear as they are fixed.
    if (attempted) setErrors(validateProposal(next, INITIATIVE_CATEGORIES));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setAttempted(true);
    const found = validateProposal(values, INITIATIVE_CATEGORIES);
    setErrors(found);
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) {
      setStatus('error');
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    havoActions.addProposal(toStoredProposal(values));
    if (!isPersistenceAvailable()) {
      setStatus('error');
      setErrors({ form: 'Браузер не разрешил сохранить данные (например, в приватном режиме). Идея видна до перезагрузки страницы.' });
      return;
    }
    setStatus('success');
    setValues(EMPTY_PROPOSAL);
    setAttempted(false);
    setErrors({});
    showToast('Идея сохранена в твоём браузере');
  };

  const err = (f) => (attempted ? errors[f] : undefined);
  const describedBy = (f, hintId) => [hintId, err(f) ? `${f}-error` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${styles.wrap} theme-dark`}>
      <div className={styles.intro}>
        <p className="t-label">Своя инициатива</p>
        <h3 className={styles.title}>Предложи идею</h3>
        <p className={styles.lead}>
          Опиши проект, который хочешь запустить. Форма помогает продумать главное: что, где и с кем.
        </p>
        <div className={styles.privacy}>
          <Lock size={18} aria-hidden="true" />
          <p>
            Заявка сохраняется <strong>только в этом браузере</strong> и никуда не отправляется. Мы не спрашиваем имя,
            фамилию, телефон, адрес и номер школы — и просим их не указывать.
          </p>
        </div>
      </div>

      <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
        <AnimatePresence>
          {status === 'success' && (
            <motion.p
              className={styles.success}
              role="status"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              Готово! Идея сохранена — она появилась в списке «Мои идеи» ниже. Обсуди её с учителем или куратором.
            </motion.p>
          )}
          {status === 'error' && (
            <motion.p
              className={styles.errorSummary}
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AlertCircle size={18} aria-hidden="true" />
              {errors.form ?? 'Проверь отмеченные поля — кое-что нужно поправить.'}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="field">
          <label htmlFor="proposal-title" className="field-label">
            Название инициативы
          </label>
          <input
            id="proposal-title"
            name="title"
            className="input"
            value={values.title}
            maxLength={LIMITS.title.max + 20}
            onChange={(e) => update('title', e.target.value)}
            aria-invalid={Boolean(err('title'))}
            aria-describedby={describedBy('title')}
            placeholder="Например: Неделя пеших маршрутов"
            autoComplete="off"
          />
          <FieldError id="title-error" message={err('title')} />
        </div>

        <div className={styles.row2}>
          <div className="field">
            <label htmlFor="proposal-category" className="field-label">
              Категория
            </label>
            <select
              id="proposal-category"
              name="category"
              className="select"
              value={values.category}
              onChange={(e) => update('category', e.target.value)}
              aria-invalid={Boolean(err('category'))}
              aria-describedby={describedBy('category')}
            >
              <option value="">Выбери категорию</option>
              {Object.entries(INITIATIVE_CATEGORIES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError id="category-error" message={err('category')} />
          </div>
          <div className="field">
            <label htmlFor="proposal-participants" className="field-label">
              Сколько участников нужно
            </label>
            <select
              id="proposal-participants"
              name="participants"
              className="select"
              value={values.participants}
              onChange={(e) => update('participants', e.target.value)}
              aria-invalid={Boolean(err('participants'))}
              aria-describedby={describedBy('participants')}
            >
              <option value="">Выбери</option>
              {PARTICIPANT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <FieldError id="participants-error" message={err('participants')} />
          </div>
        </div>

        <fieldset className={styles.fieldset} aria-describedby={describedBy('place', 'place-hint')}>
          <legend className="field-label">Где пройдёт</legend>
          <p id="place-hint" className="field-hint">
            Только тип места — без точного адреса.
          </p>
          <div className={styles.places}>
            {PLACE_OPTIONS.map((o) => (
              <label key={o.value} className={styles.place} data-on={values.place === o.value || undefined}>
                <input
                  type="radio"
                  name="place"
                  value={o.value}
                  checked={values.place === o.value}
                  onChange={() => update('place', o.value)}
                  className={styles.placeInput}
                />
                {o.label}
              </label>
            ))}
          </div>
          <FieldError id="place-error" message={err('place')} />
        </fieldset>

        <div className="field">
          <label htmlFor="proposal-description" className="field-label">
            Описание
          </label>
          <textarea
            id="proposal-description"
            name="description"
            className="textarea"
            rows={5}
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            aria-invalid={Boolean(err('description'))}
            aria-describedby={describedBy('description', 'description-hint')}
            placeholder="Что вы сделаете, зачем и какой реалистичный результат ожидаете?"
          />
          <p id="description-hint" className={`field-hint ${styles.counterRow}`}>
            <span>От {LIMITS.description.min} до {LIMITS.description.max} символов.</span>
            <span className={values.description.trim().length > LIMITS.description.max ? styles.over : undefined}>
              {values.description.trim().length}/{LIMITS.description.max}
            </span>
          </p>
          <FieldError id="description-error" message={err('description')} />
        </div>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            name="needsAdult"
            checked={values.needsAdult}
            onChange={(e) => update('needsAdult', e.target.checked)}
          />
          <span>Нужна помощь взрослых (учителя, родителей, махалли)</span>
        </label>

        <div className="field">
          <label htmlFor="proposal-alias" className="field-label">
            Как подписать идею <span className={styles.optional}>— необязательно</span>
          </label>
          <input
            id="proposal-alias"
            name="alias"
            className="input"
            value={values.alias}
            onChange={(e) => update('alias', e.target.value)}
            aria-invalid={Boolean(err('alias'))}
            aria-describedby={describedBy('alias', 'alias-hint')}
            placeholder="Ник или название команды"
            autoComplete="off"
          />
          <p id="alias-hint" className="field-hint">
            Не указывай фамилию, телефон, адрес и номер школы.
          </p>
          <FieldError id="alias-error" message={err('alias')} />
        </div>

        <div className="field">
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              name="consent"
              checked={values.consent}
              onChange={(e) => update('consent', e.target.checked)}
              aria-invalid={Boolean(err('consent'))}
              aria-describedby={describedBy('consent')}
            />
            <span>Я понимаю, что заявка сохранится только в этом браузере и никуда не отправляется.</span>
          </label>
          <FieldError id="consent-error" message={err('consent')} />
        </div>

        <div className={styles.actions}>
          <Button type="submit" icon={Send} iconPosition="start">
            Сохранить идею
          </Button>
        </div>
      </form>

      <div className={styles.savedWrap}>
        <SavedProposals />
      </div>
    </div>
  );
}
