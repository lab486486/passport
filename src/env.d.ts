/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface PassportAdsenseApi {
  key: string;
  isBlocked(): boolean;
  fillPendingAdSlots(): void;
  push(): void;
}

interface Window {
  adsbygoogle: { push: (...args: unknown[]) => unknown };
  PassportAdsense?: PassportAdsenseApi;
}
