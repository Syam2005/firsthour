/* FirstHour — theme controller
   Reads localStorage key "firsthour-theme".
   "dark"  → adds class "dark"  to <html>
   "light" → adds class "light" to <html>
   anything else (including missing) → no class; CSS @media handles system preference
*/
(function () {
  var stored = localStorage.getItem('firsthour-theme');
  var root = document.documentElement;
  if (stored === 'dark') {
    root.classList.add('dark');
  } else if (stored === 'light') {
    root.classList.add('light');
  }
  // else: system — CSS media query takes over; no explicit class

  window.__setTheme = function (value) {
    root.classList.remove('dark', 'light');
    if (value === 'dark' || value === 'light') {
      root.classList.add(value);
      localStorage.setItem('firsthour-theme', value);
    } else {
      // system
      localStorage.removeItem('firsthour-theme');
    }
    // update button labels
    document.querySelectorAll('[data-theme-btn]').forEach(function (btn) {
      btn.textContent = window.__themeLabel();
    });
  };

  window.__themeLabel = function () {
    var stored = localStorage.getItem('firsthour-theme');
    if (stored === 'dark')  return 'Theme: Dark';
    if (stored === 'light') return 'Theme: Light';
    return 'Theme: System';
  };

  window.__cycleTheme = function () {
    var stored = localStorage.getItem('firsthour-theme');
    if (stored === 'light')  { window.__setTheme('dark');   return; }
    if (stored === 'dark')   { window.__setTheme('system'); return; }
    /* system */ window.__setTheme('light');
  };
}());
