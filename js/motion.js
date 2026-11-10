// Motion utilities: loader timing, reduced motion, and tween helpers.
import { CONFIG } from "../config.js";

export function isReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initLoader(onComplete) {
  const loader = document.getElementById("bm-loader");
  if (!loader) {
    if (typeof onComplete === "function") onComplete();
    return;
  }

  if (isReducedMotion() || document.documentElement.classList.contains("intro-done")) {
    loader.classList.add("loader-done");
    loader.style.display = "none";
    if (typeof onComplete === "function") onComplete();
    return;
  }

  const duration = Math.min(CONFIG.loaderMs || 900, 900);

  setTimeout(() => {
    loader.classList.add("loader-done");
    setTimeout(() => {
      loader.style.display = "none";
      if (typeof onComplete === "function") onComplete();
    }, 250);
  }, duration);
}
