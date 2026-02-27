(async function(){
  async function inject(id, url){
    const el = document.getElementById(id);
    if(!el) return;
    try{
      const res = await fetch(url, {cache: "no-cache"});
      if(!res.ok) throw new Error(res.status + " " + res.statusText);
      el.innerHTML = await res.text();
    }catch(err){
      console.error("[inject] Failed:", url, err);
    }
  }

  // Inject shared components first so anchors / buttons exist
  await inject("site-header", "partials/header.html");
  await inject("site-footer", "partials/footer.html");

  // Re-bind: footer back-to-top button (exists after inject)
  const topBtn = document.querySelector(".footer-top");
  if(topBtn){
    topBtn.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));
  }
})();
