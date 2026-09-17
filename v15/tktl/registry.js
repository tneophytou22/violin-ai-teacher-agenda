import { createTeacherUnitCard } from './teacher-unit-card.js';

const cards = new Map();

export function registerTeacherUnitCard(input) {
  const card = createTeacherUnitCard(input);
  if (cards.has(card.id)) throw new Error(`Teacher Unit Card already registered: ${card.id}`);
  cards.set(card.id, card);
  return card;
}

export function getTeacherUnitCard(level, term) {
  return cards.get(`L${level}T${term}`) ?? null;
}

export function listTeacherUnitCards() {
  return [...cards.values()];
}

export function requireTeacherUnitCard(level, term) {
  const card = getTeacherUnitCard(level, term);
  if (!card) throw new Error(`Teacher Unit Card not registered: L${level}T${term}`);
  return card;
}