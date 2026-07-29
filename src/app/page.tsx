import { Meta, Schema } from "@once-ui-system/core";
import { PhotoFinderDialog } from "@/components/home/PhotoFinderDialog";
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
    <main className={styles.page}>
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

      <section className={styles.content} aria-labelledby="home-heading">
        <h1 className={styles.heading} id="home-heading">
          Find Your Photos
        </h1>
        <PhotoFinderDialog />
      </section>
    </main>
  );
}
