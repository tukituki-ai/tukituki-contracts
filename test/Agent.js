const hre = require("hardhat");
const { deployments, ethers } = require('hardhat');
const { expect } = require("chai");
const chai = require("chai");
const { sharedBeforeEach, toPrintableObject } = require("./util");
const { ARBITRUM, BASE, transferAsset, getERC20ByAddress, toE18, toE6, toE8 } = require("../scripts/assets");


chai.use(require('chai-bignumber')());

// to run test: yarn hardhat test test/Agent.js



const expectApproximately = (actual, expected, percent) => {
    const delta = expected * percent / 100;
    expect(actual).to.be.approximately(expected, delta);
};

const initializeTokens = async (address, account, agent) => {
    await transferAsset(address, account.address);
    let token = await getERC20ByAddress(address, account);
    await token.approve(agent.address, ethers.constants.MaxUint256);
    return token;
};

describe("Agent: Test", function () {
    let agent;
    let account;

    sharedBeforeEach("Deploy and Setup", async () => {
        await hre.run("compile");

        await deployments.fixture(['Agent']);

        const signers = await ethers.getSigners();
        account = signers[0];

        agent = await ethers.getContract('Agent');
        console.log("agent", agent.address);

        let weth = await initializeTokens(ARBITRUM.weth, account, agent);
        let usdc = await initializeTokens(ARBITRUM.usdc, account, agent);
        let wbtc = await initializeTokens(ARBITRUM.wbtc, account, agent);
        let usdt = await initializeTokens(ARBITRUM.usdt, account, agent);

        console.log(weth.address, usdc.address);
        console.log("weth balance", (await weth.balanceOf(account.address) / 1e18).toString());
        console.log("usdc balance", (await usdc.balanceOf(account.address) / 1e6).toString());

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
    });

    it("should supply and withdraw from Aave", async () => {
        await agent.supplyAave(toE18(100), ARBITRUM.weth);
        

        await agent.supplyAave(toE6(100), ARBITRUM.usdc);

        await agent.supplyAave(toE8(50), ARBITRUM.wbtc);
        await agent.supplyAave(toE6(50), ARBITRUM.usdt);

        let balances = await agent.balance(account.address);
        
        console.log(balances[0].toString());
        console.log(balances[1].toString());
        console.log(balances[2].toString());
        console.log(balances[3].toString());

        await agent.withdrawAave(toE8(50), ARBITRUM.wbtc);

        await agent.withdrawAave(toE6(100), ARBITRUM.usdc);
        await agent.withdrawAave(toE18(100), ARBITRUM.weth);
    });


    it("should deposit and withdraw from Uniswap", async () => {
        const tokenId = (await agent.depositUniswap(toE18(100), toE6(100), ARBITRUM.weth, ARBITRUM.usdc, 100)).toString();
        

        let tokenIds = await agent.userTokenIds(account.address);
        console.log("tokenIds", tokenIds);
        // await agent.withdrawUniswap(tokenId);
    });


});

