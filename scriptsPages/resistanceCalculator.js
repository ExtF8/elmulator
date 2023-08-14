// Rings Resistance Calculations
(function () {
    const RESISTANCE_ONE = 1.67;
    const RESISTANCE_TWO = 2.67;

    document.querySelector('.rings-container').addEventListener('input', (event) => {
        if (event.target.id === 'rings_input') {
            calculateResistanceOutputValues(getInputValue(event.target));
        }
    });

    const getInputValue = (element) => {
        return Number(element.value);
    };

    const calculateResistanceOutputValues = (inputValue) => {
        let outputOne = (inputValue * RESISTANCE_ONE).toFixed(2);
        let outputTwo = (inputValue * RESISTANCE_TWO).toFixed(2);
        let outputThree = ((inputValue + Number(outputOne)) / 4).toFixed(2);
        let outputFour = ((inputValue + Number(outputTwo)) / 4).toFixed(2);

        const resistanceOutputs = [outputOne, outputTwo, outputThree, outputFour];

        updateResistanceOutputValues(resistanceOutputs);
    };

    const updateResistanceOutputValues = (resistanceOutputs) => {
        const resistanceOutputElementsIds = [
            'rings_output1',
            'rings_output2',
            'rings_output3',
            'rings_output4',
        ];
        const resistanceOutputElements = resistanceOutputElementsIds.map((id) =>
            document.getElementById(id)
        );

        for (let i = 0; i < resistanceOutputElements.length; i++) {
            resistanceOutputElements[i].value = resistanceOutputs[i];
        }
    };
})();
