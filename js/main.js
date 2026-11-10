// Main entry point for Bunk Meter
import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { calc } from "./engine/bunk.js";
import {
  isStorageAvailable,
  saveAttendance,
  loadAttendance,
  clearAttendance,
  getStoredTheme,
  setStoredTheme,
  isIntroSeen,
  setIntroSeen
} from "./store.js";
import { initLoader } from "./motion.js";
import { initInputUI } from "./input-ui.js";
import { renderMeter } from "./meter-ui.js";

let ariaTimer = null;

function announcePolite(result) {
  const liveRegion = document.getElementById("bm-live-region");
  if (!liveRegion) return;

  if (ariaTimer) {
    clearTimeout(ariaTimer);
    ariaTimer = null;
  }

  if (!result || !result.ok) return;

  ariaTimer = setTimeout(() => {
    let msg = "";
    if (result.status === "safe") {
      msg = result.big === 1
        ? "You can skip 1 class"
        : `You can skip ${result.big} classes`;
    } else if (result.status === "edge") {
      msg = `Don't skip the next class. You are right at ${result.target}% attendance.`;
    } else {
      msg = result.big === 1
        ? "Attend the next class"
        : `Attend the next ${result.big} classes`;
    }
    liveRegion.textContent = msg;
  }, 500);
}

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

  const meterCard = document.getElementById("meter-card");
  const saveClearBtn = document.getElementById("save-clear-btn");
  const saveStatusText = document.getElementById("save-status-text");

  let inputUI = null;

  function handleCalculate({ immediate = false } = {}) {
    if (!inputUI) return;
    const { attended, total, target } = inputUI.getValues();

    if (String(attended).trim() === "" && String(total).trim() === "") {
      inputUI.clearErrors();
      renderMeter(meterCard, null, { immediate });
      return;
    }

    const r = calc(attended, total, target);
    if (!r.ok) {
      inputUI.showError(r.field, r.error);
      renderMeter(meterCard, null, { immediate });
      return;
    }

    inputUI.clearErrors();
    renderMeter(meterCard, r, { immediate });

    if (CONFIG.features.saveOnDevice) {
      saveAttendance(target, [
        { id: "overall", name: "Overall", attended: r.attended, total: r.total }
      ]);
    }

    announcePolite(r);
  }

  function handleReset() {
    renderMeter(meterCard, null);
  }

  inputUI = initInputUI({
    onUpdate: () => handleCalculate({ immediate: false }),
    onReset: handleReset,
    initialTarget: CONFIG.targets[0] || 75
  });

  // Clear data handler
  if (saveClearBtn) {
    saveClearBtn.addEventListener("click", () => {
      clearAttendance();
      inputUI.setValues({ attended: "", total: "", target: CONFIG.targets[0] || 75 });
      inputUI.clearErrors();
      renderMeter(meterCard, null);
      if (saveStatusText) {
        saveStatusText.textContent = t("save.cleared");
        setTimeout(() => {
          saveStatusText.textContent = t("save.on");
        }, 2000);
      }
    });
  }

  // Restore saved data or URL query params on load
  const params = new URLSearchParams(window.location.search);
  const qA = params.get("a");
  const qT = params.get("t");
  const qTarget = parseInt(params.get("target"), 10);

  if (qA !== null && qT !== null) {
    const validT = CONFIG.targets.includes(qTarget) ? qTarget : (CONFIG.targets[0] || 75);
    inputUI.setValues({
      attended: qA,
      total: qT,
      target: validT
    });
    handleCalculate({ immediate: true });
  } else if (CONFIG.features.saveOnDevice) {
    const saved = loadAttendance(CONFIG.targets);
    if (saved && saved.subjects && saved.subjects[0]) {
      const s0 = saved.subjects[0];
      inputUI.setValues({
        attended: s0.attended,
        total: s0.total,
        target: saved.target
      });
      handleCalculate({ immediate: true });
    } else {
      renderMeter(meterCard, null, { immediate: true });
    }
  } else {
    renderMeter(meterCard, null, { immediate: true });
  }

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
