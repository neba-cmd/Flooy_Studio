import { Meta, Schema } from "@once-ui-system/core";
import { Noto_Sans_Ethiopic } from "next/font/google";
import { FootballHeroCarousel } from "@/components/home/FootballHeroCarousel";
import { PhotoFinderDialog } from "@/components/home/PhotoFinderDialog";
import { about, baseURL, home, person } from "@/resources";
import styles from "./page.module.css";

const ethiopicFont = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export async function generateMetadata() {
  return Meta.generate({
    title: home.title,
    description: home.description,
    baseURL,
    path: home.path,
    image: home.image,
  });
}

const steps = [
  { english: "Find your photos", amharic: "ፎቶዎችዎን ያግኙ" },
  { english: "Select the photos you like", amharic: "የሚወዷቸውን ይምረጡ" },
  {
    english: "Pay and download your photos",
    amharic: "ክፍያ ከፈጸሙ በኋላ ፎቶዎችዎን ያውርዱ",
  },
] as const;

export default function Home() {
  return (
    <main className={`${styles.page} ${ethiopicFont.className}`}>
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

      <section className={styles.hero} aria-labelledby="home-heading">
        <FootballHeroCarousel />
        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <p className={styles.brand}>FLOOY STUDIO</p>
          <h1 id="home-heading">
            <span>Find Your Photos</span>
            <small lang="am">የእርስዎን ፎቶዎች ያግኙ</small>
          </h1>
          <p className={styles.supportingText}>
            <span>Quickly find your photos from the event.</span>
            <span lang="am">በዝግጅቱ ላይ የተነሱትን ፎቶዎችዎን በቀላሉ ያግኙ።</span>
          </p>

          <PhotoFinderDialog />
        </div>
      </section>

      <section className={styles.stepsSection} aria-labelledby="steps-heading">
        <div className={styles.sectionHeading}>
          <h2 id="steps-heading">Three simple steps</h2>
          <p lang="am">ቀላል እና ፈጣን</p>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.english}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <div>
                <strong>{step.english}</strong>
                <span lang="am">{step.amharic}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.help} aria-labelledby="help-heading">
        <span className={styles.helpIcon} aria-hidden="true">?</span>
        <div>
          <h2 id="help-heading">
            <span>Can&apos;t find your photo?</span>
            <small lang="am">ፎቶዎን ማግኘት አልቻሉም?</small>
          </h2>
          <p>
            <span>Visit the photo counter and our team will help you.</span>
            <span lang="am">ወደ ፎቶ ካውንተሩ ይምጡ። ቡድናችን ይረዳዎታል።</span>
          </p>
        </div>
      </section>
    </main>
  );
}
