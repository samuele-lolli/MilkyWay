// Setup the local blockchain network and the solidity compiler
module.exports = {
  networks: {
    development: {
      host: 'ip_address', 
      port: 7545,
      network_id: "*",
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",
    }
  },
};