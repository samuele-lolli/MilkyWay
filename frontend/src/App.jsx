import React, { useEffect, useState } from 'react';
import { getWeb3, getContract } from './MilkChain';
import SearchByLotNumber from './components/SearchByLotNumber';
import CompletedSteps from './components/CompletedSteps';
import ActiveSteps from './components/ActiveSteps';
import SplashScreen from './components/SplashScreen';
import { Title, Tabs, rem } from '@mantine/core';
import { IconSearch, IconHistory } from '@tabler/icons-react';

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
  const [loading, setLoading] = useState(true);

  const iconStyle = { width: rem(16), height: rem(16), marginRight: rem(8) };
  const tabStyle = { padding: `${rem(12)} ${rem(18)}` }; // Personalizza il padding qui

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

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div id='app-container'>
      <Title order={1} weight={700}>Milk Supply Chain</Title>
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
            completedSteps={completedSteps}
          />
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <CompletedSteps
            completedSteps={completedSteps}
          />
        </Tabs.Panel>
        
      </Tabs>
    </div>
  );
};

export default App;
