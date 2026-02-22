// Gallery Component
export class GalleryComponent {
    constructor() {
        this.scrollAmount = 370;
    }

    render() {
        return `
            <section class="gallery-section">
                <div class="gallery-header">
                    <h2>🔥 Những hoạt động tại Viện Huyết học</h2>
                </div>
                
                <div class="gallery-container">
                    <button class="gallery-nav prev" onclick="window.galleryScroll(-1)">❮</button>
                    
                    <div class="gallery-scroll" id="gallery-scroll">
                        <div class="gallery-card">
                            <img src="gallery/activity-1.jpg" alt="Hoạt động 1" loading="lazy">
                            <div class="card-content">
                                <h3>Chương trình "Giọt hồng yêu thương" - Tháng 1/2026</h3>
                                <p>Các tình nguyện viên cùng giao lưu, tặng quà và động viên tinh thần các em nhỏ</p>
                            </div>
                        </div>
                        
                        <div class="gallery-card">
                            <img src="gallery/activity-2.jpg" alt="Hoạt động 2" loading="lazy">
                            <div class="card-content">
                                <h3>Hoạt động vui chơi Trung thu - Tháng 9/2025</h3>
                                <p>Tổ chức đêm hội trăng rằm với nhiều tiết mục văn nghệ và trò chơi thú vị</p>
                            </div>
                        </div>
                        
                        <div class="gallery-card">
                            <img src="gallery/activity-3.jpg" alt="Hoạt động 3" loading="lazy">
                            <div class="card-content">
                                <h3>Chương trình "Tết yêu thương" - Tết 2026</h3>
                                <p>Mang không khí Tết đến với các em nhỏ đang điều trị tại viện</p>
                            </div>
                        </div>
                        
                        <div class="gallery-card">
                            <img src="gallery/activity-4.jpg" alt="Hoạt động 4" loading="lazy">
                            <div class="card-content">
                                <h3>Hoạt động đọc truyện - Hàng tuần</h3>
                                <p>Các tình nguyện viên đọc truyện, kể chuyện cho các em nghe</p>
                            </div>
                        </div>
                    </div>
                    
                    <button class="gallery-nav next" onclick="window.galleryScroll(1)">❯</button>
                </div>
            </section>
        `;
    }

    init() {
        window.galleryScroll = (direction) => {
            const scrollContainer = document.getElementById('gallery-scroll');
            if (scrollContainer) {
                scrollContainer.scrollBy({
                    left: direction * this.scrollAmount,
                    behavior: 'smooth'
                });
            }
        };
    }
}

export const gallery = new GalleryComponent();