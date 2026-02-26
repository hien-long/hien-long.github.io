(async function(){
  /**
   * GitHub Pages / folder hosting friendly:
   * - Try multiple relative paths so the site still works if pages are moved into subfolders.
   * - Emit an event after injection so other scripts can (re)bind listeners.
   */

  async function fetchFirstOk(urls){
    for (const url of urls){
      try{
        const res = await fetch(url, { cache: "no-cache" });
        if(res.ok) return { url, text: await res.text() };
      }catch(_){ /* ignore */ }
    }
    return null;
  }

  async function inject(id, urls){
    const el = document.getElementById(id);
    if(!el) return;
    const hit = await fetchFirstOk(urls);
    if(!hit){
      console.error("[inject] Failed all candidates for", id, urls);
      return;
    }
    el.innerHTML = hit.text;
    el.setAttribute("data-injected-from", hit.url);
  }

  function ensureStylesheet(){
    // If styles.css failed to load (wrong relative path), try a few candidates.
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(l => (l.getAttribute('href') || '').includes('styles.css'));
    if(existing) return;

    const candidates = [
      "styles.css",
      "./styles.css",
      "../styles.css",
      "../../styles.css"
    ];

    (async () => {
      const ok = await fetchFirstOk(candidates);
      if(!ok) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = ok.url;
      document.head.appendChild(link);
    })();
  }

  ensureStylesheet();

  // Inject shared components first so anchors / buttons exist
  await inject("site-header", [
    "partials/header.html",
    "./partials/header.html",
    "../partials/header.html",
    "header.html",
    "./header.html",
    "../header.html"
  ]);
  await inject("site-footer", [
    "partials/footer.html",
    "./partials/footer.html",
    "../partials/footer.html",
    "footer.html",
    "./footer.html",
    "../footer.html"
  ]);

  // Re-bind: footer back-to-top button (exists after inject)
  const topBtn = document.querySelector(".footer-top");
  if(topBtn && topBtn.dataset.tbBound !== "1"){
    topBtn.dataset.tbBound = "1";
    topBtn.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));
  }

  // Let other scripts know partials are now in DOM
  document.dispatchEvent(new CustomEvent("tb:partials:loaded"));
})();
