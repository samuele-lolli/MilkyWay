import React, { useEffect, useState } from 'react';
import { getWeb3, getContract } from './MilkChain';
import SearchByLotNumber from './components/SearchByLotNumber';
import CompletedSteps from './components/CompletedSteps';
import ActiveSteps from './components/ActiveSteps';

const App = () => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [steps, setSteps] = useState([]);
    const [supervisorAddresses, setSupervisorAddresses] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [currentLotNumber, setCurrentLotNumber] = useState(1);
    const [searchLotNumber, setSearchLotNumber] = useState('');
    const [filteredSteps, setFilteredSteps] = useState([]);

    useEffect(() => {
        const init = async () => {
            try {
                const web3 = await getWeb3();
                const accounts = await web3.eth.getAccounts();
                const contract = await getContract(web3);
                setWeb3(web3);
                setAccount(accounts[0]);
                setContract(contract);
                await updateState(contract);
            } catch (error) {
                console.error("Error initializing web3, accounts, or contract:", error);
            }
        };
        init();
    }, []);

    const updateState = async (contract) => {
        await fetchSteps(contract);
        await fetchCompletedSteps(contract);
        const currentIndex = await contract.methods.getCurrentStepIndex().call();
        setCurrentStepIndex(parseInt(currentIndex));
        const lotNumber = await contract.methods.getCurrentLotNumber().call();
        setCurrentLotNumber(Number(lotNumber));
    };

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

    return (
        <div>
            <h1>Milk Supply Chain</h1>
            <ActiveSteps
                web3={web3}
                contract={contract}
                account={account}
                steps={steps}
                currentStepIndex={currentStepIndex}
                supervisorAddresses={supervisorAddresses}
                setSupervisorAddresses={setSupervisorAddresses}
                currentLotNumber={currentLotNumber}
                setCurrentLotNumber={setCurrentLotNumber}
                updateState={updateState}
            />

            <CompletedSteps
                completedSteps={completedSteps}
            />

            <SearchByLotNumber
                searchLotNumber={searchLotNumber}
                setSearchLotNumber={setSearchLotNumber}
                filteredSteps={filteredSteps}
                setFilteredSteps={setFilteredSteps}
                completedSteps={completedSteps}
            />
        </div>
    );
};

export default App;
