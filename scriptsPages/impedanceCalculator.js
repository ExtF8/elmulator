// External Impedance Calculations
(function () {
    // Initialize values
    let onePhaseIpfOutput = 0;
    let threePhaseIpfOutput = 0;

    let ipf = onePhaseIpfOutput;
    let tpIpf = threePhaseIpfOutput;

    // Get inputs Voltage and Input Zbd
    const getImpedanceInputs = (event) => {
        if (event.target.id === 'voltage_input') {
            voltageInput = getVoltageInputValue(event.target);
            console.log(voltageInput);
        } else if (event.target.id === 'zbd_input') {
            zbdInput = getZbdInputValue(event.target);
            console.log(zbdInput);
        }
    };
    document.body.addEventListener('input', getImpedanceInputs);

    // Get Voltage inputs values
    const getVoltageInputValue = (element) => {
        return Number(element.value);
    };

    // Get Zbd inputs values
    const getZbdInputValue = (element) => {
        return Number(element.value);
    };

    // Calculate L1 Ipf output

    // Calculate TP Ipf output

    // Update outputs
});
