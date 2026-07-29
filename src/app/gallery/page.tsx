import { Flex, Meta, Schema } from "@once-ui-system/core";
import Link from "next/link";
import GalleryView from "@/components/gallery/GalleryView";
import { baseURL, gallery, person } from "@/resources";
import styles from "./page.module.css";

export async function generateMetadata() {
  return Meta.generate({
    title: gallery.title,
    description: gallery.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(gallery.title)}`,
    path: gallery.path,
  });
}

export default function Gallery() {
  return (
    <Flex maxWidth="l" direction="column">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={gallery.title}
        description={gallery.description}
        path={gallery.path}
        image={`/api/og/generate?title=${encodeURIComponent(gallery.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${gallery.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <GalleryView />
      <section className={styles.codeCta} aria-labelledby="private-gallery-heading">
        <p className={styles.eyebrow}>Private gallery</p>
        <h2 id="private-gallery-heading">Have an access code?</h2>
        <p>Use the code you received at the event to open and download your pictures.</p>
        <Link className={styles.codeButton} href="/event-photos">
          Enter your code
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </Flex>
  );
}
