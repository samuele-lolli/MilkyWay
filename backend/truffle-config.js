// Setup the local blockchain network and the solidity compiler
module.exports = {
  networks: {
    development: {
      host: "192.168.0.119",
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