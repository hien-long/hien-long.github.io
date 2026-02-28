/* ===== Inline Script 1 ===== */
const firebaseConfig = {
    apiKey: "AIzaSyCKysT8eZ3LJqyi7vCjoqQGIpjgTyt7HYg",
    authDomain: "loiyeuthuong-5bfab.firebaseapp.com",
    projectId: "loiyeuthuong-5bfab",
    storageBucket: "loiyeuthuong-5bfab.firebasestorage.app",
    messagingSenderId: "544284022045",
    appId: "1:544284022045:web:22f2eef2ed918d93707df4"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const MESSAGES_PER_PAGE = 20;
let allMessages = [], displayedCount = 0, isLoading = false;
let banners = [];
let currentBannerIndex = 0;
let bannerInterval;

window.addEventListener('load', () => {
    const loadingBar = document.getElementById('loading-bar');
    setTimeout(() => {
        loadingBar.classList.add('loading-complete');
        setTimeout(() => loadingBar.remove(), 500);
    }, 500);
});

document.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < 20; i++) setTimeout(createHeart, i * 300);
    loadBanners();
    loadGallery();
    loadPrograms();
    loadTimeline(); // Load timeline data

    // Back-to-top (footer button)
    const footerTopBtn = document.querySelector('.footer-top');
    if (footerTopBtn) {
        footerTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

function createHeart() {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerHTML = '❤';
    const size = Math.random() * 50 + 30;
    const startX = Math.random() * window.innerWidth;
    const startY = window.innerHeight + 50;
    const endX = startX + (Math.random() - 0.5) * 500;
    const endY = -100 - Math.random() * 100;
    heart.style.setProperty('--tx', `${endX - startX}px`);
    heart.style.setProperty('--ty', `${endY - startY}px`);
    heart.style.fontSize = `${size}px`;
    heart.style.color = 'white';
    heart.style.left = `${startX}px`;
    heart.style.top = `${startY}px`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 3000);
}

// Hàm format ngày tháng
function formatDate(date) {
    if (!date) return 'N/A';
    if (date instanceof firebase.firestore.Timestamp) {
        date = date.toDate();
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ===== BANNER CAROUSEL FUNCTIONS =====
function loadBanners() {
    db.collection('banners').where('active', '==', true).orderBy('order', 'asc').onSnapshot(snapshot => {
        banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderBanners();
    });
}

function renderBanners() {
    const carousel = document.getElementById('banner-carousel');
    const dotsContainer = document.getElementById('banner-dots');

    if (banners.length === 0) {
        carousel.innerHTML = '<div style="text-align: center; padding: 100px 20px; color: #999;">Không có banner nào</div>';
        dotsContainer.innerHTML = '';
        return;
    }

    carousel.innerHTML = banners.map((banner, index) => `
                <div class="banner-slide ${banner.link ? 'is-link' : ''} ${index === 0 ? 'active' : ''}" data-index="${index}" ${banner.link ? `onclick="window.open('${banner.link}', '_blank')"` : ''}>
                    <img src="${banner.image}" alt="${banner.title || 'Banner'}" loading="lazy">
                    <div class="banner-overlay">
                        <div class="banner-content">
                            ${banner.title ? `<h3 class="banner-title">${banner.title}</h3>` : ''}
                            ${banner.link ? '<div class="banner-detail">Ấn vào để biết thêm chi tiết</div>' : ''}
                        </div>
                    </div>
                </div>
            `).join('');

    dotsContainer.innerHTML = banners.map((_, index) => `
                <div class="banner-dot ${index === 0 ? 'active' : ''}" onclick="goToBanner(${index})"></div>
            `).join('');

    startBannerAutoPlay();
}

function changeBanner(direction) {
    if (banners.length === 0) return;

    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dot');

    slides[currentBannerIndex].classList.remove('active');
    dots[currentBannerIndex].classList.remove('active');

    currentBannerIndex = (currentBannerIndex + direction + banners.length) % banners.length;

    slides[currentBannerIndex].classList.add('active');
    dots[currentBannerIndex].classList.add('active');

    resetBannerAutoPlay();
}

function goToBanner(index) {
    if (banners.length === 0) return;

    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dot');

    slides[currentBannerIndex].classList.remove('active');
    dots[currentBannerIndex].classList.remove('active');

    currentBannerIndex = index;

    slides[currentBannerIndex].classList.add('active');
    dots[currentBannerIndex].classList.add('active');

    resetBannerAutoPlay();
}

function startBannerAutoPlay() {
    stopBannerAutoPlay();
    bannerInterval = setInterval(() => {
        changeBanner(1);
    }, 5000);
}

function stopBannerAutoPlay() {
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }
}

function resetBannerAutoPlay() {
    stopBannerAutoPlay();
    startBannerAutoPlay();
}

// ===== TIMELINE FUNCTIONS =====
function loadTimeline() {
    const timelineContainer = document.getElementById('timeline-items');
    timelineContainer.innerHTML = '<div style="text-align: center; width: 100%; color: #999; padding: 20px;">Đang tải timeline...</div>';

    db.collection('timeline').orderBy('order').get()
        .then(snapshot => {
            if (snapshot.empty) {
                timelineContainer.innerHTML = '<div style="text-align: center; width: 100%; color: #999; padding: 20px;">Chưa có sự kiện nào.</div>';
                return;
            }

            const colors = ['#8E2F52', '#D84A3A', '#E6B23A', '#235A73', '#1F6B63'];

            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 4);

            let html = '';
            docs.forEach((data, idx) => {
                const posClass = (idx % 2 === 0) ? 'top' : 'bottom';
                const color = colors[idx % colors.length];
                const isLast = (idx === docs.length - 1) ? 'last' : '';
                const imgSrc = data.image ? data.image : 'https://via.placeholder.com/900x500?text=No+Image';

                html += `
                            <div class="timeline-item ${posClass}" style="--c:${color}">
                                <div class="timeline-content">
                                    <div class="tc-media">
                                        <img src="${imgSrc}" alt="${escapeHtml(data.title || data.year || 'Timeline')}" loading="lazy">
                                    </div>
                                    <div class="tc-side">
                                        <h3 class="tc-title">${escapeHtml(data.title || data.year || '')}</h3>
                                        <p class="tc-desc">${escapeHtml(data.description || '')}</p>
                                    </div>
                                </div>

                                <div class="rt-pin">
                                    <div class="timeline-year">${escapeHtml(data.year || '')}</div>
                                </div>

                                <div class="rt-seg ${isLast}"></div>
                            </div>
                        `;
            });

            timelineContainer.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading timeline:', error);
            timelineContainer.innerHTML = '<div style="text-align: center; width: 100%; color: #ff6b6b; padding: 20px;">Lỗi khi tải dữ liệu.</div>';
        });
}

// ===== MESSAGE FUNCTIONS =====
document.getElementById('popup-send-btn').addEventListener('click', async () => {
    const message = document.getElementById('popup-message-input').value.trim();
    const senderName = document.getElementById('popup-sender-name').value.trim();
    const isAnonymous = document.getElementById('anonymous-checkbox').checked;
    if (!message) return alert('Vui lòng nhập lời nhắn!');
    if (!senderName && !isAnonymous) return alert('Vui lòng nhập tên hoặc chọn ẩn danh!');
    try {
        await db.collection('messages').add({
            text: message, senderName: isAnonymous ? 'Ẩn danh' : senderName,
            isAnonymous, likes: 0, status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('popup-message-input').value = '';
        document.getElementById('popup-sender-name').value = '';
        document.getElementById('anonymous-checkbox').checked = false;
        closePopup('message-popup');
        showSuccessPopup();
    } catch (e) { alert('Lỗi: ' + e.message); }
});

function showSuccessPopup() {
    const overlay = document.getElementById('success-popup-overlay');
    const popup = document.getElementById('success-popup');
    overlay.style.display = 'flex'; popup.classList.add('show');
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => overlay.style.display = 'none', 400);
    }, 5000);
}

function closePopup(id) {
    document.getElementById(id).classList.remove('show');
    setTimeout(() => document.getElementById(id + '-overlay').style.display = 'none', 400);
}

document.getElementById('open-message-popup').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('message-popup-overlay').style.display = 'flex';
    document.getElementById('message-popup').classList.add('show');
});
document.querySelector('.close-btn').addEventListener('click', () => closePopup('message-popup'));
document.getElementById('message-popup-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closePopup('message-popup');
});

function setupMasonry() {
    const container = document.getElementById('messages-container');
    const messages = Array.from(container.children);
    if (window.innerWidth <= 768) { container.style.height = 'auto'; return; }
    const gap = 25;
    const containerWidth = container.offsetWidth;
    const minCardWidth = 320;
    const numColumns = Math.max(1, Math.min(Math.floor(containerWidth / minCardWidth), 5));
    const cardWidth = (containerWidth - gap * (numColumns - 1)) / numColumns;
    messages.forEach(msg => { msg.style.width = `${cardWidth}px`; msg.style.position = 'absolute'; });
    const columnHeights = new Array(numColumns).fill(0);
    const columnLefts = Array.from({ length: numColumns }, (_, i) => i * (cardWidth + gap));
    messages.forEach((msg, index) => {
        const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));
        msg.style.left = `${columnLefts[shortestCol]}px`;
        msg.style.top = `${columnHeights[shortestCol]}px`;
        columnHeights[shortestCol] += msg.offsetHeight + gap;
        msg.style.animationDelay = `${index * 0.05}s`;
    });
    container.style.height = `${Math.max(...columnHeights)}px`;
}

function renderMessages(startIndex, endIndex) {
    const container = document.getElementById('messages-container');
    const messagesToRender = allMessages.slice(startIndex, endIndex);
    messagesToRender.forEach(msg => {
        const el = document.createElement('div');
        el.className = 'message';
        const likedMessages = JSON.parse(localStorage.getItem('likedMessages') || '[]');
        const isLiked = likedMessages.includes(msg.id);
        const senderDisplay = msg.isAnonymous ? '👤 Ẩn danh' : `✍️ ${escapeHtml(msg.senderName || 'Ẩn danh')}`;
        const dateDisplay = formatDate(msg.timestamp);
        el.innerHTML = `<div class="message-sender">${senderDisplay}</div><div class="message-text">${escapeHtml(msg.text)}</div><div class="message-actions"><span class="heart-icon ${isLiked ? 'liked' : ''}" data-id="${msg.id}"><span class="heart-symbol">${isLiked ? '❤' : '🤍'}</span><span class="like-count">${msg.likes || 0}</span></span><span>${dateDisplay}</span></div>`;
        container.appendChild(el);
    });
    setTimeout(setupMasonry, 100);
}

function updateLoadMoreButton() {
    const btn = document.getElementById('load-more-btn');
    if (displayedCount >= allMessages.length) { btn.style.display = 'none'; }
    else { btn.style.display = 'inline-flex'; btn.disabled = isLoading; }
}

function loadMoreMessages() {
    if (isLoading || displayedCount >= allMessages.length) return;
    isLoading = true;
    const btn = document.getElementById('load-more-btn');
    btn.classList.add('loading'); btn.disabled = true;
    setTimeout(() => {
        const startIndex = displayedCount;
        const endIndex = Math.min(startIndex + MESSAGES_PER_PAGE, allMessages.length);
        renderMessages(startIndex, endIndex);
        displayedCount = endIndex;
        isLoading = false;
        btn.classList.remove('loading');
        updateLoadMoreButton();
    }, 300);
}

async function toggleLike(messageId, heartIcon) {
    const likedMessages = JSON.parse(localStorage.getItem('likedMessages') || '[]');
    const isLiked = likedMessages.includes(messageId);
    const countSpan = heartIcon.querySelector('.like-count');
    const symbolSpan = heartIcon.querySelector('.heart-symbol');
    let currentCount = parseInt(countSpan.textContent) || 0;
    if (isLiked) {
        const index = likedMessages.indexOf(messageId);
        if (index > -1) likedMessages.splice(index, 1);
        localStorage.setItem('likedMessages', JSON.stringify(likedMessages));
        heartIcon.classList.remove('liked'); symbolSpan.textContent = '🤍';
        countSpan.textContent = Math.max(0, currentCount - 1);
        try { await db.collection('messages').doc(messageId).update({ likes: firebase.firestore.FieldValue.increment(-1) }); }
        catch (e) { console.error('Unlike error:', e); countSpan.textContent = currentCount; }
    } else {
        likedMessages.push(messageId);
        localStorage.setItem('likedMessages', JSON.stringify(likedMessages));
        heartIcon.classList.add('liked'); symbolSpan.textContent = '❤';
        countSpan.textContent = currentCount + 1;
        try { await db.collection('messages').doc(messageId).update({ likes: firebase.firestore.FieldValue.increment(1) }); }
        catch (e) { console.error('Like error:', e); heartIcon.classList.remove('liked'); symbolSpan.textContent = '🤍'; countSpan.textContent = currentCount; }
    }
}

function loadApprovedMessages() {
    db.collection('messages').where('status', '==', 'approved').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp }));
        const container = document.getElementById('messages-container');
        container.innerHTML = ''; displayedCount = 0;
        if (allMessages.length > 0) {
            renderMessages(0, Math.min(MESSAGES_PER_PAGE, allMessages.length));
            displayedCount = Math.min(MESSAGES_PER_PAGE, allMessages.length);
        }
        updateLoadMoreButton();
    });
}

document.addEventListener('click', e => {
    const heartIcon = e.target.closest('.heart-icon');
    if (heartIcon) { e.stopPropagation(); toggleLike(heartIcon.dataset.id, heartIcon); }
});

document.getElementById('load-more-btn').addEventListener('click', loadMoreMessages);

function loadGallery() {
    db.collection('gallery').orderBy('order', 'asc').onSnapshot(snapshot => {
        const galleryScroll = document.getElementById('gallery-scroll');
        galleryScroll.innerHTML = '';
        if (snapshot.empty) { galleryScroll.innerHTML = '<p style="color:#999;text-align:center;width:100%;">Chưa có hoạt động nào</p>'; return; }
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.innerHTML = `<img src="${data.image}" alt="${data.title}" loading="lazy"><div class="card-content"><h3>${data.title}</h3><p>${escapeHtml(data.description || '')}</p></div>`;
            galleryScroll.appendChild(card);
        });
    });
}

function scrollGallery(direction) {
    const scrollContainer = document.getElementById('gallery-scroll');
    scrollContainer.scrollBy({ left: direction * 370, behavior: 'smooth' });
}


loadApprovedMessages();
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(setupMasonry, 250); });

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }


/* ===== Inline Script 2 ===== */
// Hook big CTA buttons to existing message popup
(function msHookMessageCTA() {
    function openPopupViaExisting() {
        const a = document.getElementById('open-message-popup');
        if (a) { a.click(); return; }
        // fallback: try known function if exists
        if (typeof openMessagePopup === 'function') openMessagePopup();
    }
    document.addEventListener('DOMContentLoaded', function () {
        const b1 = document.getElementById('ms-message-cta-top');
        const b2 = document.getElementById('ms-message-cta-bottom');
        if (b1) b1.addEventListener('click', openPopupViaExisting);
        if (b2) b2.addEventListener('click', openPopupViaExisting);
    });
})();


// Theme and Header interactions are now handled by common-ui.js



/* ===== Inline Script 6 ===== */
// Footer "back to top"
(function () {
    const btn = document.querySelector('.footer-top');
    if (!btn) return;
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();
