import { db } from './config.js';
import { gallery } from './gallery.js';
import { messages } from './messages.js';

// Main Application
class App {
    constructor() {
        this.init();
    }

    async init() {
        // Loading bar
        this.setupLoadingBar();
        
        // Load components
        this.loadComponents();
        
        // Setup popups
        this.setupPopups();
        
        // Setup heart animation
        this.setupHeartAnimation();
        
        // Setup send message
        this.setupSendMessage();
    }

    setupLoadingBar() {
        window.addEventListener('load', () => {
            const loadingBar = document.getElementById('loading-bar');
            setTimeout(() => {
                loadingBar.classList.add('loading-complete');
                setTimeout(() => loadingBar.remove(), 500);
            }, 500);
        });
    }

    loadComponents() {
        const mainContent = document.getElementById('main-content');
        
        // Load Gallery
        const galleryElement = document.createElement('div');
        galleryElement.innerHTML = gallery.render();
        mainContent.appendChild(galleryElement);
        gallery.init();
        
        // Load Messages
        const messagesElement = document.createElement('div');
        messagesElement.innerHTML = messages.render();
        mainContent.appendChild(messagesElement);
        messages.init();
    }

    setupPopups() {
        // Open message popup
        document.getElementById('open-message-popup').addEventListener('click', e => {
            e.preventDefault();
            document.getElementById('message-popup-overlay').style.display = 'flex';
            document.getElementById('message-popup').classList.add('show');
        });

        // Close popup
        document.querySelector('.close-btn').addEventListener('click', () => this.closePopup('message-popup'));
        
        document.getElementById('message-popup-overlay').addEventListener('click', e => {
            if (e.target === e.currentTarget) this.closePopup('message-popup');
        });
    }

    setupSendMessage() {
        document.getElementById('popup-send-btn').addEventListener('click', async () => {
            const message = document.getElementById('popup-message-input').value.trim();
            const senderName = document.getElementById('popup-sender-name').value.trim();
            const isAnonymous = document.getElementById('anonymous-checkbox').checked;
            
            if (!message) return alert('Vui lòng nhập lời nhắn!');
            if (!senderName && !isAnonymous) return alert('Vui lòng nhập tên hoặc chọn ẩn danh!');
            
            try {
                await db.collection('messages').add({
                    text: message,
                    senderName: isAnonymous ? 'Ẩn danh' : senderName,
                    isAnonymous: isAnonymous,
                    likes: 0,
                    status: 'pending',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                document.getElementById('popup-message-input').value = '';
                document.getElementById('popup-sender-name').value = '';
                document.getElementById('anonymous-checkbox').checked = false;
                this.closePopup('message-popup');
                this.showSuccessPopup();
            } catch (e) {
                alert('Lỗi: ' + e.message);
            }
        });
    }

    closePopup(id) {
        document.getElementById(id).classList.remove('show');
        setTimeout(() => document.getElementById(id + '-overlay').style.display = 'none', 400);
    }

    showSuccessPopup() {
        const overlay = document.getElementById('success-popup-overlay');
        const popup = document.getElementById('success-popup');
        overlay.style.display = 'flex';
        popup.classList.add('show');
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => overlay.style.display = 'none', 400);
        }, 5000);
    }

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
        setTimeout(() => heart.remove(), 3000);
    }
}

// Initialize App
new App();