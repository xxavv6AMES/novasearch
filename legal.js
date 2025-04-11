document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.legal-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const content = document.getElementById(tab.dataset.tab);
            content.classList.add('active');
        });
    });
});
