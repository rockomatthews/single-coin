require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    polygon: {
      url: "https://polygon-mainnet.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78",
      chainId: 137,
      gasPrice: 300000000000, // 300 gwei for fast confirmation
      gas: 2000000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};