import React, { useEffect, useState } from 'react';
import { getWeb3, getContract } from './MilkChain';
import SearchByLotNumber from './components/SearchByLotNumber';
import CompletedSteps from './components/CompletedSteps';
import ActiveSteps from './components/ActiveSteps';
import SplashScreen from './components/SplashScreen';
import RoleAssignment from './components/RoleAssignment';
import { Title, Tabs, rem, Button, NumberInput, Group, Box } from '@mantine/core';
import { IconSearch, IconHistory, IconUser, IconList } from '@tabler/icons-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedProcesses, setCompletedProcesses] = useState([]);
  const [role, setRole] = useState(null);
  const [newProcessCount, setNewProcessCount] = useState(1);
  
  const iconStyle = { width: rem(16), height: rem(16), marginRight: rem(8) };
  const tabStyle = { padding: `${rem(6)} ${rem(18)}` };

  useEffect(() => {
    const init = async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const contract = await getContract(web3);
        setWeb3(web3);
        setAccount(accounts[0]);
        setContract(contract);
        const isAuthorized = await checkUserRole(contract, accounts[0]);
        if (!isAuthorized) {
          toast.error("Non sei autorizzato");
          return;
        }
        await updateState(contract);
        const userRole = await contract.methods.roles(accounts[0]).call();
        setRole(userRole.toString());
        setLoading(false);
      } catch (error) {
        toast.error("Errore durante l'inizializzazione di web3, accounts o contract: " + error.message);
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

  const checkUserRole = async (contract, account) => {
    const userRole = await contract.methods.roles(account).call();
    if (String(userRole) === '0') {
      return false;
    }
    return true;
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setLoading(true);
    } else {
      await initializeContractAndAccount(accounts[0]);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setLoading(true);
  };

  const initializeContractAndAccount = async (account) => {
    try {
      const web3 = await getWeb3();
      const contract = await getContract(web3);
      setWeb3(web3);
      setContract(contract);

      const isAuthorized = await checkUserRole(contract, account);
      if (!isAuthorized) {
        toast.error("Non sei autorizzato");
        return;
      }

      setAccount(account);
      await updateState(contract);
      const userRole = await contract.methods.roles(account).call();
      setRole(userRole.toString());
      setLoading(false);
    } catch (error) {
      toast.error("Errore durante l'inizializzazione del contract e dell'account: " + error.message);
    }
  };

  const updateState = async (contract) => {
    try {
      const lotNumber = await contract.methods.getCurrentLotNumber().call();
      const allProcesses = [];
      for (let i = 1; i <= lotNumber; i++) {
        const steps = await fetchSteps(contract, i);
        const currentStepIndex = await contract.methods.getCurrentStepIndex(i).call();
        const isCompleted = await contract.methods.isProcessCompleted(i).call();
        const process = { lotNumber: i, steps, currentStepIndex: parseInt(currentStepIndex), isCompleted };
        allProcesses.push(process);
      }
      setProcesses(allProcesses.filter(p => !p.isCompleted));
      setCompletedProcesses(allProcesses.filter(p => p.isCompleted));
    } catch (error) {
      toast.error("Errore durante l'aggiornamento dello stato: " + error.message);
    }
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
      toast.error("Errore durante il recupero dei passaggi: " + error.message);
      return [];
    }
  };

  const createNewProcesses = async () => {
    try {
      for (let i = 0; i < newProcessCount; i++) {
        await contract.methods.createNewProcess().send({ from: account });
      }
      await updateState(contract);
      const userRole = await contract.methods.roles(account).call();
      setRole(userRole.toString());
      toast.success(`Creati ${newProcessCount} nuovi processi`);
    } catch (error) {
      toast.error("Errore durante la creazione dei nuovi processi: " + error.message);
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div id='app-container'>
      <ToastContainer />
      <Title order={1} weight={700}>Milk Supply Chain</Title>
        <Tabs variant="pills" radius="lg" defaultValue="active">
          <Tabs.List style={{ gap: '10px' }}>
            <Tabs.Tab value="active" leftSection={<IconList style={iconStyle} />} style={{ ...tabStyle, marginRight: '10px' }}>
              <Title order={6}>Processi Attivi</Title>
            </Tabs.Tab>
            <Tabs.Tab value="search" leftSection={<IconSearch style={iconStyle} />} style={{ ...tabStyle, marginRight: '10px' }}>
              <Title order={6}>Ricerca</Title>
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory style={iconStyle} />} style={{ ...tabStyle, marginRight: '10px' }}>
              <Title order={6}>Storico</Title>
            </Tabs.Tab>
            {role === '1' && (
              <Tabs.Tab value="roles" leftSection={<IconUser style={iconStyle} />} style={tabStyle}>
                <Title order={6}>Assegna Ruoli</Title>
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="active">
            <div style={{ marginTop: '20px' }}>
              <h2>Active processes</h2>
              {role === '1' && (
                <Group align="flex-end">
                  <NumberInput
                    value={newProcessCount}
                    onChange={(value) => setNewProcessCount(value)}
                    radius="md"
                    min={1}
                    max={100}
                    style={{ maxWidth: '60px' }}
                  />
                  <Button radius="md" onClick={createNewProcesses} style={{ marginLeft: '10px' }}>Crea Nuovi Processi</Button>
                </Group>
              )}
            </div>
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
                role={role}
              />
            ))}
          </Tabs.Panel>

          <Tabs.Panel value="search">
            <h2>Search by Lot Number</h2>
            <SearchByLotNumber
              allSteps={processes.concat(completedProcesses).flatMap(p => p.steps)}
            />
          </Tabs.Panel>

          <Tabs.Panel value="history">
            <h2>Storico</h2>
            <CompletedSteps
              allSteps={processes.concat(completedProcesses).flatMap(p => p.steps)}
            />
          </Tabs.Panel>

          {role === '1' && (
            <Tabs.Panel value="roles">
              <h2>Roles management center</h2>
              <RoleAssignment contract={contract} account={account} />
            </Tabs.Panel>
          )}
        </Tabs>
    </div>
  );
};

export default App;
