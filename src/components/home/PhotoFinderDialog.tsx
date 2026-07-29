import Link from "next/link";
import styles from "@/app/page.module.css";

export function PhotoFinderDialog() {
  return (
    <Link className={styles.mainAction} href="/gallery">
      <span>Get Your Pictures</span>
      <small lang="am">ፎቶዎችዎን ያግኙ</small>
      <span className={styles.mainActionArrow} aria-hidden="true">→</span>
    </Link>
  );
}
