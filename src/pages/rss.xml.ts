import { site } from "../site.config";

export function GET() {
  return new Response(null, {
    status: 301,
    headers: {
      Location: new URL("/rss", `${site.baseUrl}/`).href,
    },
  });
}
