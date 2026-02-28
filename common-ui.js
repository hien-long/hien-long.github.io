(function () {
  var STORAGE_KEY = "tb_theme";

  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function normalizeTheme(key) {
    if (!key) return "dim-dark";
    if (key === "grey" || key === "dark") return "dim-dark";
    if (key !== "light" && key !== "dim-dark") return "dim-dark";
    return key;
  }

  function applyTheme(key) {
    var k = normalizeTheme(key);
    var isJourney = location.pathname.toLowerCase().indexOf("origin.html") !== -1;

    // Page "Hành trình" is always Dark
    if (isJourney) {
      k = "dim-dark";
    }

    // Apply to html AND body for best compatibility
    document.documentElement.setAttribute("data-theme", k);
    if (document.body) {
      document.body.setAttribute("data-theme", k);
    }

    // Update theme button text based on global saved preference
    var btn = document.getElementById("ms-theme-btn");
    if (btn) {
      var savedK = normalizeTheme(localStorage.getItem(STORAGE_KEY));
      btn.textContent = "Theme: " + (savedK === "light" ? "Light" : "Dark");
    }
  }

  function toggleTheme() {
    var current = normalizeTheme(localStorage.getItem(STORAGE_KEY));
    var next = (current === "dim-dark") ? "light" : "dim-dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  function bindThemeButton() {
    var btn = document.getElementById("ms-theme-btn");
    if (!btn) return;
    if (btn.dataset.tbBound === "1") return;
    btn.dataset.tbBound = "1";
    btn.addEventListener("click", toggleTheme);
  }

  function bindHeaderInteractions() {
    // Mobile dropdown menu
    var btn = document.getElementById("veo-menu-btn");
    var menu = document.getElementById("veo-dropmenu");
    if (btn && menu && btn.dataset.tbMenuBound !== "1") {
      btn.dataset.tbMenuBound = "1";

      function close() {
        menu.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }
      function toggle() {
        var open = menu.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      }

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggle();
      });
      document.addEventListener("click", function () {
        if (menu.classList.contains("is-open")) close();
      });
      window.addEventListener("resize", function () {
        if (window.innerWidth > 980) close();
      });
    }

    bindThemeButton();
  }

  function bindNewsletter() {
    var forms = document.querySelectorAll('.footer-form');
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (form.dataset.tbBound === "1") continue;
      form.dataset.tbBound = "1";

      var btn = form.querySelector('.footer-submit');
      if (!btn) continue;

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var currentForm = e.target.closest('form');
        var nameInput = currentForm.querySelector('input[type="text"]');
        var emailInput = currentForm.querySelector('input[type="email"]');
        var name = nameInput ? nameInput.value.trim() : '';
        var email = emailInput ? emailInput.value.trim() : '';

        if (!name || !email) {
          alert('Vui lòng nhập đầy đủ Họ tên và Email!');
          return;
        }

        if (btn.textContent === '⏳...') return;
        var originalText = btn.textContent;
        btn.textContent = '⏳...';

        if (typeof db !== 'undefined' && db.collection) {
          db.collection('newsletter').add({
            name: name,
            email: email,
            timestamp: new Date()
          }).then(function () {
            alert('Cảm ơn bạn đã đăng ký nhận tin! Tụi mình sẽ cập nhật những tin tức mới nhất vào email của bạn.');
            if (nameInput) nameInput.value = '';
            if (emailInput) emailInput.value = '';
            btn.textContent = originalText;
          }).catch(function (err) {
            alert('Đã xảy ra lỗi: ' + err.message);
            btn.textContent = originalText;
          });
        } else {
          setTimeout(function () {
            alert('Cảm ơn bạn đã đăng ký nhận tin! Tụi mình sẽ cập nhật những tin tức mới nhất vào email của bạn.');
            if (nameInput) nameInput.value = '';
            if (emailInput) emailInput.value = '';
            btn.textContent = originalText;
          }, 400);
        }
      });
    }
  }

  function highlightActiveNav() {
    var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var key = "index";
    if (file.indexOf("memb") !== -1) key = "memb";
    else if (file.indexOf("message") !== -1) key = "messages";
    else if (file.indexOf("origin") !== -1) key = "origin";
    else if (file.indexOf("event") !== -1 || file.indexOf("article") !== -1) key = "events";

    var links = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var isActive = a.getAttribute("data-nav") === key;
      if (isActive) {
        a.style.color = "var(--purple2)";
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    }
  }

  function injectPartial(containerId, fileName, fallbackHtml) {
    var host = document.getElementById(containerId);
    if (!host) return Promise.resolve(false);

    // Build URL that works on GitHub Pages subpaths.
    var url;
    try { url = new URL(fileName, document.baseURI).toString(); }
    catch (e) { url = fileName; }

    return fetch(url, { cache: "default" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (html) {
        host.innerHTML = html;
        return true;
      })
      .catch(function () {
        // file:// or blocked fetch -> fallback
        if (fallbackHtml) host.innerHTML = fallbackHtml;
        return false;
      });
  }

  function initThemeChooser() {
    var overlay = document.getElementById("theme-chooser-overlay");
    var btnLight = document.getElementById("theme-choice-light");
    var btnDark = document.getElementById("theme-choice-dark");
    if (!overlay || (!btnLight && !btnDark)) return;

    if (overlay.dataset.tbBound === "1") return;
    overlay.dataset.tbBound = "1";

    function savedTheme() {
      var v = localStorage.getItem(STORAGE_KEY);
      v = normalizeTheme(v);
      return v;
    }

    function open() { overlay.style.display = "flex"; }
    function close() { overlay.style.display = "none"; }

    function choose(k) {
      localStorage.setItem(STORAGE_KEY, k);
      applyTheme(k);
      close();
    }

    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      applyTheme("dim-dark");
      open();
    } else {
      applyTheme(savedTheme());
    }

    if (btnLight) btnLight.addEventListener("click", function () { choose("light"); });
    if (btnDark) btnDark.addEventListener("click", function () { choose("dim-dark"); });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        if (localStorage.getItem(STORAGE_KEY)) close();
      }
    });
  }

  // Minimal fallback header/footer (for file:// previews)
  var FALLBACK_HEADER = '<header class="veo-header"><div class="veo-top"><div class="veo-inner">'
    + '<a class="veo-logo" href="index.html"><span class="veo-mark">❤</span><span class="veo-logo-text">The Blouse</span></a>'
    + '<nav class="veo-nav" aria-label="Primary">'
    + '<a href="index.html" data-nav="index">Tổng quan</a>'
    + '<a href="origin.html" data-nav="origin">Hành trình</a>'
    + '<a href="events.html" data-nav="events">Hoạt động</a>'
    + '<a href="memb.html" data-nav="memb">Thành viên</a>'
    + '<a href="messages.html" data-nav="messages">Lời nhắn</a>'
    + '</nav>'
    + '<div class="veo-actions">'
    + '<button class="veo-menu-btn" id="veo-menu-btn" type="button" aria-controls="veo-dropmenu" aria-expanded="false">Menu <span class="veo-caret">▾</span></button>'
    + '<button class="veo-theme-btn" id="ms-theme-btn" type="button">Theme: Dark</button>'
    + '<a class="veo-cta-btn" href="admin.html" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;"><span class="veo-cta-ico">⚙</span> Admin</a>'
    + '</div></div>'
    + '<div class="veo-dropmenu" id="veo-dropmenu" role="menu" aria-label="Menu">'
    + '<a href="index.html" role="menuitem" data-nav="index">Tổng quan</a>'
    + '<a href="origin.html" role="menuitem" data-nav="origin">Hành trình</a>'
    + '<a href="events.html" role="menuitem" data-nav="events">Hoạt động</a>'
    + '<a href="memb.html" role="menuitem" data-nav="memb">Thành viên</a>'
    + '<a href="messages.html" role="menuitem" data-nav="messages">Lời nhắn</a>'
    + '<a href="admin.html" role="menuitem">Admin</a>'
    + '</div></div></header>';

  var FALLBACK_FOOTER = '<footer class="site-footer"><div class="footer-bottom" style="justify-content:center">'
    + '<div class="footer-copy">© The Blouse</div></div></footer>';

  function initAll() {
    // 1. Initial application (before partials) based on localStorage
    var saved = normalizeTheme(localStorage.getItem(STORAGE_KEY));
    applyTheme(saved);

    // 2. Global Sync Listener (Crucial for other tabs)
    window.removeEventListener("storage", handleStorageEvent);
    window.addEventListener("storage", handleStorageEvent);

    function handleStorageEvent(e) {
      if (e.key === STORAGE_KEY) {
        applyTheme(e.newValue);
      }
    }

    // 3. Inject partials if placeholders exist
    Promise.all([
      injectPartial("site-header", "header.html", FALLBACK_HEADER),
      injectPartial("site-footer", "footer.html", FALLBACK_FOOTER)
    ]).then(function () {
      // After injection, wire interactions & highlight
      bindHeaderInteractions();
      highlightActiveNav();
      initThemeChooser();
      bindNewsletter();

      // Re-apply theme to ensure injected elements (like button text) are correct
      applyTheme(localStorage.getItem(STORAGE_KEY));

      document.dispatchEvent(new CustomEvent("tb:partials:loaded"));
    });
  }

  onReady(initAll);

  // Apply theme IMMEDIATELY (to documentElement) before even DOM is ready
  // to avoid "flash" and ensure consistency.
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      document.documentElement.setAttribute("data-theme", normalizeTheme(saved));
    }
  } catch (e) { /* ignore */ }

  // Expose
  window.TB = window.TB || {};
})();
