const { ethers } = require("hardhat");
const {getContract, initWallet} = require("./util");
const {ARBITRUM} = require("../scripts/assets");

const hre = require('hardhat');
module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const wallet = await initWallet();

    const agent = await getContract("Agent", "arbitrum");
    
    await agent.setArgs({
        aavePoolProvider: ARBITRUM.aavePoolProvider,
        compound: ARBITRUM.compound,
        usdcToken: ARBITRUM.usdc,
        aUsdcToken: ARBITRUM.aUsdc,
        wethToken: ARBITRUM.weth,
        aWethToken: ARBITRUM.aWeth,
        npmUniswap: ARBITRUM.npmUniswap,
    });
    

    console.log("success");
};

module.exports.tags = ['setting','SettingAgent'];
