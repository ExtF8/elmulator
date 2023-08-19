/**
 * Module for External Impedance Calculations
 */
(function () {
    // Constants
    const DEFAULT_VOLTAGE = 240;
    const KA_CONVERSION_FACTOR = 1000;
    const ZDB_THRESHOLD = 5;
    const HIGH_PRECISION_DECIMALS = 4;
    const LOW_PRECISION_DECIMALS = 2;

    const impedanceOutputs = {
        onePhase: 0,
        threePhase: 0,
        single_phase_ipf: 0,
        three_phase_ipf: 0,
    };

    let voltageInput = 0;
    let zdbInput = 0;

    /**
     * Handles changes to the impedance input and initiates the processing of impedance calculations
     * @param {Event} event - The input event
     */
    const handleInputChanges = (event) => {
        updateInputValues(event.target);

        if (onlyOneInputProvided()) {
            setDefaultVoltageInput();
        }

        if (isInputValid(event)) {
            processImpedanceCalculations();
        }
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
     * Retrieves the numerical value from an input element
     * @param {HTMLInputElement} element - The input element
     * @returns {number} - The numerical value of the input
     */
    const getInputValue = (element) => {
        return Number(element.value) || 0;
    };

    /**
     * Ensures that input value is a positive number
     */
    const isInputValid = (event) => {
        const value = getInputValue(event.target);
        return typeof value === 'number' && value > 0;
    };

    /**
     * Checks if either voltage or zdb input is provided, but not both
     * @returns {boolean} - True if only one input is provided
     */
    const onlyOneInputProvided = () => {
        return !voltageInput && zdbInput;
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
     * Handles the entire impedance calculations workflow
     */
    const processImpedanceCalculations = () => {
        calculateOutputValues();
        convertToKA();
        updateOutputsInKA();
    };

    /**
     * Calculates the impedance output values in amperes based on the inputs
     */
    const calculateOutputValues = () => {
        impedanceOutputs.onePhase = voltageInput / zdbInput;
        impedanceOutputs.threePhase = impedanceOutputs.onePhase * 2;
    };

    /**
     * Converts impedance output values to kilo amperes and returns them
     */
    const convertToKA = () => {
        impedanceOutputs.single_phase_ipf = roundToDecimal(
            impedanceOutputs.onePhase / KA_CONVERSION_FACTOR,
            getDecimalPlaces()
        );
        impedanceOutputs.three_phase_ipf = roundToDecimal(
            impedanceOutputs.threePhase / KA_CONVERSION_FACTOR,
            getDecimalPlaces()
        );
    };

    /**
     * Determines the number of decimal places to use based on the Zdb input
     * @returns {number} - Number of decimal places
     */
    const getDecimalPlaces = () => {
        return zdbInput >= ZDB_THRESHOLD
            ? HIGH_PRECISION_DECIMALS
            : LOW_PRECISION_DECIMALS;
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
     * Updates the output fields based on the converted impedance values in kA.
     */
    const updateOutputsInKA = () => {
        const outputElements = {};
        Object.keys(impedanceOutputs).forEach((type) => {
            outputElements[type] = document.querySelector(
                `[data-output-type='${type}']`
            );
            if (outputElements[type]) {
                outputElements[type].value = impedanceOutputs[type];
            }
        });
    };

    document
        .querySelector('.impedance-container')
        .addEventListener('input', handleInputChanges);
})();
