import { countries } from "../data/countries";
import { stories } from "../data/stories";
import { site } from "../site.config";

export type FeedItem = {
  title: string;
  description: string;
  path: string;
  date: string;
};

const published = "2026-08-15";
const updated = "2026-08-16";

export const articleFeeds: FeedItem[] = [
  {
    title: "입국 거부 사례 모음",
    description: "항공기 탑승 거절과 입국 금지 사례를 모았습니다.",
    path: "/cases/",
    date: published,
  },
  ...stories.map((item) => ({
    title: item.title,
    description: item.hook,
    path: item.href,
    date: published,
  })),
  {
    title: "여권 재발급 방법",
    description: "여행 출발까지 여유가 있을 때 일반 여권을 다시 받는 방법.",
    path: "/guide/reissue/",
    date: updated,
  },
  {
    title: "긴급여권 발급 방법",
    description: "출발이 임박했을 때 긴급여권·여행증명서를 받는 방법과 한계.",
    path: "/guide/emergency/",
    date: updated,
  },
  {
    title: "여권 유효기간 확인 방법",
    description: "실물 여권이 없어도 만료일과 여권번호를 확인하는 방법.",
    path: "/guide/check-without-passport/",
    date: updated,
  },
  {
    title: "여권 유효기간 6개월 미만",
    description: "잔여기간이 6개월 미만일 때 나라별 기준과 재발급·긴급여권 안내.",
    path: "/guide/six-months/",
    date: updated,
  },
  {
    title: "여권번호 온라인 조회",
    description: "정부24에서 여권번호와 만료일을 조회하는 방법.",
    path: "/guide/passport-number/",
    date: updated,
  },
  {
    title: "2026 여권 발급 수수료",
    description: "단수·복수·긴급여권 국내 발급 수수료 안내.",
    path: "/guide/fees/",
    date: updated,
  },
  {
    title: "여권 분실신고 방법",
    description: "정부24 온라인 신고와 방문 신고, 습득 조회 절차.",
    path: "/guide/lost-passport/",
    date: updated,
  },
  {
    title: "국가별 여권조건",
    description: "주요 여행지 국가별 여권 유효기간을 나라별로 확인하세요.",
    path: "/countries/",
    date: published,
  },
  ...countries.map((country) => ({
    title: `${country.name} 여행 여권 유효기간`,
    description: `${country.name} 여권 유효기간 안내.`,
    path: `/countries/${country.slug}/`,
    date: country.verified_on || published,
  })),
];

export function absoluteUrl(path: string): string {
  return new URL(path, `${site.baseUrl}/`).href;
}

export const sitePages: FeedItem[] = [
  {
    title: site.title,
    description: site.description,
    path: "/",
    date: published,
  },
  ...articleFeeds,
];
