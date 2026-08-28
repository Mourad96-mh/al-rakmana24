import type { Field, Validate } from 'payload'

// RELATIVE imports — payload.config.ts graph (règle d'or #5).
import {
  RUBRIQUES,
  RUBRIQUE_OPTIONS,
  SOUS_RUBRIQUE_OPTIONS,
  findRubrique,
} from '../lib/rubriques'

/**
 * Rubrique / sous-rubrique.
 *
 * NOT localized: the rubrique is a stable taxonomy key shared by both language
 * versions of a document. Its FR and AR labels and its FR and AR URL slugs live
 * in `lib/rubriques.ts`, the single source of truth for the taxonomy — the
 * database only ever stores `economie`, `actus-juridique`, …
 *
 * Payload's `select` has no built-in way to narrow one dropdown from another's
 * value, so `sousRubrique` lists every sous-rubrique across all rubriques and a
 * server-side `validate` rejects a mismatched pair. That is the important half:
 * a UI filter can be bypassed by the REST API, this cannot.
 */

const validateSousRubrique: Validate<string | null | undefined> = (value, { data }) => {
  if (!value) return true

  const rubriqueValue = (data as { rubrique?: string } | undefined)?.rubrique
  if (!rubriqueValue) {
    return 'Choisissez d’abord une rubrique.'
  }

  const rubrique = findRubrique(rubriqueValue)
  if (!rubrique) {
    return `Rubrique inconnue : ${rubriqueValue}.`
  }

  if (!rubrique.sousRubriques.some((s) => s.value === value)) {
    const allowed = rubrique.sousRubriques.map((s) => s.label.fr)
    return allowed.length === 0
      ? `La rubrique « ${rubrique.label.fr} » n’a pas de sous-rubrique.`
      : `Sous-rubrique invalide pour « ${rubrique.label.fr} ». Attendu : ${allowed.join(' · ')}.`
  }

  return true
}

export const rubriqueField = ({ required = true }: { required?: boolean } = {}): Field => ({
  name: 'rubrique',
  type: 'select',
  required,
  index: true,
  options: RUBRIQUE_OPTIONS,
  label: { fr: 'Rubrique', ar: 'الركن' },
  admin: {
    position: 'sidebar',
    description: {
      fr: 'Commune aux deux langues. Les rubriques viennent du cahier des charges : ne pas en inventer.',
      ar: 'مشترك بين اللغتين. الأركان محددة في دفتر التحملات: لا تضف غيرها.',
    },
  },
})

export const sousRubriqueField = (): Field => ({
  name: 'sousRubrique',
  type: 'select',
  index: true,
  options: SOUS_RUBRIQUE_OPTIONS,
  validate: validateSousRubrique,
  label: { fr: 'Sous-rubrique', ar: 'الركن الفرعي' },
  admin: {
    position: 'sidebar',
    description: {
      fr: 'Facultatif. Doit appartenir à la rubrique choisie — sinon l’enregistrement est refusé.',
      ar: 'اختياري. يجب أن ينتمي إلى الركن المختار وإلا رفض الحفظ.',
    },
  },
})

/** Rubriques that actually have sous-rubriques — used by the seed and by tests. */
export const RUBRIQUES_WITH_CHILDREN = RUBRIQUES.filter((r) => r.sousRubriques.length > 0)
