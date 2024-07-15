/*
    Non sapendo a priori per quanto tempo il latte rimarrà in viaggio, data la distanza e la possibilità di raccolta a vari orari, generiamo
    casualmente la durata del viaggio tra un minimo di 20 minuti e un massimo di 4 ore prima dello scarico e del viaggio successivo. Il viaggio
    è suddiviso in un numero casuale di frame da 15 secondi tra il minimo e il massimo specificato.

    Secondo il regolamento CE 1662/06, il latte crudo giunge a destinazione ad una temperatura non superiore a +10°C
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
                // 99.99% di possibilità di essere minore o uguale a 10
                temperatures.push(7 + Math.random() * 3); // Genera un numero tra 7 e 10
            } else {
                // 0.01% di possibilità di essere maggiore di 10
                temperatures.push(10 + Math.random() * 2); // Genera un numero tra 10 e 12
            }
        }
        return temperatures;
    };
    
    const checkTravel = (address) => {
        // In situazione reale utilizzare address per recuperare l'array delle temperature del lotto
        const temperatures = measureTemperatures();
        // API
        return (temperatures.every(temp => temp <= 10));
    };
    
    
    export { checkTravel };