// Motion utilities: loader timing, reduced motion, number tween, and micro-interactions.
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

let activeTweenId = null;

export function tweenNumber(element, targetVal, duration = CONFIG.countMs || 450) {
  if (!element) return;

  if (activeTweenId !== null) {
    cancelAnimationFrame(activeTweenId);
    activeTweenId = null;
  }

  if (isReducedMotion()) {
    element.textContent = String(targetVal);
    return;
  }

  const parsedCurrent = parseInt(element.textContent, 10);
  const startVal = Number.isFinite(parsedCurrent) ? parsedCurrent : 0;
  if (startVal === targetVal) {
    element.textContent = String(targetVal);
    return;
  }

  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // Standard ease-out cubic curve
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (targetVal - startVal) * easeOut);
    element.textContent = String(current);

    if (progress < 1) {
      activeTweenId = requestAnimationFrame(step);
    } else {
      element.textContent = String(targetVal);
      activeTweenId = null;
    }
  }

  activeTweenId = requestAnimationFrame(step);
}

export function bumpElement(element, deltaY) {
  if (!element || isReducedMotion()) return;
  element.style.transition = "transform 0.1s var(--ease-out)";
  element.style.transform = `translateY(${deltaY}px)`;
  setTimeout(() => {
    element.style.transform = "translateY(0)";
  }, 100);
}
