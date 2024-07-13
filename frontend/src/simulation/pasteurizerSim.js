/*
    La pastorizzazione (usata nel latte intero) è un trattamento che consiste nell'esposizione del latte crudo a un'elevata temperatura
    per un breve periodo di tempo (almeno +71,7°C per 15 secondi, o qualsiasi altra combinazione equivalente).

    Supponiamo l'esistenza di un sensore che rivela la temperatura due volte al secondo. La temperatura ha il 99% di possibilità
    di essere almeno quella specificata, e l'1% di possibilità di essere inferiore a quella specificata.
 */


const measureTemperatures = () => {
    const temperatures = [];
    for (let i = 0; i < 30; i++) {
        const random = Math.random();
        if (random < 0.99) {
        // 99% di possibilità di essere maggiore di 71.7
        temperatures.push(71.7 + Math.random() * 3); // Genera un numero tra 71.7 e 74.7
        } else {
        // 1% di possibilità di essere inferiore a 71.7
        temperatures.push(69.7 + Math.random() * 2); // Genera un numero tra 69.7 e 71.7
        }
    }
    return temperatures;
};

const checkPasteurization = (address) => {
    // In situazione reale utilizzare address per recuperare l'array delle temperature del lotto
    const temperatures = measureTemperatures();
    return (temperatures.every(temp => temp >= 71.7));
};


export { checkPasteurization };