const { ethers } = require("hardhat");
const {getContract, initWallet} = require("./util");
const {AVALANCHE} = require("../scripts/assets");

const hre = require('hardhat');
module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const wallet = await initWallet();

    const agent = await getContract("Agent", "avalanche");
    
    await agent.setArgs({
        aavePoolProvider: AVALANCHE.aavePoolProvider,
        usdtToken: AVALANCHE.usdt,
        aUsdtToken: AVALANCHE.aUsdt,
        usdcToken: AVALANCHE.usdc,
        aUsdcToken: AVALANCHE.aUsdc,
        wethToken: AVALANCHE.weth,
        aWethToken: AVALANCHE.aWeth,
        wbtcToken: AVALANCHE.wbtc,
        aWbtcToken: AVALANCHE.aWbtc,
        npmUniswap: AVALANCHE.uniswapNpm,
    });
    

    console.log("success");
};

module.exports.tags = ['SettingAgentAV'];