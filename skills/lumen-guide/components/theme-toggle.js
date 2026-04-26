/* ══════════════════════════════════════════════════════════════════
   theme-toggle.js — dark/light theme toggle with localStorage persistence
   Part of forge base/ layer.

   IMPORTANT: Before inlining, substitute {NAME} with the diagram's
   kebab-case slug. The localStorage key uses it to scope per-diagram.

   Requires: <button id="theme-toggle"> in shell templates (single.html, split.html).
   For gallery templates, use gallery-base.js initTheme() with id="themeBtn" instead.
   ══════════════════════════════════════════════════════════════════ */

;(() => {
  var THEME_KEY = 'diag-{NAME}-theme'
  var saved = localStorage.getItem(THEME_KEY) || 'dark'
  document.documentElement.setAttribute('data-theme', saved)
  var themeBtn = document.getElementById('theme-toggle')
  if (themeBtn) {
    themeBtn.textContent = saved === 'dark' ? '◑ light' : '◑ dark'
    themeBtn.setAttribute('aria-pressed', saved === 'light' ? 'true' : 'false')
    themeBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme')
      var next = cur === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem(THEME_KEY, next)
      this.textContent = next === 'dark' ? '◑ light' : '◑ dark'
      this.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false')
    })
  }
})()
