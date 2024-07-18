/*
    Pasteurization (used for whole milk) is a treatment that involves exposing raw milk to a high temperature
    for a short period of time (at least +71.7°C for 15 seconds, or any other equivalent combination).

    Let's assume the existence of a sensor that measures the temperature twice per second. The temperature has a 99% chance
    of being at least the specified temperature, and a 1% chance of being below the specified temperature.
 */

const measureTemperatures = () => {
    const temperatures = [];
    for (let i = 0; i < 30; i++) {
        const random = Math.random();
        if (random < 0.99) {
            // 99% chance of being greater than 71.7
            temperatures.push(71.7 + Math.random() * 3); // Generates a number between 71.7 and 74.7
        } else {
            // 1% chance of being less than 71.7
            temperatures.push(69.7 + Math.random() * 2); // Generates a number between 69.7 and 71.7
        }
    }
    return temperatures;
};

const checkPasteurization = () => {
    // In a real situation, use address to retrieve the temperature array for the batch
    const temperatures = measureTemperatures();
    return (temperatures.every(temp => temp >= 71.7));
};

export { checkPasteurization };