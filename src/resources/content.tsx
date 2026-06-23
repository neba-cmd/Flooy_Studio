import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import { Line, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "Flooy",
  lastName: "Studio",
  name: "Flooy Studio",
  role: "Creative Production & Digital Agency",
  avatar: "/images/FlooyLogo.png", // This could be your studio logo
  email: "flooystudio@gmail.com",
  location: "Europe/London",
  ``
};

const newsletter: Newsletter = {
  display: true,
  title: <>Subscribe to the Flooy Studio Newsletter</>,
  description: <>Inside looks at film production, social media growth strategies, and our latest creative projects.</>,
};

const social: Social = [
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/in/nebiyu-tsegay-018a36245/", // Kept your LinkedIn as founder[cite: 1]
    essential: false,
  },
  {
    name: "Instagram",
    icon: "instagram",
    link: "https://www.instagram.com/neba.stray",
    essential: true,
  },
  {
    name: "Email",
    icon: "email",
    link: "mailto:flooystudio@gmail.com",
    essential: true,
  },
];

const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Home",
  title: `Flooy Studio | London Video Production & Digital Marketing`,
  description: `We are Flooy Studio, a premier creative production agency specializing in high-impact videography, photography, and social growth.`,
  headline: <>Telling stories through film, one frame at a time</>,
  featured: {
    display: true,
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">Flooy Studio</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Featured Showcases
        </Text>
      </Row>
    ),
    href: "/work",
  },
  subline: (
    <>
      We are <Text as="span" size="xl" weight="strong">Flooy Studio</Text>, a London-based production agency. 
      We deliver premium commercial videography, broadcast event coverage, and high-growth digital content strategy 
      engineered to scale brands and capture unforgettable narratives.
    </>
  ),
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – Flooy Studio`,
  description: `Discover the production capabilities, mission, and leadership of Flooy Studio.`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: false,
    link: "",
  },
  intro: {
    display: true,
    title: "Agency Overview",
    description: (
      <>
        Flooy Studio is an independent, full-service media production agency operating out of London. 
        Specializing in cinematic event coverage, documentary filmmaking, commercial video production, and end-to-end 
        social media strategy, we build immersive visual experiences that connect deeply with global audiences.
        <br /><br />
        Founded by Videographer Nebiyu Tsegay and Photographer Danel Belay, the studio uniquely merges top-tier creative direction with modern 
        technical architecture leveraging automation and digital systems to keep production pipelines smooth, efficient, 
        and client focused.
      </>
    ),
  },
  work: {
    display: true,
    title: "Client History & Partnerships",
    experiences: [
      {
        company: "Commercial & Event Production",
        timeframe: "2022 - Present",
        role: "Flooy Studio Core Services",
        achievements: [
          <>
            Acted as the official London media partner for international broadcast entities like Habesha View and 
            collaborated on high-profile documentary assets for major networks like DonkyTube.
          </>,
          <>
            Produced end-to-end multi-camera coverage for over 10 high-stakes weddings, private celebrations, 
            and corporate events across the UK.
          </>,
        ],
        images: [],
      },
      {
        company: "Crafty Fox Market",
        timeframe: "2024 - Present",
        role: "Social Media Growth & Content Engine",
        achievements: [
          <>
            Designed and executed a monthly short-form video framework that successfully scaled the client&apos;s 
            digital audience from 25K to over 65K followers, driving millions of organic impressions.
          </>,
        ],
        images: [],
      },
      {
        company: "Community & Charity Media Commissions",
        timeframe: "2024 - Present",
        role: "Visual Strategy Partners",
        achievements: [
          <>
            Delivered visual content strategy, short films, and digital magazines for organizations including 
            DreamArts Charity and the Greater London Authority to optimize their community presence.
          </>,
        ],
        images: [],
      },
    ],
  },
  studies: {
    display: false,
    title: "Technical Foundation",
    institutions: [
      {
        name: "King's College London Integration",
        description: <>Our operational strategies are backed by software engineering foundations (BSc Computer Science focus), allowing us to offer bespoke digital management for commercial clients.</>,
      },
    ],
  },
  technical: {
    display: true,
    title: "Studio Capabilities",
    skills: [
      {
        title: "Cinematography & Post-Production",
        description: (
          <>Full scale creative direction, lighting design, multi-track audio engineering, color grading, and speed-optimized editing workflows.</>
        ),
        tags: [
          { name: "Premiere Pro", icon: "video" },
          { name: "After Effects", icon: "video" },
          { name: "Lightroom", icon: "camera" },
        ],
        images: [],
      },

      {
        title: "Commercial & Event Photography",
        description: (
          <>
            Professional digital photography focusing on capturing unrepeatable moments with artistic precision. 
            Expertise includes full-day wedding coverage, live cultural event capture, editorial portraiture, and 
            product photography. Specialized in ambient lighting management, advanced digital editing, and maintaining 
            a cohesive visual tone across large-scale client galleries.
          </>
        ),
        tags: [
          { name: "Event Photography", icon: "camera" },
          { name: "Portraiture", icon: "camera" },
          { name: "Lightroom", icon: "camera" },
          { name: "Color Grading", icon: "camera" },
        ],
        images: [],
      },
      {
        title: "Digital Systems Architecture",
        description: (
          <>Building automated backend workflows, CRM systems, and custom Odoo ERP environments to streamline registration and data management for massive public markets and events.</>
        ),
        tags: [
          { name: "Odoo ERP", icon: "code" },
          { name: "CRM Architecture", icon: "code" },
          { name: "Systems Automation", icon: "java" },
        ],
        images: [],
      },
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Insights",
  title: "From the Director's Chair",
  description: `Industry insights, production breakdowns, and marketing case studies from the Flooy Studio team.`,
  display: false,
};

const work: Work = {
  path: "/work",
  label: "Our Work",
  title: `Production Portfolio | Flooy Studio`,
  description: `Explore the commercial projects, social campaigns, and films delivered by Flooy Studio.`,
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Gallery",
  title: `Stills & Stills Gallery`,
  description: `A collection of selected high-end event captures, portraits, and cinematography stills.`,
  images: [
    { src: "/images/gallery/horizontal-1.jpg", alt: "Production Still 1", orientation: "horizontal" },
    { src: "/images/gallery/vertical-4.jpg", alt: "Production Still 2", orientation: "vertical" },
    { src: "/images/gallery/horizontal-3.jpg", alt: "Production Still 3", orientation: "horizontal" },
    { src: "/images/gallery/vertical-1.jpg", alt: "Production Still 4", orientation: "vertical" },
    { src: "/images/gallery/vertical-2.jpg", alt: "Production Still 5", orientation: "vertical" },
    { src: "/images/gallery/horizontal-2.jpg", alt: "Production Still 6", orientation: "horizontal" },
    { src: "/images/gallery/horizontal-4.jpg", alt: "Production Still 7", orientation: "horizontal" },
    { src: "/images/gallery/vertical-3.jpg", alt: "Production Still 8", orientation: "vertical" },
    
  ],
    display: false,
};

export { person, social, newsletter, home, about, blog, work, gallery };