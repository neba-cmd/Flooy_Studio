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
    link: "https://www.instagram.com/flooystudios/",
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
  image: "/images/projects/FlooyStudio-project-01/FlooyYouTubeCover.png",
  label: "Home",
  title: `Flooy Studio | London Video Production & Digital Marketing`,
  description: `Habesha Event Photography and Videography based in London.`,
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
  description: `Habesha Event Photography and Videography based in London.`,
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
    { src: "/images/gallery/DSC01019.jpg", alt: "Gallery image DSC01019", orientation: "vertical" },
    { src: "/images/gallery/DSC01469.JPG", alt: "Gallery image DSC01469", orientation: "horizontal" },
    { src: "/images/gallery/DSC01562.jpg", alt: "Gallery image DSC01562", orientation: "horizontal" },
    { src: "/images/gallery/DSC01572.JPG", alt: "Gallery image DSC01572", orientation: "horizontal" },
    { src: "/images/gallery/DSC01660.jpg", alt: "Gallery image DSC01660", orientation: "vertical" },
    { src: "/images/gallery/DSC01662.jpg", alt: "Gallery image DSC01662", orientation: "vertical" },
    { src: "/images/gallery/DSC01714.jpg", alt: "Gallery image DSC01714", orientation: "vertical" },
    { src: "/images/gallery/DSC01827.JPG", alt: "Gallery image DSC01827", orientation: "horizontal" },
    { src: "/images/gallery/DSC01910.JPG", alt: "Gallery image DSC01910", orientation: "horizontal" },
    { src: "/images/gallery/DSC01961.JPG", alt: "Gallery image DSC01961", orientation: "horizontal" },
    { src: "/images/gallery/DSC02101.JPG", alt: "Gallery image DSC02101", orientation: "horizontal" },
    { src: "/images/gallery/DSC02195.JPG", alt: "Gallery image DSC02195", orientation: "horizontal" },
    { src: "/images/gallery/DSC05526.JPG", alt: "Gallery image DSC05526", orientation: "horizontal" },
    { src: "/images/gallery/DSC05556.JPG", alt: "Gallery image DSC05556", orientation: "horizontal" },
    { src: "/images/gallery/DSC05747.JPG", alt: "Gallery image DSC05747", orientation: "horizontal" },
    { src: "/images/gallery/DSC05766.JPG", alt: "Gallery image DSC05766", orientation: "horizontal" },
    { src: "/images/gallery/DSC05937.JPG", alt: "Gallery image DSC05937", orientation: "horizontal" },
    { src: "/images/gallery/DSC06122.JPG", alt: "Gallery image DSC06122", orientation: "horizontal" },
    { src: "/images/gallery/DSC06255.JPG", alt: "Gallery image DSC06255", orientation: "horizontal" },
    { src: "/images/gallery/DSC06587.JPG", alt: "Gallery image DSC06587", orientation: "horizontal" },
    { src: "/images/gallery/DSC06703.jpg", alt: "Gallery image DSC06703", orientation: "horizontal" },
    { src: "/images/gallery/DSC06728.JPG", alt: "Gallery image DSC06728", orientation: "horizontal" },
    { src: "/images/gallery/DSC06744.JPG", alt: "Gallery image DSC06744", orientation: "horizontal" },
    { src: "/images/gallery/DSC06916.JPG", alt: "Gallery image DSC06916", orientation: "horizontal" },
    { src: "/images/gallery/DSC07000.jpg", alt: "Gallery image DSC07000", orientation: "horizontal" },
    { src: "/images/gallery/DSC07554.JPG", alt: "Gallery image DSC07554", orientation: "horizontal" },
    { src: "/images/gallery/DSC07615.JPG", alt: "Gallery image DSC07615", orientation: "horizontal" },
    { src: "/images/gallery/DSC07632.JPG", alt: "Gallery image DSC07632", orientation: "horizontal" },
    { src: "/images/gallery/DSC09568.JPG", alt: "Gallery image DSC09568", orientation: "horizontal" },
    { src: "/images/gallery/EFF (46 of 145).jpg", alt: "Gallery image EFF (46 of 145)", orientation: "horizontal" },
    { src: "/images/gallery/EFF (52 of 145).jpg", alt: "Gallery image EFF (52 of 145)", orientation: "horizontal" },
    { src: "/images/gallery/EFF (89 of 145).jpg", alt: "Gallery image EFF (89 of 145)", orientation: "horizontal" },
    { src: "/images/gallery/Rufta Pictures DSC07942 (1) (1).jpg", alt: "Gallery image Rufta Pictures DSC07942 (1) (1)", orientation: "horizontal" },
    { src: "/images/gallery/m (32 of 113).jpg", alt: "Gallery image m (32 of 113)", orientation: "vertical" },
    { src: "/images/gallery/m (52 of 113).jpg", alt: "Gallery image m (52 of 113)", orientation: "vertical" },
    { src: "/images/gallery/m (63 of 113).jpg", alt: "Gallery image m (63 of 113)", orientation: "horizontal" },
    { src: "/images/gallery/m (72 of 113).jpg", alt: "Gallery image m (72 of 113)", orientation: "vertical" },
    { src: "/images/gallery/m (93 of 113).jpg", alt: "Gallery image m (93 of 113)", orientation: "horizontal" },
    { src: "/images/gallery/noha-6.jpg", alt: "Gallery image noha-6", orientation: "horizontal" },
    { src: "/images/gallery/thumb-4-noha.jpg", alt: "Gallery image thumb-4-noha", orientation: "horizontal" },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };