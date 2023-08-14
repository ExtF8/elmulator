// External Impedance Calculations
(function () {
    // Initialize values
    let voltageInput = 0;
    let zdbInput = 0;

    // Get Voltage and zdb inputs
    const handleImpedanceInputChanges = (event) => {
        updateImpedanceInputValue(event.target);

        if (onlyOneInputProvided()) {
            setDefaultVoltageInput();
        }

        calculateImpedanceOutputValues();
    };

    document
        .querySelector('.impedance-container')
        .addEventListener('input', handleImpedanceInputChanges);

    const updateImpedanceInputValue = (element) => {
        if (element.id === 'voltage_input') {
            voltageInput = getNumericInputValue(element);
        } else if (element.id === 'zdb_input') {
            zdbInput = getNumericInputValue(element);
        }
    };

    // Default voltage value
    const onlyOneInputProvided = () => {
        return (
            (voltageInput === 0 && zdbInput !== 0) ||
            (zdbInput === 0 && voltageInput !== 0)
        );
    };
    const setDefaultVoltageInput = () => {
        if (voltageInput === 0) {
            voltageInput = 240;

            const voltageInputElement =
                document.getElementById('voltage_input');

            voltageInputElement.value = voltageInput;
        }
    };

    // Get numeric inputs values
    const getNumericInputValue = (element) => {
        return Number(element.value);
    };

    // Calculate Impedance output Values
    // L1- outputIpf = inputVoltage / inputZdb
    // TP - outputIpf = L1 - outputIpf * 2
    const calculateImpedanceOutputValues = () => {
        if (inputsAreValid()) {
            const onePhaseOutput = voltageInput / zdbInput;
            const threePhaseOutput = onePhaseOutput * 2;

            convertImpedanceOutputValues(onePhaseOutput, threePhaseOutput);
        }
    };

    const convertImpedanceOutputValues = (onePhaseOutput, threePhaseOutput) => {
        let decimalPlaces = zdbInput >= 5 ? 4 : 2;

        let onePhaseOutputKA = roundToDecimal(
            onePhaseOutput / 1000,
            decimalPlaces
        );
        let threePhaseOutputKA = roundToDecimal(
            threePhaseOutput / 1000,
            decimalPlaces
        );

        const convertedImpedanceValues = [onePhaseOutputKA, threePhaseOutputKA];

        updateConvertedImpedanceOutputs(convertedImpedanceValues);
    };

    // Helper function for rounding to specific number of decimal places
    const roundToDecimal = (number, decimalPlaces) => {
        const factor = Math.pow(10, decimalPlaces);
        return Math.round(number * factor) / factor;
    };

    // Are inputs Valid
    const inputsAreValid = () => {
        return voltageInput !== 0 && zdbInput !== 0;
    };

    const updateConvertedImpedanceOutputs = (convertedImpedanceValues) => {
        const impedanceOutputElementIds = [
            'one_phase_ipf_output_ka',
            'three_phase_ipf_output_ka',
        ];

        const impedanceOutputElements = impedanceOutputElementIds.map((id) =>
            document.getElementById(id)
        );

        for (let i = 0; i < impedanceOutputElements.length; i++) {
            impedanceOutputElements[i].value = convertedImpedanceValues[i];
        }
    };
})();
