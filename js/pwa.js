let deferredPrompt;
const installKey = 'pwa_install_dismissed';

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Check if user previously dismissed
    if (!localStorage.getItem(installKey)) {
        showInstallPrompt();
    }
});

function showInstallPrompt() {
    const prompt = document.getElementById('pwa-install-prompt');
    prompt.style.display = 'block';

    document.getElementById('pwa-install-button').addEventListener('click', async () => {
        prompt.style.display = 'none';
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
        }
    });

    document.getElementById('pwa-dismiss-button').addEventListener('click', () => {
        prompt.style.display = 'none';
        localStorage.setItem(installKey, 'true');
    });
}
