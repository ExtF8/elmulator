// Circuits Count Calculations
(function () {
    // Initialize values
    let circuitsInput = 0;
    let peopleInput = 0;

    // Get Circuits and People inputs
    const handleCircuitsInputChanges = (event) => {
        if (event.target.id === 'circuits_input') {
            updateCircuitsInput(event.target);
        } else if (event.target.id === 'people_input') {
            updatePeopleInput(event.target);
        }
        calculateCircuitOutputValues();
    };

    document.querySelector('.circuits-container').addEventListener('input', handleCircuitsInputChanges);

    // Update inputs
    const updateCircuitsInput = (element) => {
        circuitsInput = getCircuitsInputValue(element);
    };

    const updatePeopleInput = (element) => {
        peopleInput = getPeopleInputValue(element);
    };

    // Get Circuits value
    const getCircuitsInputValue = (element) => {
        return Number(element.value);
    };
    // Get People value
    const getPeopleInputValue = (element) => {
        return Number(element.value);
    };

    // Values for output
    const calculateCircuitOutputValues = () => {
        let circuitsPerPerson = calculateCircuitsPerPerson();
        let remainder = calculateRemainder();

        // For one person
        let forOnePerson = circuitsPerPerson + remainder;
        // For others
        let forOthers = circuitsPerPerson;

        let circuitsOutputs = [forOnePerson, forOthers];

        updateCircuitOutputs(circuitsOutputs);
    };

    // Per person
    const calculateCircuitsPerPerson = () => {
        if (!inputsAreValid()) return 0;
        return Math.floor(circuitsInput / peopleInput);
    };

    // remainder
    const calculateRemainder = () => {
        if (!inputsAreValid()) return 0;
        return circuitsInput % peopleInput;
    };

    // Are inputs Valid
    const inputsAreValid = () => {
        return circuitsInput !== 0 && peopleInput !== 0;
    };

    // Update calculated values
    const updateCircuitOutputs = (circuitsOutputs) => {
        const circuitsOutputElementIds = ['one_person_output', 'people_output'];

        const circuitsOutputElements = circuitsOutputElementIds.map((id) =>
            document.getElementById(id)
        );

        for (let i = 0; i < circuitsOutputElements.length; i++) {
            circuitsOutputElements[i].value = circuitsOutputs[i];
        }
    };
})();
