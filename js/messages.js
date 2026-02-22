import { db } from './config.js';

// Messages Component
export class MessagesComponent {
    constructor() {
        this.MESSAGES_PER_PAGE = 20;
        this.allMessages = [];
        this.displayedCount = 0;
        this.isLoading = false;
    }

    render() {
        return `
            <div class="note">
                ⚠️ Lưu ý: Đây là bản demo với hệ thống quản lý admin hoàn chỉnh. Lời nhắn sẽ được lưu trữ và quản lý qua Firebase. 
                Hãy gửi lời nhắn yêu thương của bạn để lan tỏa yêu thương đến các em nhỏ!
            </div>

            <div class="messages" id="messages-container"></div>

            <div class="load-more-container">
                <button id="load-more-btn" class="load-more-btn">
                    <span class="btn-text">Tải thêm...</span>
                    <span class="spinner"></span>
                </button>
            </div>
        `;
    }

    init() {
        this.loadApprovedMessages();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('load-more-btn').addEventListener('click', () => this.loadMoreMessages());
        
        // Like handler
        document.addEventListener('click', e => {
            const heartIcon = e.target.closest('.heart-icon');
            if (heartIcon) {
                e.stopPropagation();
                this.toggleLike(heartIcon.dataset.id, heartIcon);
            }
        });

        // Resize handler
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.setupMasonry(), 250);
        });
    }

    async loadMoreMessages() {
        if (this.isLoading || this.displayedCount >= this.allMessages.length) return;
        
        this.isLoading = true;
        const btn = document.getElementById('load-more-btn');
        btn.classList.add('loading');
        btn.disabled = true;
        
        setTimeout(() => {
            const startIndex = this.displayedCount;
            const endIndex = Math.min(startIndex + this.MESSAGES_PER_PAGE, this.allMessages.length);
            
            this.renderMessages(startIndex, endIndex);
            this.displayedCount = endIndex;
            
            this.isLoading = false;
            btn.classList.remove('loading');
            this.updateLoadMoreButton();
        }, 300);
    }

    loadApprovedMessages() {
        db.collection('messages')
            .where('status', '==', 'approved')
            .orderBy('timestamp', 'desc')
            .onSnapshot(snapshot => {
                this.allMessages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const container = document.getElementById('messages-container');
                if (container) {
                    container.innerHTML = '';
                    this.displayedCount = 0;
                    
                    if (this.allMessages.length > 0) {
                        this.renderMessages(0, Math.min(this.MESSAGES_PER_PAGE, this.allMessages.length));
                        this.displayedCount = Math.min(this.MESSAGES_PER_PAGE, this.allMessages.length);
                    }
                    
                    this.updateLoadMoreButton();
                }
            });
    }

    renderMessages(startIndex, endIndex) {
        const container = document.getElementById('messages-container');
        const messagesToRender = this.allMessages.slice(startIndex, endIndex);
        
        messagesToRender.forEach((msg, index) => {
            const el = document.createElement('div');
            el.className = 'message';
            
            const likedMessages = JSON.parse(localStorage.getItem('likedMessages') || '[]');
            const isLiked = likedMessages.includes(msg.id);
            const senderDisplay = msg.isAnonymous ? 
                '👤 Ẩn danh' : 
                `✍️ ${this.escapeHtml(msg.senderName || 'Ẩn danh')}`;
            
            el.innerHTML = `
                <div class="message-sender">${senderDisplay}</div>
                <div class="message-text">${this.escapeHtml(msg.text)}</div>
                <div class="message-actions">
                    <span class="heart-icon ${isLiked ? 'liked' : ''}" data-id="${msg.id}">
                        <span class="heart-symbol">${isLiked ? '❤' : '🤍'}</span>
                        <span class="like-count">${msg.likes || 0}</span>
                    </span>
                    <span>0 Bình luận</span>
                </div>`;
            container.appendChild(el);
        });
        
        setTimeout(() => this.setupMasonry(), 100);
    }

    setupMasonry() {
        const container = document.getElementById('messages-container');
        if (!container) return;
        
        const messages = Array.from(container.children);
        if (window.innerWidth <= 768) {
            container.style.height = 'auto';
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

    async toggleLike(messageId, heartIcon) {
        const likedMessages = JSON.parse(localStorage.getItem('likedMessages') || '[]');
        const isLiked = likedMessages.includes(messageId);
        const countSpan = heartIcon.querySelector('.like-count');
        const symbolSpan = heartIcon.querySelector('.heart-symbol');
        let currentCount = parseInt(countSpan.textContent) || 0;
        
        if (isLiked) {
            const index = likedMessages.indexOf(messageId);
            if (index > -1) likedMessages.splice(index, 1);
            localStorage.setItem('likedMessages', JSON.stringify(likedMessages));
            
            heartIcon.classList.remove('liked');
            symbolSpan.textContent = '🤍';
            countSpan.textContent = Math.max(0, currentCount - 1);
            
            try {
                await db.collection('messages').doc(messageId).update({
                    likes: firebase.firestore.FieldValue.increment(-1)
                });
            } catch (e) {
                console.error('Unlike error:', e);
                countSpan.textContent = currentCount;
            }
        } else {
            likedMessages.push(messageId);
            localStorage.setItem('likedMessages', JSON.stringify(likedMessages));
            
            heartIcon.classList.add('liked');
            symbolSpan.textContent = '❤';
            countSpan.textContent = currentCount + 1;
            
            try {
                await db.collection('messages').doc(messageId).update({
                    likes: firebase.firestore.FieldValue.increment(1)
                });
            } catch (e) {
                console.error('Like error:', e);
                heartIcon.classList.remove('liked');
                symbolSpan.textContent = '🤍';
                countSpan.textContent = currentCount;
            }
        }
    }

    updateLoadMoreButton() {
        const btn = document.getElementById('load-more-btn');
        if (btn) {
            btn.style.display = this.displayedCount >= this.allMessages.length ? 'none' : 'inline-flex';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export const messages = new MessagesComponent();