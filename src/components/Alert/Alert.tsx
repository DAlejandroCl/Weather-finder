import type { ReactNode } from "react"
import styles from "./Alert.module.css"

// role="alert" makes screen readers announce the message when it appears.
export default function Alert({children}: {children: ReactNode}) {
  return (
      <div className={styles.alert} role="alert">{children}</div>
  )
}
