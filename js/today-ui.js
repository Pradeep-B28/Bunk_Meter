// Today buttons controller (I attended, I skipped, Undo)
import { logClass } from "./engine/bunk.js";
import { CONFIG } from "../config.js";
import { t } from "./copy.js";
import { isReducedMotion } from "./motion.js";

let cardEl = null;
let attendedBtn = null;
let skippedBtn = null;
let undoBtn = null;
let msgEl = null;

let onUpdateCallback = null;
let getCurrentValues = null;

let lastSnapshot = null; // Single-step undo storage: { attended, total }

function spawnFloatChip(inputWrapperId) {
  if (isReducedMotion()) return;
  const wrapper = document.getElementById(inputWrapperId)?.closest(".input-row");
  if (!wrapper) return;

  const chip = document.createElement("span");
  chip.className = "float-chip";
  chip.textContent = "+1";
  chip.setAttribute("aria-hidden", "true");
  wrapper.appendChild(chip);

  setTimeout(() => {
    chip.remove();
  }, 650);
}

function handleLog(present) {
  if (!getCurrentValues || !onUpdateCallback) return;

  const current = getCurrentValues();
  if (!current || typeof current.attended !== "number" || typeof current.total !== "number") {
    return;
  }

  const next = logClass(current.attended, current.total, present);
  if (!next) {
    if (msgEl) msgEl.textContent = t("today.full");
    return;
  }

  // Save for one-step undo
  lastSnapshot = {
    attended: current.attended,
    total: current.total
  };
  if (undoBtn) undoBtn.disabled = false;

  // Float +1 feedback
  if (present) {
    spawnFloatChip("attended");
  }
  spawnFloatChip("total");

  if (msgEl) msgEl.textContent = t("today.done");

  onUpdateCallback(next.attended, next.total);
}

function handleUndo() {
  if (!lastSnapshot || !onUpdateCallback) return;

  const restored = lastSnapshot;
  lastSnapshot = null;
  if (undoBtn) undoBtn.disabled = true;
  if (msgEl) msgEl.textContent = "";

  onUpdateCallback(restored.attended, restored.total);
}

export function initToday(elements = {}, callbacks = {}) {
  cardEl = elements.card || document.getElementById("today-card");
  attendedBtn = elements.attendedBtn || document.getElementById("today-attended-btn");
  skippedBtn = elements.skippedBtn || document.getElementById("today-skipped-btn");
  undoBtn = elements.undoBtn || document.getElementById("today-undo-btn");
  msgEl = elements.msg || document.getElementById("today-msg");

  getCurrentValues = callbacks.getCurrent;
  onUpdateCallback = callbacks.onUpdate;

  if (!CONFIG.features.todayButtons) {
    if (cardEl) cardEl.dataset.visible = "false";
    return;
  }

  attendedBtn?.addEventListener("click", () => handleLog(true));
  skippedBtn?.addEventListener("click", () => handleLog(false));
  undoBtn?.addEventListener("click", handleUndo);
}

export function updateToday(result) {
  if (!CONFIG.features.todayButtons) {
    if (cardEl) cardEl.dataset.visible = "false";
    return;
  }
  // Clear any limit warning if numbers changed below max
  if (result && result.ok && result.total < 5000 && msgEl?.textContent === t("today.full")) {
    msgEl.textContent = "";
  }
}
