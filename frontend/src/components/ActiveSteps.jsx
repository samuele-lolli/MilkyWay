import React, { useState, useEffect, useCallback } from 'react';
import { Table, TextInput, Button, CheckIcon } from '@mantine/core';
import { toast } from 'react-toastify';
import { IconCheck, IconX } from '@tabler/icons-react';
import { getContract } from "../web3"

const ActiveSteps = ({ web3, factoryContract, processContractAddress, account, steps, currentStepIndex, lotNumber, updateState, role, isFailed }) => {
  const [locationInputs, setLocationInputs] = useState(Array(steps.length).fill(''));
  const [supervisorAddresses, setSupervisorAddresses] = useState(Array(steps.length).fill(''));
  const [actualContract, setActualContract] = useState(null);

  useEffect(() => {
    const getActualContract = async () => {
      console.log("Fetching contract for process address:", processContractAddress);
      const cntr = await getContract(web3, 'MilkProcess', processContractAddress);
      setActualContract(cntr);
      console.log("Contract fetched:", cntr);
    }
    getActualContract();
  }, [web3, processContractAddress]);

  const handleKeyPress = async (e, index, type) => {
    if (e.key === 'Enter') {
      if (type === 'supervisor') {
        await assignSupervisor(index);
      } else if (type === 'location') {
        await completeStep(index);
      }
    }
  };

  const assignSupervisor = async (index) => {
    try {
      const supervisorAddress = supervisorAddresses[index].trim();
      if (!web3.utils.isAddress(supervisorAddress)) {
        throw new Error("Indirizzo del supervisore non valido");
      }
      console.log("Fetching role for supervisor address:", supervisorAddress);
      const supervisorRole = await factoryContract.methods.getRole(supervisorAddress).call();
      console.log("Supervisor role fetched:", supervisorRole);
      if (supervisorRole.toString() !== '2') {
        throw new Error("L'indirizzo non ha un ruolo di Supervisore");
      }
      console.log("Assigning supervisor:", supervisorAddress, "to step:", index);
      await actualContract.methods.assignSupervisor(index, supervisorAddress).send({ from: account });
      console.log("Supervisor assigned successfully");
      await updateState();
      toast.success("Supervisore assegnato con successo");
    } catch (error) {
      console.error("Error assigning supervisor:", error);
      toast.error(error.message);
    }
  };

  const completeStep = async (index) => {
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
      const location = locationInputs[index].trim();
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

  const handleSupervisorChange = (e, index) => {
    const newAddresses = [...supervisorAddresses];
    newAddresses[index] = e.target.value;
    setSupervisorAddresses(newAddresses);
  };

  const handleLocationChange = (e, index) => {
    const newLocations = [...locationInputs];
    newLocations[index] = e.target.value;
    setLocationInputs(newLocations);
  };

  const handleTemperatureCheck = async (index, isValid) => {
    try {
      console.log(`Setting temperature check for step ${index} to ${isValid}`);
      await actualContract.methods.isTemperatureOK(isValid).send({ from: account });
      console.log("Temperature check set successfully");
      await updateState();
      toast.success(`Controllo temperatura ${isValid ? 'superato' : 'fallito'} con successo`);
    } catch (error) {
      console.error("Error setting temperature check:", error);
      toast.error(error.message);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <label>Current Lot Number: {String(lotNumber)}</label>
      <Table>
        <thead>
          <tr>
            <th>Step</th>
            <th>Supervisor</th>
            <th>Status</th>
            <th>Location</th>
            {role === '2' && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {steps.map((step, index) => (
            <tr key={index}>
              <td>{step[0]}</td>
              <td>
                {index === 1 ? (
                  "Sensor for temperature"
                ) : (
                  step[1] === '0x0000000000000000000000000000000000000000' ? (
                    <TextInput
                      radius="md"
                      variant="unstyled"
                      placeholder="Supervisor Address"
                      value={supervisorAddresses[index] || ''}
                      onChange={(e) => handleSupervisorChange(e, index)}
                      onKeyDown={(e) => handleKeyPress(e, index, 'supervisor')}
                      disabled={role !== '1'}
                    />
                  ) : (
                    step[1]
                  )
                )}
              </td>
              <td>{step[2] ? 'Completed' : 'Pending'}</td>
              <td>
                {index === 1 && currentStepIndex === 1 ? (
                  <div>
                    <Button variant="light" color="green" size="xs" radius="xl" onClick={() => handleTemperatureCheck(index, true)}><IconCheck style={{color: 'green'}}/></Button>
                    <Button variant="light" color="red" size="xs" radius="xl" onClick={() => handleTemperatureCheck(index, false)}><IconX style={{color: 'red'}}/></Button>
                  </div>
                ) : (
                  index <= currentStepIndex && !step[2] ? (
                    <TextInput
                      radius="md"
                      variant="unstyled"
                      placeholder="Location (e.g., address or coordinates)"
                      value={locationInputs[index] || ''}
                      onChange={(e) => handleLocationChange(e, index)}
                      onKeyDown={(e) => handleKeyPress(e, index, 'location')}
                      disabled={step[1] === '0x0000000000000000000000000000000000000000' || role !== '2' || steps[index][1].toLowerCase() !== account.toLowerCase()}
                      styles={{ padding: '8px' }}
                    />
                  ) : (
                    step[5]
                  )
                )}
              </td>
              <td style={{ textAlign: 'center' }}>
                {role === '2' && !step[2] && step[1] !== '0x0000000000000000000000000000000000000000' && index === currentStepIndex && steps[index][1].toLowerCase() === account.toLowerCase() && (
                  <Button variant="light" color="red" size="xs" radius="xl" onClick={() => failStep(index)}>Dichiara Fallito</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ActiveSteps;