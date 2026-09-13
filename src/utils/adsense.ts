import enabledData from "../data/adsense/enabled.json";
import adsTxtData from "../data/adsense/ads-txt.json";
import headScriptData from "../data/adsense/head-script.json";
import displayData from "../data/adsense/display.json";
import multiplexData from "../data/adsense/multiplex.json";

export type AdsenseConfig = {
  enabled: boolean;
  ads_txt: string;
  head_script: string;
  display: { code: string; code_home?: string };
  multiplex: { code: string };
};

export function getAdsenseConfig(): AdsenseConfig {
  return {
    enabled: enabledData.enabled,
    ads_txt: adsTxtData.content,
    head_script: headScriptData.script,
    display: displayData,
    multiplex: multiplexData,
  };
}

export function isAdsenseActive(config: AdsenseConfig = getAdsenseConfig()): boolean {
  return config.enabled;
}

export function hasHeadScript(config: AdsenseConfig = getAdsenseConfig()): boolean {
  return isAdsenseActive(config) && Boolean(config.head_script?.trim());
}

export function hasHomeAd(config: AdsenseConfig = getAdsenseConfig()): boolean {
  return isAdsenseActive(config) && Boolean(config.display.code_home?.trim());
}

export function getHomeAdCode(config: AdsenseConfig = getAdsenseConfig()): string {
  return (config.display.code_home || "").trim();
}

export function hasDisplayAd(config: AdsenseConfig = getAdsenseConfig()): boolean {
  return isAdsenseActive(config) && Boolean(config.display.code?.trim());
}

export function getDisplayAdCode(config: AdsenseConfig = getAdsenseConfig()): string {
  return (config.display.code || "").trim();
}

export function hasMultiplexAd(config: AdsenseConfig = getAdsenseConfig()): boolean {
  return isAdsenseActive(config) && Boolean(config.multiplex.code?.trim());
}
