export class ImageViewer {
    constructor() {
        this.initializeViewer();
        this.bindEvents();
    }

    initializeViewer() {
        this.viewer = document.createElement('dialog');
        this.viewer.className = 'image-viewer';
        this.viewer.innerHTML = `
            <div class="viewer-content">
                <img src="" alt="Preview">
                <button class="close-viewer">×</button>
            </div>
        `;
        document.body.appendChild(this.viewer);
    }

    bindEvents() {
        // Handle image result clicks
        document.addEventListener('click', (e) => {
            const imageResult = e.target.closest('.gsc-imageResult');
            if (imageResult) {
                e.preventDefault();
                this.showImage(imageResult.querySelector('img').src);
            }
        });

        // Close viewer handlers
        this.viewer.querySelector('.close-viewer').addEventListener('click', () => {
            this.viewer.close();
        });

        this.viewer.addEventListener('click', (e) => {
            if (e.target === this.viewer) {
                this.viewer.close();
            }
        });
    }

    showImage(src) {
        const img = this.viewer.querySelector('img');
        img.src = src;
        this.viewer.showModal();
    }
}
