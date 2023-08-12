// Rings resistance calculations
(function () {
    const RESISTANCE_ONE = 1.67;
    const RESISTANCE_TWO = 2.67;

    document.body.addEventListener('input', (event) => {
        if (event.target.id === 'rings_input') {
            calculations(getInputValue(event.target));
        }
    });

    const getInputValue = (element) => {
        return Number(element.value);
    };

    const calculations = (inputValue) => {
        let outputOne = (inputValue * RESISTANCE_ONE).toFixed(2);
        let outputTwo = (inputValue * RESISTANCE_TWO).toFixed(2);
        let outputThree = ((inputValue + Number(outputOne)) / 4).toFixed(2);
        let outputFour = ((inputValue + Number(outputTwo)) / 4).toFixed(2);

        const outputs = [outputOne, outputTwo, outputThree, outputFour];

        updateOutputValues(outputs);
    };

    const updateOutputValues = (outputs) => {
        const outputElementsIds = [
            'rings_output1',
            'rings_output2',
            'rings_output3',
            'rings_output4',
        ];
        const outputElements = outputElementsIds.map((id) =>
            document.getElementById(id)
        );

        for (let i = 0; i < outputElements.length; i++) {
            outputElements[i].value = outputs[i];
        }
    };
})();
