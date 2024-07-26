/*
    Sterilization (used in long-life milk) is a treatment that consists of continuous heating
    of raw milk at least 135°C for not less than one second, in order to neutralize microorganisms and spores.

    Let's assume that the company uses a sterilization cycle of 1.5 seconds, and employs a sensor that measures the internal
    temperature once every tenth of a second. The temperature has a 99% chance of being higher than 135°C, and a 1% chance
    of being lower than 135°C.
 */

const measureTemperatures = () => {
    const temperatures = [];
    for (let i = 0; i < 15; i++) {
        const random = Math.floor(Math.random() * 1000) + 1;
        if (random < 999) {
            // 99.9% chance of being greater than 135
            temperatures.push(Math.random() * (140 - 135) + 135);  // generates a temperature equal or above 71.7
        } else {
            temperatures.push(Math.random() * (134.9 - 130.9) + 130.9); // generates a temperature below 71.7
        }
    }
    return temperatures;
};

const checkSterilization = () => {
    // In a real situation, use address to retrieve the temperature array of the batch
    const temperatures = measureTemperatures();
    return (temperatures.every(temp => temp >= 135));
};

export { checkSterilization };