// Circuits Count Calculations
(function () {
    let circuitsInputSP = 0;
    let circuitsInputTP = 0;
    let peopleInput = 0;

    const handleCircuitsInputChanges = (event) => {
        switch (event.target.id) {
            case 'people_input':
                peopleInput = getCircuitsInputValue(event.target);
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

            const circuitsPerPerson = calculateCircuitsPerPerson(circuitsInput);
            const remainder = calculateRemainder(circuitsInput);

            const forOnePerson = circuitsPerPerson + remainder;
            const forOthers = circuitsPerPerson;

            updateCircuitOutputs([forOnePerson, forOthers], type);
        });
    };

    const calculateCircuitsPerPerson = (circuitsInput) => {
        return inputsAreValid() ? Math.floor(circuitsInput / peopleInput) : 0;
    };

    const calculateRemainder = (circuitsInput) => {
        return inputsAreValid() ? circuitsInput % peopleInput : 0;
    };

    const inputsAreValid = () => {
        return (
            (circuitsInputSP !== 0 || circuitsInputTP !== 0) &&
            peopleInput !== 0
        );
    };

    const updateCircuitOutputs = (circuitsOutputs, type) => {
        const circuitsOutputElementIds = [
            `one_person_output_${type}`,
            `people_output_${type}`,
        ];

        circuitsOutputElementIds.forEach(
            (id, index) =>
                (document.getElementById(id).value = circuitsOutputs[index])
        );
    };
})();
