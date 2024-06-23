const MilkChain = artifacts.require("MilkChain");

module.exports = function(deployer) {
  deployer.deploy(MilkChain);
};
