import React, { useState, useEffect } from 'react';
import axios from "axios"
import { TextInput, Button, Select, Badge } from '@mantine/core';
import { toast } from 'react-toastify';
import { getContract } from "../web3"
import { checkPasteurization } from '../simulation/pasteurizerSim';
import { checkSterilization } from '../simulation/sterilizerSim';
import { checkTravel } from '../simulation/transportSim';
import { checkStorage } from '../simulation/storageSim';
import { checkShipping } from '../simulation/shippingSim';
import { locationOptionsIntero, locationOptionsLC } from '../data/options';

const ActiveSteps = ({ web3, factoryContract, processContractAddress, account, steps, currentStepIndex, lotNumber, isIntero, updateState, role, isFailed }) => {
  const [locationInputs, setLocationInputs] = useState(Array(steps.length).fill(''));
  const [supervisorAddresses, setSupervisorAddresses] = useState(Array(steps.length).fill(''));
  const [actualContract, setActualContract] = useState(null);
  const [inputErrors, setInputErrors] = useState(Array(steps.length).fill(false));
  const [isSaveButtonVisible, setIsSaveButtonVisible] = useState(false); 
  const [currentLocation, setCurrentLocation] = useState("");

  useEffect(() => {
    const getActualContract = async () => {
      console.log("Fetching contract for process address:", processContractAddress);
      const cntr = await getContract(web3, 'MilkProcess', processContractAddress);
      setActualContract(cntr);
      console.log("Contract fetched:", cntr);
    }
    getActualContract();
  }, [web3, processContractAddress]);

  const handleLocationSelect = async (value, index) => {
    try {
      const newLocationInputs = [...locationInputs];
      newLocationInputs[index] = value;
      setLocationInputs(newLocationInputs);
      setCurrentLocation(value);
      await completeStep(index, value); // Passa il valore selezionato direttamente
    } catch (error) {
      console.error("Error handling location select:", error);
      toast.error("Errore nel completare lo step con la posizione selezionata");
    }
  };

  const completeStep = async (index, location) => {
    try {
      console.log(location);
      if (isFailed) {
        throw new Error("Il processo è fallito e non può essere completato");
      }
      if (steps[index][1] === '0x0000000000000000000000000000000000000000') {
        throw new Error("Supervisore non assegnato per questo step");
      }
      if (steps[index][1].toLowerCase() !== account.toLowerCase()) {
        throw new Error("Solo il supervisore assegnato può completare questo step");
      }
      const isReasonableLocation = true; 
      if (!isReasonableLocation) {
        throw new Error("La posizione non è ragionevole per questo step");
      }
      console.log("Completing step:", index, "with location:", location, "for process address:", processContractAddress);
      await actualContract.methods.completeStep(location).send({ from: account })
      .on('transactionHash', function(hash){
        console.log('Transaction Hash:', hash);
    })
    .on('receipt', function(receipt){
        console.log('Transaction Receipt:', receipt);
    })
    .on('confirmation', function(confirmationNumber, receipt){
        console.log('Transaction Confirmation:', confirmationNumber, receipt);
    })
    .on('error', console.error);
      console.log("Step completed successfully");
      await updateState();
      toast.success("Step completato con successo");
    } catch (error) {
      console.error("Error completing step:", error);
      toast.error(error.message);
    }
  };

  const failStep = async (index) => {
    try {
      if (steps[index][1] === '0x0000000000000000000000000000000000000000') {
        throw new Error("Supervisore non assegnato per questo step");
      }
      if (steps[index][1].toLowerCase() !== account.toLowerCase()) {
        throw new Error("Solo il supervisore assegnato può dichiarare fallito questo step");
      }
      console.log("Failing step:", index);
      await actualContract.methods.failStep().send({ from: account });
      console.log("Step failed successfully");
      await updateState();
      toast.success("Step dichiarato fallito con successo");
    } catch (error) {
      console.error("Error failing step:", error);
      toast.error(error.message);
    }
  };

  const handleCheckPasteurization = async (processContractAddress) => {
    const result = checkPasteurization(processContractAddress);
    if (result) {
      await actualContract.methods.isTemperatureOK(result).send({ from: account });
      await updateState();
    } else {
      toast.error("Il processo di pastorizzazione del lotto non è andato a buon fine");
    }
  };

  const handleCheckSterilization = async (processContractAddress) => {
    const result = checkSterilization(processContractAddress);
    if (result) {
      await actualContract.methods.isTemperatureOK(result).send({ from: account });
      await updateState();
    } else {
      toast.error("Il processo di sterilizzazione del lotto non è andato a buon fine");
    }
  };

  const handleCheckTravel = async (processContractAddress) => {
    console.log("Travel temperature: ", checkTravel(processContractAddress));
    console.log(currentLocation);

    const jsonBody = { loc: currentLocation };

    try {
        const response = await axios.post('http://127.0.0.1:5000/transportSimulate', jsonBody);
        console.log(response);

        // Esegui le chiamate ai metodi del contratto con await
        await actualContract.methods.isTemperatureOK(checkTravel(processContractAddress)).send({ from: account });
        await updateState();
    } catch (error) {
        console.error("Error during the process:", error);
    }
};


  const handleCheckStorage = async (processContractAddress) => {
    console.log("Storage temperature: ", checkStorage(processContractAddress));
    await actualContract.methods.isTemperatureOK(checkTravel(processContractAddress)).send({ from: account });
    await updateState();
  };

  const handleCheckShipping = async (processContractAddress) => {
    console.log("Shipping temperature: ", checkStorage(processContractAddress));
    await actualContract.methods.isTemperatureOK(checkShipping(processContractAddress)).send({ from: account });
    await updateState();
  };

  const handleSupervisorChange = (e, index) => {
    const newAddresses = [...supervisorAddresses];
    newAddresses[index] = e.target.value;
    setSupervisorAddresses(newAddresses);

    const newErrors = [...inputErrors];
    newErrors[index] = false; // Rimuove l'errore quando si richiede il focus
    setInputErrors(newErrors);

    // Rendi visibile il pulsante "Salva" quando l'utente scrive qualcosa
    setIsSaveButtonVisible(true);
  };

  useEffect(() => {
    console.log("Supervisori:", supervisorAddresses);
  }, [supervisorAddresses]);

  const handleSaveSupervisors = async (e) => {
    e.preventDefault();
    try {
      let allValid = true;
      const newErrors = [...inputErrors];

      for (let i = 0; i < supervisorAddresses.length; i++) {
        const supervisorAddress = supervisorAddresses[i].trim();
        if (supervisorAddress !== '' && !web3.utils.isAddress(supervisorAddress)) {
          newErrors[i] = true;
          allValid = false;
        } else {
          newErrors[i] = false;
        }
      }

      setInputErrors(newErrors);

      if (allValid) {
        for (let i = 0; i < supervisorAddresses.length; i++) {
          const supervisorAddress = supervisorAddresses[i].trim();
          if (supervisorAddress !== '') {
            const supervisorRole = await factoryContract.methods.getRole(supervisorAddress).call();
            if (supervisorRole.toString() !== '2') {
              newErrors[i] = true;
              allValid = false;
            }
          }
        }
        setInputErrors(newErrors);
        // Rimuovi gli elementi vuoti dall'array
        const supervisors = supervisorAddresses.filter(address => address.trim() !== '');
        console.log("Supervisori validi:", supervisors);
        await actualContract.methods.assignSupervisors(supervisors).send({ from: account });
      setIsSaveButtonVisible(false);
        await updateState();
        toast.success("Supervisori assegnati con successo");
      } else {
        throw new Error("Alcuni indirizzi non sono validi o non corrispondono a supervisori");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <label style={{ fontSize: '20px', display: 'flex', alignItems: 'center'}}>
        <b>Lotto {String(lotNumber)}</b>{' '}
        <Badge color={isIntero ? 'blue' : 'green'} style={{ marginLeft: '10px', fontSize: '10px'  }}>{isIntero ? 'Intero' : 'Lunga Conservazione'}</Badge>
      </label>
      <form onSubmit={handleSaveSupervisors}>
        <table>
          <thead>
            <tr>
              <th>Fase</th>
              <th>Supervisore</th>
              <th>Stato</th>
              <th>Posizione</th>
              {role === '2' && <th>Azioni</th>}
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr key={index}>
                <td>{step[0]}</td>
                <td>
                  {index === 1 || index === 5 || (index === 7 && Boolean(isIntero)) || (index === 8 && Boolean(isIntero)) ? (
                    "Sensore di temperatura"
                  ) : (
                    step[1] === '0x0000000000000000000000000000000000000000' ? (
                      <TextInput
                        error={inputErrors[index]} // Mostra l'errore se presente
                        radius="md"
                        variant="unstyled"
                        placeholder="Supervisor address"
                        value={supervisorAddresses[index] || ''}
                        onChange={(e) => handleSupervisorChange(e, index)}
                        onkeydown="return event.key != 'Enter';"
                        disabled={role !== '1'}
                      />
                    ) : (
                      step[1]
                    )
                  )}
                </td>
                <td>{step[2] ? 'Completed' : 'Pending'}</td>
                <td>
                  {index === 5 && currentStepIndex === 5 ? (
                    <div>
                      {Boolean(isIntero) ? (
                        <Button variant="dark" color="teal" size="xs" style={{color: 'white'}} radius="xl" onClick={() => handleCheckPasteurization(processContractAddress)}>Simula</Button>
                      ) : (
                        <Button variant="dark" color="green" size="xs" style={{color: 'white'}} radius="xl" onClick={() => handleCheckSterilization(processContractAddress)}>Simula</Button>
                      )}
                    </div>
                  ) : index === 1 && currentStepIndex === 1 ? (
                    <Button variant="dark" color="teal" size="xs" style={{color: 'white'}} radius="xl" onClick={() => handleCheckTravel(processContractAddress)}>Simula trasporto</Button>
                  ) : Boolean(isIntero) && index === 7 && currentStepIndex === 7 ? (
                    <Button variant="dark" color="teal" size="xs" style={{color: 'white'}} radius="xl" onClick={() => handleCheckStorage(processContractAddress)}>Simula Stoccaggio</Button>
                  ) : (index === 8 && Boolean(isIntero) && currentStepIndex == 8) ? (
                    <Button variant="dark" color="teal" size="xs" style={{color: 'white'}} radius="xl" onClick={() => handleCheckShipping(processContractAddress)}>Simula consegna</Button>
                  ) : (
                    index <= currentStepIndex && !step[2] ? (
                      <Select
                        searchable
                        data={Boolean(isIntero) ? locationOptionsIntero[index] : locationOptionsLC[index]}
                        onChange={(value) => handleLocationSelect(value, index)}
                        disabled={step[1] === '0x0000000000000000000000000000000000000000' || role !== '2' || steps[index][1].toLowerCase() !== account.toLowerCase()}
                      >
                      </Select>
                    ) : (
                      step[5]
                    )
                  )}
                </td>
                {role === '2' && (
                <td style={{ textAlign: 'center' }}>
                  {!step[2] && step[1] !== '0x0000000000000000000000000000000000000000' && index === currentStepIndex && steps[index][1].toLowerCase() === account.toLowerCase() && (
                    <Button variant="dark" color="red" size="xs" radius="xl" onClick={() => failStep(index)}>Dichiara Fallito</Button>    
                  )}
                </td>
              )}
              </tr>
            ))}
          </tbody>
        </table>
        {isSaveButtonVisible && (
          <Button 
            type="submit" 
            variant="dark" 
            color="blue" 
            size="md" 
            radius="xl" 
            style={{ width: '100%' }} 
          >
            Salva
          </Button>
        )}
      </form>
    </div>
  );
};

export default ActiveSteps;