// Plain script in head. Sets theme and intro class before first paint.
(function () {
  try {
    var queryTheme = new URLSearchParams(window.location.search).get("theme");
    var savedTheme = (queryTheme === "dark" || queryTheme === "light") ? queryTheme : localStorage.getItem("bm-theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : (prefersDark ? "dark" : "light");
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (e) {
    // Storage blocked or unavailable
  }

  try {
    var queryIntro = new URLSearchParams(window.location.search).get("intro");
    var introSeen = (queryIntro === "done") || (sessionStorage.getItem("bm-intro-seen") === "1");
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (introSeen || reducedMotion) {
      document.documentElement.classList.add("intro-done");
    }
  } catch (e) {
    // Session storage blocked
  }
})();
