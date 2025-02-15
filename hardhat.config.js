require('hardhat-deploy');
require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');
const dotenv = require('dotenv/config');

const BASE_NODE_URI="https://rpc.ankr.com/base";
const OP_NODE_URI="https://rpc.ankr.com/optimism";
const ARB_NODE_URI="https://rpc.ankr.com/arbitrum";
const LINEA_NODE_URI="https://1rpc.io/linea";

const BLOCK_NUMBER = 306068879;

module.exports = {
  namedAccounts: {
    deployer: {
      default: 0
  },
  recipient: {
      default: 1,
  },
  anotherAccount: {
      default: 2
  }
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
          url: ARB_NODE_URI,
          blockNumber: BLOCK_NUMBER,
      },
    },
    base: {
      url: BASE_NODE_URI,
      chainId: 8453,
      accounts: [process.env.PK],
      gasPrice: "auto"
    },
    arbitrum: {
      url: ARB_NODE_URI,
      chainId: 42161,
      accounts: [process.env.PK],
      gasPrice: "auto"
    },
    linea: {
      url: LINEA_NODE_URI,
      chainId: 59144,
      accounts: [process.env.PK],
      gasPrice: "auto"
    },
    optimism: {
      url: OP_NODE_URI,
      chainId: 10,
      accounts: [process.env.PK],
      gasPrice: "auto"
    },
    avalanche: {
      url: "https://avalanche.drpc.org",
      chainId: 43114,
      accounts: [process.env.PK],
      gasPrice: "auto"
    },
  },
  etherscan: {
    apiKey: {
        mainnet: "YOUR_ETHERSCAN_API_KEY",
        optimisticEthereum: "QF8C271KDRUFUUZGXZKUF1U5AMBPAIFR6J",
        arbitrumOne: "HD7VAN3NK41AWIHC834F9H8TJN6638RUYT",
        // avalanche: "YOUR_AVALANCHE_API_KEY",
    }
  },
  mocha: {
    timeout: 100000000
  }
};