import styles from './Graphics.module.css'

/**
 * The lockup on the admin login screen. The mark is red-and-green on a
 * transparent ground, so it needs the white disc behind it — on the admin's
 * dark theme half of it would otherwise disappear, exactly as on the site's red
 * masthead bar.
 */
export function Logo() {
  return (
    <div className={styles.logo}>
      <span className={styles.disc}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Payload renders
            this outside the app router's image pipeline. */}
        <img src="/logo-mark.png" alt="" width={64} height={56} className={styles.mark} />
      </span>
      <span className={styles.words}>
        <span className={styles.name}>Al-Raqmana24</span>
        <span className={styles.tagline}>Entreprendre, Innover, Digitaliser.</span>
      </span>
    </div>
  )
}
