"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "@/app/page.module.css";

const footballPhotos = [
  "/images/gallery/itally football/previews/DSC00509.jpg",
  "/images/gallery/itally football/previews/DSC00519.jpg",
  "/images/gallery/itally football/previews/DSC00866.jpg",
  "/images/gallery/itally football/previews/DSC01154.jpg",
  "/images/gallery/itally football/previews/DSC01280.jpg",
  "/images/gallery/itally football/previews/DSC01332.jpg",
];

export function FootballHeroCarousel() {
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      return;
    }

    const interval = window.setInterval(() => {
      setActivePhoto((current) => (current + 1) % footballPhotos.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className={styles.carousel} aria-hidden="true">
      <Image
        key={footballPhotos[activePhoto]}
        className={styles.carouselImage}
        src={footballPhotos[activePhoto]}
        alt=""
        fill
        priority={activePhoto === 0}
        quality={78}
        sizes="100vw"
      />
    </div>
  );
}
