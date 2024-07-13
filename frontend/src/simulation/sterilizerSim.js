/*
    La sterilizzazione (usata nel latte a lunga conservazione)è un trattamento che consiste in un riscaldamento
    continuo del latte crudo ad almeno 135°C per non meno di un secondo, al fine di neutralizzare microrganismi e spore. 

    Supponiamo che l'azienda impieghi un ciclo di sterilizzazione di 1.5 secondi, e che impieghi un sensore che misuri la temperatura
    interna una volta ogni decimo di secondo. La temperatura ha il 99% di possibilità di essere maggiore di 135°C, e il 1% di possibilità
    di essere inferiore a 135°C.
 */

const measureTemperatures = () => {
    const temperatures = [];
    for (let i = 0; i < 15; i++) {
        const random = Math.random();
        if (random < 0.99) {
        // 99% di possibilità di essere maggiore di 135
        temperatures.push(135 + Math.random() * 3); 
        } else {
        // 1% di possibilità di essere inferiore a 135
        temperatures.push(132 + Math.random() * 2); 
        }
    }
    return temperatures;
};

const checkSterilization = (address) => {
    // In situazione reale utilizzare address per recuperare l'array delle temperature del lotto
    const temperatures = measureTemperatures();
    return (temperatures.every(temp => temp >= 135));
};


export { checkSterilization };