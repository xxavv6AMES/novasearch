export class ImageViewer {
    constructor() {
        this.initializeViewer();
    }

    initializeViewer() {
        // Add event listeners for image results
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG' && e.target.closest('.gs-image-box')) {
                this.showImage(e.target.src);
            }
        });
    }

    showImage(src) {
        const viewer = document.createElement('div');
        viewer.className = 'image-viewer';
        viewer.innerHTML = `
            <div class="image-viewer-content">
                <img src="${src}" alt="Full size image">
                <button class="close-viewer"><i class="fas fa-times"></i></button>
            </div>
        `;

        viewer.addEventListener('click', (e) => {
            if (e.target === viewer || e.target.closest('.close-viewer')) {
                viewer.remove();
            }
        });

        document.body.appendChild(viewer);
    }
}
