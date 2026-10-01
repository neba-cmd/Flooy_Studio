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

const bundleExamples = [
  { photos: "4 photos", calculation: "€5 × 4", total: "€20" },
  { photos: "5 photos", calculation: "Bundle saving €6", total: "€19" },
  { photos: "6 photos", calculation: "€19 + €5", total: "€24" },
  { photos: "10 photos", calculation: "€19 + €19", total: "€38" },
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
        image="/images/homepage-event-main.jpg"
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

      <section className={styles.pricing} aria-labelledby="pricing-heading">
        <div className={styles.pricingHeader}>
          <p className={styles.eyebrow}>Simple event pricing</p>
          <h2 id="pricing-heading">Choose your favourites. Save when you choose five.</h2>
          <p>
            Each photo uses its displayed event price. Every complete group of five
            is capped at <strong>€19</strong>, but only when the bundle saves you money.
          </p>
        </div>

        <div className={styles.pricingGrid}>
          <article className={styles.bundleCard}>
            <div className={styles.priceLine}>
              <span>Five-photo bundle</span>
              <strong>€19</strong>
            </div>
            <p>
              The highest-priced photos are grouped first, so you receive the best
              available saving.
            </p>
            <ul>
              <li><strong>1–4 photos:</strong> pay the individual total</li>
              <li><strong>5 photos:</strong> pay the lower of the individual total or €19</li>
              <li><strong>6–9 photos:</strong> one bundle, plus the remaining photos</li>
              <li><strong>10 photos:</strong> up to two five-photo bundles</li>
            </ul>
            <div className={styles.lowPriceNote}>
              Five photos at €3 each still cost €15—not €19. A bundle never makes
              your order more expensive.
            </div>
          </article>

          <article className={styles.teamCard}>
            <p className={styles.cardLabel}>Team package</p>
            <div className={styles.teamPrice}>
              <strong>£75</strong>
              <span>20 team photos</span>
            </div>
            <p>
              A separate fixed-price package for teams, with 20 photos included.
            </p>
          </article>
        </div>

        <div className={styles.exampleBlock}>
          <h3>Example: photos priced at €5 each</h3>
          <div className={styles.exampleGrid}>
            {bundleExamples.map((example) => (
              <div key={example.photos} className={styles.example}>
                <span>{example.photos}</span>
                <small>{example.calculation}</small>
                <strong>{example.total}</strong>
              </div>
            ))}
          </div>
        </div>

        <p className={styles.securePricing}>
          Your total is recalculated securely at checkout using our stored prices,
          so the amount cannot be changed in the browser.
        </p>
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
