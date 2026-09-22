import headScriptData from "../data/adsense/head-script.json";

export const ADSENSE_GUARD_KEY = "passport:adsense-ivt";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_CLICKS = 3;
const BLUR_DEBOUNCE_MS = 1000;
const ARM_HOLD_MS = 2000;
const SCRIPT_SRC_FALLBACK =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8094444885520451";

type GuardState = {
  count: number;
  windowStart: number;
};

let booted = false;
let lastRecordAt = 0;

function now(): number {
  return Date.now();
}

function emptyState(): GuardState {
  return { count: 0, windowStart: 0 };
}

function adsenseScriptSrc(): string {
  const match = headScriptData.script.match(/src="([^"]+)"/);
  return match?.[1] || SCRIPT_SRC_FALLBACK;
}

function readState(): GuardState {
  try {
    const raw = localStorage.getItem(ADSENSE_GUARD_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<GuardState>;
    if (typeof parsed.count !== "number" || typeof parsed.windowStart !== "number") {
      return emptyState();
    }
    if (parsed.windowStart > 0 && now() - parsed.windowStart >= WINDOW_MS) {
      localStorage.removeItem(ADSENSE_GUARD_KEY);
      return emptyState();
    }
    return { count: parsed.count, windowStart: parsed.windowStart };
  } catch {
    return emptyState();
  }
}

function writeState(state: GuardState): void {
  try {
    localStorage.setItem(ADSENSE_GUARD_KEY, JSON.stringify(state));
  } catch {
    // private mode / quota
  }
}

export function isAdsenseBlocked(): boolean {
  return readState().count >= MAX_CLICKS;
}

export function recordAdClickEstimate(): void {
  const state = readState();
  if (state.windowStart === 0) state.windowStart = now();
  state.count += 1;
  writeState(state);
}

function loadAdsenseScript(): void {
  if (isAdsenseBlocked()) return;
  if (document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = adsenseScriptSrc();
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

export function pushAdsense(): void {
  if (isAdsenseBlocked()) return;
  (window.adsbygoogle = window.adsbygoogle || []).push({});
}

function removeAdSlots(): void {
  document.querySelectorAll("[data-display-ad]").forEach((el) => el.remove());
}

export function fillPendingAdSlots(): void {
  bootAdsense();
  if (isAdsenseBlocked()) {
    removeAdSlots();
    return;
  }

  document.querySelectorAll<HTMLElement>("[data-display-ad]").forEach((slot) => {
    if (slot.querySelector("ins.adsbygoogle")) return;
    const client = slot.dataset.adClient;
    const adSlot = slot.dataset.adSlot;
    if (!client || !adSlot) return;

    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", client);
    ins.setAttribute("data-ad-slot", adSlot);
    ins.setAttribute("data-ad-format", slot.dataset.adFormat || "auto");
    if (slot.dataset.fullWidthResponsive !== "false") {
      ins.setAttribute("data-full-width-responsive", "true");
    }
    slot.appendChild(ins);
  });
}

function isAdArea(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(".adsbygoogle"));
}

function watchAdClicks(): void {
  let armed = false;
  let disarmTimer = 0;

  const arm = () => {
    armed = true;
    window.clearTimeout(disarmTimer);
  };

  const disarmSoon = () => {
    window.clearTimeout(disarmTimer);
    disarmTimer = window.setTimeout(() => {
      armed = false;
    }, ARM_HOLD_MS);
  };

  document.addEventListener(
    "pointerenter",
    (event) => {
      if (isAdArea(event.target)) arm();
    },
    true,
  );
  document.addEventListener(
    "pointerleave",
    (event) => {
      if (isAdArea(event.target)) disarmSoon();
    },
    true,
  );
  document.addEventListener(
    "touchstart",
    (event) => {
      if (isAdArea(event.target)) arm();
    },
    { capture: true, passive: true },
  );

  window.addEventListener("blur", () => {
    if (!armed) return;
    const t = now();
    if (t - lastRecordAt < BLUR_DEBOUNCE_MS) return;
    lastRecordAt = t;
    armed = false;
    recordAdClickEstimate();
  });
}

export function bootAdsense(): void {
  if (booted) return;
  booted = true;
  if (!isAdsenseBlocked()) loadAdsenseScript();
  watchAdClicks();
}
