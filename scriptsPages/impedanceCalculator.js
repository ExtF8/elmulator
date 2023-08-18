/**
 * Module External Impedance Calculations
 */
(function () {
    // Constants
    const DEFAULT_VOLTAGE = 240;
    const SINGLE_PHASE = 'single_phase_ipf';
    const THREE_PHASE = 'three_phase_ipf';

    let voltageInput = 0;
    let zdbInput = 0;

    /**
     * Handles changes to the impedance input fields, calculates outputs, and updates output
     * @param {Event} event - The input event
     */
    const handleInputChanges = (event) => {
        updateInputValues(event.target);

        if (onlyOneInputProvided()) {
            setDefaultVoltageInput();
        }

        processImpedanceCalculations();
    };

    document
        .querySelector('.impedance-container')
        .addEventListener('input', handleInputChanges);

    /**
     * Handles the entire impedance calculations workflow
     *
     * This function ensures that:
     * 1. Inputs are validated for accuracy.
     * 2. Raw impedance values are calculated.
     * 3. Raw values are converted to kilo amperes (kA) from amperes (A)
     * 4. The UI is updated with processed values.
     */
    const processImpedanceCalculations = () => {
        if (!areInputsValid()) return;

        const { onePhase, threePhase } = calculateOutputValues();
        const { onePhaseKA, threePhaseKA } = convertToKA(onePhase, threePhase);
        updateOutputsInKA(onePhaseKA, threePhaseKA);
    };

    /**
     * Updates the input value based on the provided element
     * @param {HTMLElement} element - The input element
     */
    const updateInputValues = (element) => {
        const value = getInputValue(element);
        const inputType = element.getAttribute('data-input-type');

        switch (inputType) {
            case 'voltage':
                voltageInput = value;
                break;
            case 'zdb':
                zdbInput = value;
                break;
        }
    };

    /**
     * Checks if only one input is provided
     * @returns {boolean} - True if only one input is provided
     */
    const onlyOneInputProvided = () => {
        return (
            (voltageInput === 0 && zdbInput !== 0) ||
            (zdbInput === 0 && voltageInput !== 0)
        );
    };

    /**
     * Sets default value for voltage input if not provided
     */
    const setDefaultVoltageInput = () => {
        if (voltageInput === 0) {
            voltageInput = DEFAULT_VOLTAGE;

            const voltageInputElement = document.querySelector(
                '[data-input-type="voltage"]'
            );
            voltageInputElement.value = voltageInput;
        }
    };

    /**
     * Retrieves the numerical value from an input element
     * @param {HTMLInputElement} element - The input element
     * @returns {number} - The numerical value of the input
     */
    const getInputValue = (element) => {
        return Number(element.value);
    };

    /**
     * Calculates the impedance output values in amperes based on the inputs
     * @returns {Object} - The calculated impedance outputs for single phase and three phase
     */
    const calculateOutputValues = () => {
        const onePhase = voltageInput / zdbInput;
        const threePhase = onePhase * 2;

        return { onePhase, threePhase };
    };

    /**
     * Converts impedance output values to kilo amperes and returns them
     * @param {number} onePhase - The calculated impedance for single phase
     * @param {number} threePhase - The calculated impedance for three phase
     * @returns {Object} - The impedance values in kilo amperes for single and three phase
     */
    const convertToKA = (onePhase, threePhase) => {
        const onePhaseKA = roundToDecimal(onePhase / 1000, getDecimalPlaces());
        const threePhaseKA = roundToDecimal(
            threePhase / 1000,
            getDecimalPlaces()
        );

        return { onePhaseKA, threePhaseKA };
    };

    /**
     * Determines the number of decimal places to use based on the Zdb input
     * @returns {number} - Number of decimal places
     */
    const getDecimalPlaces = () => {
        return zdbInput >= 5 ? 4 : 2;
    };

    /**
     * Rounds a number to a specified number of decimal places
     * @param {number} number - The number to round
     * @param {number} decimalPlaces - The number of decimal places
     * @returns {number} - The rounded number
     */
    const roundToDecimal = (number, decimalPlaces) => {
        const factor = Math.pow(10, decimalPlaces);
        return Math.round(number * factor) / factor;
    };

    /**
     * Checks if the input values are valid
     * @returns {boolean} - True if valid
     */
    const areInputsValid = () => {
        return voltageInput !== 0 && zdbInput !== 0;
    };

    const updateOutputsInKA = (onePhaseKA, threePhaseKA) => {
        const outputTypes = [SINGLE_PHASE, THREE_PHASE];
        const values = [onePhaseKA, threePhaseKA];

        outputTypes.forEach((type, index) => {
            const outputElement = document.querySelector(
                `[data-output-type='${type}']`
            );
            if (outputElement) {
                outputElement.value = values[index];
            }
        });
    };
})();
