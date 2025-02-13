const hre = require("hardhat");
const { deployments, ethers } = require('hardhat');
const { expect } = require("chai");
const chai = require("chai");
const { sharedBeforeEach, toPrintableObject } = require("./util");
const { ARBITRUM, BASE, transferAsset, getERC20ByAddress, toE18, toE6 } = require("../scripts/assets");


chai.use(require('chai-bignumber')());

// to run test: yarn hardhat test test/Agent.js



const expectApproximately = (actual, expected, percent) => {
    const delta = expected * percent / 100;
    expect(actual).to.be.approximately(expected, delta);
};

const initializeTokens = async (address, account, agent) => {
    await transferAsset(address, agent.address);
    return await getERC20ByAddress(address, account);
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

        console.log(weth.address, usdc.address);
        console.log("weth balance", (await weth.balanceOf(account.address) / 1e18).toString());
        console.log("usdc balance", (await usdc.balanceOf(account.address) / 1e6).toString());

        await agent.setArgs({
            aavePoolProvider: ARBITRUM.aavePoolProvider,
            compound: ARBITRUM.compound,
            usdcToken: ARBITRUM.usdc,
            aUsdcToken: ARBITRUM.aUsdc,
            wethToken: ARBITRUM.weth,
            aWethToken: ARBITRUM.aWeth,
            npmUniswap: ARBITRUM.npmUniswap,
        });

        
    });

    it("should supply and withdraw from Aave", async () => {
        await agent.supplyAave(toE18(100), ARBITRUM.weth);
        await agent.withdrawAave(toE18(100), ARBITRUM.weth);

        await agent.supplyAave(toE6(100), ARBITRUM.usdc);

        await agent.withdrawAave(toE6(100), ARBITRUM.usdc);
    });

    it("should supply and withdraw from Compound", async () => {
        await agent.supplyCompound(toE6(100), ARBITRUM.usdc);
        let balances = await agent.balances();
        let compound_balance = Number(balances[2]);
        
        await agent.withdrawCompound((compound_balance / 1e6).toFixed(0), ARBITRUM.usdc);
    });

    it("should deposit and withdraw from Uniswap", async () => {
        await agent.depositUniswap(toE18(100), toE18(100), ARBITRUM.weth, ARBITRUM.usdc, 500);
        await agent.withdrawUniswap(toE18(100), ARBITRUM.weth, ARBITRUM.usdc);
    });


});

