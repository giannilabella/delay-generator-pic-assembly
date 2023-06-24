function getCalculationParameters() {
    const frequency = document.querySelector('input#frequency').value;
    const delay = document.querySelector('input#delay').value;

    return [frequency, delay];
}

function getGenerationParameters() {
    let variables = document.querySelector('input#variables').value;
    let registers = document.querySelector('input#registers').value;

    if (variables != "")
        variables = variables.split(',').map(s => s.trim());
    else
        variables = []

    if (registers != "")
        registers = registers.split(',').map(s => s.trim());
    else
        registers = []

    return [variables, registers];
}

function calculatePreload(frequency, delay) {
    const cyclesInInternalLoop = 4;
    const cyclesInDelay = (frequency * 1_000_000 / 4) * (delay / 1000);

    let numberOfLoops = 1;
    let previousNumberOfCycles = 0;
    let numberOfCycles = 255 * cyclesInInternalLoop + 3;
    while (numberOfCycles < cyclesInDelay - numberOfLoops - 1) {
        numberOfLoops++;
        previousNumberOfCycles = numberOfCycles;
        numberOfCycles += (numberOfCycles + 3) * 255 + numberOfCycles + 2;
    }

    const preload = Math.round((cyclesInDelay - previousNumberOfCycles - 2) / (previousNumberOfCycles + 3) + 1);

    return [preload, numberOfLoops];
}

function generate() {
    const [frequency, delay] = getCalculationParameters();
    const [variables, registers] = getGenerationParameters();

    const [preload, numberOfLoops] = calculatePreload(frequency, delay);

    if (variables.length < numberOfLoops) {
        for (let i = variables.length; i < numberOfLoops; i++) {
            variables.push(`delay_counter${i}`);
        }
    }
    if (registers.length < numberOfLoops) {
        let register = registers.length == 0 ? 0x20 : parseInt(registers[registers.length - 1], 16) + 1;
        for (let i = registers.length; i < numberOfLoops; i++, register++) {
            registers.push(`0x${register.toString(16)}`);
        }
    }

    document.querySelector('input#variables').value = variables.join(', ');
    document.querySelector('input#registers').value = registers.join(', ');

    const subroutine = ['delay', `\tmovlw   d'${preload}'`, `\tmovwf   ${variables[numberOfLoops - 1]}`];
    for (let i = numberOfLoops - 2; i >= 0; i--) {
        subroutine.push(`\tclrf    ${variables[i]}`);
    }

    subroutine.push('loop');
    for (let i = 0; i < numberOfLoops; i++) {
        subroutine.push(`\tdecfsz  ${variables[i]}, F`);
        subroutine.push('\tgoto    loop');
    }
    subroutine.push('\treturn');

    document.querySelector('textarea#subroutine').value = subroutine.join('\n');
}
