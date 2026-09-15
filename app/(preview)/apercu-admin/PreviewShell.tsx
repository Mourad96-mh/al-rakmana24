'use client'

import { useState } from 'react'

import {
  DashboardView,
  type DashboardCounts,
  type DraftItem,
  type Lang,
  type TranslationGap,
} from '@/components/admin/Dashboard/DashboardView'
import styles from './PreviewShell.module.css'

/**
 * The harness around the dashboard preview: language, theme and data-state
 * switches. None of this ships to the admin — `DashboardView` is the only part
 * that does, and it is rendered here exactly as `Welcome` renders it.
 *
 * The three data states are the ones that actually occur and that the layout
 * has to survive: a working newsroom, a fresh install, and a database that
 * answered with an error (counts come back `null`, the stats show em dashes).
 */

type DataState = 'sample' | 'empty' | 'failed'

const COUNTS: Record<DataState, DashboardCounts> = {
  /** A plausible mid-week state a few months after launch. */
  sample: {
    publishedArticles: 248,
    draftArticles: 6,
    videos: 19,
    documents: 34,
    textes: 57,
    activeAds: 2,
  },
  /** Day one: collections exist, nothing in them. Also the seed-less state. */
  empty: {
    publishedArticles: 0,
    draftArticles: 0,
    videos: 0,
    documents: 0,
    textes: 0,
    activeAds: 0,
  },
  /** Every count threw. The dashboard must still render, not blank the admin. */
  failed: {
    publishedArticles: null,
    draftArticles: null,
    videos: null,
    documents: null,
    textes: null,
    activeAds: null,
  },
}

/**
 * Sample worklists. The titles are deliberately LONG and mixed FR/AR: the
 * ellipsis rule and the RTL row order are the two things most likely to break,
 * and a preview full of short Latin titles would never show it.
 */
const GAPS: Record<DataState, { items: TranslationGap[]; total: number } | undefined> = {
  sample: {
    items: [
      { id: '1', title: 'Plateformes numériques : ce que changerait un cadre juridique dédié', missing: 'ar' },
      { id: '2', title: 'تطبيقات مغربية تتجاوز الحدود: قراءة في موجة التوسع الإقليمي', missing: 'fr' },
      { id: '3', title: 'Données personnelles : où en sont vraiment les entreprises marocaines', missing: 'ar' },
      { id: '4', title: 'Legaltech : un marché marocain encore en formation', missing: 'ar' },
      { id: '5', title: 'Soutien à l’innovation : mode d’emploi des dispositifs publics', missing: 'ar' },
    ],
    total: 11,
  },
  empty: { items: [], total: 0 },
  /** The check threw — must read as "unknown", never as "all translated". */
  failed: undefined,
}

const DRAFTS: Record<DataState, DraftItem[] | undefined> = {
  sample: [
    { id: '6', title: 'Fintech : la bataille du paiement mobile s’accélère', updated: '12 sept.' },
    { id: '7', title: 'الذكاء الاصطناعي في المحاكم المغربية', updated: '11 sept.' },
    { id: '8', title: 'Levées de fonds : le bilan du troisième trimestre', updated: '9 sept.' },
  ],
  empty: [],
  failed: undefined,
}

const LANGS: { value: Lang; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية (RTL)' },
]

const THEMES: { value: 'light' | 'dark'; label: string }[] = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
]

const STATES: { value: DataState; label: string }[] = [
  { value: 'sample', label: 'Exemple' },
  { value: 'empty', label: 'Vide' },
  { value: 'failed', label: 'Erreur' },
]

/**
 * Whose drafts the screen is describing.
 *
 * A `contributeur` gets their own pipeline and different wording for it (« Mes
 * brouillons », l'alerte qui parle de relecture). It is a whole set of strings
 * that nobody would otherwise see until an outside contributor logged in — so
 * it gets a switch, like every other state worth reviewing here.
 */
type Viewer = 'newsroom' | 'own'

const VIEWERS: { value: Viewer; label: string }[] = [
  { value: 'newsroom', label: 'Rédaction' },
  { value: 'own', label: 'Contributeur' },
]

export function PreviewShell() {
  const [lang, setLang] = useState<Lang>('fr')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [data, setData] = useState<DataState>('sample')
  const [viewer, setViewer] = useState<Viewer>('newsroom')

  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <div className={styles.title}>
          <strong>Aperçu du tableau de bord</strong>
          <span className={styles.subtitle}>
            hors base de données — /admin reste inaccessible tant que DATABASE_URI est vide
          </span>
        </div>

        <div className={styles.controls}>
          <Group label="Langue" options={LANGS} value={lang} onChange={setLang} />
          <Group label="Thème" options={THEMES} value={theme} onChange={setTheme} />
          <Group label="Données" options={STATES} value={data} onChange={setData} />
          <Group label="Vue" options={VIEWERS} value={viewer} onChange={setViewer} />
        </div>
      </header>

      <main className={styles.stage} data-preview-theme={theme}>
        <div className={styles.canvas}>
          {/*
            Payload renders `beforeDashboard` here, above its own collection
            list. The block below is a stand-in for that list so the spacing
            underneath the dashboard is judged in context — it is NOT the real
            component.
          */}
          <DashboardView
            lang={lang}
            name="Mourad"
            adminRoute="/admin"
            counts={COUNTS[data]}
            gaps={GAPS[data]}
            drafts={DRAFTS[data]}
            ownDraftsOnly={viewer === 'own'}
          />

          <p className={styles.stub}>
            Liste des collections de Payload (Contenu, Entités, Rédaction, Régie,
            Audience, Administration) — rendue par l’admin, pas par cet aperçu.
          </p>
        </div>
      </main>
    </div>
  )
}

function Group<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (next: T) => void
}) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.segments}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.segment}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
