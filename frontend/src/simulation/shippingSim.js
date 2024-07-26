/*
    Not knowing in advance how long the milk will remain in transit, given the distance and the possibility of delivery at various times, we randomly
    generate the duration of the trip between a minimum of 20 minutes and a maximum of 3 hours before delivery.

    Whole milk must continue to be stored at no more than 4°C.
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
        if (random < 0.999) {
            // 99.9% chance of being less than or equal to 10
            temperatures.push(6 + Math.random() * 3); // Generates a number between 7 and 10
        } else {
            // 0.1% chance of being greater than 10
            temperatures.push(10 + Math.random() * 2); // Generates a number between 10 and 12
        }
    }
    return temperatures;
};

const checkShipping = () => {
    // In a real situation, use address to retrieve the temperature array of the batch
    const temperatures = measureTemperatures();
    return (temperatures.every(temp => temp <= 4));
};

export { checkShipping };