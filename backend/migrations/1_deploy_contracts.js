const MilkProcessFactory = artifacts.require("MilkProcessFactory");

module.exports = function(deployer) {
  deployer.deploy(MilkProcessFactory);
};
