/*
    Not knowing in advance how long the milk will remain in transit, given the distance and the possibility of collection at various times, we randomly generate
    the duration of the journey between a minimum of 20 minutes and a maximum of 4 hours before unloading and the next trip. The journey
    is divided into a random number of 15-second frames between the specified minimum and maximum.

    According to EC Regulation 1662/06, raw milk arrives at its destination at a temperature not exceeding +10°C
 */

const measureTemperatures = () => {
    const generateTravelLength = () => {
        const min = 60;
        const max = 3600;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const frames = generateTravelLength();
    const temperatures = [];
    for (let i = 0; i < frames; i++) {
        const random = Math.random();
        if (random < 0.9999) {
            // 99.99% chance of being less than or equal to 10
            temperatures.push(7 + Math.random() * 3); // Generates a number between 7 and 10
        } else {
            // 0.01% chance of being greater than 10
            temperatures.push(10 + Math.random() * 2); // Generates a number between 10 and 12
        }
    }
    return temperatures;
};

const checkTravel = () => {
    // In a real situation, use address to retrieve the temperature array of the batch
    const temperatures = measureTemperatures();
    return (temperatures.every(temp => temp <= 10));
};

export { checkTravel };