// External Impedance Calculations
(function () {
    // Initialize values
    let voltageInput = 0;
    let zbdInput = 0;

    // Get Voltage and Zbd inputs
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
        } else if (element.id === 'zbd_input') {
            zbdInput = getNumericInputValue(element);
        }
    };

    // Default voltage value
    const onlyOneInputProvided = () => {
        return (
            (voltageInput === 0 && zbdInput !== 0) ||
            (zbdInput === 0 && voltageInput !== 0)
        );
    };
    const setDefaultVoltageInput = () => {
        if (voltageInput === 0) {
            voltageInput = 240;

            const voltageInputElement =
                document.getElementById('voltage_input');

            voltageInputElement.value = voltageInput.toString();
        }
    };

    // Get numeric inputs values
    const getNumericInputValue = (element) => {
        return Number(element.value);
    };

    // Calculate Impedance output Values
    // L1- outputIpf = inputVoltage / inputZbd
    // TP - outputIpf = L1 - outputIpf * 2
    const calculateImpedanceOutputValues = () => {
        if (inputsAreValid()) {
            const onePhaseOutput = Math.round(voltageInput / zbdInput);
            const threePhaseOutput = Math.round(onePhaseOutput * 2);

            console.log('L1:', onePhaseOutput);
            console.log('TP', threePhaseOutput);

            const impedanceOutputValues = [onePhaseOutput, threePhaseOutput];

            updateImpedanceOutputs(impedanceOutputValues);
            convertImpedanceOutputValues(onePhaseOutput, threePhaseOutput);
        }
    };

    const convertImpedanceOutputValues = (onePhaseOutput, threePhaseOutput) => {
        const onePhaseOutputKA = (onePhaseOutput / 1000).toFixed(2);
        console.log('Converted:', onePhaseOutputKA);
        const threePhaseOutputKA = (threePhaseOutput / 1000).toFixed(2);
        console.log('Converted:', threePhaseOutputKA);

        const convertedImpedanceValues = [onePhaseOutputKA, threePhaseOutputKA];

        updateConvertedImpedanceOutputs(convertedImpedanceValues);
    };

    // Are inputs Valid
    const inputsAreValid = () => {
        return voltageInput !== 0 && zbdInput !== 0;
    };

    // Update outputs
    const updateImpedanceOutputs = (impedanceOutputValues) => {
        const impedanceOutputElementIds = [
            'one_phase_ipf_output',
            'three_phase_ipf_output',
        ];

        const impedanceOutputElements = impedanceOutputElementIds.map((id) =>
            document.getElementById(id)
        );

        for (let i = 0; i < impedanceOutputElements.length; i++) {
            impedanceOutputElements[i].value = impedanceOutputValues[i];
        }
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
