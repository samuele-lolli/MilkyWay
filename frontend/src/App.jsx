import React, { useEffect, useState } from 'react';
import { getWeb3, getContract } from './MilkChain.js';
import SearchByLotNumber from './components/SearchByLotNumber';
import CompletedSteps from './components/CompletedSteps';
import ActiveSteps from './components/ActiveSteps';
import SplashScreen from './components/SplashScreen';
import RoleAssignment from './components/RoleAssignment';
import { Title, Tabs, rem, Button, NumberInput, Group } from '@mantine/core';
import { IconSearch, IconHistory, IconUser, IconList } from '@tabler/icons-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  const [processContracts, setProcessContracts] = useState([]);
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
        const factoryContract = await getContract(web3, 'MilkProcessFactory');
        setWeb3(web3);
        setAccount(accounts[0]);
        setFactoryContract(factoryContract);
        await updateState(factoryContract);
        checkIfAdmin(factoryContract, accounts[0]);
        checkIfSupervisor(factoryContract, accounts[0]); // Controllo del ruolo
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

  const checkIfSupervisor = async (factoryContract, account) => {
    const processAddresses = await factoryContract.methods.getAllProcesses().call();
    for (let address of processAddresses) {
      // const processContract = await getContract(web3, 'MilkProcess', address);
      // const userRole = await processContract.methods.roles(account).call();
      if (String(userRole) === '2') {
        setRole('supervisor');
        return true;
      }
    }
    return false;
  };

  const checkIfAdmin = async (factoryContract, account) => {
    const factoryAddress = await factoryContract.methods.owner().call();
    if (account === factoryAddress) {
      setRole('admin');
      return true;
    }
    return false;
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
    } else {
      await initializeContractAndAccount(accounts[0]);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
  };

  const initializeContractAndAccount = async (account) => {
    try {
      const web3 = await getWeb3();
      const factoryContract = await getContract(web3, 'MilkProcessFactory');
      setWeb3(web3);
      setFactoryContract(factoryContract);

      if (!await checkIfSupervisor(factoryContract, account) || checkIfAdmin(factoryContract, account)) {
        toast.error("Non sei autorizzato");
        return;
      }

      setAccount(account);
      await updateState(factoryContract);
    } catch (error) {
      toast.error("Errore durante l'inizializzazione del contract e dell'account: " + error.message);
    }
  };

  const updateState = async (factoryContract) => {
    try {
      const processAddresses = await factoryContract.methods.getAllProcesses().call();
      const allProcesses = [];
      for (let address of processAddresses) {
        const processContract = await getContract(web3, 'MilkProcess', address);
        const steps = await fetchSteps(processContract);
        const currentStepIndex = await processContract.methods.currentStepIndex().call();
        const isCompleted = await processContract.methods.isProcessCompleted().call();
        const lotNumber = await processContract.methods.lotNumber().call();
        const process = { address, lotNumber, steps, currentStepIndex: parseInt(currentStepIndex), isCompleted };
        allProcesses.push(process);
      }
      setProcessContracts(allProcesses.filter(p => !p.isCompleted));
      setCompletedProcesses(allProcesses.filter(p => p.isCompleted));
    } catch (error) {
      toast.error("Errore durante l'aggiornamento dello stato: " + error.message);
    }
  };

  const fetchSteps = async (contract) => {
    try {
      const steps = [];
      for (let i = 0; ; i++) {
        try {
          const step = await contract.methods.getStep(i).call();
          steps.push(step);
        } catch (e) {
          break;
        }
      }
      return steps;
    } catch (error) {
      toast.error("Errore durante il recupero dei passaggi: " + error.message);
      return [];
    }
  };

  const createNewProcesses = async () => {
    try {
      await factoryContract.methods.createNewProcess(newProcessCount).send({ from: account });
      await updateState(factoryContract);
      toast.success(`Creati ${newProcessCount} nuovi processi`);
    } catch (error) {
      toast.error("Errore durante la creazione dei nuovi processi: " + error.message);
    }
  };

  return (
    <div>
      {(role === 'admin' || role === 'supervisor') ? <>
        <div id='app-container'><ToastContainer />
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
              {role === 'admin' && (
                <Tabs.Tab value="roles" leftSection={<IconUser style={iconStyle} />} style={tabStyle}>
                  <Title order={6}>Assegna Ruoli</Title>
                </Tabs.Tab>
              )}
            </Tabs.List>

            <Tabs.Panel value="active">
              <div style={{ marginTop: '20px' }}>
                <h2>Active processes</h2>
                {role === 'admin' && (
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
              {processContracts.map((process) => (
                <ActiveSteps
                  key={process.address}
                  web3={web3}
                  contract={process.contract}
                  account={account}
                  steps={process.steps}
                  currentStepIndex={process.currentStepIndex}
                  lotNumber={process.lotNumber}
                  updateState={() => updateState(factoryContract)}
                  role={role}
                />
              ))}
            </Tabs.Panel>

            <Tabs.Panel value="search">
              <h2>Search by Lot Number</h2>
              <SearchByLotNumber
                allSteps={processContracts.concat(completedProcesses).flatMap(p => p.steps)}
              />
            </Tabs.Panel>

            <Tabs.Panel value="history">
              <h2>Storico</h2>
              <CompletedSteps
                allSteps={processContracts.concat(completedProcesses).flatMap(p => p.steps)}
              />
            </Tabs.Panel>

            {role === 'admin' && (
              <Tabs.Panel value="roles">
                <h2>Roles management center</h2>
                <RoleAssignment contract={factoryContract} account={account} />
              </Tabs.Panel>
            )}
          </Tabs>

        </div> </> : <SplashScreen />
      }
    </div>);
};

export default App;