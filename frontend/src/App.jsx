import React, { useEffect, useState } from 'react';
import { getWeb3, getContract } from './MilkChain';
import SearchByLotNumber from './components/SearchByLotNumber';
import CompletedSteps from './components/CompletedSteps';
import ActiveSteps from './components/ActiveSteps';
import SplashScreen from './components/SplashScreen';
import { Title, Tabs, rem, Button } from '@mantine/core';
import { IconSearch, IconHistory } from '@tabler/icons-react';

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLotNumber, setSearchLotNumber] = useState('');
  const [filteredSteps, setFilteredSteps] = useState([]);
  const [completedProcesses, setCompletedProcesses] = useState([]);
  const iconStyle = { width: rem(16), height: rem(16), marginRight: rem(8) };
  const tabStyle = { padding: `${rem(12)} ${rem(18)}` };

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
        setLoading(false);
      } catch (error) {
        console.error("Error initializing web3, accounts, or contract:", error);
      }
    };

    init();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setLoading(true);
    } else {
      setAccount(accounts[0]);
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setLoading(true);
  };

  const updateState = async (contract) => {
    const lotNumber = await contract.methods.getCurrentLotNumber().call();
    const activeProcesses = [];
    const completedProcesses = [];
    for (let i = 1; i <= lotNumber; i++) {
      const steps = await fetchSteps(contract, i);
      const currentStepIndex = await contract.methods.getCurrentStepIndex(i).call();
      const isCompleted = await contract.methods.isProcessCompleted(i).call();
      const process = { lotNumber: i, steps, currentStepIndex: parseInt(currentStepIndex) };
      if (isCompleted) {
        completedProcesses.push(process);
      } else {
        activeProcesses.push(process);
      }
    }
    setProcesses(activeProcesses);
    setCompletedProcesses(completedProcesses);
  };

  const fetchSteps = async (contract, lotNumber) => {
    try {
      const stepsLength = await contract.methods.getStepsLength(lotNumber).call();
      const steps = [];
      for (let i = 0; i < stepsLength; i++) {
        const step = await contract.methods.getStep(lotNumber, i).call();
        steps.push(step);
      }
      return steps;
    } catch (error) {
      console.error("Error fetching steps:", error);
      return [];
    }
  };

  const createNewProcess = async () => {
    try {
      await contract.methods.createNewProcess().send({ from: account });
      await updateState(contract);
    } catch (error) {
      console.error("Error creating new process:", error);
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div id='app-container'>
      <Title order={1} weight={700}>Milk Supply Chain</Title>
      <Button onClick={createNewProcess}>Crea Nuovo Processo</Button>
      {processes.map((process) => (
        <ActiveSteps
          key={process.lotNumber}
          web3={web3}
          contract={contract}
          account={account}
          steps={process.steps}
          currentStepIndex={process.currentStepIndex}
          lotNumber={process.lotNumber}
          updateState={updateState}
        />
      ))}

      <Tabs variant="pills" radius="md" defaultValue="search">
        <Tabs.List>
          <Tabs.Tab value="search" leftSection={<IconSearch style={iconStyle} />} style={tabStyle}>
            <Title order={6}>Ricerca</Title>
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory style={iconStyle} />} style={tabStyle}>
            <Title order={6}>Storico</Title>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="search">
          <SearchByLotNumber
            searchLotNumber={searchLotNumber}
            setSearchLotNumber={setSearchLotNumber}
            filteredSteps={filteredSteps}
            setFilteredSteps={setFilteredSteps}
            completedSteps={completedProcesses.flatMap(p => p.steps.filter(s => s[2]))}
          />
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <CompletedSteps
            completedSteps={completedProcesses.flatMap(p => p.steps.filter(s => s[2]))}
          />
        </Tabs.Panel>
        
      </Tabs>
    </div>
  );
};

export default App;