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
        <span>Get Your Photos</span>
        <small lang="am">ፎቶዎችዎን ያግኙ</small>
        <span className={styles.mainActionArrow} aria-hidden="true">→</span>
      </button>

      <dialog
        ref={dialogRef}
        className={styles.choiceDialog}
        aria-labelledby="photo-choice-heading"
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
              className={styles.choiceCard}
              href="/event-photos"
            >
              <span className={styles.choiceCopy}>
                <strong>Enter Your Code</strong>
                <span className={styles.choiceDescription}>
                  <span>Enter the private code you received to access your photos.</span>
                </span>
                <span className={styles.choiceAction}>
                  <span>Enter Code</span>
                </span>
              </span>
            </Link>

            <Link
              className={styles.choiceCard}
              href="https://gallery.flooystudio.com"
            >
              <span className={styles.choiceCopy}>
                <strong>View Gallery</strong>
                <span className={styles.choiceDescription}>
                  <span>Browse all available event photos.</span>
                </span>
                <span className={styles.choiceAction}>
                  <span>View Gallery</span>
                </span>
              </span>
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
