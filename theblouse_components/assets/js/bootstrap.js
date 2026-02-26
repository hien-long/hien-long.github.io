(function(){
  function loadScript(src){
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.onload = function(){ resolve(); };
      s.onerror = function(){ reject(new Error("Failed to load script: " + src)); };
      document.body.appendChild(s);
    });
  }

  async function inject(id, url){
    var el = document.getElementById(id);
    if(!el) return;
    try{
      var res = await fetch(url, { cache: "no-cache" });
      if(!res.ok) throw new Error("HTTP " + res.status);
      el.innerHTML = await res.text();
    }catch(err){
      console.error("[TB] Failed to inject", url, err);
      // Keep placeholder empty to avoid breaking layout
    }
  }

  async function boot(){
    // 1) Inject shared partials
    await inject("tb-header", "partials/header.html");
    await inject("tb-footer", "partials/footer.html");

    // Let other scripts know header/footer are ready
    document.dispatchEvent(new CustomEvent("tb:partials:loaded"));

    // 2) Load shared JS
    await loadScript("assets/js/common-ui.js");

    // 3) Load page-specific JS (comma-separated)
    var meta = document.querySelector('meta[name="tb-page-scripts"]');
    var list = meta && meta.content ? meta.content.split(",") : [];
    for (var i=0;i<list.length;i++){
      var src = list[i].trim();
      if(src) await loadScript(src);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }
})();
