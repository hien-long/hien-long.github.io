// ===== FIREBASE CONFIG =====
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
const db = firebase.firestore();

// ===== CONSTANTS =====
const MESSAGES_PER_PAGE = 20;
let allMessages = [];
let displayedCount = 0;
let isLoading = false;
let banners = [];
let currentBannerIndex = 0;
let bannerInterval;

// ===== UTILS =====
function escapeHtml(text) { 
    const div = document.createElement('div'); 
    div.textContent = text; 
    return div.innerHTML; 
}

function formatDate(date) {
    if (!date) return 'N/A';
    if (date instanceof firebase.firestore.Timestamp) {
        date = date.toDate();
    }
    return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

// ===== INIT EVENT LISTENERS =====
function initEventListeners() {
    const openPopupBtn = document.getElementById('open-message-popup');
    if (openPopupBtn) {
        openPopupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const overlay = document.getElementById('message-popup-overlay');
            const popup = document.getElementById('message-popup');
            if (overlay && popup) {
                overlay.style.display = 'flex';
                popup.classList.add('show');
            }
        });
    }
    
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closePopup('message-popup');
        });
    }
    
    const messagePopupOverlay = document.getElementById('message-popup-overlay');
    if (messagePopupOverlay) {
        messagePopupOverlay.addEventListener('click', function(e) {
            if (e.target === e.currentTarget) {
                closePopup('message-popup');
            }
        });
    }
    
    const sendBtn = document.getElementById('popup-send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreMessages);
    }
    
    document.addEventListener('click', function(e) {
        const heartIcon = e.target.closest('.heart-icon');
        if (heartIcon) { 
            e.stopPropagation(); 
            toggleLike(heartIcon.dataset.id, heartIcon); 
        }
    });
}

// ===== INIT FEATURES =====
function initFeatures() {
    window.addEventListener('load', function() {
        const loadingBar = document.getElementById('loading-bar');
        if (loadingBar) {
            setTimeout(function() {
                loadingBar.classList.add('loading-complete');
                setTimeout(function() { loadingBar.remove(); }, 500);
            }, 500);
        }
    });
    
    for (let i = 0; i < 20; i++) {
        setTimeout(createHeart, i * 300);
    }
    
    let resizeTimer;
    window.addEventListener('resize', function() { 
        clearTimeout(resizeTimer); 
        resizeTimer = setTimeout(setupMasonry, 250); 
    });
}

// ===== HEART FLOATING =====
function createHeart() {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerHTML = '❤';
    const size = Math.random() * 50 + 30;
    const startX = Math.random() * window.innerWidth;
    const startY = window.innerHeight + 50;
    const endX = startX + (Math.random() - 0.5) * 500;
    const endY = -100 - Math.random() * 100;
    heart.style.setProperty('--tx', (endX - startX) + 'px');
    heart.style.setProperty('--ty', (endY - startY) + 'px');
    heart.style.fontSize = size + 'px';
    heart.style.color = 'white';
    heart.style.left = startX + 'px';
    heart.style.top = startY + 'px';
    document.body.appendChild(heart);
    setTimeout(function() { heart.remove(); }, 3000);
}

// ===== BANNER FUNCTIONS =====
function loadBanners() {
    db.collection('banners').where('active', '==', true).orderBy('order', 'asc').onSnapshot(function(snapshot) {
        banners = snapshot.docs.map(function(doc) { return { id: doc.id, ...doc.data() }; });
        renderBanners();
    });
}

function renderBanners() {
    const carousel = document.getElementById('banner-carousel');
    const dotsContainer = document.getElementById('banner-dots');
    if (!carousel || !dotsContainer) return;
    
    if (banners.length === 0) {
        carousel.innerHTML = '<div style="text-align:center;padding:100px 20px;color:#999;">Không có banner nào</div>';
        dotsContainer.innerHTML = '';
        return;
    }

    let slidesHTML = '';
    let dotsHTML = '';
    banners.forEach(function(banner, index) {
        const activeClass = index === 0 ? 'active' : '';
        const onclickAttr = banner.link ? 'onclick="window.open(\'' + banner.link + '\',\'_blank\')"' : '';
        slidesHTML += '<div class="banner-slide ' + activeClass + '" ' + onclickAttr + '>' +
            '<img src="' + banner.image + '" alt="' + (banner.title || 'Banner') + '" loading="lazy">' +
            '<div class="banner-overlay"><div class="banner-content">' +
            (banner.title ? '<h3 class="banner-title">' + banner.title + '</h3>' : '') +
            (banner.link ? '<div class="banner-detail">Ấn vào để biết thêm chi tiết</div>' : '') +
            '</div></div></div>';
        dotsHTML += '<div class="banner-dot ' + (index === 0 ? 'active' : '') + '" onclick="goToBanner(' + index + ')"></div>';
    });
    
    carousel.innerHTML = slidesHTML;
    dotsContainer.innerHTML = dotsHTML;
    startBannerAutoPlay();
}

function changeBanner(direction) {
    if (banners.length === 0) return;
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dot');
    if (slides[currentBannerIndex]) slides[currentBannerIndex].classList.remove('active');
    if (dots[currentBannerIndex]) dots[currentBannerIndex].classList.remove('active');
    currentBannerIndex = (currentBannerIndex + direction + banners.length) % banners.length;
    if (slides[currentBannerIndex]) slides[currentBannerIndex].classList.add('active');
    if (dots[currentBannerIndex]) dots[currentBannerIndex].classList.add('active');
    resetBannerAutoPlay();
}

function goToBanner(index) {
    if (banners.length === 0 || index < 0 || index >= banners.length) return;
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dot');
    if (slides[currentBannerIndex]) slides[currentBannerIndex].classList.remove('active');
    if (dots[currentBannerIndex]) dots[currentBannerIndex].classList.remove('active');
    currentBannerIndex = index;
    if (slides[currentBannerIndex]) slides[currentBannerIndex].classList.add('active');
    if (dots[currentBannerIndex]) dots[currentBannerIndex].classList.add('active');
    resetBannerAutoPlay();
}

function startBannerAutoPlay() {
    stopBannerAutoPlay();
    bannerInterval = setInterval(function() { changeBanner(1); }, 5000);
}

function stopBannerAutoPlay() {
    if (bannerInterval) { clearInterval(bannerInterval); bannerInterval = null; }
}

function resetBannerAutoPlay() {
    stopBannerAutoPlay();
    startBannerAutoPlay();
}

// ===== GALLERY FUNCTIONS =====
function loadGallery() {
    db.collection('gallery').orderBy('order', 'asc').onSnapshot(function(snapshot) {
        const galleryScroll = document.getElementById('gallery-scroll');
        if (!galleryScroll) return;
        galleryScroll.innerHTML = '';
        if (snapshot.empty) { 
            galleryScroll.innerHTML = '<p style="color:#999;text-align:center;width:100%;">Chưa có hoạt động nào</p>'; 
            return; 
        }
        snapshot.forEach(function(doc) {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.innerHTML = '<img src="' + data.image + '" alt="' + data.title + '" loading="lazy">' +
                '<div class="card-content"><h3>' + data.title + '</h3><p>' + (data.description || '') + '</p></div>';
            galleryScroll.appendChild(card);
        });
    });
}

function scrollGallery(direction) {
    const scrollContainer = document.getElementById('gallery-scroll');
    if (scrollContainer) {
        scrollContainer.scrollBy({ left: direction * 370, behavior: 'smooth' });
    }
}

// ===== MESSAGE FUNCTIONS =====
function sendMessage() {
    const messageInput = document.getElementById('popup-message-input');
    const senderNameInput = document.getElementById('popup-sender-name');
    const anonymousCheckbox = document.getElementById('anonymous-checkbox');
    const message = messageInput ? messageInput.value.trim() : '';
    const senderName = senderNameInput ? senderNameInput.value.trim() : '';
    const isAnonymous = anonymousCheckbox ? anonymousCheckbox.checked : false;
    
    if (!message) return alert('Vui lòng nhập lời nhắn!');
    if (!senderName && !isAnonymous) return alert('Vui lòng nhập tên hoặc chọn ẩn danh!');
    
    db.collection('messages').add({
        text: message, 
        senderName: isAnonymous ? 'Ẩn danh' : senderName,
        isAnonymous: isAnonymous,
        likes: 0, 
        status: 'pending',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        if (messageInput) messageInput.value = '';
        if (senderNameInput) senderNameInput.value = '';
        if (anonymousCheckbox) anonymousCheckbox.checked = false;
        closePopup('message-popup');
        showSuccessPopup();
    }).catch(function(e) { 
        console.error('Error:', e);
        alert('Lỗi: ' + e.message); 
    });
}

function showSuccessPopup() {
    const overlay = document.getElementById('success-popup-overlay');
    const popup = document.getElementById('success-popup');
    if (!overlay || !popup) return;
    overlay.style.display = 'flex'; 
    popup.classList.add('show');
    setTimeout(function() {
        popup.classList.remove('show');
        setTimeout(function() { overlay.style.display = 'none'; }, 400);
    }, 5000);
}

function closePopup(id) {
    const popup = document.getElementById(id);
    const overlay = document.getElementById(id + '-overlay');
    if (!popup || !overlay) return;
    popup.classList.remove('show');
    setTimeout(function() { overlay.style.display = 'none'; }, 400);
}

// ===== MASONRY LAYOUT =====
function setupMasonry() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    const messages = Array.from(container.children);
    if (window.innerWidth <= 768) { 
        container.style.height = 'auto'; 
        messages.forEach(function(msg) { 
            msg.style.position = 'relative'; 
            msg.style.width = '100%'; 
            msg.style.left = '0';
            msg.style.top = '0';
        });
        return; 
    }
    const gap = 25;
    const containerWidth = container.offsetWidth;
    const minCardWidth = 320;
    const numColumns = Math.max(1, Math.min(Math.floor(containerWidth / minCardWidth), 5));
    const cardWidth = (containerWidth - gap * (numColumns - 1)) / numColumns;
    messages.forEach(function(msg) { 
        msg.style.width = cardWidth + 'px'; 
        msg.style.position = 'absolute'; 
        msg.style.left = '0';
        msg.style.top = '0';
    });
    const columnHeights = new Array(numColumns).fill(0);
    const columnLefts = [];
    for (let i = 0; i < numColumns; i++) { columnLefts.push(i * (cardWidth + gap)); }
    messages.forEach(function(msg, index) {
        const minHeight = Math.min.apply(null, columnHeights);
        const shortestCol = columnHeights.indexOf(minHeight);
        msg.style.left = columnLefts[shortestCol] + 'px';
        msg.style.top = columnHeights[shortestCol] + 'px';
        columnHeights[shortestCol] += msg.offsetHeight + gap;
        msg.style.animationDelay = (index * 0.05) + 's';
        msg.style.opacity = '1';
    });
    const maxHeight = Math.max.apply(null, columnHeights);
    container.style.height = maxHeight + 'px';
}

function renderMessages(startIndex, endIndex) {
    const container = document.getElementById('messages-container');
    if (!container) return;
    const messagesToRender = allMessages.slice(startIndex, endIndex);
    messagesToRender.forEach(function(msg) {
        const el = document.createElement('div');
        el.className = 'message';
        const likedMessages = JSON.parse(localStorage.getItem('likedMessages') || '[]');
        const isLiked = likedMessages.indexOf(msg.id) > -1;
        const senderDisplay = msg.isAnonymous ? '👤 Ẩn danh' : '✍️ ' + escapeHtml(msg.senderName || 'Ẩn danh');
        const dateDisplay = formatDate(msg.timestamp);
        el.innerHTML = '<div class="message-sender">' + senderDisplay + '</div>' +
            '<div class="message-text">' + escapeHtml(msg.text) + '</div>' +
            '<div class="message-actions">' +
            '<span class="heart-icon ' + (isLiked ? 'liked' : '') + '" data-id="' + msg.id + '">' +
            '<span class="heart-symbol">' + (isLiked ? '❤' : '🤍') + '</span>' +
            '<span class="like-count">' + (msg.likes || 0) + '</span></span>' +
            '<span>' + dateDisplay + '</span></div>';
        container.appendChild(el);
    });
    setTimeout(setupMasonry, 100);
}

function updateLoadMoreButton() {
    const btn = document.getElementById('load-more-btn');
    if (!btn) return;
    if (displayedCount >= allMessages.length) { 
        btn.style.display = 'none'; 
    } else { 
        btn.style.display = 'inline-flex'; 
        btn.disabled = isLoading; 
    }
}

function loadMoreMessages() {
    if (isLoading || displayedCount >= allMessages.length) return;
    isLoading = true;
    const btn = document.getElementById('load-more-btn');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }
    setTimeout(function() {
        const startIndex = displayedCount;
        const endIndex = Math.min(startIndex + MESSAGES_PER_PAGE, allMessages.length);
        renderMessages(startIndex, endIndex);
        displayedCount = endIndex;
        isLoading = false;
        if (btn) { btn.classList.remove('loading'); }
        updateLoadMoreButton();
    }, 300);
}

function toggleLike(messageId, heartIcon) {
    if (!messageId || !heartIcon) return;
    const likedMessages = JSON.parse(localStorage.getItem('likedMessages') || '[]');
    const isLiked = likedMessages.indexOf(messageId) > -1;
    const countSpan = heartIcon.querySelector('.like-count');
    const symbolSpan = heartIcon.querySelector('.heart-symbol');
    let currentCount = parseInt(countSpan && countSpan.textContent) || 0;
    
    if (isLiked) {
        const index = likedMessages.indexOf(messageId);
        if (index > -1) likedMessages.splice(index, 1);
        localStorage.setItem('likedMessages', JSON.stringify(likedMessages));
        heartIcon.classList.remove('liked'); 
        if (symbolSpan) symbolSpan.textContent = '🤍';
        if (countSpan) countSpan.textContent = Math.max(0, currentCount - 1);
        db.collection('messages').doc(messageId).update({ likes: firebase.firestore.FieldValue.increment(-1) })
        .catch(function(e) { console.error('Unlike error:', e); if (countSpan) countSpan.textContent = currentCount; });
    } else {
        likedMessages.push(messageId);
        localStorage.setItem('likedMessages', JSON.stringify(likedMessages));
        heartIcon.classList.add('liked'); 
        if (symbolSpan) symbolSpan.textContent = '❤';
        if (countSpan) countSpan.textContent = currentCount + 1;
        db.collection('messages').doc(messageId).update({ likes: firebase.firestore.FieldValue.increment(1) })
        .catch(function(e) { console.error('Like error:', e); heartIcon.classList.remove('liked'); if (symbolSpan) symbolSpan.textContent = '🤍'; if (countSpan) countSpan.textContent = currentCount; });
    }
}

function loadApprovedMessages() {
    db.collection('messages').where('status', '==', 'approved').orderBy('timestamp', 'desc').onSnapshot(function(snapshot) {
        allMessages = snapshot.docs.map(function(doc) { return { id: doc.id, ...doc.data(), timestamp: doc.data().timestamp }; });
        const container = document.getElementById('messages-container');
        if (!container) return;
        container.innerHTML = ''; 
        displayedCount = 0;
        if (allMessages.length > 0) {
            renderMessages(0, Math.min(MESSAGES_PER_PAGE, allMessages.length));
            displayedCount = Math.min(MESSAGES_PER_PAGE, allMessages.length);
        }
        updateLoadMoreButton();
    });
}

// ===== MAIN INIT =====
function initApp() {
    initEventListeners();
    initFeatures();
    loadBanners();
    loadGallery();
    loadApprovedMessages();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
