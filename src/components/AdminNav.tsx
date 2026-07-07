"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./AdminNav.module.css";

export function AdminNav({
  displayName,
  active,
}: {
  displayName: string;
  active: "upload" | "dashboard";
}) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <div className={styles.nav}>
      <div className={styles.links}>
        <Link href="/admin" className={active === "upload" ? styles.linkActive : styles.linkInactive}>
          Upload
        </Link>
        <Link
          href="/admin/dashboard"
          className={active === "dashboard" ? styles.linkActive : styles.linkInactive}
        >
          Dashboard
        </Link>
      </div>
      <div className={styles.right}>
        <span>{displayName}</span>
        <button onClick={logout} className={styles.signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
