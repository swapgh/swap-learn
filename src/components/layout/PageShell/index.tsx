import { type ReactNode } from "react";
import styles from "./styles.module.css";

export function PageShell({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
