(function () {
  var KEY = "passport:adsense-ivt-v2";
  var WINDOW_MS = 24 * 60 * 60 * 1000;
  var MAX_CLICKS = 3;
  var BLUR_DEBOUNCE_MS = 1000;
  var ARM_MS = 14000;
  var SCRIPT_SRC_FALLBACK =
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8094444885520451";

  var current = document.currentScript;
  var SCRIPT_SRC =
    (current && current.getAttribute("data-ad-script-src")) || SCRIPT_SRC_FALLBACK;

  var AD_AREA_SELECTOR =
    ".ad-unit, .ad-slot, [data-display-ad], ins.adsbygoogle, .adsbygoogle";
  var AD_FRAME_SELECTOR = [
    'iframe[id^="aswift_"]',
    'iframe[id^="google_ads_iframe"]',
    'iframe[name^="google_ads"]',
    'iframe[src*="googlesyndication.com"]',
    'iframe[src*="doubleclick.net"]',
  ].join(",");
  var AD_NODE_SELECTOR = [
    ".ad-unit",
    ".ad-slot",
    "[data-display-ad]",
    "ins.adsbygoogle",
    AD_FRAME_SELECTOR,
    'script[src*="pagead2.googlesyndication.com"]',
    'script[src*="adsbygoogle.js"]',
  ].join(",");

  var blocked = false;
  var clicksWatching = false;
  var insertionGuarded = false;
  var injectionObserver = null;
  var lastRecordAt = 0;
  var armedUntil = 0;
  var siteNavAt = 0;
  var nativeAppendChild = Node.prototype.appendChild;
  var nativeInsertBefore = Node.prototype.insertBefore;

  function now() {
    return Date.now();
  }

  function emptyState() {
    return { count: 0, windowStart: 0 };
  }

  function readState() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return emptyState();
      var parsed = JSON.parse(raw);
      if (typeof parsed.count !== "number" || typeof parsed.windowStart !== "number") {
        return emptyState();
      }
      if (parsed.windowStart > 0 && now() - parsed.windowStart >= WINDOW_MS) {
        localStorage.removeItem(KEY);
        return emptyState();
      }
      return { count: parsed.count, windowStart: parsed.windowStart };
    } catch (err) {
      return emptyState();
    }
  }

  function writeState(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      // private mode / quota
    }
  }

  function isBlocked() {
    return blocked || readState().count >= MAX_CLICKS;
  }

  function isAdFrame(el) {
    return el instanceof Element && el.matches(AD_FRAME_SELECTOR);
  }

  function isAdNode(node) {
    return node instanceof Element && node.matches(AD_NODE_SELECTOR);
  }

  function isAdArea(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(AD_AREA_SELECTOR)) || isAdFrame(target);
  }

  function containsAdNode(node) {
    return node instanceof Element && Boolean(node.querySelector(AD_NODE_SELECTOR));
  }

  function arm() {
    armedUntil = now() + ARM_MS;
  }

  function isArmed() {
    return now() < armedUntil;
  }

  function isSiteArticleLink(target) {
    if (!(target instanceof Element)) return false;
    var link = target.closest("a[href]");
    if (!link || isAdArea(link)) return false;
    var href = link.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return false;
    try {
      var url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return false;
      return url.pathname !== location.pathname || url.search !== location.search;
    } catch (err) {
      return false;
    }
  }

  function markSiteNavigation() {
    siteNavAt = now();
  }

  function isSiteNavigation() {
    return siteNavAt > 0 && now() - siteNavAt < 3000;
  }

  function neutralizeAdsbygoogle() {
    var noopPush = function () {
      return 0;
    };
    try {
      var currentQueue = window.adsbygoogle;
      if (currentQueue && typeof currentQueue.push === "function") {
        currentQueue.push = noopPush;
      }
    } catch (err) {
      // already sealed
    }
    var noop = [];
    noop.push = noopPush;
    try {
      Object.defineProperty(window, "adsbygoogle", {
        configurable: true,
        enumerable: true,
        get: function () {
          return noop;
        },
        set: function () {
          // Google's loader does `window.adsbygoogle = window.adsbygoogle || []`.
        },
      });
    } catch (err) {
      window.adsbygoogle = noop;
    }
  }

  function removeAds() {
    var nodes = document.querySelectorAll(AD_NODE_SELECTOR);
    for (var i = 0; i < nodes.length; i++) nodes[i].remove();
  }

  function rejectAdNode(node) {
    if (!blocked || !node) return false;
    if (isAdNode(node) || containsAdNode(node)) return true;
    return node instanceof DocumentFragment && Boolean(node.querySelector(AD_NODE_SELECTOR));
  }

  function installInsertionGuard() {
    if (insertionGuarded) return;
    insertionGuarded = true;
    Node.prototype.appendChild = function (node) {
      if (rejectAdNode(node)) return node;
      return nativeAppendChild.call(this, node);
    };
    Node.prototype.insertBefore = function (node, child) {
      if (rejectAdNode(node)) return node;
      return nativeInsertBefore.call(this, node, child);
    };
  }

  function watchLateInjections() {
    if (injectionObserver || typeof MutationObserver === "undefined") return;
    injectionObserver = new MutationObserver(function (mutations) {
      if (!blocked) return;
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        if (mutation.type === "attributes") {
          if (isAdNode(mutation.target)) mutation.target.remove();
          continue;
        }
        var added = mutation.addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (isAdNode(node)) {
            node.remove();
            continue;
          }
          if (node instanceof Element) {
            var nested = node.querySelectorAll(AD_NODE_SELECTOR);
            for (var k = nested.length - 1; k >= 0; k--) nested[k].remove();
          }
        }
      }
    });
    injectionObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "id", "name"],
    });
  }

  function enforce() {
    blocked = true;
    neutralizeAdsbygoogle();
    installInsertionGuard();
    removeAds();
    watchLateInjections();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", removeAds, { once: true });
    }
  }

  function recordAdClickEstimate() {
    if (isBlocked()) {
      enforce();
      return;
    }
    var state = readState();
    if (state.windowStart === 0) state.windowStart = now();
    state.count += 1;
    writeState(state);
    if (state.count >= MAX_CLICKS) enforce();
  }

  function recordIfArmed() {
    if (isSiteNavigation()) return;
    if (isAdArea(document.activeElement)) arm();
    if (!isArmed()) return;
    if (isBlocked()) {
      enforce();
      return;
    }
    var t = now();
    if (t - lastRecordAt < BLUR_DEBOUNCE_MS) return;
    lastRecordAt = t;
    // The pointer stays inside the cross-origin iframe, so the parent
    // never receives another mouseover. Keep the sticky arm.
    arm();
    recordAdClickEstimate();
  }

  function watchClicks() {
    if (clicksWatching) return;
    clicksWatching = true;

    document.addEventListener(
      "pointerover",
      function (event) {
        if (isAdArea(event.target)) arm();
      },
      true,
    );
    document.addEventListener(
      "mouseover",
      function (event) {
        if (isAdArea(event.target)) arm();
      },
      true,
    );
    document.addEventListener(
      "pointerdown",
      function (event) {
        if (isSiteArticleLink(event.target)) {
          markSiteNavigation();
          return;
        }
        if (isAdArea(event.target)) arm();
      },
      true,
    );
    document.addEventListener(
      "click",
      function (event) {
        if (!isSiteArticleLink(event.target)) return;
        if (event.defaultPrevented) {
          siteNavAt = 0;
          return;
        }
        markSiteNavigation();
      },
      true,
    );
    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key !== "Enter") return;
        if (isSiteArticleLink(event.target)) markSiteNavigation();
      },
      true,
    );
    document.addEventListener(
      "touchstart",
      function (event) {
        if (isSiteArticleLink(event.target)) {
          markSiteNavigation();
          return;
        }
        if (isAdArea(event.target)) arm();
      },
      { capture: true, passive: true },
    );
    document.addEventListener(
      "focusin",
      function (event) {
        if (isAdArea(event.target)) arm();
      },
      true,
    );
    window.addEventListener(
      "focus",
      function () {
        if (isAdArea(document.activeElement)) arm();
      },
      true,
    );

    if (window.navigation && typeof window.navigation.addEventListener === "function") {
      window.navigation.addEventListener("navigate", function (event) {
        try {
          var url = new URL(event.destination.url);
          if (url.origin !== location.origin) return;
          if (url.pathname === location.pathname && url.search === location.search) return;
          markSiteNavigation();
        } catch (err) {
          // ignore malformed destinations
        }
      });
    }

    window.addEventListener("blur", recordIfArmed);
    window.addEventListener("pagehide", recordIfArmed);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") recordIfArmed();
    });
  }

  function loadAdsenseScript() {
    if (isBlocked()) return;
    if (document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      return;
    }
    var script = document.createElement("script");
    script.async = true;
    script.src = SCRIPT_SRC;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }

  function pushAdsense() {
    if (isBlocked()) return;
    var queue = (window.adsbygoogle = window.adsbygoogle || []);
    queue.push({});
  }

  function fillPendingAdSlots() {
    if (isBlocked()) {
      enforce();
      return;
    }
    var slots = document.querySelectorAll("[data-display-ad]");
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      if (slot.hidden) continue;
      if (slot.querySelector("ins.adsbygoogle")) continue;
      var client = slot.getAttribute("data-ad-client");
      var adSlot = slot.getAttribute("data-ad-slot");
      if (!client || !adSlot) continue;
      var ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.setAttribute("data-ad-client", client);
      ins.setAttribute("data-ad-slot", adSlot);
      ins.setAttribute("data-ad-format", slot.getAttribute("data-ad-format") || "auto");
      if (slot.getAttribute("data-full-width-responsive") !== "false") {
        ins.setAttribute("data-full-width-responsive", "true");
      }
      slot.appendChild(ins);
    }
  }

  function boot() {
    if (isBlocked()) {
      enforce();
      return;
    }
    watchClicks();
    loadAdsenseScript();
  }

  window.PassportAdsense = {
    key: KEY,
    isBlocked: isBlocked,
    fillPendingAdSlots: fillPendingAdSlots,
    push: pushAdsense,
  };

  boot();
})();
