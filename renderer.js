document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button[data-load-page]');
    const container = document.getElementById('pages_container');
    const defaultPage = './pages/rings.html';
    // const defaultPage = './pages/circuitsCount.html';


    // Script mapping
    const scriptMapping = {
        './pages/circuitsCount.html': './scriptsPages/circuitsCalculator.js',
        './pages/externalImpedance.html': './scriptsPages/impedanceCalculator.js',
        './pages/rings.html': './scriptsPages/resistanceCalculator.js',
    };

    const defaultButton = Array.from(buttons).find(
        (button) => button.getAttribute('data-load-page') === defaultPage
    );

    buttons.forEach((button) => {
        button.addEventListener('click', handleButtonClick);
    });

    if (defaultButton) {
        activateButton(defaultButton);
    }

    loadPage(defaultPage, container);

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
    async function loadPage(url, container) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            container.innerHTML = html;
            loadScript(scriptMapping[url]);
        } catch (error) {
            console.error('Error loading page:', error);
        }
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

        document.head.appendChild(script);
    }
});
