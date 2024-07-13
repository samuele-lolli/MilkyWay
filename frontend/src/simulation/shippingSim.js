/*
    Non sapendo a priori per quanto tempo il latte rimarrà in viaggio, data la distanza e la possibilità di conesgna  a vari orari, generiamo
    casualmente la durata del viaggio tra un minimo di 20 minuti e un massimo di 3 ore prima della consegna.

    Il latte intero deve continuare lo stoccaggio a non più di 4°C
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
                // 99.9% di possibilità di essere minore o uguale a 10
                temperatures.push(1 + Math.random() * 3); // Genera un numero tra 7 e 10
            } else {
                // 0.1% di possibilità di essere maggiore di 10
                temperatures.push(4 + Math.random() * 2); // Genera un numero tra 10 e 12
            }
        }
        return temperatures;
    };
    
    const checkShipping = (address) => {
        // In situazione reale utilizzare address per recuperare l'array delle temperature del lotto
        const temperatures = measureTemperatures();
        return (temperatures.every(temp => temp <= 4));
    };
    
    
    export { checkShipping };