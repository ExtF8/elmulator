// Circuits Count Calculations
(function () {
    let circuitsInputSP = 0;
    let circuitsInputTP = 0;
    let engineersInput = 0;

    const handleCircuitsInputChanges = (event) => {
        switch (event.target.id) {
            case 'engineers_input':
                engineersInput = getCircuitsInputValue(event.target);
                break;
            case 'circuits_input_sp':
                circuitsInputSP = getCircuitsInputValue(event.target);
                break;
            case 'circuits_input_tp':
                circuitsInputTP = getCircuitsInputValue(event.target);
                break;
        }
        calculateCircuitOutputValues();
    };

    document
        .querySelector('.circuits-container')
        .addEventListener('input', handleCircuitsInputChanges);

    const getCircuitsInputValue = (element) => {
        return Number(element.value);
    };

    const calculateCircuitOutputValues = () => {
        ['sp', 'tp'].forEach((type) => {
            const circuitsInput =
                type === 'sp' ? circuitsInputSP : circuitsInputTP;

            if (circuitsInput === 0) return;

            const circuitsPerEngineer = calculateCircuitsPerEngineer(circuitsInput);
            const remainder = calculateRemainder(circuitsInput);

            const forOneEngineer = circuitsPerEngineer + remainder;
            const forOthers = circuitsPerEngineer;

            updateCircuitOutputs([forOneEngineer, forOthers], type);
        });
    };

    const calculateCircuitsPerEngineer = (circuitsInput) => {
        return inputsAreValid() ? Math.floor(circuitsInput / engineersInput) : 0;
    };

    const calculateRemainder = (circuitsInput) => {
        return inputsAreValid() ? circuitsInput % engineersInput : 0;
    };

    const inputsAreValid = () => {
        return (
            (circuitsInputSP !== 0 || circuitsInputTP !== 0) &&
            engineersInput !== 0
        );
    };

    const updateCircuitOutputs = (circuitsOutputs, type) => {
        const circuitsOutputElementIds = [
            `one_engineer_output_${type}`,
            `engineers_output_${type}`,
        ];

        circuitsOutputElementIds.forEach(
            (id, index) =>
                (document.getElementById(id).value = circuitsOutputs[index])
        );
    };
})();
