import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

type Team = {
  name: string;
  role: string;
  avatar: string;
  linkedIn: string;
};

type Metadata = {
  title: string;
  subtitle?: string;
  publishedAt: string;
  summary: string;
  image?: string;
  images: string[];
  tag?: string;
  team: Team[];
  link?: string;
  videoLink?: string;
};

function extractFirstVideoLink(content: string) {
  const embedMatch = content.match(/src=["']([^"']*youtube\.com\/embed\/[^"']*)["']/i);
  if (embedMatch?.[1]) {
    const idMatch = embedMatch[1].match(/youtube\.com\/embed\/([^?&#"']+)/i);
    if (idMatch?.[1]) {
      return `https://www.youtube.com/watch?v=${idMatch[1]}`;
    }
    return embedMatch[1];
  }

  const shortLinkMatch = content.match(/src=["']([^"']*youtu\.be\/[^"']*)["']/i);
  if (shortLinkMatch?.[1]) {
    const idMatch = shortLinkMatch[1].match(/youtu\.be\/([^?&#"']+)/i);
    if (idMatch?.[1]) {
      return `https://www.youtube.com/watch?v=${idMatch[1]}`;
    }
    return shortLinkMatch[1];
  }

  return undefined;
}

import { notFound } from "next/navigation";

function getMDXFiles(dir: string) {
  if (!fs.existsSync(dir)) {
    notFound();
  }

  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const rawContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(rawContent);

  const metadata: Metadata = {
    title: data.title || "",
    subtitle: data.subtitle || "",
    publishedAt: data.publishedAt,
    summary: data.summary || "",
    image: data.image || "",
    images: data.images || [],
    tag: data.tag || [],
    team: data.team || [],
    link: data.link || "",
    videoLink: data.videoLink || extractFirstVideoLink(content) || data.link || "",
  };

  return { metadata, content };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

function normalizePath(customPath: string[]) {
  return customPath[0] === "src" ? customPath.slice(1) : customPath;
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

export function getPosts(customPath: string[]) {
  const relativePath = normalizePath(customPath);
  const postsDir = path.join(projectRoot, ...relativePath);
  return getMDXData(postsDir);
}
