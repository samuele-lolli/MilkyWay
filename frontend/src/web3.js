import Web3 from 'web3';
import MilkProcessFactory from '../../backend/build/contracts/MilkProcessFactory.json';
import MilkProcess from '../../backend/build/contracts/MilkProcess.json';

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    window.addEventListener('load', async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      } else if (window.web3) {
        resolve(window.web3);
      } else {

        const provider = new Web3.providers.HttpProvider('ip_address:7545');
        const web3 = new Web3(provider);
        resolve(web3);
      }
    });
  });

const getContract = async (web3, contractName, address = null) => {
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = contractName === 'MilkProcessFactory'
    ? MilkProcessFactory.networks[networkId]
    : MilkProcess.networks[networkId];
  const contract = new web3.eth.Contract(
    contractName === 'MilkProcessFactory'
      ? MilkProcessFactory.abi
      : MilkProcess.abi,
    address || deployedNetwork && deployedNetwork.address,
  );
  return contract;
};

export { getWeb3, getContract };
