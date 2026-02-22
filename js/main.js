import { db } from './config.js';
import { gallery } from './gallery.js';
import { messages } from './messages.js';

// ===== MAIN APPLICATION =====
class App {
    constructor() {
        this.init();
    }

    async init() {
        // Setup loading bar
        this.setupLoadingBar();
        
        // Load components (Gallery + Messages)
        await this.loadComponents();
        
        // Setup popups
        this.setupPopups();
        
        // Setup send message functionality
        this.setupSendMessage();
        
        // Setup heart animation
        this.setupHeartAnimation();
        
        console.log('✅ App initialized successfully!');
    }

    // 🔥 Loading Bar
    setupLoadingBar() {
        window.addEventListener('load', () => {
            const loadingBar = document.getElementById('loading-bar');
            if (loadingBar) {
                setTimeout(() => {
                    loadingBar.classList.add('loading-complete');
                    setTimeout(() => loadingBar.remove(), 500);
                }, 500);
            }
        });
    }

    // 🔥 Load Components from HTML templates
    async loadComponents() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('❌ main-content element not found!');
            return;
        }
        
        try {
            // Load Gallery Component
            const galleryRes = await fetch('components/gallery.html');
            if (galleryRes.ok) {
                const galleryHTML = await galleryRes.text();
                const galleryElement = document.createElement('div');
                galleryElement.innerHTML = galleryHTML;
                mainContent.appendChild(galleryElement);
                gallery.init();
                console.log('✅ Gallery loaded');
            } else {
                console.warn('⚠️ Gallery template not found, using inline render');
                const galleryElement = document.createElement('div');
                galleryElement.innerHTML = gallery.render();
                mainContent.appendChild(galleryElement);
                gallery.init();
            }
            
            // Load Messages Component
            const messagesRes = await fetch('components/messages.html');
            if (messagesRes.ok) {
                const messagesHTML = await messagesRes.text();
                const messagesElement = document.createElement('div');
                messagesElement.innerHTML = messagesHTML;
                mainContent.appendChild(messagesElement);
                messages.init();
                console.log('✅ Messages loaded');
            } else {
                console.warn('⚠️ Messages template not found, using inline render');
                const messagesElement = document.createElement('div');
                messagesElement.innerHTML = messages.render();
                mainContent.appendChild(messagesElement);
                messages.init();
            }
            
        } catch (error) {
            console.error('❌ Error loading components:', error);
            // Fallback: render inline
            mainContent.innerHTML = gallery.render() + messages.render();
            gallery.init();
            messages.init();
        }
    }

    // 🔥 Setup Popups
    setupPopups() {
        // Open message popup
        const openBtn = document.getElementById('open-message-popup');
        if (openBtn) {
            openBtn.addEventListener('click', e => {
                e.preventDefault();
                const overlay = document.getElementById('message-popup-overlay');
                const popup = document.getElementById('message-popup');
                if (overlay && popup) {
                    overlay.style.display = 'flex';
                    popup.classList.add('show');
                }
            });
        }

        // Close popup button
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePopup('message-popup'));
        }
        
        // Close when clicking outside
        const overlay = document.getElementById('message-popup-overlay');
        if (overlay) {
            overlay.addEventListener('click', e => {
                if (e.target === e.currentTarget) {
                    this.closePopup('message-popup');
                }
            });
        }
    }

    // 🔥 Send Message
    setupSendMessage() {
        const sendBtn = document.getElementById('popup-send-btn');
        if (!sendBtn) return;
        
        sendBtn.addEventListener('click', async () => {
            const messageInput = document.getElementById('popup-message-input');
            const senderNameInput = document.getElementById('popup-sender-name');
            const anonymousCheckbox = document.getElementById('anonymous-checkbox');
            
            const message = messageInput?.value.trim();
            const senderName = senderNameInput?.value.trim();
            const isAnonymous = anonymousCheckbox?.checked || false;
            
            if (!message) {
                alert('Vui lòng nhập lời nhắn!');
                return;
            }
            
            if (!senderName && !isAnonymous) {
                alert('Vui lòng nhập tên hoặc chọn ẩn danh!');
                return;
            }
            
            try {
                await db.collection('messages').add({
                    text: message,
                    senderName: isAnonymous ? 'Ẩn danh' : senderName,
                    isAnonymous: isAnonymous,
                    likes: 0,
                    status: 'pending',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Clear inputs
                if (messageInput) messageInput.value = '';
                if (senderNameInput) senderNameInput.value = '';
                if (anonymousCheckbox) anonymousCheckbox.checked = false;
                
                this.closePopup('message-popup');
                this.showSuccessPopup();
            } catch (e) {
                console.error('Send message error:', e);
                alert('Lỗi: ' + e.message);
            }
        });
    }

    // 🔥 Close Popup
    closePopup(id) {
        const popup = document.getElementById(id);
        const overlay = document.getElementById(id + '-overlay');
        if (popup) popup.classList.remove('show');
        if (overlay) {
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 400);
        }
    }

    // 🔥 Show Success Popup
    showSuccessPopup() {
        const overlay = document.getElementById('success-popup-overlay');
        const popup = document.getElementById('success-popup');
        if (!overlay || !popup) return;
        
        overlay.style.display = 'flex';
        popup.classList.add('show');
        
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 400);
        }, 5000);
    }

    // 🔥 Heart Animation
    setupHeartAnimation() {
        document.addEventListener('DOMContentLoaded', () => {
            for (let i = 0; i < 20; i++) {
                setTimeout(() => this.createHeart(), i * 300);
            }
        });
    }

    createHeart() {
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
        
        setTimeout(() => {
            heart.remove();
        }, 3000);
    }
}

// ===== INITIALIZE APP =====
new App();