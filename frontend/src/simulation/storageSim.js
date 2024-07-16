/*
    Solo il latte intero va conservato a temperature diverse da quella ambiente
    Stimiamo un massimo di 3 ore in attesa di essere caricato sul camion per la consegna ai distributori e un minimo di 10 minuti
    
    Supponiamo la presenza di un sensore che misuri la temperatura interna una volta ogni 10 secondi

    La temperatura della cella deve essere non superiore a 4°C. 
    Stimiamo un 99.9% di possibilità che la cella mantenga tale temperatura
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
            const random = Math.random();
            if (random < 0.999) {
                // 99.99% di possibilità di essere minore o uguale a 4°C
                temperatures.push(1 + Math.random() * 2); // Genera un numero tra 1 e 4
            } else {
                // 0.01% di possibilità di essere maggiore di 4°C
                temperatures.push(4 + Math.random() * 2); // Genera un numero tra 4 e 6
            }
        }
        return temperatures;
    };
    
    const checkStorage = (address) => {
        // In situazione reale utilizzare address per recuperare l'array delle temperature del lotto
        const temperatures = measureTemperatures();
        return (temperatures.every(temp => temp <= 4));
    };
    
    
    export { checkStorage };