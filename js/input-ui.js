// Input card UI: inputs, steppers, target pills, example chips, reset, and errors.
import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { bumpElement } from "./motion.js";
import { MAX_CLASSES } from "./engine/bunk.js";

export function initInputUI({ onUpdate, onReset, initialTarget = 75 }) {
  const attendedInput = document.getElementById("attended");
  const totalInput = document.getElementById("total");
  const errorAttended = document.getElementById("error-attended");
  const errorTotal = document.getElementById("error-total");

  const attendedMinus = document.getElementById("attended-minus");
  const attendedPlus = document.getElementById("attended-plus");
  const totalMinus = document.getElementById("total-minus");
  const totalPlus = document.getElementById("total-plus");

  const targetPillsContainer = document.getElementById("target-pills");
  const exampleSafe = document.getElementById("example-safe");
  const exampleDanger = document.getElementById("example-danger");
  const resetBtn = document.getElementById("reset-inputs");
  const heroSub = document.getElementById("hero-sub");

  let currentTarget = initialTarget;

  function setHeroSub(target) {
    if (heroSub) {
      heroSub.textContent = t("hero.sub", { target });
    }
  }

  function setTarget(target) {
    currentTarget = target;
    setHeroSub(target);
    if (targetPillsContainer) {
      const pills = targetPillsContainer.querySelectorAll(".target-pill");
      pills.forEach((p) => {
        const val = parseInt(p.getAttribute("data-target"), 10);
        p.setAttribute("aria-pressed", val === target ? "true" : "false");
      });
    }
  }

  function clearErrors() {
    if (errorAttended) errorAttended.textContent = "";
    if (errorTotal) errorTotal.textContent = "";
    if (attendedInput) attendedInput.classList.remove("input-invalid");
    if (totalInput) totalInput.classList.remove("input-invalid");
  }

  function showError(field, errorCode) {
    clearErrors();
    const message = COPY.errors[errorCode] || "";
    if (field === "attended" && errorAttended && attendedInput) {
      errorAttended.textContent = message;
      attendedInput.classList.add("input-invalid");
    } else if (field === "total" && errorTotal && totalInput) {
      errorTotal.textContent = message;
      totalInput.classList.add("input-invalid");
    }
  }

  // Stepper binding with repeat-on-hold
  function bindStepper(btn, action) {
    if (!btn) return;

    let timer = null;
    let interval = null;

    function startHold(e) {
      if (e.button && e.button !== 0) return;
      e.preventDefault();
      action();

      stopHold();
      timer = setTimeout(() => {
        interval = setInterval(() => {
          action();
        }, CONFIG.holdRepeatMs || 90);
      }, 300);
    }

    function stopHold() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    btn.addEventListener("pointerdown", startHold);
    btn.addEventListener("pointerup", stopHold);
    btn.addEventListener("pointercancel", stopHold);
    btn.addEventListener("pointerleave", stopHold);
  }

  // Attended minus: never goes below 0
  bindStepper(attendedMinus, () => {
    const curr = parseInt(attendedInput.value, 10);
    const val = Number.isFinite(curr) ? Math.max(0, curr - 1) : 0;
    attendedInput.value = String(val);
    bumpElement(attendedInput, 4);
    if (typeof onUpdate === "function") onUpdate();
  });

  // Attended plus: raises total too if attended > total
  bindStepper(attendedPlus, () => {
    const currA = parseInt(attendedInput.value, 10);
    const currT = parseInt(totalInput.value, 10);
    const a = Number.isFinite(currA) ? currA : 0;
    const tVal = Number.isFinite(currT) ? currT : 0;

    const newA = Math.min(MAX_CLASSES, a + 1);
    attendedInput.value = String(newA);
    if (newA > tVal) {
      totalInput.value = String(newA);
    }
    bumpElement(attendedInput, -4);
    if (typeof onUpdate === "function") onUpdate();
  });

  // Total minus: never goes below 0
  bindStepper(totalMinus, () => {
    const curr = parseInt(totalInput.value, 10);
    const val = Number.isFinite(curr) ? Math.max(0, curr - 1) : 0;
    totalInput.value = String(val);
    bumpElement(totalInput, 4);
    if (typeof onUpdate === "function") onUpdate();
  });

  // Total plus: never passes MAX_CLASSES
  bindStepper(totalPlus, () => {
    const curr = parseInt(totalInput.value, 10);
    const tVal = Number.isFinite(curr) ? curr : 0;
    const newT = Math.min(MAX_CLASSES, tVal + 1);
    totalInput.value = String(newT);
    bumpElement(totalInput, -4);
    if (typeof onUpdate === "function") onUpdate();
  });

  // Live typing on inputs
  if (attendedInput) {
    attendedInput.addEventListener("input", () => {
      if (typeof onUpdate === "function") onUpdate();
    });
  }

  if (totalInput) {
    totalInput.addEventListener("input", () => {
      if (typeof onUpdate === "function") onUpdate();
    });
  }

  // Target pills
  if (targetPillsContainer) {
    targetPillsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".target-pill");
      if (!btn) return;
      const target = parseInt(btn.getAttribute("data-target"), 10);
      if (target && target !== currentTarget) {
        setTarget(target);
        if (typeof onUpdate === "function") onUpdate();
      }
    });
  }

  // Examples
  if (exampleSafe) {
    exampleSafe.addEventListener("click", () => {
      clearErrors();
      attendedInput.value = String(CONFIG.examples.safe.attended);
      totalInput.value = String(CONFIG.examples.safe.total);
      if (typeof onUpdate === "function") onUpdate();
    });
  }

  if (exampleDanger) {
    exampleDanger.addEventListener("click", () => {
      clearErrors();
      attendedInput.value = String(CONFIG.examples.danger.attended);
      totalInput.value = String(CONFIG.examples.danger.total);
      if (typeof onUpdate === "function") onUpdate();
    });
  }

  // Reset
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      clearErrors();
      attendedInput.value = "";
      totalInput.value = "";
      if (typeof onReset === "function") onReset();
    });
  }

  return {
    getValues: () => ({
      attended: attendedInput ? attendedInput.value : "",
      total: totalInput ? totalInput.value : "",
      target: currentTarget
    }),
    setValues: ({ attended, total, target }) => {
      if (attendedInput && attended !== undefined) attendedInput.value = String(attended);
      if (totalInput && total !== undefined) totalInput.value = String(total);
      if (target !== undefined) setTarget(target);
    },
    showError,
    clearErrors,
    getTarget: () => currentTarget
  };
}
