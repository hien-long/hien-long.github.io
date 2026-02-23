// ===== FIREBASE CONFIG =====
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

// ===== CONSTANTS =====
const MESSAGES_PER_PAGE = 20;
let allMessages = [], displayedCount = 0, isLoading = false;
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
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ===== LOAD SECTIONS =====
async function loadSection(path, containerId) {
    try {
        const response = await fetch(path);
        const html = await response.text();
        document.getElementById(containerId).innerHTML = html;
        return true;
    } catch (error) {
        console.error(`Error loading ${path}:`, error);
        return false;
    }
}

async function loadAllSections() {
    await Promise.all([
        loadSection('sections/banner.html', 'sections-container'),
        loadSection('sections/gallery.html', 'sections-container'),
        loadSection('sections/messages.html', 'sections-container')
    ]);
    // Re-attach event listeners after sections loaded
    initEventListeners();
    initFeatures();
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Popup controls
    document.getElementById('open-message-popup')?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('message-popup-overlay').style.display = 'flex';
        document.getElementById('message-popup').classList.add('show');
    });
    
    document.querySelector('.close-btn')?.addEventListener('click', () => closePopup('message-popup'));
    document.getElementById('message-popup-overlay')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closePopup('message-popup');
    });
    
    // Send message
    document.getElementById('popup-send-btn')?.addEventListener('click', sendMessage);
    
    // Load more
    document.getElementById('load-more-btn')?.addEventListener('click', loadMoreMessages);
    
    // Like handler (delegation)
    document.addEventListener('click', e => {
        const heartIcon = e.target.closest('.heart-icon');
        if (heartIcon) { 
            e.stopPropagation(); 
            toggleLike(heartIcon.dataset.id, heartIcon); 
        }
    });
}

// ===== FEATURES INIT =====
function initFeatures() {
    // Loading bar
    window.addEventListener('load', () => {
        const loadingBar = document.getElementById('loading-bar');
        setTimeout(() => {
            loadingBar.classList.add('loading-complete');
            setTimeout(() => loadingBar.remove(), 500);
        }, 500);
    });
    
    // Floating hearts
    document.addEventListener('DOMContentLoaded', () => {
        for (let i = 0; i < 20; i++) setTimeout(createHeart, i * 300);
        loadBanners();
        loadGallery();
        loadApprovedMessages();
    });
    
    // Resize handler for masonry
    let resizeTimer;
    window.addEventListener('resize', () => { 
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
    heart.style.setProperty('--tx', `${endX - startX}px`);
    heart.style.setProperty('--ty', `${endY - startY}px`);
    heart.style.fontSize = `${size}px`;
    heart.style.color = 'white';
    heart.style.left = `${startX}px`;
    heart.style.top = `${startY}px`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 3000);
}

// ===== BANNER FUNCTIONS =====
function loadBanners() {
    db.collection('banners').where('active', '==', true).orderBy('order', 'asc').onSnapshot(snapshot => {
        banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderBanners();
    });
}

function renderBanners() {
    const carousel = document.getElementById('banner-carousel');
    const dotsContainer = document.getElementById('banner-dots');
    
    if (!carousel || !dotsContainer) return;
    
    if (banners.length === 0) {
        carousel.innerHTML = '<div style="text-align: center; padding: 100px 20px; color: #999;">Không có banner nào</div>';
        dotsContainer.innerHTML = '';
        return;
    }

    carousel.innerHTML = banners.map((banner, index) => `
        <div class="banner-slide ${index === 0 ? 'active' : ''}" data-index="${index}" ${banner.link ? `onclick="window.open('${banner.link}', '_blank')"` : ''}>
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
    
    slides[currentBannerIndex]?.classList.remove('active');
    dots[currentBannerIndex]?.classList.remove('active');
    
    currentBannerIndex = (currentBannerIndex + direction + banners.length) % banners.length;
    
    slides[currentBannerIndex]?.classList.add('active');
    dots[currentBannerIndex]?.classList.add('active');
    
    resetBannerAutoPlay();
}

function goToBanner(index) {
    if (banners.length === 0) return;
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dot');
    
    slides[currentBannerIndex]?.classList.remove('active');
    dots[currentBannerIndex]?.classList.remove('active');
    
    currentBannerIndex = index;
    
    slides[currentBannerIndex]?.classList.add('active');
    dots[currentBannerIndex]?.classList.add('active');
    
    resetBannerAutoPlay();
}

function startBannerAutoPlay() {
    stopBannerAutoPlay();
    bannerInterval = setInterval(() => changeBanner(1), 5000);
}

function stopBannerAutoPlay() {
    if (bannerInterval) clearInterval(bannerInterval);
}

function resetBannerAutoPlay() {
    stopBannerAutoPlay();
    startBannerAutoPlay();
}

// ===== GALLERY FUNCTIONS =====
function loadGallery() {
    db.collection('gallery').orderBy('order', 'asc').onSnapshot(snapshot => {
        const galleryScroll = document.getElementById('gallery-scroll');
        if (!galleryScroll) return;
        
        galleryScroll.innerHTML = '';
        if (snapshot.empty) { 
            galleryScroll.innerHTML = '<p style="color:#999;text-align:center;width:100%;">Chưa có hoạt động nào</p>'; 
            return; 
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.innerHTML = `<img src="${data.image}" alt="${data.title}" loading="lazy"><div class="card-content"><h3>${data.title}</h3><p>${data.description || ''}</p></div>`;
            galleryScroll.appendChild(card);
        });
    });
}

function scrollGallery(direction) {
    const scrollContainer = document.getElementById('gallery-scroll');
    scrollContainer?.scrollBy({ left: direction * 370, behavior: 'smooth' });
}

// ===== MESSAGE FUNCTIONS =====
async function sendMessage() {
    const message = document.getElementById('popup-message-input')?.value.trim();
    const senderName = document.getElementById('popup-sender-name')?.value.trim();
    const isAnonymous = document.getElementById('anonymous-checkbox')?.checked;
    
    if (!message) return alert('Vui lòng nhập lời nhắn!');
    if (!senderName && !isAnonymous) return alert('Vui lòng nhập tên hoặc chọn ẩn danh!');
    
    try {
        await db.collection('messages').add({
            text: message, 
            senderName: isAnonymous ? 'Ẩn danh' : senderName,
            isAnonymous, 
            likes: 0, 
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Reset form
        document.getElementById('popup-message-input').value = '';
        document.getElementById('popup-sender-name').value = '';
        document.getElementById('anonymous-checkbox').checked = false;
        
        closePopup('message-popup');
        showSuccessPopup();
    } catch (e) { 
        alert('Lỗi: ' + e.message); 
    }
}

function showSuccessPopup() {
    const overlay = document.getElementById('success-popup-overlay');
    const popup = document.getElementById('success-popup');
    if (!overlay || !popup) return;
    
    overlay.style.display = 'flex'; 
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => overlay.style.display = 'none', 400);
    }, 5000);
}

function closePopup(id) {
    const popup = document.getElementById(id);
    const overlay = document.getElementById(id + '-overlay');
    if (!popup || !overlay) return;
    
    popup.classList.remove('show');
    setTimeout(() => overlay.style.display = 'none', 400);
}

// ===== MASONRY LAYOUT =====
function setupMasonry() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    const messages = Array.from(container.children);
    if (window.innerWidth <= 768) { 
        container.style.height = 'auto'; 
        messages.forEach(msg => { 
            msg.style.position = 'relative'; 
            msg.style.width = '100%'; 
        });
        return; 
    }
    
    const gap = 25;
    const containerWidth = container.offsetWidth;
    const minCardWidth = 320;
    const numColumns = Math.max(1, Math.min(Math.floor(containerWidth / minCardWidth), 5));
    const cardWidth = (containerWidth - gap * (numColumns - 1)) / numColumns;
    
    messages.forEach(msg => { 
        msg.style.width = `${cardWidth}px`; 
        msg.style.position = 'absolute'; 
    });
    
    const columnHeights = new Array(numColumns).fill(0);
    const columnLefts = Array.from({length: numColumns}, (_, i) => i * (cardWidth + gap));
    
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
    if (!container) return;
    
    const messagesToRender = allMessages.slice(startIndex, endIndex);
    messagesToRender.forEach(msg => {
        const el = document.createElement('div');
        el.className = 'message';
        const likedMessages = JSON.parse(localStorage.getItem('likedMessages') || '[]');
        const isLiked = likedMessages.includes(msg.id);
        const senderDisplay = msg.isAnonymous ? '👤 Ẩn danh' : `✍️ ${escapeHtml(msg.senderName || 'Ẩn danh')}`;
        const dateDisplay = formatDate(msg.timestamp);
        
        el.innerHTML = `
            <div class="message-sender">${senderDisplay}</div>
            <div class="message-text">${escapeHtml(msg.text)}</div>
            <div class="message-actions">
                <span class="heart-icon ${isLiked ? 'liked' : ''}" data-id="${msg.id}">
                    <span class="heart-symbol">${isLiked ? '❤' : '🤍'}</span>
                    <span class="like-count">${msg.likes || 0}</span>
                </span>
                <span>${dateDisplay}</span>
            </div>
        `;
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
    btn?.classList.add('loading'); 
    if (btn) btn.disabled = true;
    
    setTimeout(() => {
        const startIndex = displayedCount;
        const endIndex = Math.min(startIndex + MESSAGES_PER_PAGE, allMessages.length);
        renderMessages(startIndex, endIndex);
        displayedCount = endIndex;
        isLoading = false;
        btn?.classList.remove('loading');
        updateLoadMoreButton();
    }, 300);
}

async function toggleLike(messageId, heartIcon) {
    const likedMessages = JSON.parse(localStorage.getItem('likedMessages') || '[]');
    const isLiked = likedMessages.includes(messageId);
    const countSpan = heartIcon.querySelector('.like-count');
    const symbolSpan = heartIcon.querySelector('.heart-symbol');
    let currentCount = parseInt(countSpan?.textContent) || 0;
    
    if (isLiked) {
        const index = likedMessages.indexOf(messageId);
        if (index > -1) likedMessages.splice(index, 1);
        localStorage.setItem('likedMessages', JSON.stringify(likedMessages));
        heartIcon.classList.remove('liked'); 
        if (symbolSpan) symbolSpan.textContent = '🤍';
        if (countSpan) countSpan.textContent = Math.max(0, currentCount - 1);
        
        try { 
            await db.collection('messages').doc(messageId).update({ 
                likes: firebase.firestore.FieldValue.increment(-1) 
            }); 
        } catch (e) { 
            console.error('Unlike error:', e); 
            if (countSpan) countSpan.textContent = currentCount; 
        }
    } else {
        likedMessages.push(messageId);
        localStorage.setItem('likedMessages', JSON.stringify(likedMessages));
        heartIcon.classList.add('liked'); 
        if (symbolSpan) symbolSpan.textContent = '❤';
        if (countSpan) countSpan.textContent = currentCount + 1;
        
        try { 
            await db.collection('messages').doc(messageId).update({ 
                likes: firebase.firestore.FieldValue.increment(1) 
            }); 
        } catch (e) { 
            console.error('Like error:', e); 
            heartIcon.classList.remove('liked'); 
            if (symbolSpan) symbolSpan.textContent = '🤍'; 
            if (countSpan) countSpan.textContent = currentCount; 
        }
    }
}

function loadApprovedMessages() {
    db.collection('messages')
      .where('status', '==', 'approved')
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        allMessages = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(), 
            timestamp: doc.data().timestamp 
        }));
        
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadAllSections();
});