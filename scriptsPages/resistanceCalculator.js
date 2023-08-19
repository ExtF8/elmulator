/**
 * Module for Rings Resistance Calculations
 */
(function () {
    // Constants
    const DEFAULT_R2_MULTIPLIER_ONE = 1.67;
    const DEFAULT_R2_MULTIPLIER_TWO = 2.67;
    const DIVISION_FACTOR = 4;

    // The structure of the outputs object
    const outputs = {
        r2_multiplier_1: 0,
        r2_multiplier_2: 0,
        r_sum_1: 0,
        r_sum_2: 0,
    };

    /**
     * Handles changes to the resistance input and initiates the processing of resistance calculations
     * @param {Event} event - The input event
     */
    const handleInputChanges = (event) => {
        const value = getInputValue(event.target);
        const inputType = event.target.getAttribute('data-input-type');

        if (inputType === 'r1' && isValidInput(value)) {
            processResistanceCalculations(value);
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
     * @param {number} value - The resistance input value
     * @returns {boolean} - True if valid
     */
    const isValidInput = (value) => {
        return typeof value === 'number' && value > 0;
    };

    /**
     * Initiates the resistance calculations and updates resistance outputs
     * @param {number} inputValue - The resistance input value (r1)
     */
    const processResistanceCalculations = (inputValue) => {
        calculateResistanceOutputs(inputValue);
        updateResistanceOutputs();
    };

    /**
     * Computes the resistance output values based on r1 input value
     * @param {number} inputValue - The resistance value of r1
     */
    const calculateResistanceOutputs = (inputValue) => {
        outputs.r2_multiplier_1 = roundValue(
            inputValue * DEFAULT_R2_MULTIPLIER_ONE
        );
        outputs.r2_multiplier_2 = roundValue(
            inputValue * DEFAULT_R2_MULTIPLIER_TWO
        );

        outputs.r_sum_1 = roundValue(
            (inputValue + outputs.r2_multiplier_1) / DIVISION_FACTOR
        );
        outputs.r_sum_2 = roundValue(
            (inputValue + outputs.r2_multiplier_2) / DIVISION_FACTOR
        );
    };

    /**
     * Rounds a number to two decimal places
     * @param {number} number - The number to round
     * @returns {number} - The rounded number
     */
    const roundValue = (number) => {
        return Number(number.toFixed(2));
    };

    /**
     * Updates the output fields with the calculated resistance values
     */
    const updateResistanceOutputs = () => {
        Object.keys(outputs).forEach((type) => {
            const outputElement = document.querySelector(
                `[data-output-type='${type}']`
            );
            if (outputElement) {
                outputElement.value = outputs[type];
            }
        });
    };

    document
        .querySelector('.rings-container')
        .addEventListener('input', handleInputChanges);
})();
