"use client";

import { useCallback, useRef, useState } from "react";
import { validatePhotoFile } from "@/lib/photo-delivery/validation";
import styles from "./DropZone.module.css";

export function DropZone({
  onFiles,
  onRejected,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  onRejected?: (messages: string[]) => void;
  disabled?: boolean;
}) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (selected: File[]) => {
      const valid: File[] = [];
      const messages: string[] = [];
      for (const file of selected) {
        const message = validatePhotoFile(file);
        if (message) messages.push(message);
        else valid.push(file);
      }
      if (messages.length) onRejected?.(messages);
      if (valid.length) onFiles(valid);
    },
    [onFiles, onRejected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      if (disabled) return;
      processFiles(Array.from(e.dataTransfer.files));
    },
    [processFiles, disabled]
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
        accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className={styles.hiddenInput}
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) processFiles(files);
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
