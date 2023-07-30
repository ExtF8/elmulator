let inputNumberValue = document.getElementById('input1');
let outputTwoValue = document.getElementById('input2');
let outputThreeValue = document.getElementById('input3');
let outputFourValue = document.getElementById('input4');
let outputFiveValue = document.getElementById('input5');

const RESISTANCE_ONE = 1.67;
const RESISTANCE_TWO = 2.67;

inputNumberValue.addEventListener('input', (e) => {
    let input = getValue1();
    calculations(input);
});

const getValue1 = () => {
    return Number(inputNumberValue.value);
};

const calculations = (input) => {
    const output2 = +(input * RESISTANCE_ONE).toFixed(2);
    const output3 = +(input * RESISTANCE_TWO).toFixed(2);
    const output4 = +((input + output2) / 4).toFixed(2);
    const output5 = +((input + output3) / 4).toFixed(2);
    const outputs = [output2, output3, output4, output5];

    updateValues(outputs);
};

const updateValues = (outputs) => {
    outputTwoValue.value = outputs[0];
    outputThreeValue.value = outputs[1];
    outputFourValue.value = outputs[2];
    outputFiveValue.value = outputs[3];
};
