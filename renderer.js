document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[data-load-page]', 'button');
    const container = document.getElementById('pageContainer');

    buttons.forEach((button) => {
        button.addEventListener('click', (e) => {
            const pageToLoad = e.target.getAttribute('data-load-page');

            buttons.forEach((button) => button.classList.remove('active'));

            fetch(`${pageToLoad}`)
                .then((response) => response.text())
                .then((html) => {
                    container.innerHTML = html;
                });
            e.target.classList.add('active');
        });
    });
});
