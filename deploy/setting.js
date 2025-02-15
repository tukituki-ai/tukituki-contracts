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

            usdtToken: ARBITRUM.usdt,
            aUsdtToken: ARBITRUM.aUsdt,
            usdcToken: ARBITRUM.usdc,
            aUsdcToken: ARBITRUM.aUsdc,
            wethToken: ARBITRUM.weth,
            aWethToken: ARBITRUM.aWeth,
            wbtcToken: ARBITRUM.wbtc,
            aWbtcToken: ARBITRUM.aWbtc,

            npmUniswap: ARBITRUM.npmUniswap,
    });
    

    console.log("success");
};

module.exports.tags = ['setting','SettingAgent'];
