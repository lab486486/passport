export type ValidityFrom = "arrival" | "departure" | "stay_end";
export type Confidence = "high" | "medium" | "low";
export type VisaFree = boolean | "eta";
export type EmergencyOk = boolean | "unknown";

export type CountryCase = {
  title: string;
  body: string;
};

export type TravelCert = "ok" | "limited" | "no" | "unknown";

export type CountryRule = {
  slug: string;
  name: string;
  iso2: string;
  passport_months: number;
  extra_days?: number;
  from: ValidityFrom;
  emergency_ok: EmergencyOk;
  emergency_note?: string;
  travel_cert?: TravelCert;
  stay_days: number | null;
  visa_free: VisaFree;
  airline_stricter: boolean;
  source_url: string;
  source_quote: string;
  verified_on: string;
  confidence: Confidence;
  notes: string;
  cases: CountryCase[];
  landmark?: string;
};

export type CheckInput = {
  country: CountryRule;
  passportExpiry: Date;
  departure: Date;
  returnDate?: Date;
  today?: Date;
};

export type CheckStatus = "ok" | "risk" | "no";

export type CtaKind = "none" | "reissue" | "emergency" | "both";

export type CheckResult = {
  status: CheckStatus;
  remainingDays: number;
  neededDays: number;
  shortDays: number;
  daysUntilTrip: number;
  requiredUntil: Date;
  stayEnd: Date;
  assumedReturn: boolean;
  cta: CtaKind;
  headline: string;
  summary: string;
  requirement: string;
};
