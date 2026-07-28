import { Column, Meta, Schema } from "@once-ui-system/core";
import Image from "next/image";
import Link from "next/link";
import { about, baseURL, home, person } from "@/resources";
import styles from "./page.module.css";

export async function generateMetadata() {
  return Meta.generate({
    title: home.title,
    description: home.description,
    baseURL,
    path: home.path,
    image: home.image,
  });
}

export default function Home() {
  return (
    <>
      <Column className={styles.home} maxWidth="m" horizontal="center">
        <Schema
          as="webPage"
          baseURL={baseURL}
          path={home.path}
          title={home.title}
          description={home.description}
          image={`/api/og/generate?title=${encodeURIComponent(home.title)}`}
          author={{
            name: person.name,
            url: `${baseURL}${about.path}`,
            image: `${baseURL}${person.avatar}`,
          }}
        />

        <section className={styles.hero}>
          <p className={styles.eyebrow}>Flooy Studio event photos</p>
          <h1 className={styles.title}>Your pictures are ready.</h1>
          <p className={styles.intro}>Use your event code to view and download your photos.</p>
          <Link href="https://gallery.flooystudio.com" className={styles.primaryCta}>
            <span>
              <small>Enter your access code</small>
              <strong>Get your pictures</strong>
            </span>
            <span className={styles.primaryArrow} aria-hidden="true">→</span>
          </Link>
        </section>

        <section className={styles.eventPhotos} aria-labelledby="event-photos-heading">
          <div className={styles.eventPhotosBackdrop} aria-hidden="true">
            <div className={styles.eventPhotoMain}>
              <Image
                src="/images/gallery/DSC05937.JPG"
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 760px"
              />
            </div>
            <div className={styles.eventPhotoInset}>
              <Image
                src="/images/gallery/DSC01660.jpg"
                alt=""
                fill
                sizes="(max-width: 640px) 40vw, 260px"
              />
            </div>
          </div>

          <div className={styles.eventPhotosContent}>
            <p className={styles.eventPhotosLabel}>Event photos</p>
            <h2 id="event-photos-heading">Get Your Pictures</h2>
            <p className={styles.eventPhotosText}>
              Find and download your photos from the latest Flooy Studio events.
            </p>
            <Link href="https://gallery.flooystudio.com" className={styles.eventPhotosButton}>
              <span>View Your Photos</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className={styles.videoSection} aria-labelledby="showreel-heading">
          <div className={styles.videoHeading}>
            <p>Our work</p>
            <h2 id="showreel-heading">Watch the showreel</h2>
          </div>
          <div className={styles.videoFrame}>
            <iframe
              src="https://www.youtube-nocookie.com/embed/I5PrisDzEJQ?rel=0"
              title="Flooy Studio showreel"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>

        <nav className={styles.simpleLinks} aria-label="More from Flooy Studio">
          <Link href="/work">View all work</Link>
          <Link href="/about">About the studio</Link>
        </nav>
      </Column>

      <div className={styles.mobileCtaBar}>
        <Link href="https://gallery.flooystudio.com" className={styles.mobilePhotoCta}>
          <span>
            <small>Have an event code?</small>
            <strong>Get your pictures</strong>
          </span>
          <span className={styles.arrow} aria-hidden="true">→</span>
        </Link>
      </div>
    </>
  );
}
