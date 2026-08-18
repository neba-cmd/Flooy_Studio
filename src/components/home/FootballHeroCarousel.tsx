"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "@/app/page.module.css";

const footballPhotos = [
  "/images/gallery/itally football/DSC00509-watermarked.jpg",
  "/images/gallery/itally football/DSC00519-watermarked.jpg",
  "/images/gallery/itally football/DSC00866-watermarked.jpg",
  "/images/gallery/itally football/DSC01154-watermarked.jpg",
  "/images/gallery/itally football/DSC01280-watermarked.jpg",
  "/images/gallery/itally football/DSC01332-watermarked.jpg",
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
