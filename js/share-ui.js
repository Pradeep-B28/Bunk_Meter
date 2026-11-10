// Share functionality (Web Share API, WhatsApp fallback, clipboard copy)
import { CONFIG } from "../config.js";
import { t } from "./copy.js";

let sectionEl = null;
let previewTextEl = null;
let shareBtn = null;
let shareBtnLabel = null;
let shareBtnIcon = null;

let currentResult = null;
let revertTimer = null;

const SHARE_SVG = '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>';
const CHECK_SVG = '<polyline points="20 6 9 17 4 12"></polyline>';

function buildShareMessage() {
  if (!currentResult || !currentResult.ok) return { text: "", url: "", full: "" };

  let text = "";
  if (currentResult.status === "safe") {
    text = t("share.safe", { count: currentResult.big, target: currentResult.target });
  } else if (currentResult.status === "edge") {
    text = t("share.edge", { target: currentResult.target });
  } else {
    text = t("share.danger", { count: currentResult.big, target: currentResult.target });
  }

  const base = CONFIG.siteUrl || (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
  const utm = `utm_source=${encodeURIComponent(CONFIG.utm.source)}&utm_medium=${encodeURIComponent(CONFIG.utm.medium)}&utm_campaign=${encodeURIComponent(CONFIG.utm.campaign)}`;
  const url = base.includes("?") ? `${base}&${utm}` : `${base}?${utm}`;
  const full = `${text} ${url}`;

  return { text, url, full };
}

function showFeedback() {
  if (!shareBtn || !shareBtnLabel) return;

  clearTimeout(revertTimer);
  shareBtnLabel.textContent = t("share.copied");
  if (shareBtnIcon) {
    while (shareBtnIcon.firstChild) shareBtnIcon.removeChild(shareBtnIcon.firstChild);
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    poly.setAttribute("points", "20 6 9 17 4 12");
    shareBtnIcon.appendChild(poly);
  }

  revertTimer = setTimeout(() => {
    shareBtnLabel.textContent = t("share.button");
    if (shareBtnIcon) {
      while (shareBtnIcon.firstChild) shareBtnIcon.removeChild(shareBtnIcon.firstChild);
      // Restore share circles and lines
      const c1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c1.setAttribute("cx", "18"); c1.setAttribute("cy", "5"); c1.setAttribute("r", "3");
      const c2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c2.setAttribute("cx", "6"); c2.setAttribute("cy", "12"); c2.setAttribute("r", "3");
      const c3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c3.setAttribute("cx", "18"); c3.setAttribute("cy", "19"); c3.setAttribute("r", "3");
      const l1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      l1.setAttribute("x1", "8.59"); l1.setAttribute("y1", "13.51"); l1.setAttribute("x2", "15.42"); l1.setAttribute("y2", "17.49");
      const l2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      l2.setAttribute("x1", "15.41"); l2.setAttribute("y1", "6.51"); l2.setAttribute("x2", "8.59"); l2.setAttribute("y2", "10.49");
      shareBtnIcon.appendChild(c1);
      shareBtnIcon.appendChild(c2);
      shareBtnIcon.appendChild(c3);
      shareBtnIcon.appendChild(l1);
      shareBtnIcon.appendChild(l2);
    }
  }, 1500);
}

function handleShare() {
  const { text, url, full } = buildShareMessage();
  if (!full) return;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    navigator.share({
      title: "Bunk Meter | Wrench Wise",
      text,
      url
    }).then(() => {
      showFeedback();
    }).catch(() => {});
  } else {
    // Fallback: WhatsApp share
    const waUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(full);
    window.open(waUrl, "_blank", "noopener,noreferrer");

    // Also copy to clipboard for convenience
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(full).then(() => {
        showFeedback();
      }).catch(() => {});
    }
  }
}

export function initShare(elements = {}) {
  sectionEl = elements.section || document.getElementById("sec-share");
  previewTextEl = elements.previewText || document.getElementById("share-preview-text");
  shareBtn = elements.btn || document.getElementById("share-action-btn");
  shareBtnLabel = elements.btnLabel || document.getElementById("share-btn-label");
  shareBtnIcon = elements.btnIcon || document.getElementById("share-btn-icon");

  if (!CONFIG.features.share) {
    if (sectionEl) sectionEl.dataset.visible = "false";
    return;
  }

  shareBtn?.addEventListener("click", handleShare);
}

export function updateShare(result) {
  if (!CONFIG.features.share) {
    if (sectionEl) {
      sectionEl.dataset.visible = "false";
      sectionEl.setAttribute("aria-hidden", "true");
    }
    return;
  }

  if (!result || !result.ok) {
    currentResult = null;
    if (sectionEl) {
      sectionEl.dataset.visible = "false";
      sectionEl.setAttribute("aria-hidden", "true");
    }
    return;
  }

  currentResult = result;
  if (sectionEl) {
    sectionEl.dataset.visible = "true";
    sectionEl.removeAttribute("aria-hidden");
  }

  const { text } = buildShareMessage();
  if (previewTextEl) {
    previewTextEl.textContent = text;
  }
}
