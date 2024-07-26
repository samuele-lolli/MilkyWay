import React, { useState, useEffect } from 'react';
import axios from "axios";
import { TextInput, Button, Select, Badge } from '@mantine/core';
import { toast } from 'react-toastify';
import { getContract } from "../web3";
import { checkPasteurization } from '../simulation/pasteurizerSim';
import { checkSterilization } from '../simulation/sterilizerSim';
import { checkTravel } from '../simulation/transportSim';
import { checkStorage } from '../simulation/storageSim';
import { checkShipping } from '../simulation/shippingSim';
import { locationOptionsIntero, locationOptionsLC } from '../data/options';

const ActiveSteps = ({ setLoading, web3, factoryContract, processContractAddress, account, steps, currentStepIndex, lotNumber, isIntero, updateState, role, isFailed }) => {
  // State for managing form inputs, assigned supervisors and locations, errors
  const [locationInputs, setLocationInputs] = useState(Array(steps.length).fill(''));
  const [supervisorAddresses, setSupervisorAddresses] = useState(Array(steps.length).fill(''));
  const [actualContract, setActualContract] = useState(null);
  const [inputErrors, setInputErrors] = useState(Array(steps.length).fill(false));
  const [isSaveButtonVisible, setIsSaveButtonVisible] = useState(false);

  // Fetch the contract instance when the component mounts or the dependencies change
  useEffect(() => {
    const getActualContract = async () => {
      const cntr = await getContract(web3, 'MilkProcess', processContractAddress);
      setActualContract(cntr);
    };
    getActualContract();
  }, [web3, processContractAddress]);

  // Prevent form submission on Enter key press
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  // Handle location selection and simulation for step 9
  const handleLocationSelect = async (value, index) => {
    if (index === 9) {
      const jsonBody = { loc: value };
      try {
        setLoading(true);
        const response = await axios.post('http://127.0.0.1:5000/transportSimulate', jsonBody);
        const data = Boolean(response.data);
        await actualContract.methods.isLocationReasonable(data, value).send({ from: account });
        await updateState();
        if (!data) {
          toast.error("La location del truck non è stata validata!");
        }
      } catch (error) {
        toast.error("Errore nel completare lo step con la posizione selezionata");
      }
      setLoading(false);
    } else {
      try {
        const newLocationInputs = [...locationInputs];
        newLocationInputs[index] = value;
        setLocationInputs(newLocationInputs);
        await completeStep(index, value);
      } catch (error) {
        toast.error("Errore nel completare lo step con la posizione selezionata");
      }
    }
  };

  // Complete the specified step with the given location
  const completeStep = async (index, location) => {
    try {
      if (isFailed) {
        throw new Error("Il processo è fallito e non può essere completato");
      }
      if (steps[index][1] === '0x0000000000000000000000000000000000000000') {
        throw new Error("Supervisore non assegnato per questo step");
      }
      if (steps[index][1].toLowerCase() !== account.toLowerCase()) {
        throw new Error("Solo il supervisore assegnato può completare questo step");
      }
      await actualContract.methods.completeStep(location).send({ from: account });
      await updateState();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Mark the specified step as failed
  const failStep = async (index) => {
    try {
      if (steps[index][1] === '0x0000000000000000000000000000000000000000') {
        throw new Error("Supervisore non assegnato per questo step");
      }
      if (steps[index][1].toLowerCase() !== account.toLowerCase()) {
        throw new Error("Solo il supervisore assegnato può dichiarare fallito questo step");
      }
      await actualContract.methods.failStep().send({ from: account });
      await updateState();
      toast.success("Step dichiarato fallito con successo");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handlers for various process checks
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
    const travelTemp = checkTravel(processContractAddress);
    const steps = await actualContract.methods.getSteps().call();

    const location = steps[0].location;
    const jsonBody = { loc: location };

    if (travelTemp) {
      try {
        setLoading(true);
        const response = await axios.post('http://127.0.0.1:5000/transportSimulate', jsonBody);
        const data = Boolean(response.data);
        await actualContract.methods.isLocationReasonable(data, location).send({ from: account });
        await updateState();
        setLoading(false);
        if (!data) {
          toast.error("La location del truck non è stata validata!");
        }
      } catch (error) {
        console.error("Error during the process:", error);
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("The truck failed to mantain temperature");
      await actualContract.methods.isTemperatureOK(travelTemp).send({ from: account });
      await updateState();
    }
  };

  const handleCheckStorage = async (processContractAddress) => {
    const travelResult = checkStorage(processContractAddress)
    console.log("Storage temperature: ", travelResult);
    await actualContract.methods.isTemperatureOK(travelResult).send({ from: account });
    if(!travelResult){
      toast.error("The refrigerator failed to mantain temperature");
    }
    await updateState();
  };

  const handleCheckShipping = async (processContractAddress) => {
    const shippingResult = checkShipping(processContractAddress)
    console.log("Shipping temperature: ", shippingResult);
    await actualContract.methods.isTemperatureOK(shippingResult).send({ from: account });
    if(!shippingResult){
      toast.error("The truck failed to mantain temperature");
    }
    await updateState();
  };

  // Update supervisor addresses
  const handleSupervisorChange = (e, index) => {
    const newAddresses = [...supervisorAddresses];
    newAddresses[index] = e.target.value;
    setSupervisorAddresses(newAddresses);
    const newErrors = [...inputErrors];
    newErrors[index] = false;
    setInputErrors(newErrors);
    setIsSaveButtonVisible(true);
  };

  // Save the supervisor addresses to the contract
  const handleSaveSupervisors = async (e) => {
    e.preventDefault();
    try {
      const newErrors = Array(supervisorAddresses.length).fill(false);
      let allValid = true;

      for (let i = 0; i < supervisorAddresses.length; i++) {
        const address = supervisorAddresses[i].trim();
        const isOptionalStep = i === 1 || i === 5 || (i === 7 && isIntero) || (i === 8 && isIntero);

        if (!isOptionalStep) {
          if (!address) {
            newErrors[i] = true;
            allValid = false;
          } else if (!web3.utils.isAddress(address)) {
            newErrors[i] = true;
            allValid = false;
          } else {
            const addressRole = await factoryContract.methods.getRole(address).call();
            if (addressRole.toString() !== '2') {
              newErrors[i] = true;
              allValid = false;
            }
          }
        }
      }
      setInputErrors(newErrors);

      if (allValid) {
        const validSupervisors = supervisorAddresses.filter(address => address.trim() !== '');
        await actualContract.methods.assignSupervisors(validSupervisors).send({ from: account });
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
     // Render active processes with visualization filter for role and several operations
    <div style={{ marginTop: '20px', maxWidth: '80%' }}>
      <label style={{ fontSize: '20px', display: 'flex', alignItems: 'center' }}>
        <b>Lotto {String(lotNumber)}</b>{' '}
        <Badge color={isIntero ? 'blue' : 'green'} style={{ marginLeft: '10px', fontSize: '10px' }}>{isIntero ? 'Intero' : 'Lunga Conservazione'}</Badge>
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
                        error={inputErrors[index]}
                        radius="md"
                        variant="unstyled"
                        placeholder="Supervisor address"
                        value={supervisorAddresses[index] || ''}
                        onChange={(e) => handleSupervisorChange(e, index)}
                        onKeyDown={handleKeyDown}
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
                        <Button variant="dark" color="teal" size="xs" style={{ color: 'white' }} radius="xl" onClick={() => handleCheckPasteurization(processContractAddress)}>Simula</Button>
                      ) : (
                        <Button variant="dark" color="green" size="xs" style={{ color: 'white' }} radius="xl" onClick={() => handleCheckSterilization(processContractAddress)}>Simula</Button>
                      )}
                    </div>
                  ) : index === 1 && currentStepIndex === 1 ? (
                    <Button variant="dark" color="teal" size="xs" style={{ color: 'white' }} radius="xl" onClick={() => handleCheckTravel(processContractAddress)}>Simula trasporto</Button>
                  ) : Boolean(isIntero) && index === 7 && currentStepIndex === 7 ? (
                    <Button variant="dark" color="teal" size="xs" style={{ color: 'white' }} radius="xl" onClick={() => handleCheckStorage(processContractAddress)}>Simula Stoccaggio</Button>
                  ) : (index === 8 && Boolean(isIntero) && currentStepIndex === 8) ? (
                    <div>
                      <Button variant="dark" color="teal" size="xs" style={{ color: 'white' }} radius="xl" onClick={() => handleCheckShipping(processContractAddress)}>Simula consegna</Button>
                    </div>
                  ) : (
                    index <= currentStepIndex && !step[2] ? (
                      <Select
                        searchable
                        data={Boolean(isIntero) ? locationOptionsIntero[index] : locationOptionsLC[index]}
                        onChange={(value) => handleLocationSelect(value, index)}
                        disabled={step[1] === '0x0000000000000000000000000000000000000000' || role !== '2' || steps[index][1].toLowerCase() !== account.toLowerCase()}
                      />
                    ) : (
                      step[5]
                    )
                  )}
                </td>
                {role === '2' && (
                  <td style={{ textAlign: 'center' }}>
                    {!step[2] && step[1] !== '0x0000000000000000000000000000000000000000' && index === currentStepIndex && steps[index][1].toLowerCase() === account.toLowerCase() && (
                      <div>
                        <Button variant="dark" color="red" size="xs" radius="xl" onClick={() => failStep(index)}>Dichiara Fallito</Button>
                      </div>
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