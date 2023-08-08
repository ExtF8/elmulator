document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[data-load-page]');
    // const container
    const container = document.getElementById('pageContainer');

    buttons.forEach((button) => {
        button.addEventListener('click', (e) => {
            const pageToLoad = e.target.getAttribute('data-load-page');
            // loadPage(pageToLoad);

            fetch(`${pageToLoad}`)
                .then((response) => response.text())
                .then((html) => {
                    container.innerHTML = html;
                });
        });
    });
});

// function loadPage(page) {
//     console.log(`Attempting to load: ${page}`);
//     if (!container) {
//         console.error('Container not found!');
//         return;
//     }

    // Using htmx to load content
    // container.setAttribute('hx-get', `${page}`);
    // container.setAttribute('hx-trigger', 'load');

    // Preform action above
    // htmx.trigger('load');
// }
