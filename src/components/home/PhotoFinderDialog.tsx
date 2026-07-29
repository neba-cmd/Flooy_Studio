import Link from "next/link";
import styles from "@/app/page.module.css";

const photoOptions = [
  {
    title: "Enter Your Code",
    description: "Enter the private code provided by your photographer or team leader.",
    action: "Enter Code",
    href: "https://www.flooystudio.com/event-photos",
  },
  {
    title: "Browse All Photos",
    description: "Browse all event photos and find yourself manually.",
    action: "Browse Photos",
    href: "https://gallery.flooystudio.com",
  },
] as const;

export function PhotoFinderDialog() {
  return (
    <div className={styles.choices}>
      {photoOptions.map((option) => (
        <Link className={styles.choiceCard} href={option.href} key={option.title}>
          <h2>{option.title}</h2>
          <p>{option.description}</p>
          <span className={styles.choiceAction}>{option.action}</span>
        </Link>
      ))}
    </div>
  );
}
