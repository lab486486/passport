import type { CheckInput, CheckResult, CtaKind, CountryRule } from "./types";

const DAY_MS = 86_400_000;
const DEFAULT_STAY_DAYS = 7;
const REISSUE_LEAD_DAYS = 30;

export function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatKoDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / DAY_MS);
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() < day) next.setDate(0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function fromLabel(country: CountryRule): string {
  if (country.from === "arrival") return "입국일 기준";
  if (country.from === "departure") return "출국(귀국)일 기준";
  return "체류 종료일 기준";
}

export function needLabel(country: CountryRule): string {
  const extra = country.extra_days ? ` + ${country.extra_days}일` : "";
  if (country.passport_months > 0) {
    return `${fromLabel(country)} ${country.passport_months}개월${extra}`;
  }
  if (country.extra_days) {
    return `${fromLabel(country)} 체류 종료 후 ${country.extra_days}일`;
  }
  return "여행 기간 동안만 유효하면 됨";
}

export function josa(name: string, pair: "은는" | "이가" | "을를"): string {
  const last = name.charCodeAt(name.length - 1);
  const hasBatchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  if (pair === "은는") return hasBatchim ? "은" : "는";
  if (pair === "이가") return hasBatchim ? "이" : "가";
  return hasBatchim ? "을" : "를";
}

export function requiredUntil(input: CheckInput): {
  date: Date;
  stayEnd: Date;
  assumedReturn: boolean;
} {
  const { country, departure, returnDate } = input;
  const assumedReturn = !returnDate;
  const stayEnd = returnDate ?? addDays(departure, DEFAULT_STAY_DAYS);
  const extra = country.extra_days ?? 0;

  if (country.from === "arrival") {
    return {
      date: addDays(addMonths(departure, country.passport_months), extra),
      stayEnd,
      assumedReturn,
    };
  }
  if (country.from === "departure") {
    return {
      date: addDays(addMonths(stayEnd, country.passport_months), extra),
      stayEnd,
      assumedReturn,
    };
  }
  return {
    date: addDays(addMonths(stayEnd, country.passport_months), extra),
    stayEnd,
    assumedReturn,
  };
}

function requirementText(country: CountryRule, until: Date): string {
  return `요건: ${country.name} 입국 시 여권은 ${formatKoDate(until)}까지는 유효해야 합니다.`;
}

function summaryText(country: CountryRule, status: CheckResult["status"]): string {
  const subject = `${country.name}${josa(country.name, "은는")}`;
  if (country.passport_months === 0 && !country.extra_days) {
    return status === "ok"
      ? `${subject} 여권 만료일 이내 여행 기간이면 가능합니다.`
      : `${subject} 여권 만료일 이내 여행 기간이어야 합니다.`;
  }
  if (country.from === "arrival" && country.passport_months > 0) {
    return `${subject} 입국일 기준 여권이 ${country.passport_months}개월 이상 남아 있어야 합니다.`;
  }
  if (country.from === "departure" && country.passport_months > 0) {
    return `${subject} 나오는 날부터 여권이 ${country.passport_months}개월 이상 남아 있어야 합니다.`;
  }
  return `${subject} ${needLabel(country)}입니다.`;
}

export function checkPassport(input: CheckInput): CheckResult {
  const today = input.today ?? new Date();
  const { date: until, stayEnd, assumedReturn } = requiredUntil(input);
  const remainingDays = daysBetween(input.departure, input.passportExpiry);
  const neededDays = daysBetween(input.departure, until);
  const shortDays = neededDays - remainingDays;
  const daysUntilTrip = daysBetween(today, input.departure);

  let status: CheckResult["status"] = "ok";
  if (remainingDays < 0) status = "no";
  else if (shortDays > 0) status = remainingDays < neededDays * 0.15 ? "no" : "risk";
  if (shortDays > 0 && remainingDays < 14) status = "no";
  if (shortDays <= 0) status = "ok";

  let cta: CtaKind = "none";
  if (status !== "ok") {
    if (daysUntilTrip < REISSUE_LEAD_DAYS) cta = "emergency";
    else if (daysUntilTrip < REISSUE_LEAD_DAYS + 10) cta = "both";
    else cta = "reissue";
  }

  const headline =
    status === "ok"
      ? `이 여권으로 ${input.country.name} 여행이 가능합니다`
      : cta === "emergency"
        ? "긴급 여권을 만들어야 합니다"
        : "이 여권은 갱신이 필요합니다";

  return {
    status,
    remainingDays,
    neededDays,
    shortDays,
    daysUntilTrip,
    requiredUntil: until,
    stayEnd,
    assumedReturn,
    cta,
    headline,
    summary: summaryText(input.country, status),
    requirement: requirementText(input.country, until),
  };
}
