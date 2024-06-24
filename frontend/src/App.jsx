import React, { useEffect, useState } from 'react';
import { getWeb3, getContract } from './MilkChain';

const App = () => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [steps, setSteps] = useState([]);
    const [supervisorAddresses, setSupervisorAddresses] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [locationInput, setLocationInput] = useState('');

    useEffect(() => {
        const init = async () => {
            try {
                const web3 = await getWeb3();
                const accounts = await web3.eth.getAccounts();
                const contract = await getContract(web3);
                setWeb3(web3);
                setAccount(accounts[0]);
                setContract(contract);
                await fetchSteps(contract);
                await fetchCompletedSteps(contract); // Carica i tracciamenti completati inizialmente
                const currentIndex = await contract.methods.currentStepIndex().call();
                setCurrentStepIndex(parseInt(currentIndex));
            } catch (error) {
                console.error("Error initializing web3, accounts, or contract:", error);
            }
        };
        init();
    }, []);

    const fetchSteps = async (contract) => {
        try {
            const stepsLength = await contract.methods.getStepsLength().call();
            const steps = [];
            for (let i = 0; i < stepsLength; i++) {
                const step = await contract.methods.getStep(i).call();
                steps.push(step);
            }
            setSteps(steps);
            setSupervisorAddresses(Array(stepsLength).fill(''));
        } catch (error) {
            console.error("Error fetching steps:", error);
        }
    };

    const fetchCompletedSteps = async (contract) => {
        try {
            const completedStepsLength = await contract.methods.getCompletedStepsLength().call();
            const completedSteps = [];
            for (let i = 0; i < completedStepsLength; i++) {
                const step = await contract.methods.getCompletedStep(i).call();
                completedSteps.push(step);
            }
            setCompletedSteps(completedSteps);
        } catch (error) {
            console.error("Error fetching completed steps:", error);
        }
    };

    const assignSupervisor = async (index) => {
        try {
            const supervisorAddress = supervisorAddresses[index].trim();
            if (!web3.utils.isAddress(supervisorAddress)) {
                throw new Error("Invalid supervisor address");
            }
            await contract.methods.assignSupervisor(index, supervisorAddress).send({ from: account });
            await fetchSteps(contract);
        } catch (error) {
            console.error("Error assigning supervisor:", error);
        }
    };

    const completeStep = async () => {
        try {
            // Simuliamo la verifica dell'indirizzo con una funzione esterna
            const isReasonableLocation = true; // Simulazione della verifica dell'indirizzo

            if (!isReasonableLocation) {
                throw new Error("Location is not reasonable for this step");
            }

            await contract.methods.completeStep(locationInput).send({ from: account });
            await fetchSteps(contract);
            await fetchCompletedSteps(contract); // Aggiorna i tracciamenti completati
            const currentIndex = await contract.methods.currentStepIndex().call();
            setCurrentStepIndex(parseInt(currentIndex));
        } catch (error) {
            console.error("Error completing step:", error);
        }
    };

    const resetProcess = async () => {
        try {
            await contract.methods.resetProcess().send({ from: account });
            await fetchSteps(contract);
            setCurrentStepIndex(0);
            // Non aggiornare i tracciamenti completati qui, lasciali come sono
        } catch (error) {
            console.error("Error resetting process:", error);
        }
    };

    return (
        <div>
            <h1>Milk Supply Chain</h1>
            <table>
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Supervisor</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {steps.map((step, index) => (
                        <tr key={index}>
                            <td>{step[0]}</td>
                            <td>{step[1] === '0x0000000000000000000000000000000000000000' ? 'Not Assigned' : step[1]}</td>
                            <td>{step[2] ? 'Completed' : 'Pending'}</td>
                            <td>
                                {!step[2] && index === currentStepIndex && (
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
                                            step[1] === account && (
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
                    ))}
                </tbody>
            </table>
            {currentStepIndex >= steps.length && (
                <button onClick={resetProcess}>Reset Process</button>
            )}

            {/* Sezione per tracciamenti passati */}
            <h2>Completed Steps</h2>
            <table>
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Supervisor</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody>
                    {completedSteps.map((step, index) => (
                        <tr key={index}>
                            <td>{step[0]}</td>
                            <td>{step[1]}</td>
                            <td>{step[3] !== '0' ? new Date(parseInt(step[3]) * 1000).toLocaleString() : '-'}</td>
                            <td>{step[4] !== '0' ? new Date(parseInt(step[4]) * 1000).toLocaleString() : '-'}</td>
                            <td>{step[5]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default App;
