// Sections UI: How it works formulas, CTA setup, and Scroll Reveal
import { CONFIG } from "../config.js";
import { t } from "./copy.js";

let howCardSkip = null;
let howCardNeed = null;
let howSkipLive = null;
let howNeedLive = null;
let howLoopText = null;
let targetSpans = [];

let ctaBody = null;
let ctaProgramBtn = null;
let ctaWhatsappBtn = null;

export function initSections(elements = {}) {
  howCardSkip = elements.howCardSkip || document.getElementById("how-card-skip");
  howCardNeed = elements.howCardNeed || document.getElementById("how-card-need");
  howSkipLive = elements.howSkipLive || document.getElementById("how-skip-live");
  howNeedLive = elements.howNeedLive || document.getElementById("how-need-live");
  howLoopText = elements.howLoopText || document.getElementById("how-loop-text");
  targetSpans = Array.from(document.querySelectorAll(".formula-target-val"));

  ctaBody = elements.ctaBody || document.getElementById("cta-body");
  ctaProgramBtn = elements.ctaProgramBtn || document.getElementById("cta-program-btn");
  ctaWhatsappBtn = elements.ctaWhatsappBtn || document.getElementById("cta-whatsapp-btn");

  // Setup CTA body with program name
  if (ctaBody) {
    ctaBody.textContent = t("cta.body", { program: CONFIG.program.name });
  }

  // Setup CTA program link with UTM
  if (ctaProgramBtn) {
    try {
      let base = CONFIG.website || "https://wrench-wise.com";
      if (CONFIG.program.page) {
        base = base.replace(/\/$/, "") + "/" + CONFIG.program.page.replace(/^\//, "");
      }
      const url = new URL(base);
      url.searchParams.set("utm_source", CONFIG.utm.source);
      url.searchParams.set("utm_medium", CONFIG.utm.medium);
      url.searchParams.set("utm_campaign", CONFIG.utm.campaign);
      ctaProgramBtn.href = url.toString();
    } catch {
      ctaProgramBtn.href = CONFIG.website || "https://wrench-wise.com";
    }
  }

  // Setup WhatsApp button if salesWhatsApp is configured
  if (ctaWhatsappBtn) {
    if (CONFIG.salesWhatsApp) {
      ctaWhatsappBtn.classList.remove("is-hidden");
      const text = CONFIG.whatsAppText.replace("{program}", CONFIG.program.name);
      ctaWhatsappBtn.href = `https://api.whatsapp.com/send?phone=${encodeURIComponent(CONFIG.salesWhatsApp)}&text=${encodeURIComponent(text)}`;
    } else {
      ctaWhatsappBtn.classList.add("is-hidden");
    }
  }

  initScrollReveal();
}

export function updateSections(result) {
  if (!CONFIG.features.howItWorks) return;

  const target = result && result.ok ? result.target : (CONFIG.targets[0] || 75);
  for (const span of targetSpans) {
    span.textContent = String(target);
  }

  if (!result || !result.ok) {
    howCardSkip?.classList.remove("card-active-formula");
    howCardNeed?.classList.remove("card-active-formula");
    if (howSkipLive) howSkipLive.textContent = "";
    if (howNeedLive) howNeedLive.textContent = "";
    if (howLoopText) howLoopText.textContent = t("how.loop", { checks: 5 });
    return;
  }

  // Highlight card and show live formula
  if (result.status === "safe" || result.status === "edge") {
    howCardSkip?.classList.add("card-active-formula");
    howCardNeed?.classList.remove("card-active-formula");
    if (howSkipLive) {
      howSkipLive.textContent = t("how.yours", {
        top: result.formula.top,
        bottom: result.formula.bottom,
        answer: result.big
      });
    }
    if (howNeedLive) howNeedLive.textContent = "";
  } else {
    howCardNeed?.classList.add("card-active-formula");
    howCardSkip?.classList.remove("card-active-formula");
    if (howNeedLive) {
      howNeedLive.textContent = t("how.yours", {
        top: result.formula.top,
        bottom: result.formula.bottom,
        answer: result.big
      });
    }
    if (howSkipLive) howSkipLive.textContent = "";
  }

  if (howLoopText) {
    howLoopText.textContent = t("how.loop", { checks: result.big + 1 });
  }
}

export function initScrollReveal() {
  if (typeof window === "undefined") return;

  const reveals = document.querySelectorAll(".reveal-on-scroll");
  if (!reveals.length) return;

  const isReduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || isReduced) {
    reveals.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach((el) => observer.observe(el));
}
