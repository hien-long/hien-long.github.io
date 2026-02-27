
/* Members page logic (Team) — loads from Firestore collection `members`
   Supports: search, tag chips, modal full profile, achievements field, social links.
*/

(function () {
  // Firebase init (shared project)
  const firebaseConfig = {
    apiKey: "AIzaSyCKysT8eZ3LJqyi7vCjoqQGIpjgTyt7HYg",
    authDomain: "loiyeuthuong-5bfab.firebaseapp.com",
    projectId: "loiyeuthuong-5bfab",
    storageBucket: "loiyeuthuong-5bfab.firebasestorage.app",
    messagingSenderId: "544284022045",
    appId: "1:544284022045:web:22f2eef2ed918d93707df4"
  };
  if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // ===== Utils =====
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = (text ?? "");
    return div.innerHTML;
  }
  function formatAchievements(text) {
    const raw = (text ?? "").toString();
    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!lines.length) return "";
    const html = lines.map(line => {
      const clean = line.replace(/^\s*[•\u2022\-*]\s*/, "");
      return `<div class="achv-line"><span class="achv-dot">•</span><span class="achv-text">${escapeHtml(clean)}</span></div>`;
    }).join("");
    return `<div class="achv-lines">${html}</div>`;
  }

  function formatAchievementsPreview(text, limit = 3) {
    const raw = (text ?? "").toString();
    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!lines.length) return "";
    const picked = lines.slice(0, Math.max(0, limit));
    const html = picked.map(line => {
      const clean = line.replace(/^\s*[•\u2022\-*]\s*/, "");
      return `<div class="achv-line"><span class="achv-dot">•</span><span class="achv-text">${escapeHtml(clean)}</span></div>`;
    }).join("");
    return `<div class="achv-lines">${html}</div>`;
  }

  function avatarFallback(name) {
    const n = (name || "Member");
    return "https://ui-avatars.com/api/?background=7C3AED&color=fff&name=" + encodeURIComponent(n);
  }

  // ===== DOM =====
  const grid = document.getElementById("team-grid");
  const chips = document.getElementById("team-chips");
  const empty = document.getElementById("empty-state");
  const loading = document.getElementById("loading-state");
  const search = document.getElementById("member-search");

  // Modal
  const modal = document.getElementById("member-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modal-close");

  // ===== State =====
  let MEMBERS = [];
  let TAGS = new Map(); // key -> {role,color,order,active}
  let q = "";
  let activeTag = "ALL";

  // Quotes (global for member modal)
  let TEAM_QUOTES = ["Cảm ơn bạn đã ghé xem team tụi mình."];

  function normalizeMember(doc) {
    const d = doc.data() || {};
    const name = (d.name || "").trim() || "Chưa có tên";
    const role = (d.role || "").trim() || "Chưa cập nhật";
    const avatar = (d.avatar || "").trim() || avatarFallback(name);
    const bio = (d.bio || "").trim() || "";
    const achievements = (d.achievements || d.achievement || "").trim() || "";
    const email = (d.email || "").toString().trim();
    const school = (d.school || d.university || d.truong || "").toString().trim();
    const links = {
      facebook: (d.facebook || "").trim(),
      instagram: (d.instagram || "").trim()
    };
    const tags = Array.isArray(d.tags) ? d.tags.filter(Boolean).map(String) : [];
    const activeTime = (d.activeTime || '').toString().trim();

    return {
      id: doc.id,
      name,
      role,
      avatar,
      bio,
      achievements,
      email,
      school,
      links,
      tags,
      activeTime,
      active: (d.active !== false),
      order: Number.isFinite(d.order) ? d.order : (parseInt(d.order, 10) || 9999),
      pinned: Boolean(d.pinned),
      verified: Boolean(d.verified) // optional
    };
  }

  function matches(member) {
    if (!member.active) return false;

    const tagOk = (activeTag === "ALL") || (member.tags || []).includes(activeTag);
    if (!tagOk) return false;

    if (!q) return true;
    const hay = (
      member.name + " " +
      member.role + " " +
      (member.bio || "") + " " +
      (member.achievements || "") + " " +
      (member.tags || []).join(" ")
    ).toLowerCase();

    return hay.includes(q);
  }

  
  function tagInfo(key){
    const t = TAGS.get(key);
    if (t && (t.active !== false)) return t;
    return { role: key, color: '' };
  }
// ===== Render chips =====
  function setActiveChip(key) {
    activeTag = key;
    [...chips.querySelectorAll(".chip")].forEach(c => c.classList.toggle("is-active", c.dataset.key === key));
    renderGrid();
  }

  function renderChips() {
    if (!chips) return;
    chips.innerHTML = "";

    const tagSet = new Set();
    MEMBERS.filter(m => m.active).forEach(m => (m.tags || []).forEach(t => tagSet.add(t)));
    const keys = [...tagSet];

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "chip" + (activeTag === "ALL" ? " is-active" : "");
    allBtn.dataset.key = "ALL";
    allBtn.textContent = "Tất cả";
    allBtn.addEventListener("click", () => setActiveChip("ALL"));
    chips.appendChild(allBtn);

    keys.sort((a,b)=>{
      const ta = TAGS.get(a);
      const tb = TAGS.get(b);
      const oa = ta ? (parseInt(ta.order,10) || 9999) : 9999;
      const ob = tb ? (parseInt(tb.order,10) || 9999) : 9999;
      if (oa !== ob) return oa - ob;
      const la = (ta && ta.role) ? ta.role : a;
      const lb = (tb && tb.role) ? tb.role : b;
      return la.localeCompare(lb, "vi");
    });

    keys.forEach(k => {
      const info = tagInfo(k);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (activeTag === k ? " is-active" : "");
      b.dataset.key = k;
      b.textContent = info.role;
      b.addEventListener("click", () => setActiveChip(k));
      chips.appendChild(b);
    });
  }

  // ===== Card =====
  function memberCard(member) {
    const root = document.createElement("article");
    root.className = "mcard";
    root.tabIndex = 0;

    const media = document.createElement("div");
    media.className = "mcard-media";
    media.innerHTML = `
      <img class="mcard-img" src="${escapeHtml(member.avatar)}" alt="${escapeHtml(member.name)}" loading="lazy">
      <div class="mcard-shade" aria-hidden="true"></div>
    `;

    const body = document.createElement("div");
    body.className = "mcard-body";

    const badge = member.verified ? `<span class="mcard-verified" title="Verified">✓</span>` : "";
    const pin = member.pinned ? `<span class="mcard-pin" title="Pinned">📌</span>` : "";

    // Info block: align all rows (Email / Trường / Thành tích / Thời gian) in the same 2-column layout.
    // NOTE: use <div> for value to safely contain multi-line achievements markup.
    const rows = [];

    if (member.email) {
      rows.push(`<div class="mcard-info-row"><span class="mcard-info-label">Email</span><div class="mcard-info-value">${escapeHtml(member.email)}</div></div>`);
    }
    if (member.school) {
      rows.push(`<div class="mcard-info-row"><span class="mcard-info-label">Trường</span><div class="mcard-info-value">${escapeHtml(member.school)}</div></div>`);
    }

    // Achievements: show up to 3 lines in card view, auto-bulleted, preserves new lines.
    const achvVal = member.achievements
      ? formatAchievementsPreview(member.achievements, 3)
      : `<span class="mcard-muted">(chưa cập nhật)</span>`;
    rows.push(`<div class="mcard-info-row"><span class="mcard-info-label">Thành tích</span><div class="mcard-info-value">${achvVal}</div></div>`);

    // Active time under achievements (kept in the same info block so it doesn't look detached)
    const timeVal = member.activeTime
      ? escapeHtml(member.activeTime)
      : `<span class="mcard-muted">(chưa cập nhật)</span>`;
    rows.push(`<div class="mcard-info-row"><span class="mcard-info-label">Thời gian</span><div class="mcard-info-value">${timeVal}</div></div>`);

    const infoBlock = `<div class="mcard-info">${rows.join("")}</div>`;

    const hasFacebook = Boolean(member.links && member.links.facebook);
    const fbBtnClass = hasFacebook ? "" : " is-disabled";
    body.innerHTML = `
      <div class="mcard-name-row">
        <div class="mcard-name">${escapeHtml(member.name)}</div>
        ${pin}${badge}
      </div>
      <div class="mcard-role">${escapeHtml(member.role)}</div>
      ${infoBlock}
      ${(member.tags && member.tags.length) ? `
        <div class="mcard-tags">
          ${member.tags.slice(0, 3).map(t => { const info = tagInfo(t); const style = info.color ? ` style=\"--tag:${escapeHtml(info.color)}\"` : ''; return `<span class=\"mcard-tag\"${style}>${escapeHtml(info.role)}</span>`; }).join("")}
        </div>` : ""}
      <div class="mcard-actions">
        <button type="button" class="mcard-btn ghost" data-act="view"><span>👤</span> Xem</button>
        <button type="button" class="mcard-btn ghost${fbBtnClass}" data-act="facebook"><span>f</span> Facebook</button>
      </div>
    `;

    root.appendChild(media);
    root.appendChild(body);

    function open() { openModal(member); }
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (btn) return; // buttons handle themselves
      open();
    });
    root.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });

    body.querySelector('[data-act="view"]').addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); open(); });
    body.querySelector('[data-act="facebook"]').addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const link = (member.links && member.links.facebook) || "";
      if (!link) return open();
      window.open(link, "_blank", "noopener");
    });

    return root;
  }

  function renderGrid() {
    if (!grid) return;
    grid.innerHTML = "";

    const list = MEMBERS.filter(matches).sort((a,b)=>{
      const ap = a.pinned ? 1 : 0;
      const bp = b.pinned ? 1 : 0;
      if (bp !== ap) return bp - ap;
      if ((a.order||0) !== (b.order||0)) return (a.order||0) - (b.order||0);
      return (a.name||"").localeCompare(b.name||"", "vi");
    });
    if (!list.length) {
      empty && (empty.style.display = "block");
    } else {
      empty && (empty.style.display = "none");
      list.forEach(m => grid.appendChild(memberCard(m)));
    }
  }

  // ===== Modal =====
  function openModal(member) {
    if (!modal) return;
    modalTitle.textContent = member.name;
    const quote = pickQuote();

    modalBody.innerHTML = `
      <div class="profile-sheet">
        <div class="p-left">
          <div class="p-avatar-wrap">
            <img class="p-avatar" src="${escapeHtml(member.avatar)}" alt="${escapeHtml(member.name)}">
          </div>
        </div>

        <div class="p-right">
          <div class="p-hello">THE BLOUSE</div>
          <div class="p-name">${escapeHtml(member.name)}</div>
          <div style="font-weight:900; color: var(--t-muted);">${escapeHtml(member.role)}</div>

          <div class="p-divider"></div>

          <div class="p-info">
            <div class="p-label">Bio</div>
            <div class="p-value">${member.bio ? escapeHtml(member.bio) : "<span style='opacity:.7'>(không có)</span>"}</div>

            ${member.email ? `
              <div class="p-label">Email</div>
              <div class="p-value"><a href="mailto:${escapeHtml(member.email)}">${escapeHtml(member.email)}</a></div>
            ` : ""}

            ${member.school ? `
              <div class="p-label">Trường</div>
              <div class="p-value">${escapeHtml(member.school)}</div>
            ` : ""}

            <div class="p-label">Thành tích</div>
            <div class="p-value">${member.achievements ? formatAchievements(member.achievements) : "<span style='opacity:.7'>(chưa cập nhật)</span>"}</div>
            <div class="p-label">Tags</div>
            <div class="p-value">${
              (member.tags || []).length
                ? (member.tags || []).map(t => { const info = tagInfo(t); const c = info.color || '#7C3AED'; return `<span class="badge" style="display:inline-flex;margin:0 6px 6px 0; border-color:${escapeHtml(c)}55; background: ${escapeHtml(c)}1A;">${escapeHtml(info.role)}</span>`; }).join("")
                : "<span style='opacity:.7'>(không có)</span>"
            }</div>

            <div class="p-label">Thời gian hoạt động</div>
            <div class="p-value">${member.activeTime ? escapeHtml(member.activeTime) : "<span style='opacity:.7'>(chưa cập nhật)</span>"}</div>
          </div>

          ${quote ? `<div class="p-quote">“${escapeHtml(quote)}”</div>` : ""}

          <div class="p-actions">
            ${member.links.instagram ? `<a class="p-btn primary" href="${escapeHtml(member.links.instagram)}" target="_blank" rel="noopener"><span>◎</span> Instagram</a>` : ""}
            ${member.links.facebook ? `<a class="p-btn secondary" href="${escapeHtml(member.links.facebook)}" target="_blank" rel="noopener"><span>f</span> Facebook</a>` : ""}
            <button class="p-btn ghost" type="button" id="mcard-close-2"><span>✕</span> Đóng</button>
          </div>
        </div>
      </div>
    `;

    const close2 = document.getElementById("mcard-close-2");
    if (close2) close2.addEventListener("click", closeModal);

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal && modal.style.display === "flex") closeModal(); });

  // ===== Search =====
  if (search) {
    search.addEventListener("input", (e) => {
      q = (e.target.value || "").trim().toLowerCase();
      renderGrid();
    });
  }


  

  
  // ===== Quotes (settings/ui.teamQuotes) =====
  function loadTeamQuotes(){
    db.collection("settings").doc("ui").onSnapshot((doc)=>{
      if (!doc || !doc.exists) return;
      const d = doc.data() || {};
      let raw = (d.teamQuotes ?? d.memberQuotes ?? d.teamQuote ?? d.memberQuote ?? d.quote);
      if (typeof raw === "string") raw = [raw];
      if (!Array.isArray(raw)) return;
      const cleaned = raw.map(x => (x ?? "").toString().trim()).filter(Boolean);
      if (cleaned.length) TEAM_QUOTES = cleaned;
    }, ()=>{/* ignore */});
  }

  function pickQuote(){
    const list = Array.isArray(TEAM_QUOTES) ? TEAM_QUOTES.filter(Boolean) : [];
    if (!list.length) return "";
    return list[Math.floor(Math.random() * list.length)];
  }

// ===== Load tags (role badges) =====
  function loadTags(){
    db.collection("tags").orderBy("order", "asc")
      .onSnapshot((snap)=>{
        const m = new Map();
        snap.forEach(doc => {
          const d = doc.data() || {};
          m.set(doc.id, {
            role: (d.role || doc.id).toString(),
            color: (d.color || '').toString(),
            order: parseInt(d.order, 10) || 9999,
            active: (d.active !== false)
          });
        });
        TAGS = m;
        // keep activeTag if still exists
        renderChips();
        renderGrid();
      }, ()=>{/* ignore */});
  }

  // ===== Load from Firestore =====
  function loadMembers() {
    loading && (loading.style.display = "block");
    db.collection("members")
      .orderBy("order", "asc")
      .onSnapshot((snapshot) => {
        MEMBERS = snapshot.docs.map(normalizeMember);
        loading && (loading.style.display = "none");

        // keep activeTag if still exists
        const tagSet = new Set();
        MEMBERS.forEach(m => (m.tags || []).forEach(t => tagSet.add(t)));
        if (activeTag !== "ALL" && !tagSet.has(activeTag)) activeTag = "ALL";

        renderChips();
        setActiveChip(activeTag);
      }, (err) => {
        loading && (loading.style.display = "none");
        if (empty) {
          empty.style.display = "block";
          empty.textContent = "Lỗi tải dữ liệu members: " + (err && err.message ? err.message : err);
        }
      });
  }

  document.addEventListener("DOMContentLoaded", () => { loadTeamQuotes(); loadTags(); loadMembers(); });
})();
