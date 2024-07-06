import React, {useState, useEffect} from 'react';
import { Table, TextInput } from '@mantine/core';
import { toast } from 'react-toastify';
import {getContract} from "../MilkChain"

const ActiveSteps = ({ web3, factoryContract, processContract, account, steps, currentStepIndex, lotNumber, updateState, role }) => {
    const [locationInputs, setLocationInputs] = useState(Array(steps.length).fill(''));
    const [supervisorAddresses, setSupervisorAddresses] = useState(Array(steps.length).fill(''));
  
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
        const supervisorRole = await factoryContract.methods.getRole(supervisorAddress).call();
        if (supervisorRole.toString() !== '2') {
          throw new Error("L'indirizzo non ha un ruolo di Supervisore");
        }
        const cntr = await getContract(web3, 'MilkProcess', processContract)
        await cntr.methods.assignSupervisor(index, supervisorAddress).send({ from: account });
        await updateState();
        toast.success("Supervisore assegnato con successo");
      } catch (error) {
        toast.error(error.message);
      }
    };
  
    const completeStep = async (index) => {
      try {
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
  
        const cntr = await getContract(web3, 'MilkProcess', processContract)

        await cntr.methods.completeStep(location).send({ from: account });
        await updateState(cntr);
        toast.success("Step completato con successo");
      } catch (error) {
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
  
    const inputStyles = {
      padding: '8px',
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
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr key={index}>
                <td>{step[0]}</td>
                <td>
                  {step[1] === '0x0000000000000000000000000000000000000000' ? (
                    <TextInput
                      radius="md"
                      variant="unstyled"
                      placeholder="Supervisor Address"
                      value={supervisorAddresses[index] || ''}
                      onChange={(e) => handleSupervisorChange(e, index)}
                      onKeyDown={(e) => handleKeyPress(e, index, 'supervisor')}
                      disabled={role !== '1'} // Solo admin può assegnare il supervisore
                    />
                  ) : (
                    step[1]
                  )}
                </td>
                <td>{step[2] ? 'Completed' : 'Pending'}</td>
                <td>
                  {index <= currentStepIndex && !step[2] ? (
                    <TextInput
                      radius="md"
                      variant="unstyled"
                      placeholder="Location (e.g., address or coordinates)"
                      value={locationInputs[index] || ''}
                      onChange={(e) => handleLocationChange(e, index)}
                      onKeyDown={(e) => handleKeyPress(e, index, 'location')}
                      disabled={step[1] === '0x0000000000000000000000000000000000000000' || role !== '2'} // Solo supervisore può completare lo step
                      styles={{ input: inputStyles }}
                    />
                  ) : (
                    step[5]
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
