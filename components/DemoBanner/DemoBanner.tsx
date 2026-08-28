import type { Locale } from '@/lib/rubriques'
import styles from './DemoBanner.module.css'

/**
 * Visible, non-dismissable notice that the articles on screen are invented
 * placeholders, not journalism.
 *
 * This ships with the demo content and is deleted in Lot 3 together with
 * `lib/demo-content.ts`. It must NOT be removed while fake headlines are still
 * rendering — a news site showing fabricated stories without a marker is the one
 * failure mode this project cannot afford.
 */
export function DemoBanner({ locale }: { locale: Locale }) {
  return (
    <aside className={styles.banner} role="note">
      <div className={`container ${styles.inner}`}>
        <span className={styles.tag}>{locale === 'fr' ? 'Démo' : 'عرض تجريبي'}</span>
        <p className={styles.text}>
          {locale === 'fr'
            ? 'Maquette. Les titres et les images ci-dessous sont fictifs et servent uniquement à valider le design — ils seront remplacés depuis le tableau de bord.'
            : 'نموذج أولي. العناوين والصور أدناه وهمية وتستعمل فقط للتحقق من التصميم، وسيتم تعويضها من لوحة التحكم.'}
        </p>
      </div>
    </aside>
  )
}
