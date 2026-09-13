export type Story = {
  slug: string;
  href: string;
  hook: string;
  hookHtml: string;
  title: string;
  countries: string[];
};

export const stories: Story[] = [
  {
    slug: "hungary-six-months",
    href: "/cases/hungary-six-months/",
    hook: "헝가리에서 제3국으로 가려다 여권 6개월 때문에 탑승이 거절됐습니다",
    hookHtml: "헝가리에서 제3국으로 가려다 여권 <span class=\"hl\">6개월</span> 때문에 탑승이 거절됐습니다",
    title: "헝가리 출발 단계에서 막힌 한국인",
    countries: [],
  },
  {
    slug: "vietnam-2025-emergency",
    href: "/cases/vietnam-2025-emergency/",
    hook: "2025년 3월부터 베트남 긴급여권은 통하지 않습니다",
    hookHtml: "2025년 3월부터 베트남 <span class=\"hl\">긴급여권</span>은 통하지 않습니다",
    title: "베트남, 긴급여권·단수여권 입국 거부",
    countries: ["vietnam"],
  },
  {
    slug: "visa-pages",
    href: "/guide/visa-pages/",
    hook: "잔여기간은 충분했는데 사증란 때문에 탑승이 거절됐습니다",
    hookHtml: "잔여기간은 충분했는데 <span class=\"hl\">사증란</span> 때문에 탑승이 거절됐습니다",
    title: "사증란이 부족하면 어떻게 되나",
    countries: ["vietnam", "thailand", "taiwan", "philippines", "china", "japan"],
  },
  {
    slug: "six-months-border",
    href: "/cases/six-months-border/",
    hook: "6개월하고 이틀 남았는데 대사관은 ‘책임은 못 진다’고 했습니다",
    hookHtml: "<span class=\"hl\">6개월</span>하고 이틀 남았는데 대사관은 ‘<span class=\"hl\">책임은 못 진다</span>’고 했습니다",
    title: "6개월이 아슬아슬할 때 생기는 일",
    countries: ["vietnam", "thailand", "taiwan", "philippines", "singapore", "malaysia"],
  },
  {
    slug: "japan-vs-asia",
    href: "/cases/japan-vs-asia/",
    hook: "일본은 만료 직전도 되는데, 동남아는 6개월이 필요합니다",
    hookHtml: "일본은 만료 직전도 되는데, 동남아는 <span class=\"hl\">6개월</span>이 필요합니다",
    title: "일본과 동남아 여권 규정이 다른 이유",
    countries: ["japan", "vietnam", "thailand"],
  },
  {
    slug: "photoshop-photo",
    href: "/cases/photoshop-photo/",
    hook: "피부 보정한 여권 사진, 발급도 입국도 거절될 수 있습니다",
    hookHtml: "<span class=\"hl\">포토샵</span> 여권 사진, 발급도 입국도 거절될 수 있습니다",
    title: "포토샵 여권 사진으로 입국 거부",
    countries: [],
  },
  {
    slug: "damaged-passport",
    href: "/cases/damaged-passport/",
    hook: "물에 젖거나 낙서된 여권은 위조로 의심받습니다",
    hookHtml: "물에 젖거나 낙서된 여권은 <span class=\"hl\">위조</span>로 의심받습니다",
    title: "훼손된 전자여권 출국 전 확인",
    countries: [],
  },
];

export function storiesFor(slug: string): Story[] {
  const matched = stories.filter((item) => item.countries.includes(slug));
  const general = stories.filter((item) => item.countries.length === 0);
  const seen = new Set<string>();
  return [...matched, ...general].filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}
