let inputElement = document.getElementById('input1');

let outputTwoElement = document.getElementById('input2');
let outputThreeElement = document.getElementById('input3');
let outputFourElement = document.getElementById('input4');
let outputFiveElement = document.getElementById('input5');

const RESISTANCE_ONE = 1.67;
const RESISTANCE_TWO = 2.67;

inputElement.addEventListener('input', () => {
    calculations(getInputValue());
});

const getInputValue = () => {
    return Number(inputElement.value);
};

const calculations = (inputValue) => {
    const outputTwo = (inputValue * RESISTANCE_ONE).toFixed(2);
    const outputThree = (inputValue * RESISTANCE_TWO).toFixed(2);
    const outputFour = (inputValue + Number(outputTwo) / 4).toFixed(2);
    const outputFive = (inputValue + Number(outputThree) / 4).toFixed(2);

    const outputs = [outputTwo, outputThree, outputFour, outputFive];

    updateOutputValues(outputs);
};

const updateOutputValues = (outputs) => {
    const outputElements = [
        outputTwoElement,
        outputThreeElement,
        outputFourElement,
        outputFiveElement,
    ];

    for (let i = 0; i < outputElements.length; i++) {
        outputElements[i].value = outputs[i];
    }
};
