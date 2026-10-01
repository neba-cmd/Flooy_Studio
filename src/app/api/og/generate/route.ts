// Deliberately do not import `next/og` or `@vercel/og` here. Those packages
// embed resvg, yoga, and font/WASM assets in the Cloudflare Worker bundle.
// OpenNext's default Cloudflare Node-compatible function supports the Web APIs
// used below and keeps this route in the normal server-function bundle.
export const runtime = "nodejs";

const SITE_NAME = "Flooy Studio";
const SITE_ROLE = "Creative Production & Digital Agency";
const MAX_TITLE_LENGTH = 160;

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => {
    switch (character) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

function wrapTitle(title: string) {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > 30 && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }
  if (line) lines.push(line);

  return lines.slice(0, 3);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedTitle = url.searchParams.get("title")?.trim() || "Portfolio";
  const title = escapeXml(requestedTitle.slice(0, MAX_TITLE_LENGTH));
  const titleLines = wrapTitle(title);
  const titleSvg = titleLines
    .map(
      (line, index) =>
        `<text x="96" y="${260 + index * 88}" class="title">${line}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#151515" />
      <stop offset="100%" stop-color="#2a1a38" />
    </linearGradient>
    <style>
      .title { fill: #ffffff; font: 700 72px Arial, sans-serif; letter-spacing: -2px; }
      .name { fill: #ffffff; font: 600 42px Arial, sans-serif; }
      .role { fill: #b9a8c9; font: 28px Arial, sans-serif; }
    </style>
  </defs>
  <rect width="1280" height="720" fill="url(#background)" />
  <rect x="96" y="96" width="88" height="10" rx="5" fill="#bc6ff1" />
  ${titleSvg}
  <circle cx="150" cy="590" r="54" fill="#bc6ff1" />
  <text x="150" y="607" text-anchor="middle" fill="#151515" font-family="Arial, sans-serif" font-size="46" font-weight="700">F</text>
  <text x="230" y="580" class="name">${SITE_NAME}</text>
  <text x="230" y="622" class="role">${SITE_ROLE}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
