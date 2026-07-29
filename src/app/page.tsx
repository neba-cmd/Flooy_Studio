import { Meta, Schema } from "@once-ui-system/core";
import { Noto_Sans_Ethiopic } from "next/font/google";
import Link from "next/link";
import { FootballHeroCarousel } from "@/components/home/FootballHeroCarousel";
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

const photoOptions = [
  {
    amharic: "የግል ፎቶዎች",
    english: "Private Gallery",
    descriptionAmharic: "የተሰጠዎትን ኮድ በመጠቀም ፎቶዎችዎን ይመልከቱ።",
    descriptionEnglish: "Use your personal code to access your photos.",
    href: "https://flooystudio.com/events-photo",
    variant: "primary",
  },
  {
    amharic: "ሁሉንም ፎቶዎች ይመልከቱ",
    english: "Browse All Photos",
    descriptionAmharic: "የዝግጅቱን ሙሉ ፎቶ ጋለሪ ይመልከቱ።",
    descriptionEnglish: "Browse the full event photo gallery.",
    href: "https://gallery.flooystudio.com",
    variant: "secondary",
  },
] as const;

const steps = [
  { amharic: "ፎቶዎችዎን ያግኙ", english: "Find your photos" },
  { amharic: "የሚወዷቸውን ይምረጡ", english: "Select the photos you like" },
  { amharic: "ክፍያ ከፈጸሙ በኋላ ያውርዱ", english: "Pay and download your photos" },
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
            <span lang="am">የእርስዎን ፎቶዎች ያግኙ</span>
            <small>Find Your Photos</small>
          </h1>
          <p className={styles.supportingText}>
            <span lang="am">በዝግጅቱ ላይ የተነሱትን ፎቶዎችዎን በቀላሉ ያግኙ።</span>
            <span>Quickly find your photos from the event.</span>
          </p>

          <div className={styles.options} aria-label="Photo gallery options">
            {photoOptions.map((option) => (
              <Link
                key={option.href}
                className={`${styles.optionCard} ${
                  option.variant === "primary" ? styles.optionPrimary : styles.optionSecondary
                }`}
                href={option.href}
              >
                <span className={styles.optionCopy}>
                  <strong lang="am">{option.amharic}</strong>
                  <b>{option.english}</b>
                  <span className={styles.optionDescription}>
                    <span lang="am">{option.descriptionAmharic}</span>
                    <span>{option.descriptionEnglish}</span>
                  </span>
                </span>
                <span className={styles.optionArrow} aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.stepsSection} aria-labelledby="steps-heading">
        <div className={styles.sectionHeading}>
          <p lang="am">ቀላል እና ፈጣን</p>
          <h2 id="steps-heading">Three simple steps</h2>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.english}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <div>
                <strong lang="am">{step.amharic}</strong>
                <span>{step.english}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.help} aria-labelledby="help-heading">
        <span className={styles.helpIcon} aria-hidden="true">?</span>
        <div>
          <h2 id="help-heading">
            <span lang="am">ፎቶዎን ማግኘት አልቻሉም?</span>
            <small>Can&apos;t find your photo?</small>
          </h2>
          <p>
            <span lang="am">ወደ ፎቶ ካውንተሩ ይምጡ። ቡድናችን ይረዳዎታል።</span>
            <span>Visit the photo counter and our team will help you.</span>
          </p>
        </div>
      </section>
    </main>
  );
}
