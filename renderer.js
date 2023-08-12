document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[data-load-page]', 'button');
    const container = document.getElementById('pages_container');

    // Script mapping
    const scriptMapping = {
        './pages/circuitsCount.html': './scriptsPages/circuitsCalculator.js',
        './pages/externalImpedance.html': './scriptsPages/impedanceCalculator.js',
        './pages/rings.html': './scriptsPages/resistanceCalculator.js',
    };

    buttons.forEach((button) => {
        button.addEventListener('click', handleButtonClick);
    });

    function handleButtonClick(e) {
        const pageToLoad = e.target.getAttribute('data-load-page');

        deactivateButtons(buttons);
        loadPage(pageToLoad, container);
        activateButton(e.target);
    }

    function activateButton(button) {
        button.classList.add('active');
    }

    function deactivateButtons(buttons) {
        buttons.forEach((button) => button.classList.remove('active'));
    }
    // Load page
    function loadPage(url, container) {
        fetch(url)
            .then((response) => response.text())
            .then((html) => {
                container.innerHTML = html;
            });
            loadScript(scriptMapping[url])
    }

    // Load script
    function loadScript(scriptUrl) {
        // Remove old script
        const oldScript = document.getElementById('calculations_script');
        if (oldScript) {
            oldScript.remove();
        }

        // Create and append the new script element
        const script = document.createElement('script');
        script.id = 'calculations_script';
        script.src = scriptUrl;
        script.defer = true;

        document.body.appendChild(script);
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
