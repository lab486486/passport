export const site = {
  name: "국가별 여권 유효기간",
  title: "국가별 여권 유효기간",
  description:
    "여권 만료일과 출발일만 넣으면 국가별 여권 유효기간을 바로 확인합니다. 6개월·3개월 잔여기간과 여행 가능 여부, 재발급·긴급여권 안내.",
  keywords:
    "국가별 여권 유효기간, 여권 유효기간, 여권 잔여기간, 여권 만료일, 여권 6개월, 베트남 여권 유효기간, 태국 여권 유효기간, 일본 여권 유효기간, 긴급여권, 여권 재발급",
  baseUrl: "https://passport.marrien.co.kr",
  lang: "ko",
  mediaBaseUrl: "",
} as const;

export function media(path: string): string {
  const cleaned = path.replace(/^\//, "");
  const base = site.mediaBaseUrl.replace(/\/$/, "");
  if (base) return `${base}/${cleaned}`;
  return `/${cleaned}`;
}

export function mediaOrigin(): string | undefined {
  if (!site.mediaBaseUrl) return undefined;
  try {
    return new URL(site.mediaBaseUrl).origin;
  } catch {
    return undefined;
  }
}
