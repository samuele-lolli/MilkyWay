/*
    Pasteurization (used for whole milk) is a treatment that involves exposing raw milk to a high temperature
    for a short period of time (at least +71.7°C for 15 seconds, or any other equivalent combination).

    Let's assume the existence of a sensor that measures the temperature twice per second. The temperature has a 99% chance
    of being at least the specified temperature, and a 1% chance of being below the specified temperature.
 */

const measureTemperatures = () => {
    const temperatures = [];
    for (let i = 0; i < 30; i++) {
        const random = Math.floor(Math.random() * 1000) + 1;
        if (random < 999) {
            // 99.9% chance of being greater than 71.7
            temperatures.push(Math.random() * (74.7 - 71.7) + 71.7);  // generates a temperature equal or above 71.7
        } else {
            temperatures.push(Math.random() * (71.6 - 68.6) + 68.6); // generates a temperature below 71.7
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