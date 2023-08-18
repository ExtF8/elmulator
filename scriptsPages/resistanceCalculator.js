/**
 * Module for Rings Resistance Calculations
 */
(function () {
    // Constants
    const RESISTANCE_ONE_MULTIPLIER = 1.67;
    const RESISTANCE_TWO_MULTIPLIER = 2.67;

    /**
     * Handles changes to the resistance input, calculates outputs, and updates them
     * @param {Event} event - The input event
     */
    const handleInputChanges = (event) => {
        const value = getInputValue(event.target);
        const inputType = event.target.getAttribute('data-input-type');

        if (inputType === 'r1') {
            processResistanceCalculations(value);
        }
    };

    document
        .querySelector('.rings-container')
        .addEventListener('input', handleInputChanges);

    /**
     * Retrieves the numerical value from an input element
     * @param {HTMLInputElement} element - The input element
     * @returns {number} - The numerical value of the input
     */
    const getInputValue = (element) => {
        return Number(element.value);
    };

    /**
     * Orchestrates the calculates and updating or resistance outputs
     * @param {number} inputValue - The resistance input value (r1)
     */
    const processResistanceCalculations = (inputValue) => {
        const outputs = calculateResistanceOutputs(inputValue);
        updateResistanceOutputs(outputs);
    };

    /**
     * Calculates the resistance output values based on r1 input
     * @param {number} inputValue - The resistance input value (r1)
     * @returns {number[]} - The calculated resistance outputs
     */
    const calculateResistanceOutputs = (inputValue) => {
        let r2_1 = (inputValue * RESISTANCE_ONE_MULTIPLIER).toFixed(2);
        let r2_2 = (inputValue * RESISTANCE_TWO_MULTIPLIER).toFixed(2);
        let rSum_1 = ((inputValue + Number(r2_1)) / 4).toFixed(2);
        let rSum_2 = ((inputValue + Number(r2_2)) / 4).toFixed(2);

        return [r2_1, r2_2, rSum_1, rSum_2];
    };

    /**
     * Updates the resistance output fields with the calculated values
     * @param {number[]} outputs - The calculated resistance output values
     */
    const updateResistanceOutputs = (outputs) => {
        const outputTypes = [
            'r2_multiplier_1',
            'r2_multiplier_2',
            'r_sum_1',
            'r_sum_2',
        ];

        outputTypes.forEach((type, index) => {
            const outputElement = document.querySelector(
                `[data-output-type='${type}']`
            );
            if (outputElement) {
                outputElement.value = outputs[index];
            }
        });
    };
})();
