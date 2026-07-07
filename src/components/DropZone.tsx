"use client";

import { useCallback, useRef, useState } from "react";
import styles from "./DropZone.module.css";

export function DropZone({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length) onFiles(files);
    },
    [onFiles, disabled]
  );

  const classes = [styles.zone, isOver ? styles.zoneOver : "", disabled ? styles.disabled : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={classes}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.hiddenInput}
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      <p className={styles.title}>Drop photos here, or tap to select</p>
      <p className={styles.subtitle}>
        Saved to this device instantly — uploads happen automatically
      </p>
    </div>
  );
}
