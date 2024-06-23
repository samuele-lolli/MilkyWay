import Web3 from 'web3';
import MilkChainContract from '../../backend/build/contracts/MilkChain.json';

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    window.addEventListener('load', async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
        await window.ethereum.request({
            "method": "eth_requestAccounts",
            "params": []
        });
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      } else if (window.web3) {
        resolve(window.web3);
      } else {
        const provider = new Web3.providers.HttpProvider('http://localhost:7545');
        const web3 = new Web3(provider);
        resolve(web3);
      }
    });
  });

const getContract = async (web3) => {
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = MilkChainContract.networks[networkId];
  return new web3.eth.Contract(
    MilkChainContract.abi,
    deployedNetwork && deployedNetwork.address,
  );
};

export { getWeb3, getContract };
