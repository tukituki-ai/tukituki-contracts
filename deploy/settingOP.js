const { ethers } = require("hardhat");
const {getContract, initWallet} = require("./util");
const {OPTIMISM} = require("../scripts/assets");

const hre = require('hardhat');
module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const wallet = await initWallet();

    const agent = await getContract("Agent", "optimism");
    
    await agent.setArgs({
        aavePoolProvider: OPTIMISM.aavePoolProvider,
        usdtToken: OPTIMISM.usdt,
        aUsdtToken: OPTIMISM.aUsdt,
        usdcToken: OPTIMISM.usdc,
        aUsdcToken: OPTIMISM.aUsdc,
        wethToken: OPTIMISM.weth,
        aWethToken: OPTIMISM.aWeth,
        wbtcToken: OPTIMISM.wbtc,
        aWbtcToken: OPTIMISM.aWbtc,
        npmUniswap: OPTIMISM.uniswapNpm,
    });
    

    console.log("success");
};

module.exports.tags = ['SettingAgentOP'];
