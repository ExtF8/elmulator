// Circuits Count Calculations

// Initialize values
let circuitsInput = 0;
let peopleInput = 0;

// Update Circuits and People input values
const updateInputValue = (event) => {
    if (event.target.id === 'circuits_input') {
        circuitsInput = getCircuitsInputValue(event.target);
    } else if (event.target.id === 'people_input') {
        peopleInput = getPeopleInputValue(event.target);
    }
    calculateOutputValues();
};

// Are inputs Valid
const inputsAreValid = () => {
    return circuitsInput !== 0 || peopleInput !== 0;
};

// Get Circuits value
const getCircuitsInputValue = (element) => {
    return Number(element.value);
};

// Get People value
const getPeopleInputValue = (element) => {
    return Number(element.value);
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

document
    .getElementById('circuits_input')
    .addEventListener('input', updateInputValue);
document
    .getElementById('people_input')
    .addEventListener('input', updateInputValue);
