import React, { useState } from 'react';
import { Table, TextInput, Button } from '@mantine/core';

const ActiveSteps = ({ web3, contract, account, steps, currentStepIndex, supervisorAddresses, setSupervisorAddresses, currentLotNumber, setCurrentLotNumber, updateState }) => {
    const [locationInputs, setLocationInputs] = useState(Array(steps.length).fill(''));
    const [supervisorErrors, setSupervisorErrors] = useState(Array(steps.length).fill(''));

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
                throw new Error("Invalid supervisor address");
            }
            await contract.methods.assignSupervisor(index, supervisorAddress).send({ from: account });
            await updateState(contract);
            const newSupervisorErrors = [...supervisorErrors];
            newSupervisorErrors[index] = '';
            setSupervisorErrors(newSupervisorErrors);
        } catch (error) {
            console.error("Error assigning supervisor:", error);
            const newSupervisorErrors = [...supervisorErrors];
            newSupervisorErrors[index] = error.message;
            setSupervisorErrors(newSupervisorErrors);
        }
    };

    const completeStep = async (index) => {
        try {
            if (steps[index][1] === '0x0000000000000000000000000000000000000000') {
                throw new Error("Supervisor not assigned for this step");
            }

            const location = locationInputs[index].trim();
            const isReasonableLocation = true; // Simulated location check

            if (!isReasonableLocation) {
                throw new Error("Location is not reasonable for this step");
            }

            await contract.methods.completeStep(location).send({ from: account });
            await updateState(contract);

            if (steps[currentStepIndex][0] === "Distribuzione") {
                const newLotNumber = currentLotNumber + 1;
                setCurrentLotNumber(newLotNumber);
            }
        } catch (error) {
            console.error("Error completing step:", error);
        }
    };

    const handleSupervisorChange = (e, index) => {
        const newAddresses = [...supervisorAddresses];
        newAddresses[index] = e.target.value;
        setSupervisorAddresses(newAddresses);
        const newSupervisorErrors = [...supervisorErrors];
        newSupervisorErrors[index] = '';
        setSupervisorErrors(newSupervisorErrors);
    };

    const handleLocationChange = (e, index) => {
        const newLocations = [...locationInputs];
        newLocations[index] = e.target.value;
        setLocationInputs(newLocations);
    };

    const inputStyles = {
        padding: '8px', // Add desired padding here
    };

    return (
        <div>
            <label>Current Lot Number: {currentLotNumber}</label>
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
                                        onKeyPress={(e) => handleKeyPress(e, index, 'supervisor')}
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
                                        onKeyPress={(e) => handleKeyPress(e, index, 'location')}
                                        disabled={step[1] === '0x0000000000000000000000000000000000000000'}
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
