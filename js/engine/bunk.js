// LOCKED. Do not edit. Attendance maths only: no DOM, no network, no storage.
// Every number the site shows comes from here.

export const MAX_CLASSES = 5000;
export const MIN_TARGET = 50;
export const MAX_TARGET = 95;
export const MAX_SUBJECTS = 20;
export const ERROR_CODES = ["empty", "notWhole", "tooBig", "zeroTotal", "moreThanTotal", "badTarget"];

// Whole-number division written out, so the answer is exact in every browser.
const divFloor = (n, d) => (n - (n % d)) / d; // n >= 0, d > 0
const divCeil = (n, d) => divFloor(n + d - 1, d); // n >= 0, d > 0

// Reads what the visitor typed. Digits only, no decimals, no minus sign.
export function readCount(value) {
  const s = typeof value === "number" ? (Number.isInteger(value) && value >= 0 ? String(value) : "x") : String(value ?? "").trim();
  if (s === "") return { ok: false, error: "empty" };
  if (!/^\d+$/.test(s)) return { ok: false, error: "notWhole" };
  if (s.replace(/^0+(?=\d)/, "").length > 4 || Number(s) > MAX_CLASSES) return { ok: false, error: "tooBig" };
  return { ok: true, value: Number(s) };
}

export function validTarget(target) {
  return Number.isInteger(target) && target >= MIN_TARGET && target <= MAX_TARGET;
}

// Percentage rounded DOWN to one decimal, so 74.96% shows as 74.9%, never 75%.
function snapshot(attended, total, target) {
  const tenths = divFloor(1000 * attended, total);
  const whole = divFloor(tenths, 10);
  const dec = tenths % 10;
  return {
    attended,
    total,
    tenths,
    text: dec === 0 ? String(whole) : `${whole}.${dec}`,
    meets: 100 * attended >= target * total
  };
}

// The one function the page uses for the big number.
export function calc(attendedIn, totalIn, target = 75) {
  const A = readCount(attendedIn);
  if (!A.ok) return { ok: false, error: A.error, field: "attended" };
  const T = readCount(totalIn);
  if (!T.ok) return { ok: false, error: T.error, field: "total" };
  if (!validTarget(target)) return { ok: false, error: "badTarget", field: "target" };
  const a = A.value;
  const t = T.value;
  if (t === 0) return { ok: false, error: "zeroTotal", field: "total" };
  if (a > t) return { ok: false, error: "moreThanTotal", field: "attended" };

  // Each skip adds 1 to total only. Each class attended adds 1 to both.
  const surplus = 100 * a - target * t;
  let status, skip = 0, need = 0, after, drop = null;
  if (surplus >= 0) {
    skip = divFloor(surplus, target); // largest k with 100a >= target(t + k)
    status = skip > 0 ? "safe" : "edge";
    after = snapshot(a, t + skip, target);
    drop = snapshot(a, t + skip + 1, target); // one skip past the limit
  } else {
    need = divCeil(-surplus, 100 - target); // smallest n with 100(a + n) >= target(t + n)
    status = "below";
    after = snapshot(a + need, t + need, target);
  }
  return {
    ok: true,
    attended: a,
    total: t,
    missed: t - a,
    target,
    status,
    skip,
    need,
    big: status === "below" ? need : skip,
    now: snapshot(a, t, target),
    after,
    drop,
    formula: surplus >= 0
      ? { top: surplus, bottom: target, rounded: "down" }
      : { top: -surplus, bottom: 100 - target, rounded: "up" }
  };
}

// "What if" numbers: skip or attend more classes from where the visitor is now.
export function project(attended, total, target, { skip = 0, attend = 0 } = {}) {
  const s = Math.max(0, Math.trunc(skip));
  const n = Math.max(0, Math.trunc(attend));
  return snapshot(attended + n, total + n + s, target);
}

// Daily update buttons. Returns null when the total would pass MAX_CLASSES.
export function logClass(attended, total, present) {
  if (total + 1 > MAX_CLASSES) return null;
  return { attended: attended + (present ? 1 : 0), total: total + 1 };
}

// Saved data. A list of subjects from day one, so subject-wise tracking is an easy upgrade.
export function toSaved(target, subjects) {
  return JSON.stringify({ v: 1, target, subjects });
}

export function readSaved(raw, targets = []) {
  let data;
  try { data = JSON.parse(String(raw ?? "")); } catch { return null; }
  if (!data || data.v !== 1 || !Array.isArray(data.subjects)) return null;
  if (!validTarget(data.target) || (targets.length && !targets.includes(data.target))) return null;
  const subjects = [];
  for (const s of data.subjects.slice(0, MAX_SUBJECTS)) {
    if (!s || typeof s !== "object") continue;
    const r = calc(s.attended, s.total, data.target);
    if (!r.ok) continue;
    const id = typeof s.id === "string" && /^[a-z0-9-]{1,24}$/.test(s.id) ? s.id : null;
    if (!id || subjects.some((x) => x.id === id)) continue;
    const name = typeof s.name === "string" ? s.name.trim().slice(0, 40) : "";
    subjects.push({ id, name: name || "Overall", attended: r.attended, total: r.total });
  }
  return subjects.length ? { v: 1, target: data.target, subjects } : null;
}
