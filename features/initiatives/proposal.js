// Validation for the "propose an initiative" form. Pure — unit tested.
// The audience includes minors, so the form deliberately avoids personal data
// and rejects phone numbers and e-mail addresses in free text.

export const PLACE_OPTIONS = [
  { value: 'school', label: 'Школа' },
  { value: 'neighbourhood', label: 'Двор или махалля' },
  { value: 'online', label: 'Онлайн' },
  { value: 'other', label: 'Другое' },
];

export const PARTICIPANT_OPTIONS = [
  { value: '1-3', label: '1–3 человека' },
  { value: '4-8', label: '4–8 человек' },
  { value: '9-15', label: '9–15 человек' },
  { value: '15+', label: 'больше 15 человек' },
];

export const LIMITS = {
  title: { min: 3, max: 80 },
  description: { min: 30, max: 800 },
  alias: { max: 30 },
};

export const EMPTY_PROPOSAL = {
  title: '',
  category: '',
  place: '',
  description: '',
  participants: '',
  needsAdult: true,
  alias: '',
  consent: false,
};

const PHONE_RE = /\+?\d[\d\s\-()]{7,}\d/;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;

export function containsContact(text) {
  return PHONE_RE.test(text) || EMAIL_RE.test(text);
}

const CONTACT_MESSAGE = 'Пожалуйста, без телефонов и e-mail: личные контакты здесь не нужны.';

/** Returns an object { field: message } — empty when the form is valid. */
export function validateProposal(values, categories) {
  const errors = {};
  const title = values.title.trim();
  const description = values.description.trim();
  const alias = values.alias.trim();

  if (title.length < LIMITS.title.min || title.length > LIMITS.title.max) {
    errors.title = `Назови инициативу: от ${LIMITS.title.min} до ${LIMITS.title.max} символов.`;
  } else if (containsContact(title)) {
    errors.title = CONTACT_MESSAGE;
  }

  if (!values.category || !(values.category in categories)) errors.category = 'Выбери категорию.';
  if (!PLACE_OPTIONS.some((o) => o.value === values.place)) errors.place = 'Выбери, где пройдёт инициатива.';

  if (description.length < LIMITS.description.min) {
    errors.description = `Опиши идею подробнее: минимум ${LIMITS.description.min} символов (сейчас ${description.length}).`;
  } else if (description.length > LIMITS.description.max) {
    errors.description = `Слишком длинно: максимум ${LIMITS.description.max} символов.`;
  } else if (containsContact(description)) {
    errors.description = CONTACT_MESSAGE;
  }

  if (!PARTICIPANT_OPTIONS.some((o) => o.value === values.participants)) {
    errors.participants = 'Укажи, сколько участников нужно.';
  }

  if (alias.length > LIMITS.alias.max) {
    errors.alias = `Не больше ${LIMITS.alias.max} символов.`;
  } else if (containsContact(alias)) {
    errors.alias = CONTACT_MESSAGE;
  }

  if (!values.consent) errors.consent = 'Подтверди, что понимаешь, как хранится заявка.';
  return errors;
}

export function toStoredProposal(values) {
  return {
    title: values.title.trim(),
    category: values.category,
    place: values.place,
    description: values.description.trim(),
    participants: values.participants,
    needsAdult: Boolean(values.needsAdult),
    alias: values.alias.trim(),
  };
}
