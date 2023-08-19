/**
 * Module for calculating circuit count
 */
(function () {
    // Constants
    const SINGLE_PHASE = 'single_phase';
    const THREE_PHASE = 'three_phase';

    const circuitsOutputs = {
        [SINGLE_PHASE]: [],
        [THREE_PHASE]: [],
    };

    let singlePhaseInput = 0;
    let threePhaseInput = 0;
    let engineersCount = 0;

    /**
     * Handles changes to the circuit input fields, calculates outputs and updates outputs
     * @param {Event} event - The input event
     */
    const handleInputChanges = (event) => {
        updateInputValues(event.target);

        if (isInputValid(event)) {
            processCircuitsCalculations();
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
            case 'engineers':
                engineersCount = value;
                break;
            case SINGLE_PHASE:
                singlePhaseInput = value;
                break;
            case THREE_PHASE:
                threePhaseInput = value;
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
     * Handles the entire circuits calculations workflow
     */
    const processCircuitsCalculations = () => {
        calculateCircuitsOutputs();
        updateCircuitsOutputs();
    };

    /**
     * Calculates the outputs based on current inputs
     */
    const calculateCircuitsOutputs = () => {
        calculateOutputForType(SINGLE_PHASE, singlePhaseInput);
        calculateOutputForType(THREE_PHASE, threePhaseInput);
    };

    /**
     * Calculates the output for a specific type
     * @param {string} type - The type of circuit (single or three phase)
     * @param {number} input - The number of circuits
     */
    const calculateOutputForType = (type, input) => {
        if (input !== 0) {
            const { perEngineer, remainder } = calculateDivisionResults(input);

            const forOneEngineer = perEngineer + remainder;
            const forOthers = perEngineer;

            circuitsOutputs[type] = [forOneEngineer, forOthers];
        }
    };

    /**
     * Calculates the number of circuits per engineer and the remainder
     * @param {number} input - The total number of circuits
     * @returns {Object} - An object containing the number of circuits per engineer and the remainder
     */
    const calculateDivisionResults = (input) => {
        const perEngineer = Math.floor(input / engineersCount);
        const remainder = input % engineersCount;
        return { perEngineer, remainder };
    };

    /**
     * Updates the output object values based on the calculated values
     */
    const updateCircuitsOutputs = () => {
        Object.keys(circuitsOutputs).forEach((type) => {
            updateOutputsForType(circuitsOutputs[type], type);
        });
    };

    /**
     * Updated the output fields for a specific type (single or three phase)
     * @param {number[]} outputs - The output values
     * @param {string} type - The type of circuit (single or three phase)
     */
    const updateOutputsForType = (circuitsOutputs, type) => {
        const outputElements = document.querySelectorAll(
            `[data-output-type='${type}']`
        );

        outputElements.forEach((element, index) => {
            // Ensure the value is defined and is a number before updating
            if (
                typeof circuitsOutputs[index] !== 'undefined' &&
                !isNaN(circuitsOutputs[index])
            ) {
                element.value = circuitsOutputs[index];
            } else {
                console.warn(
                    `Invalid value for ${type}:`,
                    circuitsOutputs[index]
                );
            }
        });
    };

    document
        .querySelector('.circuits-container')
        .addEventListener('input', handleInputChanges);
})();
