// Main entry point for Bunk Meter
import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import {
  isStorageAvailable,
  getStoredTheme,
  setStoredTheme,
  isIntroSeen,
  setIntroSeen
} from "./store.js";
import { initLoader } from "./motion.js";

function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") &&
       window.matchMedia &&
       window.matchMedia("(prefers-color-scheme: dark)").matches);

    const nextTheme = isDark ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    setStoredTheme(nextTheme);
  });
}

function initLogoFallback() {
  const logoImgs = document.querySelectorAll("img.brand-logo, img.loader-logo");
  logoImgs.forEach((img) => {
    img.addEventListener("error", () => {
      img.style.display = "none";
      const fallback = img.parentElement?.querySelector(".brand-fallback, .loader-logo-fallback");
      if (fallback) {
        fallback.style.display = "inline-block";
      }
    });
  });
}

function initStorageCheck() {
  const available = isStorageAvailable();
  if (!available) {
    const saveWrap = document.getElementById("save-status-wrap");
    if (saveWrap) {
      saveWrap.textContent = t("save.blocked");
    }
  }
}

function start() {
  initTheme();
  initLogoFallback();
  initStorageCheck();

  const hero = document.querySelector(".hero-section");
  initLoader(() => {
    setIntroSeen();
    if (hero) {
      hero.classList.add("hero-revealed");
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
