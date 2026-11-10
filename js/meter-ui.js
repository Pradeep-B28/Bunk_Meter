// Meter card renderer: gauge arc, needle, big number, colours, and detail lines.
import { t } from "./copy.js";
import { tweenNumber } from "./motion.js";

let lastStatus = "idle";

export function renderMeter(container, result, { immediate = false } = {}) {
  if (!container) return;

  const gaugeArc = container.querySelector("#gauge-arc");
  const gaugeTick = container.querySelector("#gauge-target-tick");
  const gaugeNeedle = container.querySelector("#gauge-needle-group");
  const statusLabel = container.querySelector("#meter-status-label");
  const bigNumber = container.querySelector("#meter-big-number");
  const statusUnit = container.querySelector("#meter-status-unit");
  const detailsList = container.querySelector("#meter-details");
  const gaugeWrap = container.querySelector(".meter-gauge-wrap");

  // Idle state
  if (!result || !result.ok) {
    container.setAttribute("data-status", "idle");
    lastStatus = "idle";

    if (gaugeArc) gaugeArc.style.strokeDashoffset = "251.33";
    if (gaugeNeedle) gaugeNeedle.style.transform = "rotate(-90deg)";
    if (statusLabel) statusLabel.textContent = t("meter.idle");
    if (bigNumber) bigNumber.textContent = "-";
    if (statusUnit) statusUnit.textContent = t("meter.idleSub");
    if (detailsList) {
      while (detailsList.firstChild) {
        detailsList.removeChild(detailsList.firstChild);
      }
    }
    return;
  }

  const status = result.status;

  // Ring pulse when crossing from below to safe
  if (lastStatus === "below" && status === "safe" && gaugeWrap && !immediate) {
    gaugeWrap.classList.remove("ring-pulse-active");
    void gaugeWrap.offsetWidth;
    gaugeWrap.classList.add("ring-pulse-active");
    setTimeout(() => {
      gaugeWrap.classList.remove("ring-pulse-active");
    }, 450);
  }

  // Pop micro-interaction on status change
  if (lastStatus !== "idle" && lastStatus !== status && bigNumber && !immediate) {
    bigNumber.classList.remove("number-popping");
    void bigNumber.offsetWidth;
    bigNumber.classList.add("number-popping");
    setTimeout(() => {
      bigNumber.classList.remove("number-popping");
    }, 300);
  }

  lastStatus = status;
  container.setAttribute("data-status", status);

  // 1. Gauge Needle and Arc
  const pct = Math.max(0, Math.min(100, result.now.tenths / 10));
  const dashoffset = 251.33 * (1 - pct / 100);
  if (gaugeArc) {
    gaugeArc.style.strokeDashoffset = dashoffset.toFixed(2);
  }

  const needleAngle = -90 + (pct / 100) * 180;
  if (gaugeNeedle) {
    gaugeNeedle.style.transform = `rotate(${needleAngle.toFixed(2)}deg)`;
  }

  // Target tick marker position on arc
  if (gaugeTick && typeof result.target === "number") {
    const targetRad = Math.PI * (1 - result.target / 100);
    const x1 = (100 + 80 * Math.cos(targetRad)).toFixed(2);
    const y1 = (100 - 80 * Math.sin(targetRad)).toFixed(2);
    const x2 = (100 + 90 * Math.cos(targetRad)).toFixed(2);
    const y2 = (100 - 90 * Math.sin(targetRad)).toFixed(2);
    gaugeTick.setAttribute("x1", x1);
    gaugeTick.setAttribute("y1", y1);
    gaugeTick.setAttribute("x2", x2);
    gaugeTick.setAttribute("y2", y2);
  }

  // 2. The Big Number & Labels
  if (status === "safe") {
    if (statusLabel) statusLabel.textContent = t("meter.safeLabel");
    if (statusUnit) {
      statusUnit.textContent = result.big === 1
        ? t("meter.safeUnitOne")
        : t("meter.safeUnit", { count: result.big });
    }
    if (bigNumber) {
      if (immediate) {
        bigNumber.textContent = String(result.big);
      } else {
        tweenNumber(bigNumber, result.big);
      }
    }
  } else if (status === "edge") {
    if (statusLabel) statusLabel.textContent = "";
    if (bigNumber) bigNumber.textContent = t("meter.edgeTitle");
    if (statusUnit) {
      statusUnit.textContent = t("meter.edgeSub", { target: result.target });
    }
  } else {
    // status === "below"
    if (statusLabel) statusLabel.textContent = t("meter.dangerLabel");
    if (statusUnit) {
      statusUnit.textContent = result.big === 1
        ? t("meter.dangerUnitOne")
        : t("meter.dangerUnit", { count: result.big });
    }
    if (bigNumber) {
      if (immediate) {
        bigNumber.textContent = String(result.big);
      } else {
        tweenNumber(bigNumber, result.big);
      }
    }
  }

  // 3. Lines under it
  if (detailsList) {
    while (detailsList.firstChild) {
      detailsList.removeChild(detailsList.firstChild);
    }

    const lineNow = document.createElement("div");
    lineNow.className = "meter-detail-item";
    lineNow.textContent = t("meter.now", { percent: result.now.text });
    detailsList.appendChild(lineNow);

    if (status === "safe") {
      const lineAfter = document.createElement("div");
      lineAfter.className = "meter-detail-item";
      lineAfter.textContent = result.skip === 1
        ? t("meter.afterSkipOne", { percent: result.after.text })
        : t("meter.afterSkip", { count: result.skip, percent: result.after.text });
      detailsList.appendChild(lineAfter);

      if (result.drop) {
        const lineDrop = document.createElement("div");
        lineDrop.className = "meter-detail-item";
        lineDrop.textContent = t("meter.dropLine", { percent: result.drop.text });
        detailsList.appendChild(lineDrop);
      }
    } else if (status === "edge") {
      if (result.drop) {
        const lineDrop = document.createElement("div");
        lineDrop.className = "meter-detail-item";
        lineDrop.textContent = t("meter.dropLine", { percent: result.drop.text });
        detailsList.appendChild(lineDrop);
      }
    } else if (status === "below") {
      const lineAfter = document.createElement("div");
      lineAfter.className = "meter-detail-item";
      lineAfter.textContent = result.need === 1
        ? t("meter.afterAttendOne", { percent: result.after.text })
        : t("meter.afterAttend", { count: result.need, percent: result.after.text });
      detailsList.appendChild(lineAfter);
    }

    const lineMissed = document.createElement("div");
    lineMissed.className = "meter-missed-line";
    lineMissed.textContent = t("meter.missed", { count: result.missed });
    detailsList.appendChild(lineMissed);
  }
}
