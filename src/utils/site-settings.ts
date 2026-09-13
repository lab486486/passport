import siteData from "../data/site.json";
import navData from "../data/nav.json";
import { site } from "../site.config";

export type NavItemType = "home" | "tag" | "url";

export type SiteNavItem = {
  label: string;
  type: NavItemType;
  value?: string;
};

export type SiteSettings = {
  title: string;
  description: string;
  keywords: string;
  site_url: string;
  copyright_name: string;
  nav: SiteNavItem[];
};

function normalizeNavType(raw: string): NavItemType | null {
  if (raw === "home" || raw === "tag" || raw === "url") return raw;
  return null;
}

export function getSiteSettings(): SiteSettings {
  const nav = (Array.isArray(navData.nav) ? navData.nav : [])
    .map((item) => {
      const type = normalizeNavType(String(item?.type || ""));
      if (!type) return null;
      const label = String(item?.label || "").trim();
      if (!label) return null;
      return {
        label,
        type,
        value: item?.value ? String(item.value) : undefined,
      } satisfies SiteNavItem;
    })
    .filter((item): item is SiteNavItem => Boolean(item));

  return {
    title: siteData.title || "국가별 여권 유효기간",
    description: siteData.description || site.description,
    keywords: siteData.keywords || site.keywords,
    site_url: (siteData.site_url || "https://passport.marrien.co.kr").replace(/\/$/, ""),
    copyright_name: siteData.copyright_name || "국가별 여권 유효기간",
    nav,
  };
}

export function resolveNavHref(item: SiteNavItem): string {
  if (item.type === "home") return "/";
  if (item.type === "tag") {
    const tag = (item.value || item.label || "").trim();
    return tag ? `/guide/${encodeURIComponent(tag)}/` : "/";
  }
  return (item.value || "").trim() || "/";
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
