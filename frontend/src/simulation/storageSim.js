/*
    Only whole milk needs to be stored at temperatures different from room temperature
    We estimate a maximum of 3 hours waiting to be loaded onto the truck for delivery to distributors and a minimum of 10 minutes
    
    We assume the presence of a sensor that measures the internal temperature once every 10 seconds

    The temperature of the cell must not exceed 4°C. 
    We estimate a 99.9% chance that the cell maintains this temperature
 */

const measureTemperatures = () => {
    const generateStorageLength = () => {
        const min = 60;
        const max = 1080
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const frames = generateStorageLength();
    const temperatures = [];

    for (let i = 0; i < frames; i++) {
        const random = Math.floor(Math.random() * 1000) + 1;
        if (random <= 999) {
            // 99.99% chance of being less than or equal to 4°C
             temperatures.push(Math.random() * (4 - 0) + 0); // generates a temperature equal or below 4
            } else {
                // 0.1% chance of being greater than 10
                temperatures.push(Math.random() * (8 - 4) + 4);  // generates a temperature above 4
            }
    }
    return temperatures;
};

const checkStorage = () => {
    // In a real situation, use address to retrieve the temperature array of the batch
    const temperatures = measureTemperatures();
    return (temperatures.every(temp => temp <= 4));
};

export { checkStorage };