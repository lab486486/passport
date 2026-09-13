import { site } from "../site.config";
import { articleFeeds, absoluteUrl } from "../lib/feeds";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function GET() {
  const items = articleFeeds
    .map((item) => {
      const url = absoluteUrl(item.path);
      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(`${item.date}T00:00:00+09:00`).toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${site.baseUrl}/</link>
    <description>${escapeXml(site.description)}</description>
    <language>ko</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
