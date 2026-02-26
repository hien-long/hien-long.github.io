(function(){
  var STORAGE_KEY = "tb_theme";

  function onReady(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function normalizeTheme(key){
    if(!key) return "dim-dark";
    if(key === "grey" || key === "dark") return "dim-dark";
    if(key !== "light" && key !== "dim-dark") return "dim-dark";
    return key;
  }

  function applyTheme(key){
    var k = normalizeTheme(key);
    document.body.setAttribute("data-theme", k);
    var btn = document.getElementById("ms-theme-btn");
    if(btn) btn.textContent = "Theme: " + (k === "light" ? "Light" : "Dark");
  }

  function toggleTheme(){
    var current = normalizeTheme(document.body.getAttribute("data-theme") || "dim-dark");
    var next = (current === "dim-dark") ? "light" : "dim-dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  function bindThemeButton(){
    var btn = document.getElementById("ms-theme-btn");
    if(!btn) return;
    if(btn.dataset.tbBound === "1") return;
    btn.dataset.tbBound = "1";
    btn.addEventListener("click", toggleTheme);
  }

  function requestOpenMessagePopup(){
    document.dispatchEvent(new CustomEvent("tb:open-message"));
  }

  function bindHeaderInteractions(){
    // CTA in header
    var cta = document.getElementById("veo-message-cta");
    if(cta && cta.dataset.tbBound !== "1"){
      cta.dataset.tbBound = "1";
      cta.addEventListener("click", requestOpenMessagePopup);
    }

    // Mobile dropdown menu
    var btn = document.getElementById("veo-menu-btn");
    var menu = document.getElementById("veo-dropmenu");
    if(!btn || !menu) return;
    if(btn.dataset.tbMenuBound === "1") return;
    btn.dataset.tbMenuBound = "1";

    function close(){
      menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
    function toggle(){
      var open = menu.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    btn.addEventListener("click", function(e){
      e.stopPropagation();
      toggle();
    });
    document.addEventListener("click", function(){
      if(menu.classList.contains("is-open")) close();
    });
    window.addEventListener("resize", function(){
      if(window.innerWidth > 980) close();
    });
  }

  function initThemeChooser(){
    var overlay = document.getElementById("theme-chooser-overlay");
    var btnLight = document.getElementById("theme-choice-light");
    var btnDark  = document.getElementById("theme-choice-dark");
    if(!overlay || (!btnLight && !btnDark)) return;

    if(overlay.dataset.tbBound === "1") return;
    overlay.dataset.tbBound = "1";

    function savedTheme(){
      var v = localStorage.getItem(STORAGE_KEY);
      v = normalizeTheme(v);
      return v;
    }

    function open(){ overlay.style.display = "flex"; }
    function close(){ overlay.style.display = "none"; }

    function choose(k){
      localStorage.setItem(STORAGE_KEY, k);
      applyTheme(k);
      close();
    }

    // Show on first visit if no saved value at all
    var raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){
      applyTheme("dim-dark");
      open();
    }else{
      applyTheme(savedTheme());
    }

    if(btnLight) btnLight.addEventListener("click", function(){ choose("light"); });
    if(btnDark)  btnDark.addEventListener("click", function(){ choose("dim-dark"); });

    overlay.addEventListener("click", function(e){
      if(e.target === overlay){
        // only allow closing if already chose before
        if(localStorage.getItem(STORAGE_KEY)) close();
      }
    });
  }

  function initAll(){
    // Apply theme (keeps page consistent between loads)
    applyTheme(normalizeTheme(localStorage.getItem(STORAGE_KEY)));

    bindThemeButton();
    bindHeaderInteractions();
    initThemeChooser();
  }

  onReady(initAll);
  document.addEventListener("tb:partials:loaded", initAll);

  // Expose for other scripts (optional)
  window.TB = window.TB || {};
  window.TB.requestOpenMessagePopup = requestOpenMessagePopup;
})();
