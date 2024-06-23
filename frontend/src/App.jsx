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
      const completed = [];
      for (let i = 0; i < stepsLength; i++) {
        const step = await contract.methods.getStep(i).call();
        steps.push(step);
        if (step[2]) { // Se la fase è completata, la aggiungiamo ai passati
          completed.push(step);
        }
      }
      setSteps(steps);
      setCompletedSteps(completed);
      setSupervisorAddresses(Array(stepsLength).fill(''));
    } catch (error) {
      console.error("Error fetching steps:", error);
    }
  };

  const assignSupervisor = async (index) => {
    try {
      await contract.methods.assignSupervisor(index, supervisorAddresses[index]).send({ from: account });
      await fetchSteps(contract);
    } catch (error) {
      console.error("Error assigning supervisor:", error);
    }
  };

  const completeStep = async () => {
    try {
      await contract.methods.completeStep().send({ from: account });
      await fetchSteps(contract);
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
                        <button onClick={completeStep}>Complete Step</button>
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
          </tr>
        </thead>
        <tbody>
        {completedSteps.map((step, index) => (
  <tr key={index}>
    <td>{step[0]}</td>
    <td>{step[1]}</td>
    <td>{step[3] !== '0' ? new Date(parseInt(step[3]) * 1000).toLocaleString() : '-'}</td>
    <td>{step[4] !== '0' ? new Date(parseInt(step[4]) * 1000).toLocaleString() : '-'}</td>
  </tr>
))}

        </tbody>
      </table>
    </div>
  );
};

export default App;
