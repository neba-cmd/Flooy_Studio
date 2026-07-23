import { baseURL } from "@/resources";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/event-photos"],
      },
    ],
    sitemap: `${baseURL}/sitemap.xml`,
  };
}
