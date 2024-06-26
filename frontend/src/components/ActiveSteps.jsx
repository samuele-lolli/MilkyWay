import React, { useState } from 'react';

const ActiveSteps = ({ web3, contract, account, steps, currentStepIndex, supervisorAddresses, setSupervisorAddresses, currentLotNumber, setCurrentLotNumber, updateState }) => {

    const [locationInput, setLocationInput] = useState('');

    const assignSupervisor = async (index) => {
        try {
            const supervisorAddress = supervisorAddresses[index].trim();
            if (!web3.utils.isAddress(supervisorAddress)) {
                throw new Error("Invalid supervisor address");
            }
            await contract.methods.assignSupervisor(index, supervisorAddress).send({ from: account });
            await updateState(contract);
        } catch (error) {
            console.error("Error assigning supervisor:", error);
        }
    };

    const completeStep = async () => {
        try {
            const isReasonableLocation = true; // Simulated location check

            if (!isReasonableLocation) {
                throw new Error("Location is not reasonable for this step");
            }

            await contract.methods.completeStep(locationInput).send({ from: account });
            await updateState(contract);

            // Increment lot number if the current step is "Distribuzione"
            if (steps[currentStepIndex][0] === "Distribuzione") {
                const newLotNumber = currentLotNumber + 1;
                setCurrentLotNumber(newLotNumber);
            }

        } catch (error) {
            console.error("Error completing step:", error);
        }
    };

    return (
        <div>
            <h1>Milk Supply Chain</h1>
            <label>Current Lot Number: {currentLotNumber}</label>
            <table>
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Supervisor</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {steps.map((step, index) => {
                        return (
                            <tr key={index}>
                                <td>{step[0]}</td>
                                <td>{step[1] === '0x0000000000000000000000000000000000000000' ? 'Not Assigned' : step[1]}</td>
                                <td>{step[2] ? 'Completed' : 'Pending'}</td>
                                <td>{step[5]}</td> {/* Display location */}
                                <td>
                                    {index <= currentStepIndex && (
                                        <>
                                            {step[1] === '0x0000000000000000000000000000000000000000' ? (
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Supervisor Address"
                                                        value={supervisorAddresses[index]}
                                                        onChange={(e) => {
                                                            const newAddresses = [...supervisorAddresses];
                                                            newAddresses[index] = e.target.value;
                                                            setSupervisorAddresses(newAddresses);
                                                        }}
                                                    />
                                                    <button onClick={() => assignSupervisor(index)}>Assign Supervisor</button>
                                                </div>
                                            ) : (
                                                step[1] === account && !step[2] && (
                                                    <>
                                                        <input
                                                            type="text"
                                                            placeholder="Location (e.g., address or coordinates)"
                                                            value={locationInput}
                                                            onChange={(e) => setLocationInput(e.target.value)}
                                                        />
                                                        <button onClick={completeStep}>Complete Step</button>
                                                    </>
                                                )
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ActiveSteps;