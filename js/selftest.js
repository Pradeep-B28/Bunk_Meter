// In-browser Self-Test Runner (?test=1)
import { COPY } from "./copy.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ALLOWED_KEYS = new Set(["bm-data", "bm-theme", "bm-intro-seen"]);

export async function runSelfTests() {
  // Ensure the intro loader does not obstruct the test
  const loader = document.getElementById("bm-loader");
  if (loader) {
    loader.classList.add("loader-done");
  }
  document.documentElement.classList.add("intro-done");

  // Create test overlay container
  const container = document.createElement("div");
  container.id = "selftest-results";
  container.className = "selftest-panel";

  const header = document.createElement("div");
  header.className = "selftest-header";

  const title = document.createElement("h2");
  title.className = "selftest-title";
  title.textContent = "Bunk Meter Self-Tests (?test=1)";
  header.appendChild(title);

  const statusEl = document.createElement("span");
  statusEl.className = "selftest-summary";
  statusEl.textContent = "Running 10 tests...";
  header.appendChild(statusEl);

  container.appendChild(header);

  const list = document.createElement("div");
  list.className = "selftest-list";
  container.appendChild(list);

  document.body.appendChild(container);

  // References to page elements
  const attendedInput = document.getElementById("attended");
  const totalInput = document.getElementById("total");
  const targetPills = Array.from(document.querySelectorAll(".target-pill"));
  const bigNumEl = document.getElementById("meter-big-number");
  const statusLabelEl = document.getElementById("meter-status-label");
  const statusUnitEl = document.getElementById("meter-status-unit");
  const meterDetailsEl = document.getElementById("meter-details");
  const meterCardEl = document.getElementById("meter-card");
  const errorAttendedEl = document.getElementById("error-attended");
  const whatIfSlider = document.getElementById("whatif-slider");
  const whatIfBadge = document.getElementById("whatif-badge");
  const whatIfStatement = document.getElementById("whatif-statement");
  const whatIfSkipBtn = document.getElementById("whatif-skip-btn");
  const todaySkippedBtn = document.getElementById("today-skipped-btn");
  const todayUndoBtn = document.getElementById("today-undo-btn");
  const saveClearBtn = document.getElementById("save-clear-btn");

  function setInputs(attended, total, target = 75) {
    if (attendedInput) {
      attendedInput.value = String(attended);
      attendedInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (totalInput) {
      totalInput.value = String(total);
      totalInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const pill = targetPills.find((p) => p.dataset.target === String(target));
    if (pill && pill.getAttribute("aria-pressed") !== "true") {
      pill.click();
    }
  }

  const results = [];

  function record(pass, number, name, details = "") {
    results.push(pass);
    const row = document.createElement("div");
    row.className = pass ? "selftest-row selftest-pass" : "selftest-row selftest-fail";

    const badge = document.createElement("span");
    badge.className = pass ? "selftest-badge-pass" : "selftest-badge-fail";
    badge.textContent = pass ? "PASS" : "FAIL";
    row.appendChild(badge);

    const desc = document.createElement("span");
    desc.className = "selftest-desc";
    desc.textContent = `Test ${number}: ${name}${details ? " - " + details : ""}`;
    row.appendChild(desc);

    list.appendChild(row);
  }

  // TEST 1: Doing well (33 of 40)
  setInputs(33, 40, 75);
  await sleep(600);
  const t1Big = bigNumEl?.textContent?.trim();
  const t1Label = statusLabelEl?.textContent?.trim();
  const t1Details = meterDetailsEl?.textContent || "";
  const t1Pass =
    t1Big === "4" &&
    t1Label === "You can skip" &&
    t1Details.includes("82.5%") &&
    t1Details.includes("After 4 skips: 75%") &&
    t1Details.includes("One more skip and you drop to 73.3%");
  record(t1Pass, 1, "Doing well (33 of 40) shows green 'You can skip 4 classes'");

  // TEST 2: Falling behind (17 of 25)
  setInputs(17, 25, 75);
  await sleep(600);
  const t2Big = bigNumEl?.textContent?.trim();
  const t2Label = statusLabelEl?.textContent?.trim();
  const t2Details = meterDetailsEl?.textContent || "";
  const t2Pass =
    t2Big === "7" &&
    t2Label === "Attend the next" &&
    t2Details.includes("68%") &&
    t2Details.includes("After 7 classes in a row: 75%");
  record(t2Pass, 2, "Falling behind (17 of 25) shows red 'Attend the next 7 classes'");

  // TEST 3: 30 of 40 edge state
  setInputs(30, 40, 75);
  await sleep(600);
  const t3Status = meterCardEl?.dataset.status;
  const t3Title = bigNumEl?.textContent?.trim() || statusLabelEl?.textContent?.trim();
  const t3Pass = t3Status === "edge" && t3Title === "Don't skip the next class.";
  record(t3Pass, 3, "30 of 40 shows amber 'Don't skip the next class.'");

  // TEST 4: Target 85 with 33 of 40
  setInputs(33, 40, 85);
  await sleep(600);
  const t4Big = bigNumEl?.textContent?.trim();
  const t4Label = statusLabelEl?.textContent?.trim();
  const t4Details = meterDetailsEl?.textContent || "";
  const t4Pass =
    t4Big === "7" &&
    t4Label === "Attend the next" &&
    t4Details.includes("After 7 classes in a row: 85.1%");
  record(t4Pass, 4, "Target 85 with 33 of 40 shows red 'Attend the next 7 classes'");

  // TEST 5: Typing 41 in attended with 40 in total
  setInputs(41, 40, 75);
  await sleep(300);
  const t5Err = errorAttendedEl?.textContent?.trim();
  const t5Idle = meterCardEl?.dataset.status === "idle";
  const t5Pass = t5Err === COPY.errors.moreThanTotal && t5Idle;
  record(t5Pass, 5, "Typing 41 in attended with 40 in total shows error and idle meter");

  // TEST 6: What if, Skip, 5, with 33 of 40
  setInputs(33, 40, 75);
  await sleep(500);
  whatIfSkipBtn?.click();
  if (whatIfSlider) {
    whatIfSlider.value = "5";
    whatIfSlider.dispatchEvent(new Event("input", { bubbles: true }));
  }
  await sleep(150);
  const t6Stmt = whatIfStatement?.textContent || "";
  const t6Badge = whatIfBadge?.textContent || "";
  const t6Pass = t6Stmt.includes("73.3%") && t6Badge.includes("Below");
  record(t6Pass, 6, "What if, Skip, 5, with 33 of 40 shows 73.3% and Below badge");

  // TEST 7: I skipped on 33 of 40 gives 33 of 41 and 'You can skip 3 classes'. Undo goes back to 33 of 40.
  setInputs(33, 40, 75);
  await sleep(500);
  todaySkippedBtn?.click();
  await sleep(550);
  const t7A1 = attendedInput?.value;
  const t7T1 = totalInput?.value;
  const t7Big1 = bigNumEl?.textContent?.trim();
  const t7Unit1 = statusUnitEl?.textContent?.trim();

  todayUndoBtn?.click();
  await sleep(550);
  const t7A2 = attendedInput?.value;
  const t7T2 = totalInput?.value;
  const t7Big2 = bigNumEl?.textContent?.trim();
  const t7Pass =
    t7A1 === "33" &&
    t7T1 === "41" &&
    t7Big1 === "3" &&
    t7Unit1 === "3 classes" &&
    t7A2 === "33" &&
    t7T2 === "40" &&
    t7Big2 === "4";
  record(t7Pass, 7, "I skipped on 33/40 gives 33/41, and Undo restores 33/40");

  // TEST 8: After reload, numbers come back from bm-data. Clear my data removes it.
  setInputs(33, 40, 75);
  await sleep(300);
  const rawSaved = localStorage.getItem("bm-data");
  let t8HasData = false;
  try {
    const parsed = JSON.parse(rawSaved);
    t8HasData = parsed && parsed.subjects && parsed.subjects[0]?.attended === 33;
  } catch {}

  saveClearBtn?.click();
  await sleep(200);
  const t8Cleared = localStorage.getItem("bm-data") === null;
  const t8Pass = t8HasData && t8Cleared;
  record(t8Pass, 8, "Saved numbers in bm-data and Clear my data removes it");

  // TEST 9: fetch is refused by privacy lock
  let t9Refused = false;
  try {
    await fetch("https://wrench-wise.com/", { mode: "no-cors" });
    t9Refused = false;
  } catch {
    t9Refused = true;
  }
  record(t9Refused, 9, "fetch('https://wrench-wise.com/') is refused by privacy lock");

  // TEST 10: Storage holds only allowed keys, and scrollWidth <= window.innerWidth
  const localKeys = Object.keys(localStorage);
  const sessionKeys = Object.keys(sessionStorage);
  const allKeysAllowed =
    localKeys.every((k) => ALLOWED_KEYS.has(k)) &&
    sessionKeys.every((k) => ALLOWED_KEYS.has(k));
  const noOverflow = document.documentElement.scrollWidth <= window.innerWidth;
  const t10Pass = allKeysAllowed && noOverflow;
  record(t10Pass, 10, "Storage holds only allowed keys and no horizontal overflow");

  // Summary
  const allPassed = results.every(Boolean);
  statusEl.textContent = allPassed
    ? "ALL 10 TESTS PASSED"
    : `${results.filter(Boolean).length} / 10 PASSED`;
  statusEl.className = allPassed
    ? "selftest-summary selftest-summary-pass"
    : "selftest-summary selftest-summary-fail";

  // Restore safe state for display
  setInputs(33, 40, 75);
}
