import styles from './Graphics.module.css'

/** The small mark in the admin's top-left corner, next to the nav. */
export function Icon() {
  return (
    <span className={styles.iconDisc}>
      {/* eslint-disable-next-line @next/next/no-img-element -- see Logo.tsx */}
      <img src="/logo-mark.png" alt="Al-Raqmana24" width={26} height={23} className={styles.mark} />
    </span>
  )
}
