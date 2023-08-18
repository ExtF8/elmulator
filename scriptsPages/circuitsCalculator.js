/**
 * Module for calculating circuit count
 */
(function () {
    // Constants
    const SINGLE_PHASE = 'single_phase';
    const THREE_PHASE = 'three_phase';

    let singlePhaseInput = 0;
    let threePhaseInput = 0;
    let engineersCount = 0;

    /**
     * Handles changes to the circuit input fields, calculates outputs and updates outputs
     * @param {Event} event - The input event
     */
    const handleInputChanges = (event) => {
        const value = getInputValue(event.target);
        const inputType = event.target.getAttribute('data-input-type');

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

        if (areInputsValid()) {
            const calculatedOutputs = calculateOutputs();
            updateOutputs(calculatedOutputs);
        }
    };

    document
        .querySelector('.circuits-container')
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
     * Calculate the outputs based on current inputs
     * @returns {Object} - An object containing the calculated outputs for single and three phase
     */
    const calculateOutputs = () => {
        let outputs = {
            [SINGLE_PHASE]: [],
            [THREE_PHASE]: [],
        };

        [SINGLE_PHASE, THREE_PHASE].forEach((type) => {
            const input =
                type === SINGLE_PHASE ? singlePhaseInput : threePhaseInput;

            if (input !== 0) {
                const { perEngineer, remainder } =
                    calculateDivisionResults(input);

                const forOneEngineer = perEngineer + remainder;
                const forOthers = perEngineer;

                outputs[type] = [forOneEngineer, forOthers];
            }
        });

        return outputs;
    };

    /**
     * Checks if the input values are valid
     * @returns {boolean} - True if valid
     */
    const areInputsValid = () => {
        return (singlePhaseInput || threePhaseInput) && engineersCount;
    };

    /**
     * Calculates the number of circuits per engineer and the remainder
     * Assumes inputs have already been validated
     * @param {number} input - The number of circuits
     * @returns {Object} - An object containing the number of circuits per engineer and the remainder
     */
    const calculateDivisionResults = (input) => {
        const perEngineer = Math.floor(input / engineersCount);
        const remainder = input % engineersCount;
        return { perEngineer, remainder };
    };

    /**
     * Updates the output fields based on the calculated values
     * @param {Object} outputs - The calculated outputs for single and three phase
     */
    const updateOutputs = (outputs) => {
        [SINGLE_PHASE, THREE_PHASE].forEach((type) => {
            if (outputs[type].length) {
                updateOutputsForType(outputs[type], type);
            }
        });
    };

    /**
     * Updated the output fields for a specific type (single or three phase)
     * @param {number[]} outputs - The output values
     * @param {string} type - The type of circuit (single phase or three phase)
     */
    const updateOutputsForType = (outputs, type) => {
        const outputElements = document.querySelectorAll(
            `[data-output-type='${type}']`
        );

        outputElements.forEach((element, index) => {
            element.value = outputs[index];
        });
    };
})();
