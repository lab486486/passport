/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Window {
  adsbygoogle: { push: (...args: unknown[]) => unknown };
}
