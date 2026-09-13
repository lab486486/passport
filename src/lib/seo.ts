import { site } from "../site.config";
import type { CountryRule } from "./types";
import { needLabel } from "./passport";

export function countrySeo(country: CountryRule): {
  title: string;
  description: string;
  ogImage: string;
} {
  const months = country.passport_months;
  const title = `${country.name} 여행 여권 유효기간`;
  let description = `${country.name} 여권 유효기간 안내. ${needLabel(country)}.`;
  if (months >= 6) {
    description = `${country.name} 여권 유효기간은 보통 6개월입니다. 6개월 미만이면 탑승·입국이 거절될 수 있습니다. ${country.name} 여행 전 만료일을 확인하세요.`;
  } else if (months === 3) {
    description = `${country.name} 여권 유효기간은 출국일 기준 3개월입니다. 3개월 미만인지 확인하고 ${country.name} 여행을 준비하세요.`;
  } else if (months === 1) {
    description = `${country.name} 여권 유효기간은 체류 기간에 1개월을 더한 값이 필요합니다.`;
  } else {
    description = `${country.name} 여행 여권 유효기간은 체류 기간 동안만 유효하면 됩니다. 만료일 전에 귀국하면 됩니다.`;
  }

  return {
    title,
    description,
    ogImage: `${site.baseUrl}/og/${country.slug}.png`,
  };
}

export function flagUrl(iso2: string, width = 1280): string {
  return `https://flagcdn.com/w${width}/${iso2.toLowerCase()}.png`;
}
