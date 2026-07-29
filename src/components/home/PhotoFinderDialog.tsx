"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "@/app/page.module.css";

export function PhotoFinderDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const closeFromHistory = () => {
      if (dialog.open) dialog.close();
    };

    const restorePageScroll = () => {
      document.documentElement.style.overflow = "";
    };

    window.addEventListener("popstate", closeFromHistory);
    dialog.addEventListener("close", restorePageScroll);

    return () => {
      window.removeEventListener("popstate", closeFromHistory);
      dialog.removeEventListener("close", restorePageScroll);
      restorePageScroll();
    };
  }, []);

  const openDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;

    window.history.pushState({ ...window.history.state, photoFinderOpen: true }, "");
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
  };

  const closeDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;

    if (window.history.state?.photoFinderOpen) {
      window.history.back();
    } else {
      dialog.close();
    }
  };

  return (
    <>
      <button className={styles.mainAction} type="button" onClick={openDialog}>
        <span>Find Your Photos</span>
        <small lang="am">ፎቶዎችዎን ያግኙ</small>
        <span className={styles.mainActionArrow} aria-hidden="true">→</span>
      </button>

      <dialog
        ref={dialogRef}
        className={styles.choiceDialog}
        aria-labelledby="photo-choice-heading"
        aria-describedby="photo-choice-amharic"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
      >
        <div className={styles.choicePanel}>
          <div className={styles.choiceHeader}>
            <div>
              <h2 id="photo-choice-heading">How would you like to find your photos?</h2>
              <p id="photo-choice-amharic" lang="am">
                ፎቶዎችዎን እንዴት ማግኘት ይፈልጋሉ?
              </p>
            </div>
            <button
              className={styles.closeButton}
              type="button"
              onClick={closeDialog}
              aria-label="Close photo choices"
            >
              ×
            </button>
          </div>

          <div className={styles.choices}>
            <Link
              className={`${styles.choiceCard} ${styles.codeChoice}`}
              href="https://www.flooystudio.com/event-photos"
            >
              <span className={styles.choiceCopy}>
                <strong>I Have a Code</strong>
                <b lang="am">ኮድ አለኝ</b>
                <span className={styles.choiceDescription}>
                  <span>Use the personal code you received to open your private gallery.</span>
                  <span lang="am">
                    የተሰጠዎትን ኮድ በመጠቀም የግል ፎቶዎችዎን ይመልከቱ።
                  </span>
                </span>
                <span className={styles.choiceAction}>
                  <span>Enter Your Code</span>
                  <span aria-hidden="true">→</span>
                </span>
              </span>
            </Link>

            <Link
              className={`${styles.choiceCard} ${styles.browseChoice}`}
              href="https://gallery.flooystudio.com"
            >
              <span className={styles.choiceCopy}>
                <strong>Browse All Photos</strong>
                <b lang="am">ሁሉንም ፎቶዎች ይመልከቱ</b>
                <span className={styles.choiceDescription}>
                  <span>Browse the full event gallery and select your photos.</span>
                  <span lang="am">
                    የዝግጅቱን ሙሉ ፎቶ ጋለሪ ይመልከቱ እና ፎቶዎችዎን ይምረጡ።
                  </span>
                </span>
                <span className={styles.choiceAction}>
                  <span>Browse Photos</span>
                  <span aria-hidden="true">→</span>
                </span>
              </span>
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
