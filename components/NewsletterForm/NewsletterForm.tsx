'use client'

import { useId, useState } from 'react'
import type { Locale } from '@/lib/rubriques'
import styles from './NewsletterForm.module.css'

/**
 * Free newsletter sign-up — the only "subscription" this site will ever have
 * (règle d'or #1: no payment, no paywall).
 *
 * A CLIENT ISLAND on purpose: the pages that embed it stay fully static
 * (règle d'or #4). The Brevo call lands in Lot 6, behind a server action.
 *
 * Until then the form does NOT pretend to have worked: submitting reports, in
 * plain words, that the address was not stored. A fake success message on a
 * newsletter form is the kind of thing that survives to production.
 */
export function NewsletterForm({ locale, compact }: { locale: Locale; compact?: boolean }) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const fr = locale === 'fr'

  return (
    <form
      className={`${styles.form} ${compact ? styles.compact : ''}`}
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
      }}
      noValidate
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor={id}>
          {fr ? 'Adresse e-mail' : 'البريد الإلكتروني'}
        </label>
        <input
          id={id}
          className={styles.input}
          type="email"
          name="email"
          autoComplete="email"
          required
          dir="ltr"
          placeholder="prenom.nom@exemple.ma"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setSubmitted(false)
          }}
        />
      </div>

      <button className={styles.submit} type="submit">
        {fr ? 'Je m’abonne' : 'اشتراك'}
      </button>

      <p className={styles.consent}>
        {fr
          ? 'Gratuit, sans engagement. Désabonnement en un clic depuis chaque envoi.'
          : 'مجاني وبلا التزام. إلغاء الاشتراك بنقرة واحدة من كل رسالة.'}
      </p>

      {submitted ? (
        <p className={styles.notice} role="status">
          {fr
            ? 'Maquette : le formulaire n’est pas encore relié au service d’envoi. Votre adresse n’a pas été enregistrée.'
            : 'نموذج أولي: الاستمارة غير مرتبطة بعد بخدمة الإرسال، ولم يتم تسجيل عنوانكم.'}
        </p>
      ) : null}
    </form>
  )
}
