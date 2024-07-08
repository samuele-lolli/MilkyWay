import React, { useEffect, useState, useCallback } from 'react';
import { getWeb3, getContract } from './web3.js';
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
        const web3Instance = await getWeb3();
        const accounts = await web3Instance.eth.getAccounts();
        const factoryContractInstance = await getContract(web3Instance, 'MilkProcessFactory');
        const accountRole = await factoryContractInstance.methods.getRole(accounts[0]).call();
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setFactoryContract(factoryContractInstance);
        if (String(accountRole) !== '0') {
          setRole(String(accountRole));
        }
      } catch (error) {
        toast.error("Errore durante l'inizializzazione di web3, accounts o contract: " + error.message);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (web3 && factoryContract) {
      updateState(factoryContract);
    }
  }, [web3, factoryContract]);

  const updateState = useCallback(async () => {
    try {
      if (!web3) {
        throw new Error("web3 non è stato inizializzato");
      }
      const processAddresses = await factoryContract.methods.getAllProcesses().call();
      const allProcesses = await Promise.all(processAddresses.map(async (address) => {
        const processContract = await getContract(web3, 'MilkProcess', address);
        const [steps, currentStepIndex, isCompleted, isFailed, lotNumber] = await Promise.all([
          processContract.methods.getSteps().call(),
          processContract.methods.currentStepIndex().call(),
          processContract.methods.isProcessCompleted().call(),
          processContract.methods.isFailed().call(),
          processContract.methods.lotNumber().call(),
        ]);
        return { address, lotNumber, steps, currentStepIndex: parseInt(currentStepIndex), isCompleted, isFailed };
      }));

      setProcessContracts(allProcesses.filter(p => !p.isCompleted && !p.isFailed));
      setCompletedProcesses(allProcesses.filter(p => p.isCompleted || p.isFailed));
    } catch (error) {
      toast.error("Errore durante l'aggiornamento dello stato: " + error.message);
    }
  }, [web3, factoryContract]);

  const createNewProcesses = async () => {
    try {
      await factoryContract.methods.createNewProcess(newProcessCount).send({ from: account });
      await updateState();
      toast.success(`Creati ${newProcessCount} nuovi processi`);
    } catch (error) {
      toast.error("Errore durante la creazione dei nuovi processi: " + error.message);
    }
  };

  return (
    <div>
      {(role === '1' || role === '2' || role === '3') ? (
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
              {processContracts.map((process) => (
                <ActiveSteps
                  key={process.address}
                  web3={web3}
                  factoryContract={factoryContract}
                  processContractAddress={process.address}
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
                allSteps={processContracts.concat(completedProcesses).flatMap(p => p.steps)}
              />
            </Tabs.Panel>
            <Tabs.Panel value="history">
              <h2>Storico</h2>
              <CompletedSteps
                allSteps={processContracts.concat(completedProcesses).flatMap(p => p.steps)}
              />
            </Tabs.Panel>
            {role === '1' && (
              <Tabs.Panel value="roles">
                <h2>Roles management center</h2>
                <RoleAssignment contract={factoryContract} account={account} />
              </Tabs.Panel>
            )}
          </Tabs>
        </div>
      ) : (
        <SplashScreen />
      )}
    </div>
  );
};

export default App;