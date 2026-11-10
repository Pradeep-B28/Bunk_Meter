// LOCKED. Run with: node tools/verify.mjs
// Must end with RESULT: ALL PASS at the start of every phase and before deploy.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const { calc, project, readCount, logClass, toSaved, readSaved, ERROR_CODES, MAX_CLASSES } = await import("../js/engine/bunk.js");
const { CONFIG } = await import("../config.js");
const { COPY, t } = await import("../js/copy.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let fails = 0, passes = 0;
const check = (ok, name) => {
  if (ok) passes++;
  else { fails++; if (fails <= 40) console.log("FAIL  " + name); }
};
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 1. Locked files have not changed. Line endings are ignored so Windows is fine.
const HASHES = {
  "js/engine/bunk.js": "84cdbd630feb3b79d9306e53cac91577e794faa8d45987c7a9931d8cc50fa4b5",
  "vercel.json": "73a6c65424dc4a4e7eba415d29915e995c813d0ab2480d587a5c00c77a12abc1"
};
for (const [file, hash] of Object.entries(HASHES)) {
  check(sha(read(file).replace(/\r/g, "")) === hash, `Locked file was changed: ${file}`);
}

// 2. Every answer from 1 to 300 classes, for every target, against a slow class-by-class count.
const meets = (a, total, T) => 100 * a >= T * total;
for (let T = 50; T <= 95; T++) {
  for (let total = 1; total <= 300; total++) {
    for (let a = 0; a <= total; a++) {
      const r = calc(a, total, T);
      if (meets(a, total, T)) {
        let k = 0;
        while (meets(a, total + k + 1, T)) k++;
        check(r.ok && r.status === (k > 0 ? "safe" : "edge") && r.skip === k && r.need === 0 && r.big === k, `skip ${a}/${total} at ${T}%`);
        check(r.after.meets && !r.drop.meets, `after and drop ${a}/${total} at ${T}%`);
      } else {
        let n = 0;
        while (!meets(a + n, total + n, T)) n++;
        check(r.ok && r.status === "below" && r.need === n && r.skip === 0 && r.big === n && r.drop === null, `need ${a}/${total} at ${T}%`);
        check(r.after.meets && (n === 0 || !meets(a + n - 1, total + n - 1, T)), `after ${a}/${total} at ${T}%`);
        check(Number(r.now.text) < T, `below shows under the line ${a}/${total} at ${T}%`);
      }
    }
  }
}

// 3. Exact answers the site, the examples and the reel show.
const S = calc(CONFIG.examples.safe.attended, CONFIG.examples.safe.total, CONFIG.targets[0]);
check(S.status === "safe" && S.big === 4, `safe example gives "You can skip 4", got ${S.status} ${S.big}`);
check(S.now.text === "82.5" && S.after.text === "75" && S.drop.text === "73.3", `safe example lines: ${S.now.text} ${S.after.text} ${S.drop.text}`);
check(same(S.formula, { top: 300, bottom: 75, rounded: "down" }), "safe example formula");
const D = calc(CONFIG.examples.danger.attended, CONFIG.examples.danger.total, CONFIG.targets[0]);
check(D.status === "below" && D.big === 7, `danger example gives "Attend the next 7", got ${D.status} ${D.big}`);
check(D.now.text === "68" && D.after.text === "75" && same(D.formula, { top: 175, bottom: 25, rounded: "up" }), "danger example lines and formula");
const CASES = [
  // attended, total, target, status, big, now
  [36, 40, 75, "safe", 8, "90"],
  [30, 40, 75, "edge", 0, "75"],
  [0, 1, 75, "below", 3, "0"],
  [149, 199, 75, "below", 1, "74.8"],
  [200, 250, 75, "safe", 16, "80"],
  [40, 40, 75, "safe", 13, "100"],
  [5, 5, 85, "edge", 0, "100"],
  [34, 40, 85, "edge", 0, "85"],
  [3, 4, 80, "below", 1, "75"],
  [2999, 4000, 75, "below", 4, "74.9"],
  [0, 5000, 75, "below", 15000, "0"]
];
for (const [a, total, T, status, big, now] of CASES) {
  const r = calc(a, total, T);
  check(r.ok && r.status === status && r.big === big && r.now.text === now, `${a}/${total} at ${T}%: ${r.status} ${r.big} ${r.now?.text}`);
}

// 4. Bad input never crashes and always names the field.
const BAD = [
  ["", 10, "empty", "attended"], [5, "", "empty", "total"], ["1.5", 10, "notWhole", "attended"],
  ["-3", 10, "notWhole", "attended"], ["abc", 10, "notWhole", "attended"], [5, "5001", "tooBig", "total"],
  [5, 0, "zeroTotal", "total"], [41, 40, "moreThanTotal", "attended"], [null, 10, "empty", "attended"],
  ["12e1", 200, "notWhole", "attended"], ["<b>", 10, "notWhole", "attended"]
];
for (const [a, total, error, field] of BAD) {
  const r = calc(a, total, 75);
  check(!r.ok && r.error === error && r.field === field, `bad input ${JSON.stringify([a, total])}: ${JSON.stringify(r)}`);
}
check(!calc(5, 10, 49).ok && !calc(5, 10, 96).ok && !calc(5, 10, 75.5).ok, "bad targets refused");
check(readCount(" 0036 ").ok && readCount(" 0036 ").value === 36, "spaces and leading zeros");
for (const code of ERROR_CODES) check(!!COPY.errors[code], `error copy: ${code}`);

// 5. What if, today buttons and saved data.
check(project(33, 40, 75, { skip: 4 }).text === "75" && project(33, 40, 75, { skip: 5 }).text === "73.3", "what if: skip");
check(project(17, 25, 75, { attend: 7 }).text === "75" && project(17, 25, 75, { attend: 6 }).meets === false, "what if: attend");
check(same(logClass(36, 40, true), { attended: 37, total: 41 }) && same(logClass(36, 40, false), { attended: 36, total: 41 }), "today buttons");
check(logClass(10, MAX_CLASSES, true) === null, "today buttons stop at the limit");
const saved = toSaved(75, [{ id: "overall", name: "Overall", attended: 33, total: 40 }]);
check(same(readSaved(saved, CONFIG.targets), { v: 1, target: 75, subjects: [{ id: "overall", name: "Overall", attended: 33, total: 40 }] }), "saved data round trip");
check(readSaved("not json") === null && readSaved('{"v":2}') === null && readSaved('{"v":1,"target":75,"subjects":[]}') === null, "broken saved data is ignored");
check(readSaved('{"v":1,"target":75,"subjects":[{"id":"a","attended":50,"total":40}]}') === null, "impossible saved numbers are ignored");
check(readSaved(toSaved(70, [{ id: "a", attended: 1, total: 2 }]), CONFIG.targets) === null, "saved target must be in config.targets");

// 6. Settings and words.
check(Array.isArray(CONFIG.targets) && CONFIG.targets.length > 0 && CONFIG.targets.every((x) => calc(1, 1, x).ok), "config targets");
check(Number.isInteger(CONFIG.whatIfMax) && CONFIG.whatIfMax >= 5 && CONFIG.whatIfMax <= 100, "config whatIfMax");
check(t("meter.safeUnit", { count: "4" }) === "4 classes" && t("hero.sub", { target: 75 }).includes("75%"), "t() fills values");

// 7. Privacy and writing rules across everything built so far.
const SKIP_DIRS = new Set(["node_modules", ".git", ".vercel", "tools"]);
const walk = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
  const path = dir ? `${dir}/${e.name}` : e.name;
  if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path);
  return /\.(js|html|css|md|json)$/.test(e.name) ? [path] : [];
});
const files = walk("");
const NEVER = [
  ["XMLHttpRequest", /XMLHttpRequest/], ["sendBeacon", /sendBeacon/], ["WebSocket", /WebSocket/],
  ["innerHTML", /innerHTML|outerHTML|insertAdjacentHTML/], ["document.write", /document\.write/],
  ["eval", /\beval\(|new Function\(/], ["console output", /console\.\w+\(/],
  ["analytics", /googletagmanager|gtag\(|fbq\(|connect\.facebook|clarity\.ms|hotjar/i],
  ["outside file", /<(script|link)[^>]+(src|href)=["']https?:/i], ["web font", /fonts\.googleapis|@import\s+url\(["']?http/i]
];
const STORAGE_FILES = new Set(["js/store.js", "js/theme-init.js", "js/selftest.js"]);
for (const file of files) {
  const body = read(file);
  if (/\.(js|html|css)$/.test(file)) {
    for (const [name, re] of NEVER) check(!re.test(body), `${file}: ${name} is not allowed`);
    if (file !== "js/selftest.js") check(!/\bfetch\(/.test(body), `${file}: fetch is not allowed`);
    if (!STORAGE_FILES.has(file)) check(!/localStorage|sessionStorage|indexedDB/.test(body), `${file}: storage is only allowed in js/store.js`);
  }
  check(!/[‒-―]/.test(body), `${file}: long dash found`);
  if (!file.endsWith(".md")) check(!/(?![©®™])\p{Extended_Pictographic}/u.test(body), `${file}: emoji found`);
}
for (const file of ["js/store.js", "js/theme-init.js"]) {
  if (!existsSync(join(ROOT, file))) continue;
  const keys = [...read(file).matchAll(/["'`](bm-[\w-]+)["'`]/g)].map((m) => m[1]);
  check(keys.every((k) => ["bm-data", "bm-theme", "bm-intro-seen"].includes(k)), `${file} keys: ${keys}`);
}
const CSP = JSON.parse(read("vercel.json")).headers[0].headers.find((h) => h.key === "Content-Security-Policy").value;
check(CSP.includes("connect-src 'none'") && CSP.includes("script-src 'self'"), "vercel.json lock");
if (existsSync(join(ROOT, "index.html"))) {
  const html = read("index.html");
  check(/<meta[^>]+Content-Security-Policy[^>]+connect-src 'none'/i.test(html), "index.html: CSP meta tag missing");
  check(!/<form\b/i.test(html), "index.html: no form tag allowed");
  check(!/\sstyle=/i.test(html), "index.html: inline style attribute is blocked by the lock");
  check(!/\son[a-z]+=/i.test(html), "index.html: inline event handler is blocked by the lock");
  check(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), "index.html: inline script is blocked by the lock");
  check(!/<style\b/i.test(html), "index.html: style tag is blocked by the lock");
  for (const id of ["attended", "total"]) {
    const box = html.match(new RegExp(`<input[^>]+id=["']${id}["'][^>]*>`, "i"))?.[0] ?? "";
    check(!!box, `index.html: needs <input id="${id}">`);
    for (const need of ['type="text"', 'inputmode="numeric"', 'autocomplete="off"']) check(box.includes(need), `index.html: #${id} needs ${need}`);
    check(new RegExp(`<label[^>]+for=["']${id}["']`, "i").test(html), `index.html: #${id} needs a <label for>`);
  }
}

console.log(`${passes} checks passed, ${fails} failed (${files.length} files scanned)`);
console.log(fails ? "RESULT: FAILED" : "RESULT: ALL PASS");
process.exit(fails ? 1 : 0);
