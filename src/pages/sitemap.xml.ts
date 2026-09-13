import { sitePages, absoluteUrl } from "../lib/feeds";

export function GET() {
  const urls = sitePages
    .map(
      (item) => `  <url>
    <loc>${absoluteUrl(item.path)}</loc>
    <lastmod>${item.date}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
