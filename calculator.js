let inputNumberValue = document.getElementById('input1');
let outputTwoValue = document.getElementById('input2');
let outputThreeValue = document.getElementById('input3');
let outputFourValue = document.getElementById('input4');
let outputFiveValue = document.getElementById('input5');

const RESISTANCE_ONE = 1.67;
const RESISTANCE_TWO = 2.67;

inputNumberValue.addEventListener('change', (e) => {
    let input = getValue1();
    calculations(input);
});

getValue1 = () => {
    return Number(inputNumberValue.value);
};

const calculations = (input) => {
    const output2 = +(input * RESISTANCE_ONE).toFixed(2);
    outputTwoValue.value = output2;

    const output3 = +(input * RESISTANCE_TWO).toFixed(2);
    outputThreeValue.value = output3;

    const output4 = +(input + output2 / 4).toFixed(2);
    outputFourValue.value = output4;

    const output5 = +(input + output3 / 4).toFixed(2);
    outputFiveValue.value = output5;
};
