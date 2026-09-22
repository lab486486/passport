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
let blocked = false;
let lastRecordAt = 0;
let injectionObserver: MutationObserver | null = null;

const noopAdsbygoogle = {
  push() {
    return 0;
  },
};

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
  return blocked || readState().count >= MAX_CLICKS;
}

export function recordAdClickEstimate(): void {
  if (isAdsenseBlocked()) {
    enforceAdsenseBlock();
    return;
  }

  const state = readState();
  if (state.windowStart === 0) state.windowStart = now();
  state.count += 1;
  writeState(state);

  if (state.count >= MAX_CLICKS) {
    enforceAdsenseBlock();
  }
}

function neutralizeAdsbygoogle(): void {
  try {
    Object.defineProperty(window, "adsbygoogle", {
      configurable: true,
      enumerable: true,
      get() {
        return noopAdsbygoogle;
      },
      set() {
        // Google's loader does `window.adsbygoogle = window.adsbygoogle || []`.
      },
    });
  } catch {
    window.adsbygoogle = noopAdsbygoogle;
  }
}

function isAdsenseNode(node: Node): boolean {
  if (!(node instanceof Element)) return false;
  if (node.matches("ins.adsbygoogle, [data-display-ad]")) return true;
  if (node instanceof HTMLScriptElement) {
    const src = node.src || "";
    return src.includes("googlesyndication.com") || src.includes("adsbygoogle");
  }
  if (node instanceof HTMLIFrameElement) {
    const id = node.id || "";
    const name = node.name || "";
    const src = node.src || "";
    return (
      id.startsWith("aswift_") ||
      id.startsWith("google_ads_iframe") ||
      name.startsWith("google_ads") ||
      src.includes("googlesyndication.com") ||
      src.includes("doubleclick.net")
    );
  }
  return false;
}

function removeAdSlots(): void {
  document
    .querySelectorAll(
      [
        "[data-display-ad]",
        "ins.adsbygoogle",
        'iframe[id^="aswift_"]',
        'iframe[id^="google_ads_iframe"]',
        'iframe[name^="google_ads"]',
        'iframe[src*="googlesyndication.com"]',
        'iframe[src*="doubleclick.net"]',
        'script[src*="pagead2.googlesyndication.com"]',
        'script[src*="adsbygoogle"]',
      ].join(","),
    )
    .forEach((el) => el.remove());
}

function watchLateInjections(): void {
  if (injectionObserver || typeof MutationObserver === "undefined") return;
  injectionObserver = new MutationObserver((mutations) => {
    if (!blocked) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (isAdsenseNode(node)) {
          node.parentNode?.removeChild(node);
          continue;
        }
        if (node instanceof Element) {
          node
            .querySelectorAll(
              [
                "[data-display-ad]",
                "ins.adsbygoogle",
                'iframe[id^="aswift_"]',
                'iframe[id^="google_ads_iframe"]',
                'script[src*="pagead2.googlesyndication.com"]',
              ].join(","),
            )
            .forEach((el) => el.remove());
        }
      }
    }
  });
  injectionObserver.observe(document.documentElement, { childList: true, subtree: true });
}

function enforceAdsenseBlock(): void {
  blocked = true;
  neutralizeAdsbygoogle();
  removeAdSlots();
  watchLateInjections();
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

export function fillPendingAdSlots(): void {
  bootAdsense();
  if (isAdsenseBlocked()) {
    enforceAdsenseBlock();
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

function isAdsenseFrame(el: Element): boolean {
  if (!(el instanceof HTMLIFrameElement)) return false;
  return isAdsenseNode(el);
}

function isAdArea(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("[data-display-ad], ins.adsbygoogle, .adsbygoogle")) || isAdsenseFrame(target);
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

  const recordIfArmed = () => {
    if (!armed || isAdsenseBlocked()) {
      if (isAdsenseBlocked()) enforceAdsenseBlock();
      return;
    }
    const t = now();
    if (t - lastRecordAt < BLUR_DEBOUNCE_MS) return;
    lastRecordAt = t;
    armed = false;
    recordAdClickEstimate();
  };

  document.addEventListener(
    "pointerenter",
    (event) => {
      if (isAdArea(event.target)) arm();
    },
    true,
  );
  document.addEventListener(
    "pointerdown",
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

  window.addEventListener("blur", recordIfArmed);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") recordIfArmed();
  });
}

export function bootAdsense(): void {
  if (booted) return;
  booted = true;
  if (isAdsenseBlocked()) {
    enforceAdsenseBlock();
    return;
  }
  loadAdsenseScript();
  watchAdClicks();
}
