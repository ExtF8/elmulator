document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[data-load-page]', 'button');
    const container = document.getElementById('pages_container');

    buttons.forEach((button) => {
        button.addEventListener('click', handleButtonClick);
    });

    function handleButtonClick(e) {
        const pageToLoad = e.target.getAttribute('data-load-page');

        deactivateButtons(buttons);
        loadPage(pageToLoad, container);
        activateButton(e.target);
    }

    function deactivateButtons(buttons) {
        buttons.forEach((button) => button.classList.remove('active'));
    }

    function loadPage(url, container) {
        fetch(url)
            .then((response) => response.text())
            .then((html) => {
                container.innerHTML = html;
            });
    }

    function activateButton(button) {
        button.classList.add('active');
    }

    const defaultPage = './pages/rings.html';
    loadPage(defaultPage, container);

    const defaultButton = Array.from(buttons).find(
        (button) => button.getAttribute('data-load-page') === defaultPage
    );
    if (defaultButton) {
        activateButton(defaultButton);
    }
});
