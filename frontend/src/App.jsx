import React, { useEffect, useState } from 'react';
import { getWeb3, getContract } from './MilkChain';
import SearchByLotNumber from './components/SearchByLotNumber';
import CompletedSteps from './components/CompletedSteps';
import ActiveSteps from './components/ActiveSteps';
import SplashScreen from './components/SplashScreen';
import RoleAssignment from './components/RoleAssignment';
import { Title, Tabs, rem, Button } from '@mantine/core';
import { IconSearch, IconHistory, IconUser } from '@tabler/icons-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLotNumber, setSearchLotNumber] = useState('');
  const [filteredSteps, setFilteredSteps] = useState([]);
  const [completedProcesses, setCompletedProcesses] = useState([]);
  const [role, setRole] = useState(null);
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
        console.log("UEUE")
        const isAuthorized = await checkUserRole(contract, accounts[0]);
        if (!isAuthorized) {
          alert("Accesso non autorizzato. Solo utenti con ruoli definiti possono accedere.");
          return;
        }

        await updateState(contract);
        const userRole = await contract.methods.roles(accounts[0]).call();
        setRole(userRole.toString());
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

  const checkUserRole = async (contract, account) => {
    const userRole = await contract.methods.roles(account).call();
    console.log(userRole)
    return String(userRole) !== '0'; // Assumendo che '0' sia il ruolo per utenti non autorizzati
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
        alert("Accesso non autorizzato. Solo utenti con ruoli definiti possono accedere.");
        return;
      }

      setAccount(account);
      await updateState(contract);
      const userRole = await contract.methods.roles(account).call();
      setRole(userRole.toString());
      setLoading(false);
    } catch (error) {
      console.error("Error initializing contract and account:", error);
    }
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
      const userRole = await contract.methods.roles(account).call();
      setRole(userRole.toString());
    } catch (error) {
      console.error("Error creating new process:", error);
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div id='app-container'>
       <ToastContainer />
      <Title order={1} weight={700}>Milk Supply Chain</Title>
      {role === '1' && ( // Mostra il pulsante solo se l'utente è un admin
        <Button onClick={createNewProcess}>Crea Nuovo Processo</Button>
      )}
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
          {role === '1' && ( // Mostra la tab solo se l'utente è un admin
            <Tabs.Tab value="roles" leftSection={<IconUser style={iconStyle} />} style={tabStyle}>
              <Title order={6}>Assegna Ruoli</Title>
            </Tabs.Tab>
          )}
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

        {role === '1' && ( // Mostra il pannello solo se l'utente è un admin
          <Tabs.Panel value="roles">
            <RoleAssignment contract={contract} account={account} />
          </Tabs.Panel>
        )}
      </Tabs>
    </div>
  );
};

export default App;