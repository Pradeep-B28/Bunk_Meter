// Safe storage wrapper adhering to Privacy Lock and Rule 7.
// Only "bm-data", "bm-theme", and "bm-intro-seen" are allowed.

import { toSaved, readSaved } from "./engine/bunk.js";

const KEY_DATA = "bm-data";
const KEY_THEME = "bm-theme";
const KEY_INTRO = "bm-intro-seen";

let storageBlocked = false;

export function isStorageAvailable() {
  try {
    const testKey = KEY_THEME;
    const current = localStorage.getItem(testKey);
    localStorage.setItem(testKey, current === null ? "test" : current);
    if (current === null) {
      localStorage.removeItem(testKey);
    }
    storageBlocked = false;
    return true;
  } catch (e) {
    storageBlocked = true;
    return false;
  }
}

export function saveAttendance(target, subjects) {
  try {
    const serialized = toSaved(target, subjects);
    localStorage.setItem(KEY_DATA, serialized);
    storageBlocked = false;
    return true;
  } catch (e) {
    storageBlocked = true;
    return false;
  }
}

export function loadAttendance(targets = []) {
  try {
    const raw = localStorage.getItem(KEY_DATA);
    storageBlocked = false;
    if (!raw) return null;
    return readSaved(raw, targets);
  } catch (e) {
    storageBlocked = true;
    return null;
  }
}

export function clearAttendance() {
  try {
    localStorage.removeItem(KEY_DATA);
    storageBlocked = false;
    return true;
  } catch (e) {
    storageBlocked = true;
    return false;
  }
}

export function getStoredTheme() {
  try {
    return localStorage.getItem(KEY_THEME);
  } catch (e) {
    storageBlocked = true;
    return null;
  }
}

export function setStoredTheme(theme) {
  try {
    if (theme) {
      localStorage.setItem(KEY_THEME, theme);
    } else {
      localStorage.removeItem(KEY_THEME);
    }
    return true;
  } catch (e) {
    storageBlocked = true;
    return false;
  }
}

export function isIntroSeen() {
  try {
    return sessionStorage.getItem(KEY_INTRO) === "1";
  } catch (e) {
    return false;
  }
}

export function setIntroSeen() {
  try {
    sessionStorage.setItem(KEY_INTRO, "1");
  } catch (e) {
    // Session storage blocked
  }
}
