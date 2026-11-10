// What if simulation UI controller
import { project } from "./engine/bunk.js";
import { CONFIG } from "../config.js";
import { t } from "./copy.js";

let cardEl = null;
let badgeEl = null;
let skipBtn = null;
let attendBtn = null;
let actionLabelEl = null;
let countValEl = null;
let sliderEl = null;
let statementEl = null;

let currentResult = null;
let currentAction = "skip";
let currentCount = 0;

function computeAndRender() {
  if (!currentResult || !currentResult.ok) return;

  const attended = currentResult.attended;
  const total = currentResult.total;
  const target = currentResult.target;

  const opts = currentAction === "attend" ? { attend: currentCount } : { skip: currentCount };
  const proj = project(attended, total, target, opts);

  // Badge
  if (proj.meets) {
    badgeEl.textContent = t("whatIf.above", { target });
    badgeEl.className = "badge whatif-badge badge-safe";
  } else {
    badgeEl.textContent = t("whatIf.below", { target });
    badgeEl.className = "badge whatif-badge badge-danger";
  }

  // Statement
  const actionWord = currentAction === "attend" ? "attend" : "skip";
  if (currentCount === 0) {
    statementEl.textContent = t("whatIf.lineZero");
  } else if (currentCount === 1) {
    statementEl.textContent = t("whatIf.lineOne", { action: actionWord, percent: proj.text });
  } else {
    statementEl.textContent = t("whatIf.line", { action: actionWord, count: currentCount, percent: proj.text });
  }
}

export function setWhatIf(action, count) {
  if (action === "attend" || action === "skip") {
    currentAction = action;
  }
  const max = CONFIG.whatIfMax || 30;
  currentCount = Math.max(0, Math.min(Number(count) || 0, max));

  if (sliderEl) {
    sliderEl.value = String(currentCount);
  }
  if (countValEl) {
    countValEl.textContent = String(currentCount);
  }
  if (actionLabelEl) {
    actionLabelEl.textContent = currentAction;
  }

  if (skipBtn && attendBtn) {
    skipBtn.setAttribute("aria-pressed", currentAction === "skip" ? "true" : "false");
    attendBtn.setAttribute("aria-pressed", currentAction === "attend" ? "true" : "false");
  }

  computeAndRender();
}

export function getWhatIfState() {
  return {
    action: currentAction,
    count: currentCount,
    statement: statementEl ? statementEl.textContent : "",
    badge: badgeEl ? badgeEl.textContent : ""
  };
}

export function updateWhatIf(result) {
  if (!CONFIG.features.whatIf) {
    if (cardEl) {
      cardEl.dataset.visible = "false";
      cardEl.setAttribute("aria-hidden", "true");
    }
    return;
  }

  if (!result || !result.ok) {
    currentResult = null;
    if (cardEl) {
      cardEl.dataset.visible = "false";
      cardEl.setAttribute("aria-hidden", "true");
    }
    return;
  }

  currentResult = result;
  if (cardEl) {
    cardEl.dataset.visible = "true";
    cardEl.removeAttribute("aria-hidden");
  }

  // Opens on the edge case: if below target, action is attend and count is need; otherwise skip and count is skip
  if (result.status === "below") {
    currentAction = "attend";
    currentCount = Math.min(result.need, CONFIG.whatIfMax);
  } else {
    currentAction = "skip";
    currentCount = Math.min(result.skip, CONFIG.whatIfMax);
  }

  if (sliderEl) {
    sliderEl.max = String(CONFIG.whatIfMax);
    sliderEl.value = String(currentCount);
  }
  if (countValEl) {
    countValEl.textContent = String(currentCount);
  }
  if (actionLabelEl) {
    actionLabelEl.textContent = currentAction;
  }
  if (skipBtn && attendBtn) {
    skipBtn.setAttribute("aria-pressed", currentAction === "skip" ? "true" : "false");
    attendBtn.setAttribute("aria-pressed", currentAction === "attend" ? "true" : "false");
  }

  computeAndRender();
}

export function initWhatIf(elements = {}) {
  cardEl = elements.card || document.getElementById("whatif-card");
  badgeEl = elements.badge || document.getElementById("whatif-badge");
  skipBtn = elements.skipBtn || document.getElementById("whatif-skip-btn");
  attendBtn = elements.attendBtn || document.getElementById("whatif-attend-btn");
  actionLabelEl = elements.actionLabel || document.getElementById("whatif-action-label");
  countValEl = elements.countVal || document.getElementById("whatif-count-val");
  sliderEl = elements.slider || document.getElementById("whatif-slider");
  statementEl = elements.statement || document.getElementById("whatif-statement");

  if (!cardEl || !sliderEl) return;

  if (sliderEl) {
    sliderEl.max = String(CONFIG.whatIfMax);
  }

  skipBtn?.addEventListener("click", () => {
    setWhatIf("skip", sliderEl.value);
  });

  attendBtn?.addEventListener("click", () => {
    setWhatIf("attend", sliderEl.value);
  });

  sliderEl?.addEventListener("input", () => {
    const val = Number(sliderEl.value);
    currentCount = val;
    if (countValEl) countValEl.textContent = String(val);
    computeAndRender();
  });
}
