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
import { initWhatIf, updateWhatIf } from "./whatif-ui.js";
import { initToday, updateToday } from "./today-ui.js";
import { initShare, updateShare } from "./share-ui.js";
import { initSections, updateSections } from "./sections-ui.js";

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

  function updateAllSections(result, { immediate = false } = {}) {
    renderMeter(meterCard, result, { immediate });
    updateWhatIf(result);
    updateToday(result);
    updateShare(result);
    updateSections(result);
  }

  function handleCalculate({ immediate = false } = {}) {
    if (!inputUI) return;
    const { attended, total, target } = inputUI.getValues();

    if (String(attended).trim() === "" && String(total).trim() === "") {
      inputUI.clearErrors();
      updateAllSections(null, { immediate });
      return;
    }

    const r = calc(attended, total, target);
    if (!r.ok) {
      inputUI.showError(r.field, r.error);
      updateAllSections(null, { immediate });
      return;
    }

    inputUI.clearErrors();
    updateAllSections(r, { immediate });

    if (CONFIG.features.saveOnDevice) {
      saveAttendance(target, [
        { id: "overall", name: "Overall", attended: r.attended, total: r.total }
      ]);
    }

    announcePolite(r);
  }

  function handleReset() {
    updateAllSections(null);
  }

  inputUI = initInputUI({
    onUpdate: () => handleCalculate({ immediate: false }),
    onReset: handleReset,
    initialTarget: CONFIG.targets[0] || 75
  });

  // Initialize What if, Today, Share, Sections
  initWhatIf();
  initToday({}, {
    getCurrent: () => {
      if (!inputUI) return null;
      const { attended, total } = inputUI.getValues();
      return {
        attended: Number(attended) || 0,
        total: Number(total) || 0
      };
    },
    onUpdate: (nextAttended, nextTotal) => {
      if (!inputUI) return;
      inputUI.setValues({ attended: nextAttended, total: nextTotal });
      handleCalculate({ immediate: false });
    }
  });
  initShare();
  initSections();

  // Clear data handler
  if (saveClearBtn) {
    saveClearBtn.addEventListener("click", () => {
      clearAttendance();
      inputUI.setValues({ attended: "", total: "", target: CONFIG.targets[0] || 75 });
      inputUI.clearErrors();
      updateAllSections(null);
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
      updateAllSections(null, { immediate: true });
    }
  } else {
    updateAllSections(null, { immediate: true });
  }

  // In-browser self-tests trigger (?test=1)
  if (params.get("test") === "1" || params.has("test")) {
    import("./selftest.js").then((m) => {
      m.runSelfTests();
    });
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
