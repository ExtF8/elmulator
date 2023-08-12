// Circuits Count Calculations

// Initialize values
let circuitsInput = 0;
let peopleInput = 0;

// Circuits input
document.body.addEventListener('input', (event) => {
    if (event.target.id === 'circuits_input') {
        circuitsInput = getCircuitsInputValue(event.target);
        console.log(circuitsInput);
    }
    calculateOutputValues();
});

// People input
document.body.addEventListener('input', (event) => {
    if (event.target.id === 'people_input') {
        peopleInput = getPeopleInputValue(event.target);
        console.log(peopleInput);
    }
    calculateOutputValues();
});

// Circuits value
const getCircuitsInputValue = (element) => {
    return Number(element.value);
};

// People value
const getPeopleInputValue = (element) => {
    return Number(element.value);
};

// Per person
const calculateCircuitsPerPerson = () => {
    if (circuitsInput && peopleInput === 0) return 0;
    return Math.floor(circuitsInput / peopleInput);
};

// remainder
const calculateRemainder = () => {
    if (circuitsInput && peopleInput === 0) return 0;
    return circuitsInput % peopleInput;
};

// Values for output
const calculateOutputValues = () => {
    let circuitsPerPerson = calculateCircuitsPerPerson();
    let remainder = calculateRemainder();

    // For one person
    let forOnePerson = circuitsPerPerson + remainder;
    // For others
    let forOthers = circuitsPerPerson;

    outputs = [forOnePerson, forOthers];

    updateOutputs(outputs);
};

// Update calculated values
const updateOutputs = (outputs) => {
    const outputElementIds = ['one_person_output', 'people_output'];

    const outputElements = outputElementIds.map((id) =>
        document.getElementById(id)
    );

    for (let i = 0; i < outputElements.length; i++) {
        outputElements[i].value = outputs[i];
    }
};
