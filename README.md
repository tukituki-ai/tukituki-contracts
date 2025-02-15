# Agent Smart Contract Project

## Overview

This project is a robust and scalable Hardhat-based Ethereum development environment designed to deploy and manage smart contracts that interact with DeFi protocols such as Aave and Uniswap. The core component, the `Agent` contract, leverages OpenZeppelin's upgradeable contracts to ensure secure and flexible contract upgrades. The project is equipped with comprehensive testing, deployment scripts, and integrations to facilitate seamless development and deployment processes.

## Features

- **Upgradeable Contracts**: Utilizes OpenZeppelin's `UUPSUpgradeable` and `AccessControlUpgradeable` for secure and manageable contract upgrades.
- **DeFi Integrations**: Interacts with Aave's lending pool and Uniswap's non-fungible position manager to supply and withdraw assets, manage liquidity, and handle token positions.
- **Cross-Chain Compatibility**: Configured to work with multiple Ethereum Layer 2 solutions including Base, Optimism, Arbitrum, and Linea.
- **Automated Deployments**: Incorporates Hardhat Ignition for streamlined contract deployment processes.
- **Comprehensive Testing**: Equipped with test suites to ensure contract reliability and integrity.
- **Role-Based Access Control**: Implements robust access control mechanisms to manage permissions and roles within the contract.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Running Tests](#running-tests)
  - [Deploying Contracts](#deploying-contracts)
- [Project Structure](#project-structure)
- [Contracts](#contracts)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/)
- [Hardhat](https://hardhat.org/)

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/agent-smart-contract.git
   cd agent-smart-contract
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

## Configuration

1. **Environment Variables**

   Create a `.env` file in the root directory and add your private key:

   ```env
   PK=your_private_key_here
   ```

2. **Hardhat Configuration**

   The `hardhat.config.js` file is pre-configured with multiple network settings. Update the `etherscan` API keys and other relevant configurations as needed.

## Usage

### Running Tests

Execute the test suite to verify contract functionality:

```bash
npx hardhat test
```

To generate gas reports during testing:

```bash
REPORT_GAS=true npx hardhat test
```

### Deploying Contracts

Start a local Hardhat node:

```bash
npx hardhat node
```

Deploy the `Agent` contract using Hardhat Ignition:

```bash
npx hardhat ignition deploy ./ignition/modules/Agent.ts
```

## Project Structure

- `contracts/`: Solidity smart contracts.
  - `Agent.sol`: Main contract managing interactions with Aave and Uniswap.
  - `interfaces/`: Interface definitions for external protocols.
- `deployments/`: Deployment scripts and artifacts.
- `scripts/`: Utility scripts for deployment and interaction.
- `test/`: Test suites for smart contracts.
- `hardhat.config.js`: Hardhat configuration file.
- `package.json`: Project dependencies and scripts.
- `.gitignore`: Specifies files and directories to be ignored by Git.

## Contracts

### Agent.sol

The `Agent` contract serves as the central hub for interacting with Aave's lending pool and Uniswap's position manager. It includes functionalities to supply and withdraw assets, manage user balances, and handle token positions securely.

#### Key Functions

- `initialize()`: Initializes the contract with necessary roles and configurations.
- `setArgs(Args memory args)`: Sets the necessary addresses and tokens for the contract to interact with external protocols.
- `supplyAave(uint256 amount, address token)`: Supplies a specified amount of a token to Aave.
- `withdrawAave(uint256 amount, address token)`: Withdraws a specified amount of a token from Aave.

### Interfaces

- `Aave.sol`: Defines the interface for interacting with Aave's Pool and related functionalities.
- `Uniswap.sol`: Defines the interface for interacting with Uniswap V3's Nonfungible Position Manager and Factory.
- `Silo.sol`: Defines the interface for the Silo contract used within the system.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch:

   ```bash
   git checkout -b feature-name
   ```

3. Commit your changes:

   ```bash
   git commit -m "Add some feature"
   ```

4. Push to the branch:

   ```bash
   git push origin feature-name
   ```

5. Open a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).

---
