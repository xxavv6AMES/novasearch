document.addEventListener('DOMContentLoaded', () => {
    // Add parallax effect to error message
    const errorMessage = document.querySelector('.error-message');
    
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        
        const moveX = (clientX - innerWidth / 2) * 0.01;
        const moveY = (clientY - innerHeight / 2) * 0.01;
        
        errorMessage.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    // Add click animation to back button
    const backButton = document.querySelector('.back-home');
    backButton?.addEventListener('click', (e) => {
        e.preventDefault();
        backButton.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            window.location.href = backButton.href;
        }, 200);
    });
});
