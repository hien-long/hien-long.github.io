const firebaseConfig = {
  apiKey: "AIzaSyCKysT8eZ3LJqyi7vCjoqQGIpjgTyt7HYg",
  authDomain: "loiyeuthuong-5bfab.firebaseapp.com",
  projectId: "loiyeuthuong-5bfab",
  storageBucket: "loiyeuthuong-5bfab.firebasestorage.app",
  messagingSenderId: "544284022045",
  appId: "1:544284022045:web:22f2eef2ed918d93707df4"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const membersDb = firebase.firestore();

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function renderMembers(list) {
  const grid = document.getElementById('members-grid');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = '<div class="members-empty">Hiện chưa có thành viên hiển thị.</div>';
    return;
  }

  grid.innerHTML = list.map((item) => {
    const avatar = item.avatar || `https://ui-avatars.com/api/?background=6f42c1&color=fff&name=${encodeURIComponent(item.name || 'Member')}`;
    const facebook = item.facebook ? `<a href="${item.facebook}" target="_blank" rel="noopener">Facebook</a>` : '';
    const instagram = item.instagram ? `<a href="${item.instagram}" target="_blank" rel="noopener">Instagram</a>` : '';

    return `
      <article class="member-card">
        <div class="member-top">
          <img class="member-avatar" src="${avatar}" alt="${escapeHtml(item.name)}">
          <div>
            <div class="member-name">${escapeHtml(item.name || 'Chưa có tên')}</div>
            <div class="member-role">${escapeHtml(item.role || 'Chưa có vai trò')}</div>
          </div>
        </div>
        ${item.bio ? `<div class="member-bio">${escapeHtml(item.bio)}</div>` : ''}
        <div class="member-links">${facebook}${instagram}</div>
      </article>
    `;
  }).join('');
}

function loadMembersPage() {
  membersDb.collection('members')
    .onSnapshot((snapshot) => {
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.active !== false)
        .sort((a, b) => (Number(a.order) || 9999) - (Number(b.order) || 9999));

      renderMembers(list);
    }, (error) => {
      console.error('Load members failed:', error);
      const grid = document.getElementById('members-grid');
      if (grid) {
        grid.innerHTML = '<div class="members-empty">Không thể tải dữ liệu thành viên. Vui lòng thử lại sau.</div>';
      }
    });
}

document.addEventListener('DOMContentLoaded', loadMembersPage);
