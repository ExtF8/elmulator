/**
 * Module for Page Loading and Script Management
 */

// Constants
const BUTTONS = document.querySelectorAll('button[data-load-page]');
const CONTAINER = document.getElementById('pages_container');
const DEFAULT_PAGE = './pages/rings.html';

const SCRIPT_MAPPING = {
    './pages/circuitsCount.html': './scriptsPages/circuitsCalculator.js',
    './pages/externalImpedance.html': './scriptsPages/impedanceCalculator.js',
    './pages/rings.html': './scriptsPages/resistanceCalculator.js',
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    const defaultButton = Array.from(BUTTONS).find(
        (button) => button.getAttribute('data-load-page') === DEFAULT_PAGE
    );

    BUTTONS.forEach((button) => {
        button.addEventListener('click', handleButtonClick);
    });

    if (defaultButton) {
        activateButton(defaultButton);
    }

    loadPage(DEFAULT_PAGE, CONTAINER);
});

/**
 * Event handler for button clicks.
 * Determines the page to load and updates the UI accordingly
 * @param {Event} event - The DOM event triggered by the button click
 */
const handleButtonClick = (event) => {
    const pageToLoad = event.target.getAttribute('data-load-page');

    deactivateButtons(BUTTONS);
    loadPage(pageToLoad, CONTAINER);
    activateButton(event.target);
};

/**
 * Activates the specified button, adding an 'active' class
 * @param {HTMLButtonElement} button - The button element to activate
 */
const activateButton = (button) => {
    button.classList.add('active');
};

/**
 * Deactivates all buttons in the provided list by removing the 'active' class
 * @param {NodeList} BUTTONS - List of button elements to deactivate
 */
const deactivateButtons = (BUTTONS) => {
    BUTTONS.forEach((button) => button.classList.remove('active'));
};

/**
 * Loads the specified page in to container element
 * Loads the associated script for that page
 * @param {string} url - URL of the page to load
 * @param {element} CONTAINER - The container element to load the page into
 */
async function loadPage(url, CONTAINER) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        CONTAINER.innerHTML = html;
        loadScript(SCRIPT_MAPPING[url]);
    } catch (error) {
        console.error('Error loading page:', error);
    }
}

/**
 * Loads the script associated with the given URL.
 * If an old script is present, removes it before loading the new one
 * @param {string} scriptUrl - URL of the script to load
 */
const loadScript = (scriptUrl) => {
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
};
